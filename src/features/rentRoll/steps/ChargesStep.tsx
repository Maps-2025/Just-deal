import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCharges, useUpdateCharges } from "@/hooks/useRentRoll";
import type { ChargeRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const CATEGORIES = ["Contractual Rent", "Concession", "Utility Reimbursement", "Other Income", "Parking", "Pet Rent"];

export function ChargesStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: serverCharges, isLoading } = useCharges(dealId, rentRollId);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const update = useUpdateCharges(dealId);

  useEffect(() => { if (serverCharges) setCharges(serverCharges); }, [serverCharges]);

  const handleChange = (i: number, category: string) => {
    setCharges((prev) => prev.map((c, idx) => idx === i ? { ...c, charge_category: category } : c));
  };

  const handleSave = async () => {
    try { await update.mutateAsync({ rentRollId, charges }); toast.success("Charges saved"); }
    catch { toast.error("Failed to save"); }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading charges…</p>;
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Step 3 - Assign Charge Code Categories</h3>
      <p className="text-sm text-muted-foreground mb-4">Select the appropriate category for all charge codes.</p>
      <table className="w-full text-sm border-collapse">
        <thead><tr className="border-b bg-muted/50">
          <th className="text-left px-3 py-2 font-medium">Charge Code</th>
          <th className="text-right px-3 py-2 font-medium">Total Amount</th>
          <th className="text-left px-3 py-2 font-medium">Charge Category</th>
        </tr></thead>
        <tbody>
          {charges.map((ch, i) => (
            <tr key={ch.charge_code} className="border-b hover:bg-muted/30">
              <td className="px-3 py-2">{ch.charge_code}</td>
              <td className="px-3 py-2 text-right font-mono">{fmt(ch.total_amount)}</td>
              <td className="px-3 py-2"><Select value={ch.charge_category} onValueChange={(v) => handleChange(i, v)}><SelectTrigger className="h-8 text-xs w-44"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></td>
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
