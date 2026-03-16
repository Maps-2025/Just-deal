import { Field } from "./Field";

export function PreviousSaleCard() {
  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Previous Sale</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <Field label="Last Sale Date" value={null} />
        <Field label="Current Owner" value={null} />
        <Field label="Last Sale Price" value={null} />
      </div>
    </div>
  );
}
