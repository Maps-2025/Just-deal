import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DealWithProperty } from "@/types/deals";

interface DealHeaderProps {
  deal: DealWithProperty;
}

export function DealHeader({ deal }: DealHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-2 border-b bg-white flex-shrink-0">
      <h1 className="text-[14px] font-semibold tracking-tight text-foreground">
        {deal.deal_id} – {deal.deal_name}
      </h1>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm">
          <FileText strokeWidth={1.5} />
          Generate Model
        </Button>
        <Button size="sm">
          <Upload strokeWidth={1.5} />
          Upload
        </Button>
      </div>
    </div>
  );
}
