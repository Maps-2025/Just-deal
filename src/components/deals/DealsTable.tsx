import { MoreHorizontal, ChevronDown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DealWithProperty } from "@/types/deals";

interface DealsTableProps {
  deals: DealWithProperty[];
}

const statusColor: Record<string, string> = {
  Active:    "badge-green",
  Closed:    "badge-grey",
  Pipeline:  "badge-blue",
  Dead:      "badge-red",
};

export function DealsTable({ deals }: DealsTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse tbl-compact">
        <thead>
          <tr>
            <th className="w-7 px-2 text-center"></th>
            <th className="text-left min-w-[240px]">Deal Name</th>
            <th className="text-left w-[90px]">Deal ID</th>
            <th className="text-left w-[90px]">Status</th>
            <th className="text-left w-[130px]">Market</th>
            <th className="text-right w-[60px]">Units</th>
            <th className="text-left w-[90px]">Fund</th>
            <th className="text-left w-[100px]">Bid Due</th>
            <th className="text-left w-[90px]">Asset</th>
            <th className="w-7 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {deals.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-12 text-muted-foreground text-[12px]">
                No deals found. Create your first deal to get started.
              </td>
            </tr>
          ) : (
            deals.map((deal, idx) => (
              <tr key={deal.id} className={cn(idx % 2 === 1 && "bg-muted/[0.04]")}>
                <td className="px-2 text-center">
                  <Star className="h-3 w-3 text-muted-foreground/40 hover:text-warning cursor-pointer transition-colors" />
                </td>
                <td className="px-3 py-[4px]">
                  <Link
                    to={`/deals/${deal.id}`}
                    className="text-[12px] font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {deal.deal_name}
                  </Link>
                </td>
                <td className="px-3 py-[4px] font-mono text-[11px] text-muted-foreground">
                  {deal.deal_id}
                </td>
                <td className="px-3 py-[4px]">
                  <span className={cn("badge", statusColor[deal.status] || "badge-grey")}>
                    {deal.status}
                  </span>
                </td>
                <td className="px-3 py-[4px] text-[12px] text-muted-foreground">
                  {deal.properties?.market || "—"}
                </td>
                <td className="px-3 py-[4px] text-right font-mono text-[12px]">
                  {deal.properties?.total_units ?? "—"}
                </td>
                <td className="px-3 py-[4px] text-[12px] text-muted-foreground">
                  {deal.fund || "—"}
                </td>
                <td className="px-3 py-[4px] text-[12px] text-muted-foreground">
                  {deal.bid_due_date
                    ? new Date(deal.bid_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
                    : "—"}
                </td>
                <td className="px-3 py-[4px] text-[12px] text-muted-foreground">
                  {deal.asset_type || "—"}
                </td>
                <td className="px-2 text-center">
                  <button className="text-muted-foreground/50 hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
