import { Field } from "./Field";

export function ValuationCard() {
  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Valuation</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <Field label="Expected Purchase Price" value={null} />
        <Field label="Required Equity" />
        <Field label="Expected Purchase Price / Unit" value={null} />
        <Field label="Leveraged IRR" value={null} />
        <Field label="Equity Multiple" value={null} />
        <Field label="Going-In Cap Rate (Fwd.)" value={null} />
      </div>
    </div>
  );
}
