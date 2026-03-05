import { z } from 'zod';
import {
  insertMerchantSchema,
  merchants,
  insertCourierSchema,
  couriers,
  insertDeliverySchema,
  deliveries,
  insertSupportTicketSchema,
  supportTickets,
  insertChatMessageSchema,
  chatMessages,
  insertActiveSessionSchema,
  activeSessions,
  insertDeliveryChatSchema,
  deliveryChats,
  createSecondRouteSchema,
} from './schema';
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  merchants: {
    list: {
      method: 'GET' as const,
      path: '/api/merchants' as const,
      responses: {
        200: z.array(z.custom<typeof merchants.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/merchants/:id' as const,
      responses: {
        200: z.custom<typeof merchants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/merchants' as const,
      input: insertMerchantSchema,
      responses: {
        201: z.custom<typeof merchants.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/merchants/:id' as const,
      input: insertMerchantSchema.partial(),
      responses: {
        200: z.custom<typeof merchants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  couriers: {
    list: {
      method: 'GET' as const,
      path: '/api/couriers' as const,
      responses: {
        200: z.array(z.custom<typeof couriers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/couriers/:id' as const,
      responses: {
        200: z.custom<typeof couriers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/couriers' as const,
      input: insertCourierSchema,
      responses: {
        201: z.custom<typeof couriers.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    updateLocation: {
      method: 'PATCH' as const,
      path: '/api/couriers/:id/location' as const,
      input: z.object({
        locationLat: z.string(),
        locationLng: z.string()
      }),
      responses: {
        200: z.custom<typeof couriers.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    updateAvailability: {
      method: 'PATCH' as const,
      path: '/api/couriers/:id/availability' as const,
      input: z.object({
        isAvailable: z.boolean()
      }),
      responses: {
        200: z.custom<typeof couriers.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    updateBalance: {
      method: 'PATCH' as const,
      path: '/api/couriers/:id/balance' as const,
      input: z.object({
        balance: z.string()
      }),
      responses: {
        200: z.custom<typeof couriers.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    block: {
      method: 'PATCH' as const,
      path: '/api/couriers/:id/block' as const,
      input: z.object({
        isBlocked: z.boolean(),
        blockedUntil: z.string().nullable()
      }),
      responses: {
        200: z.custom<typeof couriers.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  deliveries: {
    list: {
      method: 'GET' as const,
      path: '/api/deliveries' as const,
      responses: {
        200: z.array(z.custom<typeof deliveries.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/deliveries' as const,
      input: insertDeliverySchema.omit({ orderNumber: true, pickupCode: true }),
      responses: {
        201: z.custom<typeof deliveries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/deliveries/:id/status' as const,
      input: z.object({
        status: z.enum(["pending", "accepted", "picked_up", "delivered", "cancelled", "rejected"]),
        courierId: z.number().optional()
      }),
      responses: {
        200: z.custom<typeof deliveries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    reassign: {
      method: 'PATCH' as const,
      path: '/api/deliveries/:id/reassign' as const,
      input: z.object({
        courierId: z.number().nullable()
      }),
      responses: {
        200: z.custom<typeof deliveries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    createSecondRoute: {
      method: 'POST' as const,
      path: '/api/deliveries/:id/second-route' as const,
      input: createSecondRouteSchema,
      responses: {
        201: z.object({
          route1: z.custom<typeof deliveries.$inferSelect>(),
          route2: z.custom<typeof deliveries.$inferSelect>(),
          totalDistance: z.number(),
          totalPrice: z.number(),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    getCourierRoutes: {
      method: 'GET' as const,
      path: '/api/couriers/:id/routes' as const,
      responses: {
        200: z.array(z.custom<typeof deliveries.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    }
  },
  support: {
    list: {
      method: 'GET' as const,
      path: '/api/support' as const,
      responses: {
        200: z.array(z.custom<typeof supportTickets.$inferSelect>()),
      },
    },
    listByMerchant: {
      method: 'GET' as const,
      path: '/api/merchants/:id/support' as const,
      responses: {
        200: z.array(z.custom<typeof supportTickets.$inferSelect>()),
      },
    },
    listByCourier: {
      method: 'GET' as const,
      path: '/api/couriers/:id/support' as const,
      responses: {
        200: z.array(z.custom<typeof supportTickets.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/support' as const,
      input: insertSupportTicketSchema,
      responses: {
        201: z.custom<typeof supportTickets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/support/:id' as const,
      input: z.object({
        response: z.string()
      }),
      responses: {
        200: z.custom<typeof supportTickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  chat: {
    messages: {
      method: 'GET' as const,
      path: '/api/chat/:ticketId/messages' as const,
      responses: {
        200: z.array(z.custom<typeof chatMessages.$inferSelect>()),
      },
    },
    createMessage: {
      method: 'POST' as const,
      path: '/api/chat/messages' as const,
      input: insertChatMessageSchema,
      responses: {
        201: z.custom<typeof chatMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    sessions: {
      method: 'GET' as const,
      path: '/api/chat/sessions' as const,
      responses: {
        200: z.array(z.custom<typeof activeSessions.$inferSelect>()),
      },
    },
    createSession: {
      method: 'POST' as const,
      path: '/api/chat/sessions' as const,
      input: insertActiveSessionSchema,
      responses: {
        201: z.custom<typeof activeSessions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    closeSession: {
      method: 'DELETE' as const,
      path: '/api/chat/sessions/:ticketId' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    deliveryMessages: {
      method: 'GET' as const,
      path: '/api/deliveries/:deliveryId/chat' as const,
      responses: {
        200: z.array(z.custom<typeof deliveryChats.$inferSelect>()),
      },
    },
    createDeliveryMessage: {
      method: 'POST' as const,
      path: '/api/deliveries/chat' as const,
      input: insertDeliveryChatSchema,
      responses: {
        201: z.custom<typeof deliveryChats.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  }
};

// Tipos para respostas de rotas duplas
export const dualRouteResponse = z.object({
  route1: z.custom<typeof deliveries.$inferSelect>(),
  route2: z.custom<typeof deliveries.$inferSelect>(),
  totalDistance: z.number(),
  totalPrice: z.number(),
});

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
