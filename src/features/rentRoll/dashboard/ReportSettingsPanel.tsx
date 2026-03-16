import { Settings, Grid3X3, AlertCircle } from "lucide-react";
import type { RentRollRecord } from "@/services/rentRollApi";

interface ReportSettingsPanelProps {
  rentRolls: RentRollRecord[];
  selectedRentRollId: string | null;
  onSelectRentRoll: (id: string) => void;
  onManage: () => void;
  onView: () => void;
  hasAnomalies?: boolean;
}

export function ReportSettingsPanel({
  rentRolls,
  selectedRentRollId,
  onSelectRentRoll,
  onManage,
  onView,
  hasAnomalies,
}: ReportSettingsPanelProps) {
  const selectedRR = rentRolls.find((r) => r.id === selectedRentRollId);

  return (
    <div className="w-[280px] shrink-0 border-r bg-background overflow-y-auto sticky top-0 h-full">
      <div className="p-4 space-y-5">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">Report Settings</h3>
          <div className="flex gap-1">
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
            <span className="w-0.5 h-4 bg-muted-foreground/40 rounded" />
          </div>
        </div>

        {/* Rent Roll selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Rent Roll</span>
            <button onClick={onManage} className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <Settings className="h-3 w-3" /> Manage
            </button>
            <button onClick={onView} className="text-xs text-primary hover:underline flex items-center gap-0.5">
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
                {new Date(rr.report_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>

        {/* Anomalies */}
        {hasAnomalies && (
          <button className="text-primary text-sm hover:underline flex items-center gap-1">
            Anomalies Detected <AlertCircle className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-foreground mb-3">Chart Settings</h4>

          <SettingsField label="Detail">
            <input
              type="text"
              placeholder="Select Some Options"
              className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground placeholder:text-muted-foreground"
              readOnly
            />
            <button className="text-xs text-destructive hover:underline absolute right-0 top-0">✕clear</button>
          </SettingsField>

          <SettingsField label="Monthly Rent">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground">
              <option>$ / unit</option>
              <option>$ / sqft</option>
            </select>
          </SettingsField>

          <SettingsField label="In-Place Rent">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground">
              <option>Contractual</option>
              <option>Net Effective</option>
            </select>
          </SettingsField>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm text-foreground mb-3">Lease Expiration Schedule</h4>

          <SettingsField label="Lease Expiration Schedule by">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground">
              <option># of Units</option>
              <option>% of Units</option>
              <option>Rent</option>
            </select>
          </SettingsField>

          <SettingsField label="Lease Expiration Schedule Shown">
            <select className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground">
              <option>By Bed</option>
              <option>By Unit</option>
              <option>By Floor Plan</option>
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
