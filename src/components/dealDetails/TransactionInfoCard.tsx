import { Field } from "./Field";
import type { DealWithProperty } from "@/types/deals";

interface TransactionInfoCardProps {
  deal: DealWithProperty;
}

export function TransactionInfoCard({ deal }: TransactionInfoCardProps) {
  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Transaction Information</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        <Field label="Sale Price" value={null} />
        <Field label="Buyer" value={null} />
        <Field label="Sale Date" value={null} />
        <Field label="Seller" value={null} />
        <Field label="Sale Price Per Unit" value={null} />
        <Field label="Broker" value={deal.broker} />
        <Field label="Cap Rate (Trailing)" value={null} />
        <Field label="NOI (Trailing 12)" value={null} />
      </div>
    </div>
  );
}
