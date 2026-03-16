import { Checkbox } from "@/components/ui/checkbox";
import type { DealWithProperty } from "@/types/deals";

const AMENITIES = ["Elevator", "Doorman", "Waterfront", "Fitness Center", "Pool", "Roof Deck"];

interface AmenitiesCardProps {
  deal: DealWithProperty;
}

export function AmenitiesCard({ deal }: AmenitiesCardProps) {
  const amenities = (deal.properties?.amenities ?? {}) as Record<string, boolean>;

  const toKey = (name: string) => name.toLowerCase().replace(/\s+/g, "_");

  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Amenities</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {AMENITIES.map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <Checkbox checked={!!amenities[toKey(name)]} disabled />
            {name}
          </label>
        ))}
      </div>
    </div>
  );
}
