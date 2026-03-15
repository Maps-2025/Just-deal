import { Deal, RentRollUnit } from "@/types/deals";

export const mockDeals: Deal[] = [
  {
    id: "1", dealId: "03403", name: "9730 whitehurst dr", status: "New",
    market: "Dallas-Fort Worth, TX", units: 52, assetType: "Multi-Family",
    address: "9730 Whitehurst Dr", city: "Dallas", state: "TX", zip: "75243",
    assignedTo: "Mane, Sonali", addedBy: "Mane, Sonali", lastModifiedBy: "Mane, Sonali",
    createdAt: "2026-03-10", updatedAt: "2026-03-15",
  },
  {
    id: "2", dealId: "03402", name: "Raleigh", status: "New",
    market: "Dallas-Fort Worth, TX", units: 22, assetType: "Multi-Family",
    address: "1200 Main St", city: "Dallas", state: "TX", zip: "75201",
    createdAt: "2026-03-09", updatedAt: "2026-03-14",
  },
  {
    id: "3", dealId: "03401", name: "Le Parc", status: "New",
    market: "Dallas-Fort Worth, TX", units: 46, assetType: "Multi-Family",
    address: "4500 Oak Lawn Ave", city: "Dallas", state: "TX", zip: "75219",
    createdAt: "2026-03-08", updatedAt: "2026-03-13",
  },
  {
    id: "4", dealId: "03397", name: "Ever Self Storage", status: "New",
    market: "Dallas-Fort Worth, TX", units: 159, assetType: "Self Storage",
    address: "800 Commerce St", city: "Fort Worth", state: "TX", zip: "76102",
    createdAt: "2026-03-07", updatedAt: "2026-03-12",
  },
  {
    id: "5", dealId: "03395", name: "Plaza West", status: "New",
    market: "Wichita, KS", units: 13, assetType: "Multi-Family",
    address: "200 W Douglas Ave", city: "Wichita", state: "KS", zip: "67202",
    createdAt: "2026-03-06", updatedAt: "2026-03-11",
  },
  {
    id: "6", dealId: "00392", name: "Citadel at The Med Center", status: "New",
    market: "Houston, TX", units: 54, assetType: "Multi-Family",
    address: "6700 Main St", city: "Houston", state: "TX", zip: "77030",
    createdAt: "2026-03-05", updatedAt: "2026-03-10",
  },
  {
    id: "7", dealId: "03400", name: "The Drake", status: "New",
    market: "Dallas-Fort Worth, TX", units: 20, assetType: "Multi-Family",
    address: "3100 Turtle Creek Blvd", city: "Dallas", state: "TX", zip: "75219",
    createdAt: "2026-03-04", updatedAt: "2026-03-09",
  },
  {
    id: "8", dealId: "03399", name: "Avalon", status: "New",
    market: "Dallas-Fort Worth, TX", units: 27, assetType: "Multi-Family",
    address: "5000 Belt Line Rd", city: "Dallas", state: "TX", zip: "75254",
    createdAt: "2026-03-03", updatedAt: "2026-03-08",
  },
  {
    id: "9", dealId: "03398", name: "Meridian Heights", status: "Under Review",
    market: "Austin, TX", units: 88, assetType: "Multi-Family",
    address: "1100 S Congress Ave", city: "Austin", state: "TX", zip: "78704",
    purchasePrice: 14500000, capRate: 5.2,
    createdAt: "2026-03-02", updatedAt: "2026-03-07",
  },
  {
    id: "10", dealId: "03396", name: "Oakmont Reserve", status: "LOI",
    market: "San Antonio, TX", units: 112, assetType: "Multi-Family",
    address: "300 E Houston St", city: "San Antonio", state: "TX", zip: "78205",
    purchasePrice: 18200000, capRate: 5.8,
    createdAt: "2026-03-01", updatedAt: "2026-03-06",
  },
];

export const mockRentRoll: RentRollUnit[] = Array.from({ length: 52 }, (_, i) => {
  const types = ["1BR/1BA", "2BR/1BA", "2BR/2BA", "3BR/2BA"];
  const type = types[i % types.length];
  const sqfts: Record<string, number> = { "1BR/1BA": 650, "2BR/1BA": 850, "2BR/2BA": 950, "3BR/2BA": 1200 };
  const brs: Record<string, number> = { "1BR/1BA": 1, "2BR/1BA": 2, "2BR/2BA": 2, "3BR/2BA": 3 };
  const bas: Record<string, number> = { "1BR/1BA": 1, "2BR/1BA": 1, "2BR/2BA": 2, "3BR/2BA": 2 };
  const baseRent: Record<string, number> = { "1BR/1BA": 950, "2BR/1BA": 1150, "2BR/2BA": 1350, "3BR/2BA": 1650 };
  const statuses: ("Occupied" | "Vacant" | "Notice")[] = ["Occupied", "Occupied", "Occupied", "Occupied", "Vacant", "Notice"];

  return {
    id: `unit-${i + 1}`,
    unitNumber: `${100 + i + 1}`,
    unitType: type,
    sqft: sqfts[type],
    bedrooms: brs[type],
    bathrooms: bas[type],
    currentRent: baseRent[type] + Math.round((Math.random() - 0.5) * 100),
    marketRent: baseRent[type] + 50,
    status: statuses[i % statuses.length],
    leaseStart: "2025-06-01",
    leaseEnd: "2026-05-31",
    tenant: statuses[i % statuses.length] === "Vacant" ? undefined : `Tenant ${i + 1}`,
  };
});
