import { db } from "./db";
import {
  merchants,
  couriers,
  deliveries,
  type Merchant,
  type InsertMerchant,
  type Courier,
  type InsertCourier,
  type Delivery,
  type InsertDelivery,
  type UpdateDeliveryRequest,
  type SupportTicket,
  type InsertSupportTicket,
  supportTickets,
  chatMessages,
  activeSessions,
  type ChatMessage,
  type InsertChatMessage,
  type ActiveSession,
  type InsertActiveSession,
  type DeliveryChat,
  type InsertDeliveryChat,
  deliveryChats,
  type DualRoute,
  type CourierRouteStatus,
} from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Merchants
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant>;

  // Couriers
  getCouriers(): Promise<Courier[]>;
  getCourier(id: number): Promise<Courier | undefined>;
  createCourier(courier: InsertCourier): Promise<Courier>;
  updateCourierLocation(id: number, lat: string, lng: string): Promise<Courier>;
  updateCourierAvailability(id: number, isAvailable: boolean): Promise<Courier>;
  updateCourierBalance(id: number, balance: string): Promise<Courier>;
  updateCourierBlockStatus(id: number, isBlocked: boolean, blockedUntil: Date | null): Promise<Courier>;

  // Deliveries
  getDeliveries(): Promise<Delivery[]>;
  getDelivery(id: number): Promise<Delivery | undefined>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDeliveryStatus(id: number, status: string, courierId?: number): Promise<Delivery>;
  reassignDelivery(id: number, courierId: number | null): Promise<Delivery>;
  
  // Support Tickets
  getSupportTickets(): Promise<SupportTicket[]>;
  getMerchantSupportTickets(merchantId: number): Promise<SupportTicket[]>;
  getCourierSupportTickets(courierId: number): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, response: string): Promise<SupportTicket>;
  
  // Chat Messages
  getChatMessages(ticketId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Active Sessions
  getActiveSessions(): Promise<ActiveSession[]>;
  getActiveSessionByTicket(ticketId: number): Promise<ActiveSession | undefined>;
  createActiveSession(session: InsertActiveSession): Promise<ActiveSession>;
  closeActiveSession(ticketId: number): Promise<void>;

  // Delivery Chat
  getDeliveryChatMessages(deliveryId: number): Promise<DeliveryChat[]>;
  createDeliveryChatMessage(message: InsertDeliveryChat): Promise<DeliveryChat>;
  
  // Second Route Management
  createSecondRoute(firstDeliveryId: number, secondDeliveryData: InsertDelivery): Promise<DualRoute>;
  getCourierActiveRoutes(courierId: number): Promise<Delivery[]>;
  canAddSecondRoute(courierId: number, firstDeliveryId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants);
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const [merchant] = await db.insert(merchants).values(insertMerchant).returning();
    return merchant;
  }

  async updateMerchant(id: number, updates: Partial<InsertMerchant>): Promise<Merchant> {
    const [updated] = await db.update(merchants)
      .set(updates)
      .where(eq(merchants.id, id))
      .returning();
    return updated;
  }

  async getCouriers(): Promise<Courier[]> {
    return await db.select().from(couriers);
  }

  async getCourier(id: number): Promise<Courier | undefined> {
    const [courier] = await db.select().from(couriers).where(eq(couriers.id, id));
    return courier;
  }

  async createCourier(insertCourier: InsertCourier): Promise<Courier> {
    const [courier] = await db.insert(couriers).values(insertCourier).returning();
    return courier;
  }

  async updateCourierLocation(id: number, lat: string, lng: string): Promise<Courier> {
    const [updated] = await db.update(couriers)
      .set({ locationLat: lat, locationLng: lng })
      .where(eq(couriers.id, id))
      .returning();
    return updated;
  }

  async updateCourierAvailability(id: number, isAvailable: boolean): Promise<Courier> {
    const [updated] = await db.update(couriers)
      .set({ isAvailable })
      .where(eq(couriers.id, id))
      .returning();
    return updated;
  }

  async updateCourierBalance(id: number, balance: string): Promise<Courier> {
    const [updated] = await db.update(couriers)
      .set({ balance })
      .where(eq(couriers.id, id))
      .returning();
    return updated;
  }

  async updateCourierBlockStatus(id: number, isBlocked: boolean, blockedUntil: Date | null): Promise<Courier> {
    const [updated] = await db.update(couriers)
      .set({ isBlocked, blockedUntil })
      .where(eq(couriers.id, id))
      .returning();
    return updated;
  }

  async getDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries);
  }

  async getDelivery(id: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery;
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(deliveries).values(insertDelivery).returning();
    return delivery;
  }

  async updateDeliveryStatus(id: number, status: string, courierId?: number): Promise<Delivery> {
    const updateData: any = { status };
    if (courierId !== undefined) {
      if (status === "rejected") {
        updateData.status = "pending";
        updateData.rejectedBy = sql`array_append(${deliveries.rejectedBy}, ${courierId})`;
        updateData.lastRejectedAt = new Date();
        updateData.courierId = null;
      } else {
        updateData.courierId = courierId;
      }
    }
    const [updated] = await db.update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id))
      .returning();

    // Se a corrida foi entregue, atualiza o saldo do motoboy (80%)
    if (status === "delivered" && updated.courierId && updated.price) {
      // Set deliveredAt timestamp
      await db.update(deliveries)
        .set({ deliveredAt: new Date() })
        .where(eq(deliveries.id, id));

      const courierBalance = await this.getCourier(updated.courierId);
      if (courierBalance) {
        const currentBalance = parseFloat(courierBalance.balance || "0");
        const earnings = parseFloat(updated.price) * 0.8;
        const newBalance = (currentBalance + earnings).toFixed(2);
        await db.update(couriers)
          .set({ balance: newBalance })
          .where(eq(couriers.id, updated.courierId));
      }
    }

    return updated;
  }

  async reassignDelivery(id: number, courierId: number | null): Promise<Delivery> {
    const [updated] = await db.update(deliveries)
      .set({ courierId, status: courierId ? "accepted" : "pending" })
      .where(eq(deliveries.id, id))
      .returning();
    return updated;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(sql`${supportTickets.createdAt} desc`);
  }

  async getMerchantSupportTickets(merchantId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.merchantId, merchantId)).orderBy(sql`${supportTickets.createdAt} desc`);
  }

  async getCourierSupportTickets(courierId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.courierId, courierId)).orderBy(sql`${supportTickets.createdAt} desc`);
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values({ ...insertTicket, status: "open" }).returning();
    return ticket;
  }

  async updateSupportTicket(id: number, response: string): Promise<SupportTicket> {
    const [updated] = await db.update(supportTickets)
      .set({ response, status: "closed", updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  async getChatMessages(ticketId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.ticketId, ticketId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    return await db.select().from(activeSessions).where(eq(activeSessions.status, "active")).orderBy(sql`${activeSessions.createdAt} desc`);
  }

  async getActiveSessionByTicket(ticketId: number): Promise<ActiveSession | undefined> {
    const [session] = await db.select().from(activeSessions).where(eq(activeSessions.ticketId, ticketId));
    return session;
  }

  async createActiveSession(insertSession: InsertActiveSession): Promise<ActiveSession> {
    const [session] = await db.insert(activeSessions).values(insertSession).returning();
    return session;
  }

  async closeActiveSession(ticketId: number): Promise<void> {
    await db.update(activeSessions)
      .set({ status: "closed", updatedAt: new Date() })
      .where(eq(activeSessions.ticketId, ticketId));
    
    // Also close the associated support ticket
    await db.update(supportTickets)
      .set({ status: "closed", response: "Chat finalizado.", updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));
  }

  async getDeliveryChatMessages(deliveryId: number): Promise<DeliveryChat[]> {
    return await db.select().from(deliveryChats).where(eq(deliveryChats.deliveryId, deliveryId)).orderBy(deliveryChats.createdAt);
  }

  async createDeliveryChatMessage(insertMessage: InsertDeliveryChat): Promise<DeliveryChat> {
    const [message] = await db.insert(deliveryChats).values(insertMessage).returning();
    return message;
  }

  // Second Route Management
  async createSecondRoute(firstDeliveryId: number, secondDeliveryData: InsertDelivery): Promise<DualRoute> {
    const firstDelivery = await this.getDelivery(firstDeliveryId);
    if (!firstDelivery) {
      throw new Error('First delivery not found');
    }

    // Generate 4-digit order number and pickup code for the second route
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Create second delivery with routeNumber = 2
    const [secondDelivery] = await db.insert(deliveries).values({
      ...secondDeliveryData,
      orderNumber,
      pickupCode,
      routeNumber: 2,
      linkedDeliveryId: firstDeliveryId,
    }).returning();

    // Update first delivery to link to second
    await db.update(deliveries)
      .set({ linkedDeliveryId: secondDelivery.id })
      .where(eq(deliveries.id, firstDeliveryId));

    // Calculate totals
    const totalDistance = parseFloat(firstDelivery.distanceKm) + parseFloat(secondDeliveryData.distanceKm || '0');
    const totalPrice = parseFloat(firstDelivery.price) + parseFloat(secondDeliveryData.price || '0');

    // Update both deliveries with total values
    await db.update(deliveries)
      .set({ totalDistanceKm: totalDistance.toString(), totalPrice: totalPrice.toFixed(2) })
      .where(eq(deliveries.id, firstDeliveryId));

    await db.update(deliveries)
      .set({ totalDistanceKm: totalDistance.toString(), totalPrice: totalPrice.toFixed(2) })
      .where(eq(deliveries.id, secondDelivery.id));

    return {
      route1: firstDelivery,
      route2: secondDelivery,
      totalDistance,
      totalPrice,
    };
  }

  async getCourierActiveRoutes(courierId: number): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(
      sql`${deliveries.courierId} = ${courierId} AND ${deliveries.status} IN ('accepted', 'picked_up')`
    );
  }

  async canAddSecondRoute(courierId: number, firstDeliveryId: number): Promise<boolean> {
    // Check if courier has the first delivery
    const firstDelivery = await this.getDelivery(firstDeliveryId);
    if (!firstDelivery || firstDelivery.courierId !== courierId) {
      return false;
    }

    // Check if first delivery status is 'accepted' (not 'picked_up')
    if (firstDelivery.status !== 'accepted') {
      return false;
    }

    // Check if courier already has 2 active routes
    const activeRoutes = await this.getCourierActiveRoutes(courierId);
    if (activeRoutes.length >= 2) {
      return false;
    }

    // Check if first delivery already has a linked delivery
    if (firstDelivery.linkedDeliveryId) {
      return false;
    }

    return true;
  }
}

export const storage = new DatabaseStorage();
