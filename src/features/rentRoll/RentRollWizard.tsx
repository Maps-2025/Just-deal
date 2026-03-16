import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloorPlansStep } from "./steps/FloorPlansStep";
import { OccupancyStep } from "./steps/OccupancyStep";
import { ChargesStep } from "./steps/ChargesStep";
import { RenovationsStep } from "./steps/RenovationsStep";
import { AffordabilityStep } from "./steps/AffordabilityStep";
import { useFinalizeRentRoll } from "@/hooks/useRentRoll";
import { toast } from "sonner";

const STEPS = [
  { id: "floorplans", label: "Floorplans", num: 1 },
  { id: "occupancy", label: "Occupancy", num: 2 },
  { id: "charges", label: "Charges", num: 3 },
  { id: "renovations", label: "Renovations", num: 4 },
  { id: "affordability", label: "Affordability", num: 5 },
];

interface RentRollWizardProps {
  dealId: string;
  rentRollId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function RentRollWizard({ dealId, rentRollId, onComplete, onCancel }: RentRollWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const finalize = useFinalizeRentRoll(dealId);

  const handleNext = () => { if (currentStep < STEPS.length - 1) setCurrentStep((p) => p + 1); };
  const handlePrevious = () => { if (currentStep > 0) setCurrentStep((p) => p - 1); };

  const handleFinish = async () => {
    try { await finalize.mutateAsync(rentRollId); toast.success("Rent Roll capture complete!"); onComplete(); }
    catch (err: any) { toast.error(err.message || "Failed to finalize"); }
  };

  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b px-6 py-3">
        <nav className="flex gap-0 -mb-px">
          {STEPS.map((step, i) => (
            <button key={step.id} onClick={() => setCurrentStep(i)} className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              i === currentStep ? "border-primary text-primary" : i < currentStep ? "border-success text-success" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{step.label}</button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {currentStep === 0 && <FloorPlansStep dealId={dealId} rentRollId={rentRollId} />}
        {currentStep === 1 && <OccupancyStep dealId={dealId} rentRollId={rentRollId} />}
        {currentStep === 2 && <ChargesStep dealId={dealId} rentRollId={rentRollId} />}
        {currentStep === 3 && <RenovationsStep dealId={dealId} rentRollId={rentRollId} />}
        {currentStep === 4 && <AffordabilityStep dealId={dealId} rentRollId={rentRollId} />}
      </div>
      <div className="border-t px-6 py-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onCancel}>Edit Source Data</Button>
        <div className="flex gap-2">
          {currentStep > 0 && <Button variant="outline" size="sm" onClick={handlePrevious}>Previous</Button>}
          {isLast ? <Button size="sm" onClick={handleFinish} disabled={finalize.isPending}>{finalize.isPending ? "Finishing…" : "Finish"}</Button> : <Button size="sm" onClick={handleNext}>Next</Button>}
        </div>
      </div>
    </div>
  );
}
