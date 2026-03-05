import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useCouriers() {
  return useQuery({
    queryKey: [api.couriers.list.path],
    queryFn: async () => {
      const res = await fetch(api.couriers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch couriers");
      return await res.json();
    },
  });
}

export function useCreateCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.couriers.create.path, {
        method: api.couriers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create courier");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.couriers.list.path] }),
  });
}

export function useUpdateCourierLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, locationLat: string, locationLng: string }) => {
      const url = buildUrl(api.couriers.updateLocation.path, { id });
      const res = await fetch(url, {
        method: api.couriers.updateLocation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update location");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.couriers.list.path] }),
  });
}

export function useUpdateCourierAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, isAvailable: boolean }) => {
      const url = buildUrl(api.couriers.updateAvailability.path, { id });
      const res = await fetch(url, {
        method: api.couriers.updateAvailability.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update availability");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.couriers.list.path] }),
  });
}

export function useUpdateCourierBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, balance: string }) => {
      const url = buildUrl(api.couriers.updateBalance.path, { id });
      const res = await fetch(url, {
        method: api.couriers.updateBalance.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update balance");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.couriers.list.path] }),
  });
}

export function useBlockCourier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number, isBlocked: boolean, blockedUntil: string | null }) => {
      const url = buildUrl(api.couriers.block.path, { id });
      const res = await fetch(url, {
        method: api.couriers.block.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to block courier");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.couriers.list.path] }),
  });
}
