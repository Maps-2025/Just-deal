import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DealWithProperty } from "@/types/deals";

interface DealDetailsFormProps {
  deal: DealWithProperty;
}

export function DealDetailsForm({ deal }: DealDetailsFormProps) {
  const prop = deal.properties;

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
            <Input defaultValue={deal.deal_name} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Asset Type</Label>
            <Input defaultValue={deal.asset_type} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Deal Type</Label>
            <Input defaultValue={deal.deal_type || ""} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Fund</Label>
            <Input defaultValue={deal.fund || ""} className="flex-1" />
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Address</Label>
            <Input defaultValue={prop?.address || ""} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">Market</Label>
            <Input defaultValue={prop?.market || ""} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">City</Label>
            <Input defaultValue={prop?.city || ""} className="flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">State</Label>
            <Input defaultValue={prop?.state || ""} className="flex-1 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-muted-foreground flex-shrink-0">ZIP</Label>
            <Input defaultValue={prop?.zip || ""} className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
