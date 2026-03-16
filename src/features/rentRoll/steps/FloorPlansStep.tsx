import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFloorplans, useUpdateFloorplans } from "@/hooks/useRentRoll";
import type { FloorplanRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const UNIT_TYPES = ["Residential", "Commercial", "Other"];

export function FloorPlansStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: serverFps, isLoading } = useFloorplans(dealId, rentRollId);
  const [floorplans, setFloorplans] = useState<FloorplanRow[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const update = useUpdateFloorplans(dealId);

  useEffect(() => { if (serverFps) setFloorplans(serverFps); }, [serverFps]);

  const handleChange = (i: number, field: keyof FloorplanRow, value: any) => {
    setFloorplans((prev) => prev.map((fp, idx) => idx === i ? { ...fp, [field]: value } : fp));
  };

  const handleSave = async () => {
    try { await update.mutateAsync({ rentRollId, floorplans }); toast.success("Floor plans saved"); }
    catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading floor plans…</p>;

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">Floor Plan Details</h3>
      <p className="text-sm text-muted-foreground mb-3">
        In this step you can enter details for all floor plans, which have been automatically pulled from the rent roll.
      </p>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-primary hover:underline mb-4 block"
      >
        {showInstructions ? "Hide" : "Show"} Instructions
      </button>
      {showInstructions && (
        <div className="bg-muted/50 border rounded p-3 mb-4 text-sm text-muted-foreground space-y-1">
          <p>• <strong>Unit Type:</strong> Select the unit type for each floor plan (Residential, Commercial, Other).</p>
          <p>• <strong>Bedrooms / Baths:</strong> Enter bedroom and bathroom count.</p>
          <p>• <strong>Floor Plan Name:</strong> Optionally rename floor plans for clarity.</p>
        </div>
      )}
      <div className="overflow-auto border rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="text-left px-3 py-2 font-semibold text-xs">Floor Plan Code</th>
              <th className="text-left px-3 py-2 font-semibold text-xs">Unit Type</th>
              <th className="text-center px-3 py-2 font-semibold text-xs">Bedrooms</th>
              <th className="text-center px-3 py-2 font-semibold text-xs">Baths</th>
              <th className="text-center px-3 py-2 font-semibold text-xs"># Units</th>
              <th className="text-right px-3 py-2 font-semibold text-xs">Net SqFt</th>
              <th className="text-right px-3 py-2 font-semibold text-xs">Market Rent</th>
              <th className="text-left px-3 py-2 font-semibold text-xs">Floor Plan Name</th>
            </tr>
          </thead>
          <tbody>
            {floorplans.map((fp, i) => (
              <tr key={fp.floor_plan_code} className="border-b hover:bg-muted/20">
                <td className="px-3 py-1.5">
                  <Input className="h-7 text-xs bg-muted/30" value={fp.floor_plan_code} readOnly />
                </td>
                <td className="px-3 py-1.5">
                  <Select value={fp.unit_type} onValueChange={(v) => handleChange(i, "unit_type", v)}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-1.5">
                  <Input type="number" className="h-7 w-16 text-center text-xs" value={fp.bedrooms ?? ""} onChange={(e) => handleChange(i, "bedrooms", parseInt(e.target.value) || null)} />
                </td>
                <td className="px-3 py-1.5">
                  <Input type="number" className="h-7 w-16 text-center text-xs" value={fp.bathrooms ?? ""} onChange={(e) => handleChange(i, "bathrooms", parseFloat(e.target.value) || null)} />
                </td>
                <td className="px-3 py-1.5 text-center text-muted-foreground text-xs">
                  <Input className="h-7 w-14 text-center text-xs bg-muted/30" value={fp.units} readOnly />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <Input className="h-7 w-20 text-right text-xs bg-muted/30" value={fp.net_sqft.toLocaleString()} readOnly />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <Input className="h-7 w-24 text-right text-xs bg-muted/30" value={`$${fp.market_rent.toLocaleString()}`} readOnly />
                </td>
                <td className="px-3 py-1.5">
                  <Input className="h-7 text-xs" value={fp.floor_plan_name} onChange={(e) => handleChange(i, "floor_plan_name", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
