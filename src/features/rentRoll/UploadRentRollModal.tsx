import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">Rent Roll Capture</h2>
      </div>

      <div className="space-y-6">
        {/* Total Units */}
        <div>
          <Label htmlFor="totalUnits">
            How many total Units (commercial and residential) are in the rent roll file being uploaded?
          </Label>
          <Input
            id="totalUnits"
            type="number"
            placeholder="e.g. 52"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            className="mt-1.5 w-40"
          />
        </div>

        {/* Guidelines */}
        <div className="bg-muted/50 border rounded-lg p-4">
          <h3 className="font-medium text-sm mb-2">Guidelines for Successful Rent Roll Processing</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
            <li><strong>Verify Document Type:</strong> Confirm you are uploading a valid rent roll document. Do not upload a unit mix or operating statement.</li>
            <li><strong>Upload Clean Data:</strong> Use unmodified source data directly from the seller's property management system.</li>
            <li><strong>Supported formats:</strong> .xlsx, .xls, .csv</li>
          </ul>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
            dragOver ? "border-primary bg-primary/5" : file ? "border-success bg-success/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-success" />
              <div className="text-left">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Drag and drop your file or choose from your computer</p>
              <Button variant="outline" size="sm" className="mt-2">Select File</Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || upload.isPending}>
            {upload.isPending ? "Uploading…" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
