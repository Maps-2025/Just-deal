import { AlertTriangle, X } from "lucide-react";

interface AnomalyPanelProps {
  anomalies: { unitNo: string; issue: string }[];
  onClose: () => void;
}

export function AnomalyPanel({ anomalies, onClose }: AnomalyPanelProps) {
  return (
    <div className="bg-warning/5 border-b border-warning/30 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Anomalies in {anomalies.length} unit(s)
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {anomalies.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="font-semibold text-foreground min-w-[60px]">Unit {a.unitNo}</span>
            <span className="text-muted-foreground">{a.issue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
