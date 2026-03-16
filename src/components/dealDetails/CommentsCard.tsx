import type { DealWithProperty } from "@/types/deals";

interface CommentsCardProps {
  deal: DealWithProperty;
}

export function CommentsCard({ deal }: CommentsCardProps) {
  return (
    <div className="section-border p-5">
      <div className="flex items-center justify-between border-b pb-3 mb-4">
        <h3 className="font-semibold text-base">Comments</h3>
        <a href="#page-top" className="text-xs text-primary hover:underline">▲ Back to Top</a>
      </div>
      <div className="bg-muted/30 rounded-md p-4 min-h-[120px] text-sm text-muted-foreground whitespace-pre-wrap">
        {deal.comments || "No comments."}
      </div>
    </div>
  );
}
