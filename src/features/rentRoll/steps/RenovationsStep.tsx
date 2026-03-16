import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFloorplans, useUpdateRenovations } from "@/hooks/useRentRoll";
import { toast } from "sonner";

type MarkBy = "floorplans" | "chargecodes" | "unitnumber";

export function RenovationsStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: floorplans, isLoading } = useFloorplans(dealId, rentRollId);
  const [hasRenovated, setHasRenovated] = useState(false);
  const [markBy, setMarkBy] = useState<MarkBy>("floorplans");
  const [showInstructions, setShowInstructions] = useState(false);
  const [renovations, setRenovations] = useState<{ floor_plan_code: string; renovation_description: string; selected: boolean }[]>([]);
  const update = useUpdateRenovations(dealId);

  useEffect(() => {
    if (floorplans) setRenovations(floorplans.map((fp) => ({ floor_plan_code: fp.floor_plan_code, renovation_description: "Unrenovated", selected: false })));
  }, [floorplans]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        rentRollId,
        renovations: renovations.map(r => ({ floor_plan_code: r.floor_plan_code, renovation_description: r.renovation_description })),
      });
      toast.success("Renovations saved");
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">Unit Renovations</h3>

      <div className="flex gap-12">
        {/* Left side - questions */}
        <div className="space-y-4 min-w-[240px]">
          <div>
            <p className="text-sm mb-2">Does this rent roll have renovated units?</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={hasRenovated} onChange={() => setHasRenovated(true)} className="accent-primary" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
              <input type="radio" checked={!hasRenovated} onChange={() => setHasRenovated(false)} className="accent-primary" />
              No
            </label>
          </div>

          {hasRenovated && (
            <div>
              <p className="text-sm mb-2">How do you want to mark renovated units?</p>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={markBy === "floorplans"} onChange={() => setMarkBy("floorplans")} className="accent-primary" />
                by Floor Plans
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                <input type="radio" checked={markBy === "chargecodes"} onChange={() => setMarkBy("chargecodes")} className="accent-primary" />
                by Charge Codes
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                <input type="radio" checked={markBy === "unitnumber"} onChange={() => setMarkBy("unitnumber")} className="accent-primary" />
                by Unit Number
              </label>
            </div>
          )}
        </div>

        {/* Right side - table */}
        {hasRenovated && markBy === "floorplans" && (
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              In this step you can select floor plans that denote renovated units. In addition, you can describe the level or type of renovation (ex. Full, Partial, Deluxe, Stainless Steel).
            </p>
            <button onClick={() => setShowInstructions(!showInstructions)} className="text-sm text-primary hover:underline mb-3 block">
              {showInstructions ? "Hide" : "Show"} Instructions
            </button>

            <div className="overflow-auto border rounded">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b">
                    <th className="px-2 py-2 w-8"></th>
                    <th className="text-left px-3 py-2 font-semibold text-xs">Floor Plan Code</th>
                    <th className="text-center px-3 py-2 font-semibold text-xs"># Units</th>
                    <th className="text-right px-3 py-2 font-semibold text-xs">Market Rent</th>
                    <th className="text-left px-3 py-2 font-semibold text-xs">Floor Plan Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-xs">Renovation Description</th>
                  </tr>
                </thead>
                <tbody>
                  {renovations.map((r, i) => {
                    const fp = floorplans?.find((f) => f.floor_plan_code === r.floor_plan_code);
                    return (
                      <tr key={r.floor_plan_code} className="border-b hover:bg-muted/20">
                        <td className="px-2 py-1.5 text-center">
                          <Checkbox
                            checked={r.selected}
                            onCheckedChange={(v) => setRenovations(prev => prev.map((rr, idx) => idx === i ? { ...rr, selected: !!v } : rr))}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input className="h-7 text-xs bg-muted/30" value={r.floor_plan_code} readOnly />
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Input className="h-7 w-14 text-center text-xs bg-muted/30 mx-auto" value={fp?.units ?? 0} readOnly />
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          <Input className="h-7 w-24 text-right text-xs bg-muted/30 ml-auto" value={fmt(fp?.market_rent ?? 0)} readOnly />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input className="h-7 text-xs bg-muted/30" value={fp?.floor_plan_name ?? r.floor_plan_code} readOnly />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            className="h-7 text-xs"
                            value={r.renovation_description}
                            onChange={(e) => setRenovations((prev) => prev.map((rr, idx) => idx === i ? { ...rr, renovation_description: e.target.value } : rr))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
