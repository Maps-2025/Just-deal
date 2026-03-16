import { Field } from "./Field";
import type { DealWithProperty } from "@/types/deals";

interface CharacteristicsCardProps {
  deal: DealWithProperty;
}

export function CharacteristicsCard({ deal }: CharacteristicsCardProps) {
  const p = deal.properties;
  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Characteristics</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <Field label="No. of Residential Units" value={p?.total_units} />
        <Field label="No. of Buildings" value={p?.buildings} />
        <Field label="Residential Square Footage" value={p?.residential_sqft} />
        <Field label="No. of Stories" value={p?.stories} />
        <Field label="Building Type" value={p?.building_type} />
        <Field label="Asset Quality" value={p?.asset_quality} />
        <Field label="Year Built" value={p?.year_built} />
        <Field label="Property Manager" value={p?.property_manager} />
        <Field label="Year Renovated" value={p?.year_renovated} />
        <Field label="Acres" value={p?.acres} />
        <Field label="Affordable Units Percentage" value={p?.affordable_units_pct != null ? `${p.affordable_units_pct}%` : null} />
        <Field label="Parking Spaces" value={p?.parking_spaces} />
        <Field label="Age Restricted" value={p?.age_restricted != null ? (p.age_restricted ? "Yes" : "No") : null} />
        <Field label="Affordability Status" value={p?.affordability_status} />
      </div>
    </div>
  );
}
