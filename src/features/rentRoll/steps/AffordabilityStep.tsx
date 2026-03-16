import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCharges, useUpdateAffordability } from "@/hooks/useRentRoll";
import { toast } from "sonner";

type MarkBy = "floorplans" | "chargecodes" | "unitnumber";

const LEASE_CATEGORIES = ["Market", "HUD", "Section 8", "LURA", "LIHTC", "Other"];

export function AffordabilityStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const [hasAffordable, setHasAffordable] = useState(false);
  const [markBy, setMarkBy] = useState<MarkBy>("chargecodes");
  const [showInstructions, setShowInstructions] = useState(false);
  const [unitNumbers, setUnitNumbers] = useState("");
  const { data: charges = [] } = useCharges(dealId, rentRollId);
  const [chargeSelections, setChargeSelections] = useState<Record<string, { selected: boolean; leaseDesc: string }>>({});
  const update = useUpdateAffordability(dealId);

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    try { await update.mutateAsync({ rentRollId, hasAffordable }); toast.success("Affordability saved"); }
    catch { toast.error("Failed to save"); }
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-3">Lease Types</h3>

      <div className="flex gap-12">
        {/* Left side */}
        <div className="space-y-4 min-w-[240px]">
          <div>
            <p className="text-sm mb-2">Does this rent roll have affordable or subsidized units?</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" checked={hasAffordable} onChange={() => setHasAffordable(true)} className="accent-primary" />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
              <input type="radio" checked={!hasAffordable} onChange={() => setHasAffordable(false)} className="accent-primary" />
              No
            </label>
          </div>

          {hasAffordable && (
            <div>
              <p className="text-sm mb-2">How do you want to mark affordable or subsidized units?</p>
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

        {/* Right side */}
        {hasAffordable && (
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {markBy === "chargecodes" && "In this step you can select charge codes that identify affordable or subsidized units. In addition, you can describe the lease type (ex. HUD, Section 8, LURA)."}
              {markBy === "unitnumber" && "In this step you can identify affordable or subsidized units by unit number. In addition, you can describe the lease type (ex. HUD, Section 8, LURA)."}
              {markBy === "floorplans" && "In this step you can select floor plans that identify affordable or subsidized units."}
            </p>
            <button onClick={() => setShowInstructions(!showInstructions)} className="text-sm text-primary hover:underline mb-3 block">
              {showInstructions ? "Hide" : "Show"} Instructions
            </button>

            {markBy === "chargecodes" && (
              <div className="overflow-auto border rounded">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/60 border-b">
                      <th className="px-2 py-2 w-8"></th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Charge Code</th>
                      <th className="text-right px-3 py-2 font-semibold text-xs">Total Amount</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Charge Category</th>
                      <th className="text-left px-3 py-2 font-semibold text-xs">Lease Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((ch) => {
                      const sel = chargeSelections[ch.charge_code] || { selected: false, leaseDesc: "Market" };
                      return (
                        <tr key={ch.charge_code} className="border-b hover:bg-muted/20">
                          <td className="px-2 py-1.5 text-center">
                            <Checkbox
                              checked={sel.selected}
                              onCheckedChange={(v) => setChargeSelections(prev => ({ ...prev, [ch.charge_code]: { ...sel, selected: !!v } }))}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <Input className="h-7 text-xs bg-muted/30" value={ch.charge_code} readOnly />
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <Input className="h-7 w-24 text-right text-xs bg-muted/30 ml-auto" value={fmt(ch.total_amount)} readOnly />
                          </td>
                          <td className="px-3 py-1.5">
                            <Select value={ch.charge_category} disabled>
                              <SelectTrigger className="h-7 text-xs w-36 bg-muted/30"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value={ch.charge_category}>{ch.charge_category}</SelectItem></SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-1.5">
                            <Input
                              className="h-7 text-xs"
                              value={sel.leaseDesc}
                              onChange={(e) => setChargeSelections(prev => ({ ...prev, [ch.charge_code]: { ...sel, leaseDesc: e.target.value } }))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {markBy === "unitnumber" && (
              <div className="flex gap-8">
                <div>
                  <p className="text-sm font-semibold mb-1">Selected Units:</p>
                  <p className="text-xs text-muted-foreground mb-1">Enter Unit Numbers:</p>
                  <textarea
                    className="border rounded p-2 text-sm w-64 h-28 resize-y"
                    placeholder="e.g. 101, 204, 208, 310..."
                    value={unitNumbers}
                    onChange={(e) => setUnitNumbers(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Current Affordable Units:</p>
                  <p className="text-xs text-muted-foreground">No affordable units marked yet.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
