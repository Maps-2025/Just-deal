import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useFloorplans, useUpdateRenovations } from "@/hooks/useRentRoll";
import { toast } from "sonner";

export function RenovationsStep({ rentRollId }: { rentRollId: string }) {
  const { data: floorplans, isLoading } = useFloorplans(rentRollId);
  const [hasRenovated, setHasRenovated] = useState(false);
  const [markBy, setMarkBy] = useState<"floor_plans" | "charge_codes" | "unit_number">("floor_plans");
  const [renovations, setRenovations] = useState<{ floor_plan_code: string; renovation_description: string }[]>([]);
  const update = useUpdateRenovations();

  useEffect(() => {
    if (floorplans) {
      setRenovations(floorplans.map((fp) => ({ floor_plan_code: fp.floor_plan_code, renovation_description: "Unrenovated" })));
    }
  }, [floorplans]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({ rentRollId, renovations });
      toast.success("Renovations saved");
    } catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Step 4 - Identify Renovated Units</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Does this rent roll have renovated units?
      </p>

      <div className="flex gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${hasRenovated ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          onClick={() => setHasRenovated(true)}
        >Yes</button>
        <button
          className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${!hasRenovated ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
          onClick={() => setHasRenovated(false)}
        >No</button>
      </div>

      {hasRenovated && (
        <>
          <div className="flex gap-3 mb-4">
            <p className="text-sm text-muted-foreground mr-2">How do you want to mark renovated units?</p>
            {(["floor_plans", "charge_codes", "unit_number"] as const).map((m) => (
              <button
                key={m}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${markBy === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                onClick={() => setMarkBy(m)}
              >
                by {m.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Floor Plan Code</th>
                <th className="text-center px-3 py-2 font-medium"># Units</th>
                <th className="text-right px-3 py-2 font-medium">Market Rent</th>
                <th className="text-left px-3 py-2 font-medium">Floor Plan Name</th>
                <th className="text-left px-3 py-2 font-medium">Renovation Description</th>
              </tr>
            </thead>
            <tbody>
              {renovations.map((r, i) => {
                const fp = floorplans?.find((f) => f.floor_plan_code === r.floor_plan_code);
                return (
                  <tr key={r.floor_plan_code} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-mono">{r.floor_plan_code}</td>
                    <td className="px-3 py-1.5 text-center">{fp?.units ?? 0}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fmt(fp?.market_rent ?? 0)}</td>
                    <td className="px-3 py-1.5">{fp?.floor_plan_name ?? r.floor_plan_code}</td>
                    <td className="px-3 py-1.5">
                      <Input
                        className="h-8 text-xs"
                        value={r.renovation_description}
                        onChange={(e) => setRenovations((prev) => prev.map((rr, idx) => idx === i ? { ...rr, renovation_description: e.target.value } : rr))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="text-sm text-primary font-medium hover:underline" disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
