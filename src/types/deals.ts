// All types now come from the API service layer — no Supabase dependency
export type {
  Deal,
  Property,
  RentRollSummary,
  RentRollUnit,
  UnitMixRow,
  OsSummary,
  OsLineItem,
  OperatingStatement,
  NOISummary,
  DealStats,
  GetDealsParams,
  GetUnitsParams,
} from '@/services/api';

import type { Deal, Property } from '@/services/api';

// DealWithProperty — backend returns "property" (singular) for deal detail
export interface DealWithProperty extends Deal {
  property: Property | null;
  // alias so existing components using deal.properties still work
  properties?: Property | null;
}

export type DealStatus = Deal['status'];
