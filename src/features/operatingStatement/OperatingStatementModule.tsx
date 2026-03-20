import { useState } from "react";
import { UploadOperatingStatementModal } from "./UploadOperatingStatementModal";
import { OsProcessingScreen } from "./OsProcessingScreen";
import { OsEditableGrid } from "./OsEditableGrid";
import { OsSummaryView } from "./OsSummaryView";
import { OsManageView } from "./OsManageView";

type Phase = "idle" | "upload" | "processing" | "editing" | "summary";

interface OperatingStatementModuleProps {
  dealId: string;
  subView?: string;
  onNavigate?: (view: string) => void;
}

export function OperatingStatementModule({ dealId, subView = "os-summary", onNavigate }: OperatingStatementModuleProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const handleUploadComplete = (docId: string, bId: string) => {
    setDocumentId(docId);
    setBatchId(bId);
    setPhase("processing");
  };

  const handleProcessingComplete = () => {
    setPhase("editing");
  };

  const handleSaveComplete = () => {
    setPhase("idle");
    onNavigate?.("os-summary");
  };

  // Upload modal overlay
  if (phase === "upload") {
    return (
      <>
        <UploadOperatingStatementModal
          dealId={dealId}
          onComplete={handleUploadComplete}
          onCancel={() => setPhase("idle")}
        />
      </>
    );
  }

  // Processing state
  if (phase === "processing" && documentId) {
    return (
      <OsProcessingScreen
        dealId={dealId}
        documentId={documentId}
        onComplete={handleProcessingComplete}
        onError={() => setPhase("idle")}
      />
    );
  }

  // Editing grid
  if (phase === "editing" && batchId) {
    return (
      <OsEditableGrid
        dealId={dealId}
        batchId={batchId}
        onSave={handleSaveComplete}
        onCancel={() => setPhase("idle")}
      />
    );
  }

  // Sub-view routing
  if (subView === "os-source-data" || subView === "os-allocate") {
    return (
      <OsEditableGrid
        dealId={dealId}
        batchId={batchId || "latest"}
        onSave={handleSaveComplete}
        onCancel={() => onNavigate?.("os-summary")}
      />
    );
  }

  if (subView === "os-manage") {
    return (
      <OsManageView
        dealId={dealId}
        onUpload={() => setPhase("upload")}
        onSelectBatch={(bId) => {
          setBatchId(bId);
          setPhase("editing");
        }}
      />
    );
  }

  if (subView === "os-cash-flows" || subView === "os-revenue" || subView === "os-adjustments" || subView === "os-comps" || subView === "os-market-comp") {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          {subView === "os-cash-flows" && "Cash Flows — coming soon."}
          {subView === "os-revenue" && "Revenue Analysis — coming soon."}
          {subView === "os-adjustments" && "Adjustments — coming soon."}
          {subView === "os-comps" && "Operating Statement Comps — coming soon."}
          {subView === "os-market-comp" && "Market Comp Data (Beta) — coming soon."}
        </p>
      </div>
    );
  }

  // Default: Summary view
  return (
    <OsSummaryView
      dealId={dealId}
      onUpload={() => setPhase("upload")}
      onNavigate={onNavigate}
    />
  );
}
