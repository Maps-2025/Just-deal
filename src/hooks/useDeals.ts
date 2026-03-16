import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { dealsApi, rentRollApi } from "@/services/api";
import type { DealWithProperty } from "@/types/deals";
import type { RentRollUnit, GetDealsParams } from "@/services/api";

// ─── Normalise deal so both deal.property and deal.properties work ────────────
function normaliseDeal(deal: any): DealWithProperty {
  return {
    ...deal,
    property: deal.property ?? deal.properties ?? null,
    properties: deal.property ?? deal.properties ?? null,
  };
}

// ─── List all deals (Supabase direct) ─────────────────────────────────────────
export function useDeals(params: GetDealsParams = {}) {
  return useQuery({
    queryKey: ["deals", params],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, properties(*)")
        .order("date_modified", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: any) => normaliseDeal({ ...d, property: d.properties })) as DealWithProperty[];
    },
  });
}

// ─── Single deal (Supabase direct) ────────────────────────────────────────────
export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deals", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, properties(*)")
        .eq("id", dealId!)
        .single();
      if (error) throw error;
      return normaliseDeal({ ...data, property: data.properties }) as DealWithProperty;
    },
    enabled: !!dealId,
  });
}

// ─── Rent roll units (latest snapshot) ───────────────────────────────────────
export function useRentRollUnits(dealId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-units", dealId],
    queryFn: async () => {
      // Get latest rent roll for this deal
      const { data: rr, error: rrErr } = await supabase
        .from("rent_rolls")
        .select("id")
        .eq("deal_pk", dealId!)
        .order("report_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rrErr) throw rrErr;
      if (!rr) return [] as RentRollUnit[];

      const { data: units, error: uErr } = await supabase
        .from("rent_roll_units")
        .select("*")
        .eq("rent_roll_id", rr.id)
        .limit(200);
      if (uErr) throw uErr;
      return (units ?? []) as unknown as RentRollUnit[];
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

// ─── Create deal (Supabase direct) ────────────────────────────────────────────
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
      const { address, city, state, zip, market, ...dealData } = input;
      const { data: deal, error } = await supabase
        .from("deals")
        .insert(dealData)
        .select()
        .single();
      if (error) throw error;

      // Create property record
      const { error: propErr } = await supabase
        .from("properties")
        .insert({
          deal_pk: deal.id,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          market: market || null,
        });
      if (propErr) throw propErr;

      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}

// ─── Update deal (Supabase direct — updates both deals + properties) ──────────
export function useUpdateDeal(dealId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { property, ...dealFields } = data as Record<string, any>;

      // Update deals table
      const dealUpdate: Record<string, any> = {};
      const dealCols = ["deal_name", "asset_type", "deal_type", "fund", "status", "bid_due_date", "due_diligence_date", "broker", "broker_email", "broker_phone", "comments"];
      for (const col of dealCols) {
        if (col in dealFields) dealUpdate[col] = dealFields[col];
      }
      if (Object.keys(dealUpdate).length > 0) {
        const { error } = await supabase.from("deals").update(dealUpdate).eq("id", dealId);
        if (error) throw error;
      }

      // Update properties table
      if (property && typeof property === "object") {
        const { error } = await supabase.from("properties").update(property).eq("deal_pk", dealId);
        if (error) throw error;
      }
    },
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
