import type { DealWithProperty } from "@/types/deals";

interface DealInfoCardProps {
  deal: DealWithProperty;
}

export function DealInfoCard({ deal }: DealInfoCardProps) {
  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  const fields = [
    { label: "Deal Status", value: deal.status },
    { label: "Bid Due Date", value: formatDate(deal.bid_due_date) },
    { label: "Due Diligence Date", value: formatDate(deal.due_diligence_date) },
    { label: "Broker", value: deal.broker || "—" },
    { label: "Broker Email", value: deal.broker_email || "—" },
    { label: "Broker Phone", value: deal.broker_phone || "—" },
    { label: "Fund", value: deal.fund || "—" },
    { label: "Asset Type", value: deal.asset_type },
    { label: "Deal Type", value: deal.deal_type || "—" },
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
