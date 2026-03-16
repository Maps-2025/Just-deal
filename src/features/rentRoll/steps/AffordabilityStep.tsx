import { useState } from "react";
import { useUpdateAffordability } from "@/hooks/useRentRoll";
import { toast } from "sonner";

export function AffordabilityStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const [hasAffordable, setHasAffordable] = useState(false);
  const update = useUpdateAffordability(dealId);

  const handleSave = async () => {
    try { await update.mutateAsync({ rentRollId, hasAffordable }); toast.success("Affordability saved"); }
    catch { toast.error("Failed to save"); }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Step 5 - Identify Lease Types</h3>
      <p className="text-sm text-muted-foreground mb-4">Does this rent roll have affordable or subsidized units?</p>
      <div className="flex gap-3 mb-6">
        <button className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${hasAffordable ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`} onClick={() => setHasAffordable(true)}>Yes</button>
        <button className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${!hasAffordable ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`} onClick={() => setHasAffordable(false)}>No</button>
      </div>
      {hasAffordable && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">In this step you can select charge codes that identify affordable or subsidized units. In addition, you can describe the lease type (ex. HUD, Section 8, LURA).</p>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button onClick={handleSave} className="text-sm text-primary font-medium hover:underline" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save Changes"}</button>
      </div>
    </div>
  );
}
