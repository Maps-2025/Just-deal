import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Deal } from "@/types/deals";

interface DealHeaderProps {
  deal: Deal;
}

export function DealHeader({ deal }: DealHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b">
      <h1 className="text-lg font-semibold tracking-tight">
        {deal.dealId} – {deal.name}
      </h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          Generate Model
        </Button>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          Upload
        </Button>
      </div>
    </div>
  );
}
