import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useMerchants() {
  return useQuery({
    queryKey: [api.merchants.list.path],
    queryFn: async () => {
      const res = await fetch(api.merchants.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch merchants");
      return api.merchants.list.responses[200].parse(await res.json());
    },
  });
}

export function useMerchant(id: number) {
  return useQuery({
    queryKey: [api.merchants.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.merchants.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch merchant");
      return api.merchants.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.merchants.create.input>) => {
      const res = await fetch(api.merchants.create.path, {
        method: api.merchants.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create merchant");
      return api.merchants.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.merchants.list.path] }),
  });
}

export function useUpdateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & z.infer<typeof api.merchants.update.input>) => {
      const url = buildUrl(api.merchants.update.path, { id });
      const res = await fetch(url, {
        method: api.merchants.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update merchant");
      return api.merchants.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.merchants.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.merchants.get.path, id] });
    },
  });
}
