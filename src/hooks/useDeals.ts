import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealsApi, propertiesApi, rentRollApi } from "@/services/api";
import type { DealWithProperty } from "@/types/deals";
import type { RentRollUnit, GetDealsParams } from "@/services/api";

// ─── Normalise deal so both deal.property and deal.properties work ────────────
function normaliseDeal(deal: any): DealWithProperty {
  return {
    ...deal,
    property: deal.property ?? null,
    properties: deal.property ?? null,
  };
}

// ─── List all deals ───────────────────────────────────────────────────────────
export function useDeals(params: GetDealsParams = {}) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: async () => {
      const res = await dealsApi.list(params);
      return (res.data ?? []).map(normaliseDeal) as DealWithProperty[];
    },
  });
}

// ─── Single deal ──────────────────────────────────────────────────────────────
export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deals", dealId],
    queryFn: async () => {
      const deal = await dealsApi.get(dealId!);
      return normaliseDeal(deal) as DealWithProperty;
    },
    enabled: !!dealId,
  });
}

// ─── Rent roll units (latest snapshot) ───────────────────────────────────────
export function useRentRollUnits(dealId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-units", dealId],
    queryFn: async () => {
      const res = await rentRollApi.units(dealId!, { limit: 200 });
      return (res.data ?? []) as RentRollUnit[];
    },
    enabled: !!dealId,
  });
}

// ─── Deal stats (for future dashboard) ───────────────────────────────────────
export function useDealStats() {
  return useQuery({
    queryKey: ["deal-stats"],
    queryFn: () => dealsApi.stats(),
  });
}

// ─── Status categories (for filter dropdown) ─────────────────────────────────
export function useStatusCategories() {
  return useQuery({
    queryKey: ["status-categories"],
    queryFn: () => dealsApi.statusCategories(),
  });
}

// ─── Create deal ──────────────────────────────────────────────────────────────
export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      deal_name: string;
      asset_type: string;
      organization_id: string;
      deal_id: string;
      status: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      market?: string;
    }) => {
      return dealsApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// ─── Update deal (sends deal + property data via API) ─────────────────────────
export function useUpdateDeal(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => dealsApi.update(dealId, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals", dealId] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// ─── Toggle star ──────────────────────────────────────────────────────────────
export function useToggleStar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) => dealsApi.toggleStar(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// ─── Delete deal ──────────────────────────────────────────────────────────────
export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dealId: string) => dealsApi.delete(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
