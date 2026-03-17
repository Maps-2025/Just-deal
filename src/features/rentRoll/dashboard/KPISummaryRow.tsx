import { Building2, Users, TrendingDown, DollarSign, Percent, Home } from "lucide-react";

interface KPISummaryRowProps {
  totalUnits: number;
  occupied: number;
  vacant: number;
  occupancyPct: number;
  avgMarketRent: number;
  avgInPlaceRent: number;
  totalMonthlyRent: number;
  lossToLease: number;
  lossToLeasePct: number;
  vacancyLoss: number;
}

function KPICard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-background border rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="text-lg font-semibold text-foreground leading-tight">{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

const fmtDollar = (n: number) => {
  if (n == null || isNaN(n)) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
};

export function KPISummaryRow({
  totalUnits,
  occupied,
  vacant,
  occupancyPct,
  avgMarketRent,
  avgInPlaceRent,
  totalMonthlyRent,
  lossToLease,
  lossToLeasePct,
  vacancyLoss,
}: KPISummaryRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <KPICard
        icon={Building2}
        label="Total Units"
        value={String(totalUnits || 0)}
        sub={`${occupied || 0} occupied · ${vacant || 0} vacant`}
      />
      <KPICard
        icon={Percent}
        label="Occupancy"
        value={`${(occupancyPct || 0).toFixed(1)}%`}
      />
      <KPICard
        icon={DollarSign}
        label="Avg In-Place Rent"
        value={fmtDollar(avgInPlaceRent)}
        sub={`Market: ${fmtDollar(avgMarketRent)}`}
      />
      <KPICard
        icon={TrendingDown}
        label="Loss to Lease"
        value={fmtDollar(lossToLease)}
        sub={`${(lossToLeasePct || 0).toFixed(1)}% of market`}
      />
      <KPICard
        icon={Home}
        label="Monthly Revenue"
        value={fmtDollar(totalMonthlyRent)}
        sub={`Vacancy loss: ${fmtDollar(vacancyLoss)}`}
      />
    </div>
  );
}
