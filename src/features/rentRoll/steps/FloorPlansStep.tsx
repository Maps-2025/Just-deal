import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFloorplans, useUpdateFloorplans } from "@/hooks/useRentRoll";
import type { FloorplanRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const UNIT_TYPES = ["Residential", "Commercial", "Other"];

export function FloorPlansStep({ rentRollId }: { rentRollId: string }) {
  const { data: serverFps, isLoading } = useFloorplans(rentRollId);
  const [floorplans, setFloorplans] = useState<FloorplanRow[]>([]);
  const update = useUpdateFloorplans();

  useEffect(() => {
    if (serverFps) setFloorplans(serverFps);
  }, [serverFps]);

  const handleChange = (i: number, field: keyof FloorplanRow, value: any) => {
    setFloorplans((prev) => prev.map((fp, idx) => idx === i ? { ...fp, [field]: value } : fp));
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({ rentRollId, floorplans });
      toast.success("Floor plans saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading floor plans…</p>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Step 1 - Enter Floor Plan Details</h3>
      <p className="text-sm text-muted-foreground mb-4">
        In this step you can enter details for all floor plans, which have been automatically pulled from the rent roll.
      </p>

      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-3 py-2 font-medium">Floor Plan Code</th>
              <th className="text-left px-3 py-2 font-medium">Unit Type</th>
              <th className="text-center px-3 py-2 font-medium">Bedrooms</th>
              <th className="text-center px-3 py-2 font-medium">Baths</th>
              <th className="text-center px-3 py-2 font-medium"># Units</th>
              <th className="text-right px-3 py-2 font-medium">Net SqFt</th>
              <th className="text-right px-3 py-2 font-medium">Market Rent</th>
              <th className="text-left px-3 py-2 font-medium">Floor Plan Name</th>
            </tr>
          </thead>
          <tbody>
            {floorplans.map((fp, i) => (
              <tr key={fp.floor_plan_code} className="border-b hover:bg-muted/30">
                <td className="px-3 py-1.5 font-mono text-sm">{fp.floor_plan_code}</td>
                <td className="px-3 py-1.5">
                  <Select value={fp.unit_type} onValueChange={(v) => handleChange(i, "unit_type", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-1.5">
                  <Input type="number" className="h-8 w-16 text-center text-xs" value={fp.bedrooms ?? ""} onChange={(e) => handleChange(i, "bedrooms", parseInt(e.target.value) || null)} />
                </td>
                <td className="px-3 py-1.5">
                  <Input type="number" className="h-8 w-16 text-center text-xs" value={fp.bathrooms ?? ""} onChange={(e) => handleChange(i, "bathrooms", parseFloat(e.target.value) || null)} />
                </td>
                <td className="px-3 py-1.5 text-center text-muted-foreground">{fp.units}</td>
                <td className="px-3 py-1.5 text-right font-mono">{fp.net_sqft.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-right font-mono">${fp.market_rent.toLocaleString()}</td>
                <td className="px-3 py-1.5">
                  <Input className="h-8 text-xs" value={fp.floor_plan_name} onChange={(e) => handleChange(i, "floor_plan_name", e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="text-sm text-primary font-medium hover:underline" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
