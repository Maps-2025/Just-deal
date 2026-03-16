import { Field } from "./Field";
import type { DealWithProperty } from "@/types/deals";

interface LocationCardProps {
  deal: DealWithProperty;
}

export function LocationCard({ deal }: LocationCardProps) {
  const p = deal.properties;
  const addressLine = [p?.address, p?.city && p?.state ? `${p.city}, ${p.state}` : p?.city || p?.state, p?.zip]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Location</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <div>
          <span className="text-xs text-muted-foreground">Address</span>
          <p className="text-sm mt-0.5 whitespace-pre-line">{addressLine || "N/A"}</p>
        </div>
        <Field label="Market" value={p?.market} />
        <Field label="University Affiliation" value={null} />
        <Field label="Parcel" value={null} />
        <Field label="Location Quality" value={p?.location_quality} />
        <Field label="Property Website" value={null} />
      </div>
    </div>
  );
}
