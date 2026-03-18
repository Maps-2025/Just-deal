import { useState } from "react";
import { Upload, Download, Trash2, Pencil, AlertCircle } from "lucide-react";
import { useRentRollList, useDeleteRentRoll } from "@/hooks/useRentRoll";
import { UploadRentRollModal } from "./UploadRentRollModal";
import { SourceMappingModal } from "./SourceMappingModal";
import { RentRollWizard } from "./RentRollWizard";
import { CaptureComplete } from "./CaptureComplete";
import { RentRollDashboard } from "./dashboard/RentRollDashboard";
import { FloorPlanSummaryTab } from "./dashboard/FloorPlanSummaryTab";
import { RentRollTableView } from "./dashboard/RentRollTableView";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { toast } from "sonner";

type Phase = "list" | "upload" | "mapping" | "wizard" | "complete";

interface RentRollModuleProps {
  dealId: string;
  subView?: string;
  onNavigate?: (view: string) => void;
}

export function RentRollModule({ dealId, subView = "list", onNavigate }: RentRollModuleProps) {
  const [phase, setPhase] = useState<Phase>("list");
  const [rentRollId, setRentRollId] = useState<string | null>(null);
  const [uploadHeaders, setUploadHeaders] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null);

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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRR.mutateAsync(deleteTarget.id);
      toast.success("Rent roll deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteTarget(null);
  };

  const handleAddAnother = () => { setRentRollId(null); setUploadHeaders([]); setPhase("upload"); };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Sub-view routing
  if (subView === "rent-roll-dashboard" && latestRRId) {
    return <RentRollDashboard dealId={dealId} rentRollId={latestRRId} onNavigate={onNavigate} />;
  }
  if (subView === "rent-roll-floorplan" && latestRRId) {
    return <FloorPlanSummaryTab dealId={dealId} rentRollId={latestRRId} onNavigate={onNavigate} />;
  }
  if (subView === "rent-roll-table" && latestRRId) {
    return <RentRollTableView dealId={dealId} rentRollId={latestRRId} rentRolls={rentRolls} onNavigate={onNavigate} />;
  }
  if (subView === "rent-roll-manage" || subView === "list") {
    // Show manage / list view
  } else if (subView === "rent-roll-comps") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Rent Roll Comps — coming soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-5 mb-6">
            <h2 className="text-xl font-semibold text-foreground">Rent Rolls</h2>
            <button className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1.5 font-medium">
              <Download className="h-4 w-4" /> Download Template
            </button>
            <button
              className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1.5 font-medium"
              onClick={() => setPhase("upload")}
            >
              <span className="font-bold text-base">+</span> Upload Rent Roll
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : rentRolls.length === 0 ? (
            <p className="text-sm text-[hsl(var(--primary))]">No Rent Rolls uploaded for this deal.</p>
          ) : (
            <div className="space-y-1">
              {rentRolls.map((rr) => (
                <div
                  key={rr.id}
                  className="flex items-center justify-between py-3 px-4 border-b hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => onNavigate?.("rent-roll-dashboard")}
                      className="text-sm font-medium text-[hsl(var(--primary))] hover:underline cursor-pointer"
                    >
                      {fmtDate(rr.report_date)}
                    </button>
                    {rr.has_anomalies && (
                      <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Anomalies Detected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                      onClick={() => { setRentRollId(rr.id); setPhase("wizard"); }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      className="text-sm text-destructive hover:underline flex items-center gap-1"
                      onClick={() => setDeleteTarget({ id: rr.id, date: fmtDate(rr.report_date) })}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          date={deleteTarget.date}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteRR.isPending}
        />
      )}

      {/* Wizard overlays */}
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
