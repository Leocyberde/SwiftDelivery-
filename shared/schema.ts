import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  category: text("category").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
});

export const couriers = pgTable("couriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationLat: text("location_lat"),
  locationLng: text("location_lng"),
  isAvailable: boolean("is_available").default(true),
  balance: text("balance").default("0.00"),
  isBlocked: boolean("is_blocked").default(false),
  blockedUntil: timestamp("blocked_until"),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  customerName: text("customer_name").notNull(),
  observation: text("observation"),
  distanceKm: text("distance_km").notNull(),
  price: text("price").notNull(),
  status: text("status").notNull().default("pending"), 
  courierId: integer("courier_id").references(() => couriers.id),
  orderNumber: text("order_number"),
  pickupCode: text("pickup_code"),
  customerWhatsapp: text("customer_whatsapp"),
  rejectedBy: integer("rejected_by").array().default(sql`'{}'`),
  lastRejectedAt: timestamp("last_rejected_at"),
  deliveredAt: timestamp("delivered_at"),
  // Novo: rastreamento de rotas múltiplas
  routeNumber: integer("route_number").default(1), // 1 ou 2 para primeira ou segunda rota
  linkedDeliveryId: integer("linked_delivery_id").references(() => deliveries.id), // ID da outra rota se for uma rota dupla
  totalDistanceKm: text("total_distance_km"), // Distância total de ambas as rotas
  totalPrice: text("total_price"), // Preço total de ambas as rotas
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  courierId: integer("courier_id").references(() => couriers.id),
  senderRole: text("sender_role").notNull().default("merchant"), // 'merchant' or 'courier'
  type: text("type").notNull(), // 'chat', 'feedback', 'error'
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'closed'
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  sender: text("sender").notNull(), // 'admin', 'merchant', 'courier'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activeSessions = pgTable("active_sessions", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  merchantId: integer("merchant_id").references(() => merchants.id),
  courierId: integer("courier_id").references(() => couriers.id),
  status: text("status").notNull().default("active"), // 'active', 'closed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deliveryChats = pgTable("delivery_chats", {
  id: serial("id").primaryKey(),
  deliveryId: integer("delivery_id").references(() => deliveries.id).notNull(),
  sender: text("sender").notNull(), // 'customer', 'courier'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true });
export const insertCourierSchema = createInsertSchema(couriers).omit({ id: true });
export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export const insertActiveSessionSchema = createInsertSchema(activeSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDeliveryChatSchema = createInsertSchema(deliveryChats).omit({ id: true, createdAt: true });

// Schema para criar uma segunda rota
export const createSecondRouteSchema = z.object({
  firstDeliveryId: z.number(),
  deliveryAddress: z.string(),
  customerName: z.string(),
  customerWhatsapp: z.string(),
  observation: z.string().optional(),
});

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;

export type Courier = typeof couriers.$inferSelect;
export type InsertCourier = z.infer<typeof insertCourierSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type UpdateDeliveryRequest = Partial<InsertDelivery>;

// Tipo para representar uma rota dupla (duas entregas vinculadas)
export type DualRoute = {
  route1: Delivery;
  route2: Delivery;
  totalDistance: number;
  totalPrice: number;
};

// Tipo para representar o status de rotas do motoboy
export type CourierRouteStatus = {
  courierId: number;
  activeDeliveries: Delivery[];
  maxRoutesReached: boolean; // true se já tem 2 rotas ativas
};

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ActiveSession = typeof activeSessions.$inferSelect;
export type InsertActiveSession = z.infer<typeof insertActiveSessionSchema>;

export type DeliveryChat = typeof deliveryChats.$inferSelect;
export type InsertDeliveryChat = z.infer<typeof insertDeliveryChatSchema>;

export type CreateSecondRoute = z.infer<typeof createSecondRouteSchema>;
