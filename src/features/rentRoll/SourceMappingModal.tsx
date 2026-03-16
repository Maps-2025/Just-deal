import { useState } from "react";
import { X } from "lucide-react";
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
  { key: "unit_no", label: "Unit Number", required: true, aliases: ["unit", "unit #", "unit no", "unit_no", "unit number", "apt", "apartment"] },
  { key: "floor_plan", label: "Floor Plan Code", required: true, aliases: ["floor plan", "floorplan", "floor_plan", "fp", "plan", "plan code", "floor plan code"] },
  { key: "net_sqft", label: "Net SqFt", required: false, aliases: ["sqft", "sq ft", "square feet", "net sqft", "net_sqft", "area", "size", "square footage"] },
  { key: "bedrooms", label: "Bedrooms", required: false, aliases: ["bed", "beds", "bedrooms", "br", "bd"] },
  { key: "bathrooms", label: "Bathrooms", required: false, aliases: ["bath", "baths", "bathrooms", "ba"] },
  { key: "occupancy_status", label: "Occupancy Status", required: true, aliases: ["occupancy", "status", "occupancy status", "occ status", "occ", "vacancy"] },
  { key: "market_rent", label: "Market Rent", required: true, aliases: ["market rent", "market_rent", "mkt rent", "market", "asking rent"] },
  { key: "contractual_rent", label: "Contractual Rent", required: false, aliases: ["contract rent", "contractual rent", "actual rent", "current rent", "rent", "charge", "monthly rent"] },
  { key: "lease_start_date", label: "Lease Start Date", required: false, aliases: ["lease start", "start date", "lease_start", "move in", "lease begin"] },
  { key: "lease_end_date", label: "Lease Expiration", required: false, aliases: ["lease end", "end date", "lease_end", "expiration", "lease expiration", "expire"] },
  { key: "move_in_date", label: "Move In", required: false, aliases: ["move in", "move_in", "move-in", "moved in"] },
  { key: "move_out_date", label: "Move Out", required: false, aliases: ["move out", "move_out", "move-out", "moved out"] },
  { key: "tenant_name", label: "Tenant Name", required: false, aliases: ["tenant", "resident", "name", "tenant name", "resident name", "lessee"] },
  { key: "unit_type", label: "Unit Type", required: false, aliases: ["unit type", "type", "unit_type"] },
  { key: "lease_type", label: "Lease Type", required: false, aliases: ["lease type", "lease_type"] },
  { key: "renovation_status", label: "Renovation Status", required: false, aliases: ["renovation", "renovated", "reno", "renovation status"] },
  { key: "recurring_concessions", label: "Recurring Concessions", required: false, aliases: ["concession", "concessions", "recurring concessions", "discount"] },
  { key: "net_effective_rent", label: "Net Effective Rent", required: false, aliases: ["net effective", "effective rent", "net_effective_rent", "ner"] },
];

function autoDetectMapping(headers: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  for (const field of FIELDS) {
    const hl = headers.map(h => h.toLowerCase().trim());
    // Exact match first
    let matchIdx = hl.findIndex((h, i) => !usedHeaders.has(headers[i]) && (
      h === field.key.replace(/_/g, " ") || h === field.label.toLowerCase() || field.aliases.includes(h)
    ));
    // Partial match
    if (matchIdx === -1) {
      matchIdx = hl.findIndex((h, i) => !usedHeaders.has(headers[i]) &&
        field.aliases.some(a => h.includes(a) || a.includes(h))
      );
    }
    if (matchIdx !== -1) {
      m[field.key] = headers[matchIdx];
      usedHeaders.add(headers[matchIdx]);
    }
  }
  return m;
}

export function SourceMappingModal({ dealId, rentRollId, headers, onComplete, onCancel }: SourceMappingModalProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => autoDetectMapping(headers));
  const saveMapping = useSaveMapping(dealId);

  const autoMappedCount = Object.keys(mapping).length;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Blue header */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Source Data Mapping</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Map the columns from your uploaded file to the required fields. Required fields are marked with <span className="text-destructive">*</span>
          </p>
          {autoMappedCount > 0 && (
            <p className="text-xs text-primary mb-4">
              ✓ Auto-detected {autoMappedCount} column{autoMappedCount > 1 ? "s" : ""} from your file headers.
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <Label className="text-xs font-medium">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Select value={mapping[field.key] || ""} onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="— Select column —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t px-6 py-3 flex justify-between">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saveMapping.isPending}
            className="bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] text-white px-8"
          >
            {saveMapping.isPending ? "Saving…" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
