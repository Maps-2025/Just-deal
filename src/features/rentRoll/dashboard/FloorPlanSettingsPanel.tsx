import { Settings, Grid3X3, AlertCircle } from "lucide-react";
import type { RentRollRecord } from "@/services/rentRollApi";

interface FloorPlanSettingsPanelProps {
  rentRolls: RentRollRecord[];
  selectedRentRollId: string | null;
  onSelectRentRoll: (id: string) => void;
  onManage: () => void;
  onView: () => void;
  hasAnomalies?: boolean;
  reportType: string;
  onReportTypeChange: (v: string) => void;
  monthlyRentMode: string;
  onMonthlyRentModeChange: (v: string) => void;
  inPlaceRentType: string;
  onInPlaceRentTypeChange: (v: string) => void;
  includeSupplemental: boolean;
  onIncludeSupplementalChange: (v: boolean) => void;
}

export function FloorPlanSettingsPanel({
  rentRolls,
  selectedRentRollId,
  onSelectRentRoll,
  onManage,
  onView,
  hasAnomalies,
  reportType,
  onReportTypeChange,
  monthlyRentMode,
  onMonthlyRentModeChange,
  inPlaceRentType,
  onInPlaceRentTypeChange,
  includeSupplemental,
  onIncludeSupplementalChange,
}: FloorPlanSettingsPanelProps) {
  return (
    <div className="w-[280px] shrink-0 border-r bg-background overflow-y-auto sticky top-0 h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
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
            <button onClick={onManage} className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
              <Settings className="h-3 w-3" /> Manage
            </button>
            <button onClick={onView} className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
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
          <button className="text-primary text-sm hover:underline flex items-center gap-1 font-medium">
            Anomalies Detected <AlertCircle className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Report View Settings */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-foreground mb-3">Report View Settings</h4>

          <Field label="Report Type">
            <select
              className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
              value={reportType}
              onChange={(e) => onReportTypeChange(e.target.value)}
            >
              <option value="floorplan">Floor Plan</option>
              <option value="unitmix">Unit Mix</option>
              <option value="unitsize">Unit Size</option>
              <option value="fpcode">Floor Plan Code</option>
            </select>
          </Field>

          <Field label="Monthly Rent">
            <select
              className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
              value={monthlyRentMode}
              onChange={(e) => onMonthlyRentModeChange(e.target.value)}
            >
              <option value="1">$ / unit</option>
              <option value="2">$ / sf</option>
              <option value="0">$ total</option>
            </select>
          </Field>

          <Field label="In-Place Rent">
            <select
              className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground"
              value={inPlaceRentType}
              onChange={(e) => onInPlaceRentTypeChange(e.target.value)}
            >
              <option value="contractual">Contractual</option>
              <option value="net_effective">Net Effective</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={includeSupplemental}
              onChange={(e) => onIncludeSupplementalChange(e.target.checked)}
              className="rounded border-muted-foreground"
            />
            Include Supplemental Rents
          </label>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
