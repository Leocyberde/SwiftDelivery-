import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import type { SupportTicket, InsertSupportTicket } from "@shared/schema";

export function useSupportTickets() {
  return useQuery<SupportTicket[]>({
    queryKey: [api.support.list.path],
  });
}

export function useMerchantSupportTickets(merchantId?: number) {
  return useQuery<SupportTicket[]>({
    queryKey: [buildUrl(api.support.listByMerchant.path, { id: merchantId || 0 })],
    enabled: !!merchantId,
  });
}

export function useCourierSupportTickets(courierId?: number) {
  return useQuery<SupportTicket[]>({
    queryKey: [buildUrl(api.support.listByCourier.path, { id: courierId || 0 })],
    enabled: !!courierId,
  });
}

export function useCreateSupportTicket() {
  return useMutation({
    mutationFn: async (ticket: InsertSupportTicket) => {
      const res = await fetch(api.support.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticket),
      });
      if (!res.ok) throw new Error("Failed to create support ticket");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.support.list.path] });
      if (variables.merchantId) {
        queryClient.invalidateQueries({ queryKey: [buildUrl(api.support.listByMerchant.path, { id: variables.merchantId })] });
      }
      if (variables.courierId) {
        queryClient.invalidateQueries({ queryKey: [buildUrl(api.support.listByCourier.path, { id: variables.courierId })] });
      }
    },
  });
}

export function useUpdateSupportTicket() {
  return useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      const res = await fetch(buildUrl(api.support.update.path, { id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error("Failed to update support ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.support.list.path] });
    },
  });
}
