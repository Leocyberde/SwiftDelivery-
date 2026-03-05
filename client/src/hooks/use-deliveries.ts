import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useDeliveries() {
  return useQuery({
    queryKey: [api.deliveries.list.path],
    queryFn: async () => {
      const res = await fetch(api.deliveries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      return api.deliveries.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.deliveries.create.input>) => {
      const res = await fetch(api.deliveries.create.path, {
        method: api.deliveries.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create delivery");
      return api.deliveries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.deliveries.list.path] }),
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof api.deliveries.updateStatus.input>) => {
      const url = buildUrl(api.deliveries.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.deliveries.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.deliveries.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.deliveries.list.path] }),
  });
}

export function useReassignDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, courierId: number | null }) => {
      const url = buildUrl(api.deliveries.reassign.path, { id });
      const res = await fetch(url, {
        method: api.deliveries.reassign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reassign delivery");
      return api.deliveries.reassign.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.deliveries.list.path] }),
  });
}

export function useCreateSecondRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof api.deliveries.createSecondRoute.input>) => {
      const url = buildUrl(api.deliveries.createSecondRoute.path, { id });
      const res = await fetch(url, {
        method: api.deliveries.createSecondRoute.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create second route");
      return api.deliveries.createSecondRoute.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate deliveries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [api.deliveries.list.path] });
      // Dispatch custom event for notification
      window.dispatchEvent(new CustomEvent('second-route-created', { detail: { timestamp: Date.now() } }));
    },
  });
}
