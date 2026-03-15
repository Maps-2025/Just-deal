import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDeal } from "@/hooks/useDeals";
import { toast } from "sonner";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
}

// Default org for Phase 1 — will come from auth context in Phase 2
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function AddDealModal({ open, onClose }: AddDealModalProps) {
  const [name, setName]           = useState("");
  const [address, setAddress]     = useState("");
  const [city, setCity]           = useState("");
  const [state, setState]         = useState("");
  const [market, setMarket]       = useState("");
  const [assetType, setAssetType] = useState("Multifamily");
  const createDeal = useCreateDeal();

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Deal name is required");
      return;
    }
    try {
      await createDeal.mutateAsync({
        deal_name:       name.trim(),
        deal_id:         String(Math.floor(Math.random() * 90000) + 10000),
        asset_type:      assetType,
        organization_id: DEFAULT_ORG_ID,
        status:          "New",
        address:         address || undefined,
        city:            city    || undefined,
        state:           state   || undefined,
        market:          market  || undefined,
      });
      toast.success("Deal created successfully");
      setName(""); setAddress(""); setCity(""); setState(""); setMarket("");
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to create deal");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative bg-background border rounded-lg shadow-subtle w-full max-w-md p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">New Deal</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="deal-name">Deal Name *</Label>
            <Input id="deal-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 9730 Whitehurst Dr" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="deal-asset-type">Asset Type</Label>
            <Input id="deal-asset-type" value={assetType} onChange={(e) => setAssetType(e.target.value)}
              placeholder="Multifamily" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="deal-address">Address</Label>
            <Input id="deal-address" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="deal-city">City</Label>
              <Input id="deal-city" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Dallas" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="deal-state">State</Label>
              <Input id="deal-state" value={state} onChange={(e) => setState(e.target.value)}
                placeholder="TX" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="deal-market">Market</Label>
            <Input id="deal-market" value={market} onChange={(e) => setMarket(e.target.value)}
              placeholder="Dallas-Fort Worth, TX" className="mt-1.5" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createDeal.isPending}>
            {createDeal.isPending ? "Creating…" : "Create Deal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
