import { CheckCircle, AlertTriangle } from "lucide-react";
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
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md space-y-6">
        <CheckCircle className="h-16 w-16 mx-auto text-success" />
        <div>
          <h2 className="text-2xl font-semibold mb-2">Rent Roll Capture Process Complete</h2>
          <p className="text-muted-foreground">
            Finished! You have successfully uploaded the rent roll. What would you like to do next?
          </p>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2 text-left">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Anomalies Detected</p>
            <p className="text-xs text-muted-foreground">Click "Edit Rent Roll" below to review Anomalies</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full" onClick={onViewDashboard}>Rent Roll Dashboard</Button>
          <Button variant="outline" className="w-full" onClick={onViewRentRoll}>View Rent Roll</Button>
          <Button variant="outline" className="w-full" onClick={onEditRentRoll}>Edit Rent Roll</Button>
          <Button variant="outline" className="w-full" onClick={onAddAnother}>Add Another Rent Roll</Button>
        </div>

        <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Close</Button>
      </div>
    </div>
  );
}
