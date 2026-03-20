import { useState, useRef, useCallback } from "react";
import { X, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { osUploadApi } from "@/services/operatingStatementApi";
import { toast } from "sonner";

interface Props {
  dealId: string;
  onComplete: (documentId: string, batchId: string) => void;
  onCancel: () => void;
}

export function UploadOperatingStatementModal({ dealId, onComplete, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];

  const handleFile = useCallback((f: File) => {
    if (!acceptedTypes.includes(f.type) && !f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await osUploadApi.upload(dealId, file);
      toast.success("File uploaded. Processing…");
      onComplete(result.document_id, result.batch_id);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[540px] flex flex-col overflow-hidden">
        {/* Blue header */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Operating Statement Upload</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Intro */}
          <div>
            <p className="text-sm font-semibold text-foreground">
              Let's get started processing your operating statement.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the file you would like to upload. Only one file can be processed at a time.
            </p>
          </div>

          {/* Upload area */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                  : "border-border hover:border-[hsl(var(--primary))]/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Drag & Drop your file</p>
              <p className="text-xs text-muted-foreground mt-1">or Click to Browse for Files</p>
              <Button
                variant="default"
                size="sm"
                className="mt-3 bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,40%)] text-white"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Extra options */}
          <p className="text-xs text-muted-foreground">
            You can also enter new operating statement in by{" "}
            <span className="text-[hsl(var(--primary))] cursor-pointer hover:underline">entering the data manually</span>
            {" "}or{" "}
            <span className="text-[hsl(var(--primary))] cursor-pointer hover:underline">pasting directly from Excel</span>.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {file && (
            <Button
              size="sm"
              disabled={uploading}
              className="bg-[hsl(200,70%,45%)] hover:bg-[hsl(200,70%,40%)] text-white"
              onClick={handleSubmit}
            >
              {uploading ? "Uploading…" : "Submit"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
