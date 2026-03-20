import { X } from "lucide-react";

interface Props {
  mapped: number;
  unmapped: number;
  onClose: () => void;
}

export function OsMappingPanel({ mapped, unmapped, onClose }: Props) {
  return (
    <div className="w-[220px] border-l flex-shrink-0 bg-background overflow-y-auto">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Info</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2">Mappings Applied</h4>
          <p className="text-xs text-muted-foreground">Click below to toggle highlighting.</p>
        </div>

        <button className="text-xs text-[hsl(var(--primary))] hover:underline block">
          » {mapped} Mappings Applied
        </button>

        <button className="text-xs text-destructive hover:underline block">
          » {unmapped} Mappings Not Matched
        </button>

        <button className="text-xs text-destructive hover:underline block mt-4">
          ✕ Remove Highlights
        </button>
      </div>
    </div>
  );
}
