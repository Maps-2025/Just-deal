import { MoreVertical, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Deal } from "@/types/deals";
import { cn } from "@/lib/utils";

interface DealsTableProps {
  deals: Deal[];
}

export function DealsTable({ deals }: DealsTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr className="border-b">
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[280px]">Deal Name</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">Deal ID</th>
            <th className="text-center font-medium text-muted-foreground px-2 py-2.5 w-[32px]">S</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[120px]">Status</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Market</th>
            <th className="text-right font-medium text-muted-foreground px-4 py-2.5 w-[80px]">Units</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">Fund</th>
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[120px]">Bid Due Date</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, index) => (
            <tr
              key={deal.id}
              className={cn(
                "h-11 border-b transition-colors hover:bg-primary/5 cursor-pointer",
                index % 2 === 0 && "bg-primary/[0.03]"
              )}
            >
              <td className="px-4 py-0">
                <Link
                  to={`/deals/${deal.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {deal.name}
                </Link>
              </td>
              <td className="px-4 py-0 font-mono text-muted-foreground">{deal.dealId}</td>
              <td className="px-2 py-0 text-center">
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </td>
              <td className="px-4 py-0">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  {deal.status}
                  <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
                </span>
              </td>
              <td className="px-4 py-0 text-muted-foreground">{deal.market}</td>
              <td className="px-4 py-0 text-right font-mono">{deal.units}</td>
              <td className="px-4 py-0 text-muted-foreground">{deal.fund || "—"}</td>
              <td className="px-4 py-0 text-muted-foreground">{deal.bidDueDate || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
