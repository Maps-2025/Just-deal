import { useState, useEffect } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";
import { osDataApi } from "@/services/operatingStatementApi";
import type { OsDocument } from "@/services/operatingStatementApi";
import { toast } from "sonner";

interface Props {
  dealId: string;
  onUpload: () => void;
  onSelectBatch: (batchId: string) => void;
}

export function OsManageView({ dealId, onUpload, onSelectBatch }: Props) {
  const [batches, setBatches] = useState<OsDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await osDataApi.listBatches(dealId);
        setBatches(data);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dealId]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
          <h2 className="text-xl font-semibold text-foreground">Operating Statements</h2>
          <button className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1.5 font-medium">
            <Download className="h-4 w-4" /> Download Template
          </button>
          <button
            className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1.5 font-medium"
            onClick={onUpload}
          >
            <span className="font-bold text-base">+</span> Upload Operating Statement
          </button>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : batches.length === 0 ? (
          <p className="text-sm text-[hsl(var(--primary))]">No Operating Statements uploaded for this deal.</p>
        ) : (
          <div className="space-y-1">
            {batches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between py-3 px-4 border-b hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => onSelectBatch(b.id)}
                    className="text-sm font-medium text-[hsl(var(--primary))] hover:underline cursor-pointer"
                  >
                    {fmtDate(b.batch_date || b.created_at)}
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === "PROCESSED"
                      ? "bg-green-100 text-green-700"
                      : b.status === "PROCESSING"
                      ? "bg-yellow-100 text-yellow-700"
                      : b.status === "FAILED"
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                    onClick={() => onSelectBatch(b.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
