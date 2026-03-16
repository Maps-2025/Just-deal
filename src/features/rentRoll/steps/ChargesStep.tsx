import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCharges, useUpdateCharges } from "@/hooks/useRentRoll";
import type { ChargeRow } from "@/services/rentRollApi";
import { toast } from "sonner";

const CATEGORIES = ["Contractual Rent", "Concession", "Utility Reimbursement", "Other Income", "Parking", "Pet Rent"];

export function ChargesStep({ dealId, rentRollId }: { dealId: string; rentRollId: string }) {
  const { data: serverCharges, isLoading } = useCharges(dealId, rentRollId);
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
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
      <h3 className="text-base font-semibold mb-1">Charge Code Categories</h3>
      <p className="text-sm text-muted-foreground mb-2">
        In this step you can select the appropriate Category for all charge codes, which have been automatically pulled from the rent roll.
      </p>
      <ul className="text-sm text-muted-foreground mb-2 list-disc pl-5 space-y-0.5">
        <li><strong>Charge Category:</strong> You can assign Categories that correspond to the charge codes identified in the rent roll (optional but recommended).</li>
        <li>The total dollar amount of each charge code is provided for your reference.</li>
        <li>Click "Next" to proceed to next step.</li>
      </ul>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="text-sm text-primary hover:underline mb-4 block"
      >
        {showInstructions ? "Hide" : "Show"} Instructions
      </button>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="text-left px-3 py-2 font-semibold text-xs">Charge Code</th>
              <th className="text-right px-3 py-2 font-semibold text-xs">Total Amount</th>
              <th className="text-left px-3 py-2 font-semibold text-xs">
                Charge Category <span className="inline-block w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[10px] leading-[14px] text-center">?</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {charges.map((ch, i) => (
              <tr key={ch.charge_code} className="border-b hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Input className="h-7 text-xs bg-muted/30" value={ch.charge_code} readOnly />
                </td>
                <td className="px-3 py-2 text-right">
                  <Input className="h-7 w-24 text-right text-xs bg-muted/30 ml-auto" value={fmt(ch.total_amount)} readOnly />
                </td>
                <td className="px-3 py-2">
                  <Select value={ch.charge_category} onValueChange={(v) => handleChange(i, v)}>
                    <SelectTrigger className="h-7 text-xs w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
