import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSaveMapping } from "@/hooks/useRentRoll";
import { toast } from "sonner";

interface SourceMappingModalProps {
  dealId: string;
  rentRollId: string;
  headers: string[];
  onComplete: () => void;
  onCancel: () => void;
}

const FIELDS = [
  { key: "unit_no", label: "Unit Number", required: true },
  { key: "floor_plan", label: "Floor Plan Code", required: true },
  { key: "net_sqft", label: "Net SqFt", required: false },
  { key: "bedrooms", label: "Bedrooms", required: false },
  { key: "bathrooms", label: "Bathrooms", required: false },
  { key: "occupancy_status", label: "Occupancy Status", required: true },
  { key: "market_rent", label: "Market Rent", required: true },
  { key: "contractual_rent", label: "Contractual Rent", required: false },
  { key: "lease_start_date", label: "Lease Start Date", required: false },
  { key: "lease_end_date", label: "Lease Expiration", required: false },
  { key: "move_in_date", label: "Move In", required: false },
  { key: "move_out_date", label: "Move Out", required: false },
  { key: "tenant_name", label: "Tenant Name", required: false },
  { key: "unit_type", label: "Unit Type", required: false },
  { key: "lease_type", label: "Lease Type", required: false },
  { key: "renovation_status", label: "Renovation Status", required: false },
  { key: "recurring_concessions", label: "Recurring Concessions", required: false },
  { key: "net_effective_rent", label: "Net Effective Rent", required: false },
];

export function SourceMappingModal({ dealId, rentRollId, headers, onComplete, onCancel }: SourceMappingModalProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const field of FIELDS) {
      const match = headers.find((h) => {
        const hl = h.toLowerCase();
        const fl = field.label.toLowerCase();
        return hl === fl || hl.includes(field.key.replace(/_/g, " ")) || hl.includes(fl);
      });
      if (match) m[field.key] = match;
    }
    return m;
  });

  const saveMapping = useSaveMapping(dealId);

  const handleSubmit = async () => {
    const missingRequired = FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      toast.error(`Please map: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }
    try {
      await saveMapping.mutateAsync({ rentRollId, mapping });
      toast.success("Mapping saved successfully");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save mapping");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel}><ArrowLeft className="h-4 w-4" /></Button>
        <h2 className="text-xl font-semibold">Source Data Mapping</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Map the columns from your uploaded file to the required fields. Required fields are marked with *.</p>
      <div className="grid grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-sm">{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Select value={mapping[field.key] || ""} onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select column…" /></SelectTrigger>
              <SelectContent>{headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-8">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saveMapping.isPending}>{saveMapping.isPending ? "Saving…" : "Next"}</Button>
      </div>
    </div>
  );
}
