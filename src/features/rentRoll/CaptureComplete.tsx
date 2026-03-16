import { X, BarChart3, Grid3X3, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptureCompleteProps {
  rentRollId: string;
  onViewDashboard: () => void;
  onViewRentRoll: () => void;
  onEditRentRoll: () => void;
  onAddAnother: () => void;
  onClose: () => void;
}

export function CaptureComplete({
  onViewDashboard,
  onViewRentRoll,
  onEditRentRoll,
  onAddAnother,
  onClose,
}: CaptureCompleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[750px] flex flex-col overflow-hidden">
        {/* Blue header */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Rent Roll Capture Process Complete</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 text-center space-y-6">
          <div>
            <h3 className="text-2xl font-light italic text-foreground mb-2">Finished!</h3>
            <p className="text-sm text-muted-foreground">
              You have successfully uploaded the rent roll. What would you like to do next?
            </p>
          </div>

          {/* Anomalies warning */}
          <div>
            <p className="text-primary font-semibold text-lg">
              Anomalies Detected <span className="inline-block w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs leading-4 text-center">?</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "<strong>Edit Rent Roll</strong>" below to review Anomalies
            </p>
          </div>

          {/* Action icons grid */}
          <div className="flex items-center justify-center gap-10 py-6">
            <button onClick={onViewDashboard} className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-lg border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Rent Roll<br/>Dashboard</span>
            </button>

            <button onClick={onViewRentRoll} className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-lg border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <Grid3X3 className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">View Rent Roll</span>
            </button>

            <button onClick={onEditRentRoll} className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-lg border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <Pencil className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Edit Rent Roll</span>
            </button>

            <button onClick={onAddAnother} className="flex flex-col items-center gap-2 group">
              <div className="h-16 w-16 rounded-lg border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Add Another<br/>Rent Roll</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t px-6 py-3 flex justify-end">
          <Button
            onClick={onClose}
            className="bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] text-white px-8"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
