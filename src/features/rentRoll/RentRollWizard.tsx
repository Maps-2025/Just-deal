import { useState } from "react";
import { X } from "lucide-react";
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

const STEP_TITLES = [
  "Step 1 – Enter Floor Plan Details",
  "Step 2 – Assign Occupancy Statuses",
  "Step 3 – Assign Charge Code Categories",
  "Step 4 – Identify Renovated Units",
  "Step 5 – Identify Lease Types",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Blue header with step title */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">{STEP_TITLES[currentStep]}</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step breadcrumbs */}
        <div className="bg-muted/40 border-b px-6 py-2.5">
          <nav className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded",
                    i === currentStep
                      ? "text-primary font-semibold"
                      : i < currentStep
                      ? "text-primary/70"
                      : "text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold",
                    i === currentStep
                      ? "bg-primary text-primary-foreground"
                      : i < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.num}
                  </span>
                  {step.label}
                </button>
                {i < STEPS.length - 1 && (
                  <span className="text-muted-foreground/40 mx-1">›</span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-auto p-6">
          {currentStep === 0 && <FloorPlansStep dealId={dealId} rentRollId={rentRollId} />}
          {currentStep === 1 && <OccupancyStep dealId={dealId} rentRollId={rentRollId} />}
          {currentStep === 2 && <ChargesStep dealId={dealId} rentRollId={rentRollId} />}
          {currentStep === 3 && <RenovationsStep dealId={dealId} rentRollId={rentRollId} />}
          {currentStep === 4 && <AffordabilityStep dealId={dealId} rentRollId={rentRollId} />}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 border-t px-6 py-3 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-primary border-primary hover:bg-primary/5">
            Edit Source Data ⓘ
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                size="sm"
                onClick={handlePrevious}
                className="bg-[hsl(200,15%,40%)] hover:bg-[hsl(200,15%,35%)] text-white px-6"
              >
                Previous
              </Button>
            )}
            {isLast ? (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={finalize.isPending}
                className="bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] text-white px-6"
              >
                {finalize.isPending ? "Finishing…" : "Finish"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] text-white px-6"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
