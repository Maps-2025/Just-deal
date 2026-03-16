import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useOccupancy, useUpdateOccupancy } from "@/hooks/useRentRoll";
import type { OccupancyRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const STATUSES = ["Occupied", "Vacant", "Notice", "Down"];

export function OccupancyStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: serverOcc, isLoading } = useOccupancy(dealId, rentRollId);
  const [occupancy, setOccupancy] = useState<OccupancyRow[]>([]);
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
      <h3 className="text-lg font-semibold mb-1">Step 2 - Assign Occupancy Statuses</h3>
      <p className="text-sm text-muted-foreground mb-4">Select the appropriate statuses for all occupancy codes.</p>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="border-b bg-muted/50">
          <th className="text-left px-3 py-2 font-medium">Occupancy Code</th>
          <th className="text-center px-3 py-2 font-medium">Total Units</th>
          <th className="text-right px-3 py-2 font-medium">Total Charges</th>
          <th className="text-left px-3 py-2 font-medium">Occupancy Status</th>
        </tr></thead>
        <tbody>
          {occupancy.map((occ, i) => (
            <tr key={occ.occupancy_code} className="border-b hover:bg-muted/30">
              <td className="px-3 py-2">{occ.occupancy_code}</td>
              <td className="px-3 py-2 text-center">{occ.total_units}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(occ.total_charges)}</td>
              <td className="px-3 py-2"><Select value={occ.occupancy_status} onValueChange={(v) => handleChange(i, v)}><SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="text-sm text-primary font-medium hover:underline" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save Changes"}</button>
      </div>
    </div>
  );
}
