import type { DealWithProperty } from "@/types/deals";

interface DealInfoCardProps {
  deal: DealWithProperty;
}

export function DealInfoCard({ deal }: DealInfoCardProps) {
  const fields = [
    { label: "Deal Status", value: deal.status },
    { label: "Bid Due Date", value: deal.bid_due_date || "—" },
    { label: "Due Diligence Date", value: deal.due_diligence_date || "—" },
    { label: "Broker", value: deal.broker || "—" },
    { label: "Broker Email", value: deal.broker_email || "—" },
  ];

  return (
    <div className="section-border p-5">
      <h3 className="font-semibold text-sm mb-4">Deal Info</h3>
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="border-b pb-3 last:border-0 last:pb-0">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <p className="text-sm mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
