import type { Tables } from "@/integrations/supabase/types";

// DB row types
export type Deal = Tables<"deals">;
export type Property = Tables<"properties">;
export type RentRoll = Tables<"rent_rolls">;
export type RentRollUnit = Tables<"rent_roll_units">;
export type OperatingStatement = Tables<"operating_statements">;
export type OperatingStatementLineItem = Tables<"operating_statement_line_items">;
export type Organization = Tables<"organizations">;

// Deal with joined property
export interface DealWithProperty extends Deal {
  properties: Property | null;
}

export type DealStatus = Deal["status"];
