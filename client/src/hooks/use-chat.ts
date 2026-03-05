import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import type { ChatMessage, InsertChatMessage, ActiveSession, InsertActiveSession, DeliveryChat, InsertDeliveryChat } from "@shared/schema";

export function useChatMessages(ticketId?: number) {
  return useQuery<ChatMessage[]>({
    queryKey: [buildUrl(api.chat.messages.path, { ticketId: ticketId || 0 })],
    enabled: !!ticketId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time effect
  });
}

export function useCreateChatMessage() {
  return useMutation({
    mutationFn: async (message: InsertChatMessage) => {
      const res = await fetch(api.chat.createMessage.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!res.ok) throw new Error("Failed to create chat message");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.chat.messages.path, { ticketId: variables.ticketId })] });
    },
  });
}

export function useActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: [api.chat.sessions.path],
    refetchInterval: 3000, // Refetch every 3 seconds
  });
}

export function useCreateActiveSession() {
  return useMutation({
    mutationFn: async (session: InsertActiveSession) => {
      const res = await fetch(api.chat.createSession.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });
      if (!res.ok) throw new Error("Failed to create active session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.sessions.path] });
    },
  });
}

export function useCloseActiveSession() {
  return useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await fetch(buildUrl(api.chat.closeSession.path, { ticketId }), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to close session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chat.sessions.path] });
    },
  });
}

export function useDeliveryChatMessages(deliveryId?: number) {
  return useQuery<DeliveryChat[]>({
    queryKey: [buildUrl(api.chat.deliveryMessages.path, { deliveryId: deliveryId || 0 })],
    enabled: !!deliveryId,
    refetchInterval: 2000,
  });
}

export function useCreateDeliveryChatMessage() {
  return useMutation({
    mutationFn: async (message: InsertDeliveryChat) => {
      const res = await fetch(api.chat.createDeliveryMessage.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!res.ok) throw new Error("Failed to create delivery chat message");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.chat.deliveryMessages.path, { deliveryId: variables.deliveryId })] });
    },
  });
}
