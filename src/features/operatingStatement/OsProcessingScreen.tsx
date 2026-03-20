import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { osUploadApi } from "@/services/operatingStatementApi";

interface Props {
  dealId: string;
  documentId: string;
  onComplete: () => void;
  onError: () => void;
}

export function OsProcessingScreen({ dealId, documentId, onComplete, onError }: Props) {
  const [statusText, setStatusText] = useState("Processing your operating statement…");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await osUploadApi.status(dealId, documentId);
        if (cancelled) return;

        if (res.status === "PROCESSED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete();
        } else if (res.status === "FAILED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStatusText("Processing failed. Please try again.");
          setTimeout(onError, 2000);
        } else {
          setStatusText("Processing your operating statement…");
        }
      } catch {
        if (!cancelled) {
          setStatusText("Checking status…");
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dealId, documentId, onComplete, onError]);

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--primary))] mx-auto" />
        <p className="text-sm font-medium text-foreground">{statusText}</p>
        <p className="text-xs text-muted-foreground">This may take a few seconds</p>
      </div>
    </div>
  );
}
