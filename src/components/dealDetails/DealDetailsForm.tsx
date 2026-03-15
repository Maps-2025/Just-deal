import { Deal } from "@/types/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DealDetailsFormProps {
  deal: Deal;
}

export function DealDetailsForm({ deal }: DealDetailsFormProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Property Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Property</h2>
          <Button size="sm">Update</Button>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Deal Name</Label>
            <Input defaultValue={deal.name} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Assigned To</Label>
            <Input defaultValue={deal.assignedTo || ""} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Asset Type</Label>
            <Input defaultValue={deal.assetType} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Last Modified By</Label>
            <p className="text-sm">{deal.lastModifiedBy || "—"}</p>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Address</Label>
            <Input defaultValue={deal.address} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Market</Label>
            <p className="text-sm">{deal.market}</p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">City</Label>
            <Input defaultValue={deal.city} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">State</Label>
            <Input defaultValue={deal.state} className="flex-1 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">ZIP</Label>
            <Input defaultValue={deal.zip} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
