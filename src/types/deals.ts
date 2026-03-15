export type DealStatus = "New" | "Under Review" | "LOI" | "Due Diligence" | "Closed" | "Dead";

export type AssetType = "Multi-Family" | "Self Storage" | "Office" | "Retail" | "Industrial" | "Mixed-Use";

export interface Deal {
  id: string;
  dealId: string;
  name: string;
  status: DealStatus;
  market: string;
  units: number;
  assetType: AssetType;
  fund?: string;
  bidDueDate?: string;
  purchasePrice?: number;
  capRate?: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  broker?: string;
  brokerEmail?: string;
  assignedTo?: string;
  addedBy?: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentRollUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  currentRent: number;
  marketRent: number;
  status: "Occupied" | "Vacant" | "Notice";
  leaseStart?: string;
  leaseEnd?: string;
  tenant?: string;
}
