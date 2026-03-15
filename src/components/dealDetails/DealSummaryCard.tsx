import type { DealWithProperty } from "@/types/deals";

interface DealSummaryCardProps {
  deal: DealWithProperty;
}

export function DealSummaryCard({ deal }: DealSummaryCardProps) {
  return (
    <div className="section-border p-5">
      <h2 className="text-xl font-semibold mb-4">{deal.deal_name}</h2>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Deal Id</span>
          <p className="font-mono text-sm mt-0.5">{deal.deal_id}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">No. of Residential Units</span>
          <p className="font-mono text-sm mt-0.5">{deal.properties?.total_units ?? "—"}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Market</span>
          <p className="text-sm mt-0.5">{deal.properties?.market || "—"}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-sm text-center mb-1">Unit Mix</h3>
          <p className="text-sm text-muted-foreground text-center">No Rent Rolls added for this deal.</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-center mb-1">Leasing Trends</h3>
          <p className="text-sm text-muted-foreground text-center">No Rent Rolls added for this deal.</p>
        </div>
      </div>
    </div>
  );
}
