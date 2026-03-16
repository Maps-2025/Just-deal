import { useState } from "react";
import { Upload, Download, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRentRollList, useDeleteRentRoll } from "@/hooks/useRentRoll";
import { UploadRentRollModal } from "./UploadRentRollModal";
import { SourceMappingModal } from "./SourceMappingModal";
import { RentRollWizard } from "./RentRollWizard";
import { CaptureComplete } from "./CaptureComplete";
import { RentRollDashboard } from "./dashboard/RentRollDashboard";
import { toast } from "sonner";

type Phase = "list" | "upload" | "mapping" | "wizard" | "complete" | "dashboard";

interface RentRollModuleProps {
  dealId: string;
}

export function RentRollModule({ dealId }: RentRollModuleProps) {
  const [phase, setPhase] = useState<Phase>("list");
  const [rentRollId, setRentRollId] = useState<string | null>(null);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [activeRentRollId, setActiveRentRollId] = useState<string | null>(null);

  const { data: rentRolls = [], isLoading } = useRentRollList(dealId);
  const deleteRR = useDeleteRentRoll(dealId);

  const handleUploadComplete = (rrId: string, headers: string[]) => {
    setRentRollId(rrId);
    setUploadHeaders(headers);
    setPhase("mapping");
  };

  const handleMappingComplete = () => setPhase("wizard");
  const handleWizardComplete = () => setPhase("complete");

  const handleViewDashboard = (rrId?: string) => {
    setActiveRentRollId(rrId || rentRollId);
    setPhase("dashboard");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rent roll?")) return;
    try { await deleteRR.mutateAsync(id); toast.success("Rent roll deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleAddAnother = () => { setRentRollId(null); setUploadHeaders([]); setPhase("upload"); };

  // Modals render as overlays
  return (
    <>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold">Rent Rolls</h2>
            <button className="text-sm text-primary hover:underline flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> Download Template
            </button>
            <button
              className="text-sm text-primary hover:underline flex items-center gap-1"
              onClick={() => setPhase("upload")}
            >
              <span className="text-primary font-bold">+</span> Upload Rent Roll
            </button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : rentRolls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Rent Rolls uploaded for this deal.</p>
          ) : (
            <div className="space-y-2">
              {rentRolls.map((rr) => (
                <div key={rr.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {new Date(rr.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {rr.has_anomalies && (
                      <span className="text-xs text-muted-foreground italic">Anomalies Detected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      onClick={() => handleViewDashboard(rr.id)}
                    >
                      View
                    </button>
                    <button
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      onClick={() => { setRentRollId(rr.id); setPhase("wizard"); }}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      className="text-sm text-destructive hover:underline flex items-center gap-1"
                      onClick={() => handleDelete(rr.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal overlays */}
      {phase === "upload" && (
        <UploadRentRollModal dealId={dealId} onComplete={handleUploadComplete} onCancel={() => setPhase("list")} />
      )}
      {phase === "mapping" && rentRollId && (
        <SourceMappingModal dealId={dealId} rentRollId={rentRollId} headers={uploadHeaders} onComplete={handleMappingComplete} onCancel={() => setPhase("list")} />
      )}
      {phase === "wizard" && rentRollId && (
        <RentRollWizard dealId={dealId} rentRollId={rentRollId} onComplete={handleWizardComplete} onCancel={() => setPhase("list")} />
      )}
      {phase === "complete" && rentRollId && (
        <CaptureComplete rentRollId={rentRollId} onViewDashboard={() => handleViewDashboard()} onViewRentRoll={() => handleViewDashboard()} onEditRentRoll={() => setPhase("wizard")} onAddAnother={handleAddAnother} onClose={() => setPhase("list")} />
      )}
      {phase === "dashboard" && activeRentRollId && (
        <RentRollDashboard dealId={dealId} rentRollId={activeRentRollId} onBack={() => setPhase("list")} />
      )}
    </>
  );
}
