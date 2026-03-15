import { Plus } from "lucide-react";

export function DealActionsCard() {
  return (
    <div className="section-border p-5 space-y-5">
      <div>
        <span className="text-xs text-muted-foreground">Rent Rolls</span>
        <button className="flex items-center gap-1.5 text-sm text-primary font-medium mt-1 hover:underline">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Upload Rent Roll
        </button>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Operating Statement</span>
        <button className="flex items-center gap-1.5 text-sm text-primary font-medium mt-1 hover:underline">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Upload Operating Statement
        </button>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">Proforma Models</span>
        <button className="text-sm text-primary font-medium mt-1 hover:underline">
          Generate Model
        </button>
      </div>
    </div>
  );
}
