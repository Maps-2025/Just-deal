import { useState } from "react";
import { Upload, Download, Trash2, Pencil } from "lucide-react";
import { useRentRollList, useDeleteRentRoll } from "@/hooks/useRentRoll";
import { UploadRentRollModal } from "./UploadRentRollModal";
import { SourceMappingModal } from "./SourceMappingModal";
import { RentRollWizard } from "./RentRollWizard";
import { CaptureComplete } from "./CaptureComplete";
import { RentRollDashboard } from "./dashboard/RentRollDashboard";
import { FloorPlanSummaryTab } from "./dashboard/FloorPlanSummaryTab";
import { RentRollTableTab } from "./dashboard/RentRollTableTab";
import { ManageRentRollsTab } from "./dashboard/ManageRentRollsTab";
import { toast } from "sonner";

type Phase = "list" | "upload" | "mapping" | "wizard" | "complete";

interface RentRollModuleProps {
  dealId: string;
  /** Which sub-view to show: dashboard, floorplan, table, comps, manage, or list */
  subView?: string;
  onNavigate?: (view: string) => void;
}

export function RentRollModule({ dealId, subView = "list", onNavigate }: RentRollModuleProps) {
  const [phase, setPhase] = useState<Phase>("list");
  const [rentRollId, setRentRollId] = useState<string | null>(null);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);

  const { data: rentRolls = [], isLoading } = useRentRollList(dealId);
  const deleteRR = useDeleteRentRoll(dealId);

  const latestRRId = rentRolls.length > 0 ? rentRolls[0].id : null;

  const handleUploadComplete = (rrId: string, headers: string[]) => {
    setRentRollId(rrId);
    setUploadHeaders(headers);
    setPhase("mapping");
  };

  const handleMappingComplete = () => setPhase("wizard");
  const handleWizardComplete = () => setPhase("complete");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rent roll?")) return;
    try { await deleteRR.mutateAsync(id); toast.success("Rent roll deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const handleAddAnother = () => { setRentRollId(null); setUploadHeaders([]); setPhase("upload"); };

  // Sub-view routing for dashboard tabs
  if (subView === "rent-roll-dashboard" && latestRRId) {
    return <RentRollDashboard dealId={dealId} rentRollId={latestRRId} onNavigate={onNavigate} />;
  }
  if (subView === "rent-roll-floorplan" && latestRRId) {
    return <div className="p-6"><FloorPlanSummaryTab dealId={dealId} rentRollId={latestRRId} /></div>;
  }
  if (subView === "rent-roll-table" && latestRRId) {
    return <div className="p-6"><RentRollTableTab dealId={dealId} rentRollId={latestRRId} /></div>;
  }
  if (subView === "rent-roll-manage") {
    return <div className="p-6"><ManageRentRollsTab rentRollId={latestRRId || ""} /></div>;
  }
  if (subView === "rent-roll-comps") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Rent Roll Comps — coming soon.</p>
      </div>
    );
  }

  // Default: list view
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
                      onClick={() => onNavigate?.("rent-roll-dashboard")}
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
        <CaptureComplete rentRollId={rentRollId} onViewDashboard={() => onNavigate?.("rent-roll-dashboard")} onViewRentRoll={() => onNavigate?.("rent-roll-table")} onEditRentRoll={() => setPhase("wizard")} onAddAnother={handleAddAnother} onClose={() => setPhase("list")} />
      )}
    </>
  );
}
