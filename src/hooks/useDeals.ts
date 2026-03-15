import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DealWithProperty, RentRollUnit } from "@/types/deals";

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, properties(*)")
        .order("date_added", { ascending: false });
      if (error) throw error;
      return data as DealWithProperty[];
    },
  });
}

export function useDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: ["deals", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*, properties(*)")
        .eq("id", dealId!)
        .maybeSingle();
      if (error) throw error;
      return data as DealWithProperty | null;
    },
    enabled: !!dealId,
  });
}

export function useRentRollUnits(dealId: string | undefined) {
  return useQuery({
    queryKey: ["rent-roll-units", dealId],
    queryFn: async () => {
      // First get rent_rolls for this deal
      const { data: rentRolls, error: rrError } = await supabase
        .from("rent_rolls")
        .select("id")
        .eq("deal_pk", dealId!)
        .order("report_date", { ascending: false })
        .limit(1);
      if (rrError) throw rrError;
      if (!rentRolls || rentRolls.length === 0) return [];

      const { data, error } = await supabase
        .from("rent_roll_units")
        .select("*")
        .eq("rent_roll_id", rentRolls[0].id)
        .order("unit_no");
      if (error) throw error;
      return data as RentRollUnit[];
    },
    enabled: !!dealId,
  });
}

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
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .insert(dealData)
        .select()
        .single();
      if (dealError) throw dealError;

      // Create property record
      if (address || city || state || zip || market) {
        const { error: propError } = await supabase
          .from("properties")
          .insert({
            deal_pk: deal.id,
            address,
            city,
            state,
            zip,
            market,
          });
        if (propError) throw propError;
      }

      return deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });
}
