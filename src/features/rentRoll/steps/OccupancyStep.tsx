import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOccupancy, useUpdateOccupancy } from "@/hooks/useRentRoll";
import type { OccupancyRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const STATUSES = ["Occupied", "Vacant", "Notice", "Down"];

export function OccupancyStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: serverOcc, isLoading } = useOccupancy(dealId, rentRollId);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const update = useUpdateOccupancy(dealId);

  useEffect(() => { if (serverOcc) setOccupancy(serverOcc); }, [serverOcc]);

  const handleChange = (i: number, status: string) => {
    setOccupancy((prev) => prev.map((o, idx) => idx === i ? { ...o, occupancy_status: status } : o));
  };

  const handleSave = async () => {
    try { await update.mutateAsync({ rentRollId, occupancy }); toast.success("Occupancy saved"); }
    catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading occupancy…</p>;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">Occupancy Status</h3>
      <p className="text-sm text-muted-foreground mb-3">
        In this step you can select the appropriate Statuses for all occupancy codes, which have been automatically pulled from the rent roll and grouped together.
      </p>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-primary hover:underline mb-4 block"
      >
        {showInstructions ? "Hide" : "Show"} Instructions
      </button>
      {showInstructions && (
        <div className="bg-muted/50 border rounded p-3 mb-4 text-sm text-muted-foreground space-y-1">
          <p>• Select the appropriate occupancy status for each code.</p>
          <p>• Click "Next" to proceed to the next step.</p>
        </div>
      )}
      <div className="overflow-auto border rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="text-left px-3 py-2 font-semibold text-xs">Occupancy Code</th>
              <th className="text-center px-3 py-2 font-semibold text-xs">Total Units</th>
              <th className="text-right px-3 py-2 font-semibold text-xs">Total Charges</th>
              <th className="text-left px-3 py-2 font-semibold text-xs">
                Occupancy Status <span className="inline-block w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[10px] leading-[14px] text-center">?</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {occupancy.map((occ, i) => (
              <tr key={occ.occupancy_code} className="border-b hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Input className="h-7 text-xs bg-muted/30" value={occ.occupancy_code} readOnly />
                </td>
                <td className="px-3 py-2 text-center">
                  <Input className="h-7 w-16 text-center text-xs bg-muted/30 mx-auto" value={occ.total_units} readOnly />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input className="h-7 w-24 text-right text-xs bg-muted/30 ml-auto" value={fmt(occ.total_charges)} readOnly />
                </td>
                <td className="px-3 py-2">
                  <Select value={occ.occupancy_status} onValueChange={(v) => handleChange(i, v)}>
                    <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
