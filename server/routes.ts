import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingMerchants = await storage.getMerchants();
  if (existingMerchants.length === 0) {
    await storage.createMerchant({
      name: "Super Lanches",
      whatsapp: "11999999999",
      category: "restaurante",
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP"
    });
  }

  const existingCouriers = await storage.getCouriers();
  if (existingCouriers.length === 0) {
    await storage.createCourier({
      name: "João Motoboy",
      isAvailable: true,
      locationLat: "-23.550520",
      locationLng: "-46.633308"
    });
    await storage.createCourier({
      name: "Maria Entregas",
      isAvailable: true,
      locationLat: "-23.555520",
      locationLng: "-46.638308"
    });
  }

  const existingDeliveries = await storage.getDeliveries();
  if (existingDeliveries.length === 0) {
    await storage.createDelivery({
      merchantId: 1,
      pickupAddress: "Rua das Flores, 123, Centro, São Paulo",
      deliveryAddress: "Avenida Paulista, 1000, Bela Vista, São Paulo",
      customerName: "Carlos Silva",
      customerWhatsapp: "11988888888",
      orderNumber: "4521",
      pickupCode: "7845",
      observation: "Entregar na portaria",
      distanceKm: "3.5",
      price: "12.00",
      status: "pending"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Call seed database
  seedDatabase().catch(console.error);

  // Merchants
  app.get(api.merchants.list.path, async (req, res) => {
    const merchants = await storage.getMerchants();
    res.json(merchants);
  });

  app.get(api.merchants.get.path, async (req, res) => {
    const merchant = await storage.getMerchant(Number(req.params.id));
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    res.json(merchant);
  });

  app.post(api.merchants.create.path, async (req, res) => {
    try {
      const input = api.merchants.create.input.parse(req.body);
      const merchant = await storage.createMerchant(input);
      res.status(201).json(merchant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.merchants.update.path, async (req, res) => {
    try {
      const input = api.merchants.update.input.parse(req.body);
      const merchant = await storage.updateMerchant(Number(req.params.id), input);
      if (!merchant) {
        return res.status(404).json({ message: 'Merchant not found' });
      }
      res.json(merchant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Couriers
  app.get(api.couriers.list.path, async (req, res) => {
    const couriers = await storage.getCouriers();
    res.json(couriers);
  });

  app.get(api.couriers.get.path, async (req, res) => {
    const courier = await storage.getCourier(Number(req.params.id));
    if (!courier) {
      return res.status(404).json({ message: 'Courier not found' });
    }
    res.json(courier);
  });

  app.post(api.couriers.create.path, async (req, res) => {
    try {
      const input = api.couriers.create.input.parse(req.body);
      const courier = await storage.createCourier(input);
      res.status(201).json(courier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.couriers.updateLocation.path, async (req, res) => {
    try {
      const input = api.couriers.updateLocation.input.parse(req.body);
      const courier = await storage.updateCourierLocation(Number(req.params.id), input.locationLat, input.locationLng);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found' });
      }
      res.json(courier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.couriers.updateAvailability.path, async (req, res) => {
    try {
      const input = api.couriers.updateAvailability.input.parse(req.body);
      const courier = await storage.updateCourierAvailability(Number(req.params.id), input.isAvailable);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found' });
      }
      res.json(courier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.couriers.updateBalance.path, async (req, res) => {
    try {
      const input = api.couriers.updateBalance.input.parse(req.body);
      const courier = await storage.updateCourierBalance(Number(req.params.id), input.balance);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found' });
      }
      res.json(courier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.couriers.block.path, async (req, res) => {
    try {
      const input = api.couriers.block.input.parse(req.body);
      const blockedUntil = input.blockedUntil ? new Date(input.blockedUntil) : null;
      const courier = await storage.updateCourierBlockStatus(Number(req.params.id), input.isBlocked, blockedUntil);
      if (!courier) {
        return res.status(404).json({ message: 'Courier not found' });
      }
      res.json(courier);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Deliveries
  app.get(api.deliveries.list.path, async (req, res) => {
    const deliveries = await storage.getDeliveries();
    res.json(deliveries);
  });

  app.post(api.deliveries.create.path, async (req, res) => {
    try {
      const input = api.deliveries.create.input.parse(req.body);
      
      // Generate 4-digit order number and pickup code
      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      const delivery = await storage.createDelivery({
        ...input,
        orderNumber,
        pickupCode
      });
      res.status(201).json(delivery);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.deliveries.updateStatus.path, async (req, res) => {
    try {
      const input = api.deliveries.updateStatus.input.parse(req.body);
      const delivery = await storage.updateDeliveryStatus(Number(req.params.id), input.status, input.courierId);
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      res.json(delivery);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.deliveries.reassign.path, async (req, res) => {
    try {
      const input = api.deliveries.reassign.input.parse(req.body);
      const delivery = await storage.reassignDelivery(Number(req.params.id), input.courierId);
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      res.json(delivery);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Create second route for courier
  app.post(api.deliveries.createSecondRoute.path, async (req, res) => {
    try {
      const firstDeliveryId = Number(req.params.id);
      const input = api.deliveries.createSecondRoute.input.parse(req.body);
      
      // Get first delivery to check courier
      const firstDelivery = await storage.getDelivery(firstDeliveryId);
      if (!firstDelivery || !firstDelivery.courierId) {
        return res.status(404).json({ message: 'First delivery not found or no courier assigned' });
      }

      // Check if second route can be added
      const canAdd = await storage.canAddSecondRoute(firstDelivery.courierId, firstDeliveryId);
      if (!canAdd) {
        return res.status(400).json({ 
          message: 'Cannot add second route. Courier may already have 2 routes or delivery status is not accepted.' 
        });
      }

      // Create second delivery
      const secondDeliveryData = {
        merchantId: firstDelivery.merchantId,
        pickupAddress: firstDelivery.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        customerName: input.customerName,
        customerWhatsapp: input.customerWhatsapp,
        observation: input.observation || '',
        distanceKm: '5.0', // Default distance
        price: '15.00', // Default price
        status: 'pending',
        courierId: firstDelivery.courierId,
      };

      const dualRoute = await storage.createSecondRoute(firstDeliveryId, secondDeliveryData);
      res.status(201).json(dualRoute);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error('Error creating second route:', err);
      res.status(500).json({ message: 'Error creating second route' });
    }
  });

  // Get courier active routes
  app.get(api.deliveries.getCourierRoutes.path, async (req, res) => {
    try {
      const courierId = Number(req.params.id);
      const routes = await storage.getCourierActiveRoutes(courierId);
      res.json(routes);
    } catch (err) {
      console.error('Error getting courier routes:', err);
      res.status(500).json({ message: 'Error getting courier routes' });
    }
  });

  app.get("/api/deliveries/:id", async (req, res) => {
    const delivery = await storage.getDelivery(Number(req.params.id));
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    res.json(delivery);
  });

  // Check if second route can be added
  app.get("/api/deliveries/:id/can-add-second-route", async (req, res) => {
    try {
      const deliveryId = Number(req.params.id);
      const delivery = await storage.getDelivery(deliveryId);
      
      if (!delivery || !delivery.courierId) {
        return res.status(404).json({ message: 'Delivery not found or no courier assigned' });
      }

      const canAdd = await storage.canAddSecondRoute(delivery.courierId, deliveryId);
      res.json({ canAdd, courierId: delivery.courierId });
    } catch (err) {
      console.error('Error checking second route:', err);
      res.status(500).json({ message: 'Error checking second route' });
    }
  });

  app.get("/api/merchants/:id", async (req, res) => {
    const merchant = await storage.getMerchant(Number(req.params.id));
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });
    res.json(merchant);
  });

  // Support
  app.get(api.support.list.path, async (req, res) => {
    const tickets = await storage.getSupportTickets();
    res.json(tickets);
  });

  app.get(api.support.listByMerchant.path, async (req, res) => {
    const tickets = await storage.getMerchantSupportTickets(Number(req.params.id));
    res.json(tickets);
  });

  app.get(api.support.listByCourier.path, async (req, res) => {
    const tickets = await storage.getCourierSupportTickets(Number(req.params.id));
    res.json(tickets);
  });

  app.post(api.support.create.path, async (req, res) => {
    try {
      const input = api.support.create.input.parse(req.body);
      const ticket = await storage.createSupportTicket(input);
      res.status(201).json(ticket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.support.update.path, async (req, res) => {
    try {
      const input = api.support.update.input.parse(req.body);
      const ticket = await storage.updateSupportTicket(Number(req.params.id), input.response);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      res.json(ticket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Chat Messages
  app.get(api.chat.messages.path, async (req, res) => {
    const messages = await storage.getChatMessages(Number(req.params.ticketId));
    res.json(messages);
  });

  app.post(api.chat.createMessage.path, async (req, res) => {
    try {
      const input = api.chat.createMessage.input.parse(req.body);
      const message = await storage.createChatMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Active Sessions
  app.get(api.chat.sessions.path, async (req, res) => {
    const sessions = await storage.getActiveSessions();
    res.json(sessions);
  });

  app.post(api.chat.createSession.path, async (req, res) => {
    try {
      const input = api.chat.createSession.input.parse(req.body);
      const session = await storage.createActiveSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.chat.closeSession.path, async (req, res) => {
    try {
      await storage.closeActiveSession(Number(req.params.ticketId));
      res.json({ message: 'Session closed successfully' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to close session' });
    }
  });

  // Delivery Chat
  app.get(api.chat.deliveryMessages.path, async (req, res) => {
    const messages = await storage.getDeliveryChatMessages(Number(req.params.deliveryId));
    res.json(messages);
  });

  app.post(api.chat.createDeliveryMessage.path, async (req, res) => {
    try {
      const input = api.chat.createDeliveryMessage.input.parse(req.body);
      const message = await storage.createDeliveryChatMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
