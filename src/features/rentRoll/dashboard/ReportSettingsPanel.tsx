import { Settings, Grid3X3, AlertCircle, X } from "lucide-react";
import type { RentRollRecord } from "@/services/rentRollApi";

const DETAIL_OPTIONS = ["Baths", "Beds", "Unit Type", "Lease Type", "Renovated", "Floor Plan", "Net sf", "Occupancy"];

interface ReportSettingsPanelProps {
  rentRolls: RentRollRecord[];
  selectedRentRollId: string | null;
  onSelectRentRoll: (id: string) => void;
  onManage: () => void;
  onView: () => void;
  hasAnomalies?: boolean;
  monthlyRentMode?: string;
  onMonthlyRentModeChange?: (v: string) => void;
  inPlaceRentType?: string;
  onInPlaceRentTypeChange?: (v: string) => void;
  leaseExpBy?: string;
  onLeaseExpByChange?: (v: string) => void;
  leaseExpShown?: string;
  onLeaseExpShownChange?: (v: string) => void;
  detailFilters?: string[];
  onDetailFiltersChange?: (v: string[]) => void;
}

export function ReportSettingsPanel({
  rentRolls,
  selectedRentRollId,
  onSelectRentRoll,
  onManage,
  onView,
  hasAnomalies,
  monthlyRentMode = "per_unit",
  onMonthlyRentModeChange,
  inPlaceRentType = "contractual",
  onInPlaceRentTypeChange,
  leaseExpBy = "units",
  onLeaseExpByChange,
  leaseExpShown = "by_bed",
  onLeaseExpShownChange,
  detailFilters = [],
  onDetailFiltersChange,
}: ReportSettingsPanelProps) {
  return (
    <div className="w-[280px] shrink-0 border-r bg-background overflow-y-auto sticky top-0 h-full">
      <div className="p-4 space-y-4">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Report Settings</h3>
          <div className="flex gap-0.5">
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
          </div>
        </div>

        {/* Rent Roll selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Rent Roll</span>
            <button onClick={onManage} className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5 font-medium">
              <Settings className="h-3 w-3" /> Manage
            </button>
            <button onClick={onView} className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-0.5 font-medium">
              <Grid3X3 className="h-3 w-3" /> View
            </button>
          </div>
          <select
            className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
            value={selectedRentRollId || ""}
            onChange={(e) => onSelectRentRoll(e.target.value)}
          >
            {rentRolls.map((rr) => (
              <option key={rr.id} value={rr.id}>
                {new Date(rr.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>

        {/* Anomalies */}
        {hasAnomalies && (
          <button className="text-[hsl(var(--primary))] text-sm hover:underline flex items-center gap-1 font-medium">
            Anomalies Detected <AlertCircle className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-foreground mb-3">Chart Settings</h4>

          {/* Detail multi-select */}
          <SettingsField label="Detail">
            <div className="relative">
              <div className="flex flex-wrap gap-1 min-h-[32px] border rounded px-2 py-1 bg-background">
                {detailFilters.map(f => (
                  <span key={f} className="inline-flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">
                    {f}
                    <button onClick={() => onDetailFiltersChange?.(detailFilters.filter(d => d !== f))}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                <select
                  className="flex-1 min-w-[80px] text-xs bg-transparent border-0 outline-none text-muted-foreground"
                  value=""
                  onChange={e => {
                    if (e.target.value && !detailFilters.includes(e.target.value)) {
                      onDetailFiltersChange?.([...detailFilters, e.target.value]);
                    }
                  }}
                >
                  <option value="">Select…</option>
                  {DETAIL_OPTIONS.filter(o => !detailFilters.includes(o)).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              {detailFilters.length > 0 && (
                <button
                  onClick={() => onDetailFiltersChange?.([])}
                  className="text-xs text-destructive hover:underline absolute right-0 -top-4"
                >
                  ✕clear
                </button>
              )}
            </div>
          </SettingsField>

          <SettingsField label="Monthly Rent">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground" value={monthlyRentMode} onChange={e => onMonthlyRentModeChange?.(e.target.value)}>
              <option value="total">$ total</option>
              <option value="per_unit">$ / unit</option>
              <option value="per_sf">$ / sf</option>
            </select>
          </SettingsField>

          <SettingsField label="In-Place Rent">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground" value={inPlaceRentType} onChange={e => onInPlaceRentTypeChange?.(e.target.value)}>
              <option value="contractual">Contractual</option>
              <option value="net_effective">Net Effective</option>
            </select>
          </SettingsField>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-foreground mb-3">Lease Expiration Schedule</h4>

          <SettingsField label="Lease Expiration Schedule by">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground" value={leaseExpBy} onChange={e => onLeaseExpByChange?.(e.target.value)}>
              <option value="units"># of Units</option>
              <option value="pct_units">% of Units</option>
              <option value="pct_rent">% of In-Place Rent</option>
            </select>
          </SettingsField>

          <SettingsField label="Lease Expiration Schedule Shown">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground" value={leaseExpShown} onChange={e => onLeaseExpShownChange?.(e.target.value)}>
              <option value="all">All Units</option>
              <option value="by_bed">By Bed</option>
              <option value="by_unit">By Unit</option>
              <option value="by_fp">By Floor Plan</option>
            </select>
          </SettingsField>
        </div>
      </div>
    </div>
  );
}

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 relative">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
