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

  if (phase === "upload") return <UploadRentRollModal dealId={dealId} onComplete={handleUploadComplete} onCancel={() => setPhase("list")} />;
  if (phase === "mapping" && rentRollId) return <SourceMappingModal dealId={dealId} rentRollId={rentRollId} headers={uploadHeaders} onComplete={handleMappingComplete} onCancel={() => setPhase("list")} />;
  if (phase === "wizard" && rentRollId) return <RentRollWizard dealId={dealId} rentRollId={rentRollId} onComplete={handleWizardComplete} onCancel={() => setPhase("list")} />;
  if (phase === "complete" && rentRollId) return <CaptureComplete rentRollId={rentRollId} onViewDashboard={() => handleViewDashboard()} onViewRentRoll={() => handleViewDashboard()} onEditRentRoll={() => setPhase("wizard")} onAddAnother={handleAddAnother} onClose={() => setPhase("list")} />;
  if (phase === "dashboard" && activeRentRollId) return <RentRollDashboard dealId={dealId} rentRollId={activeRentRollId} onBack={() => setPhase("list")} />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Rent Rolls</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Download Template</Button>
          <Button size="sm" onClick={() => setPhase("upload")}><Upload className="h-4 w-4 mr-1.5" /> Upload Rent Roll</Button>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : rentRolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm mb-3">No Rent Roll data available.</p>
          <Button size="sm" onClick={() => setPhase("upload")}><Upload className="h-4 w-4 mr-1.5" /> Upload Rent Roll</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rentRolls.map((rr) => (
            <div key={rr.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium">{new Date(rr.report_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">{rr.total_units ?? 0} units · {rr.occupancy_pct ?? 0}% occupancy</p>
                </div>
                {rr.has_anomalies && <span className="flex items-center gap-1 text-xs text-warning font-medium"><AlertTriangle className="h-3.5 w-3.5" /> Anomalies Detected</span>}
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{rr.processing_status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDashboard(rr.id)}>View</Button>
                <Button variant="outline" size="sm" onClick={() => { setRentRollId(rr.id); setPhase("wizard"); }}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(rr.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
