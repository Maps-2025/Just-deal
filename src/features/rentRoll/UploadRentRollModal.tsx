import { useState, useRef, useCallback } from "react";
import { X, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadRentRoll } from "@/hooks/useRentRoll";
import { toast } from "sonner";

interface UploadRentRollModalProps {
  dealId: string;
  onComplete: (rentRollId: string, headers: string[]) => void;
  onCancel: () => void;
}

export function UploadRentRollModal({ dealId, onComplete, onCancel }: UploadRentRollModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [totalUnits, setTotalUnits] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadRentRoll();

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
    toast.info("Uploading rent roll. Please wait...");
    try {
      const result = await upload.mutateAsync({
        dealId,
        file,
        totalUnits: parseInt(totalUnits) || 0,
      });
      toast.success(`Uploaded ${result.data.row_count} rows`);
      onComplete(result.data.rent_roll_id, result.data.headers);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Blue header */}
        <div className="bg-[hsl(200,70%,45%)] px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Rent Roll Capture</h2>
          <button onClick={onCancel} className="text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Total Units */}
          <div className="flex items-start gap-3">
            <span className="text-sm mt-0.5 flex-shrink-0">1.</span>
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <span className="text-sm">How many total Units (commercial and residential) are in the rent roll file being uploaded?</span>
              <Input
                type="number"
                placeholder="e.g. 52"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                className="w-24 h-8 text-sm border-destructive/50"
              />
            </div>
          </div>

          {/* Asset Type */}
          <div className="flex items-start gap-3">
            <span className="text-sm mt-0.5 flex-shrink-0">2.</span>
            <span className="text-sm">Asset Type : <strong>Multifamily</strong></span>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-3">
            <span className="text-sm mt-0.5 flex-shrink-0">3.</span>
            <span className="text-sm">Select the file you would like to upload and then click "<strong>Next.</strong>" Only one file can be processed at a time.</span>
          </div>

          {/* Guidelines */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Guidelines for Successful Rent Roll Processing</h3>
            <ul className="text-sm space-y-1.5 list-disc pl-5">
              <li><strong>Verify Document Type:</strong> Confirm you are uploading a valid rent roll document. Do not upload a unit mix or operating statement.</li>
              <li><strong>Upload Clean Data:</strong> Use unmodified source data directly from the seller's property management system. An unmodified Excel spreadsheet or a printed (not scanned) PDF works best. Scanned PDFs are acceptable but harder to process.</li>
              <li><strong>Verify Student Housing Rent Rolls:</strong> Ensure the rent roll is for current, in-place leases.</li>
            </ul>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : file ? "border-muted bg-muted/30" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium">{file.name}</p>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Drag and drop your file or click to browse</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-lg font-medium">Please Wait...</p>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-primary rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-muted/30 border-t px-6 py-3 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!file || upload.isPending || uploading}
            className="bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] text-white px-8"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
