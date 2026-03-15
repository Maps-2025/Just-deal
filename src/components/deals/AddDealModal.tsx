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

// Hardcoded org ID for now — will be dynamic after auth
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export function AddDealModal({ open, onClose }: AddDealModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [assetType, setAssetType] = useState("Multi-Family");
  const createDeal = useCreateDeal();

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Deal name is required");
      return;
    }
    try {
      await createDeal.mutateAsync({
        deal_name: name.trim(),
        deal_id: String(Math.floor(Math.random() * 90000) + 10000),
        asset_type: assetType,
        organization_id: DEFAULT_ORG_ID,
        status: "New",
        address: address || undefined,
      });
      toast.success("Deal created");
      setName("");
      setAddress("");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to create deal");
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
            <Label htmlFor="deal-name">Deal Name</Label>
            <Input id="deal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 9730 Whitehurst Dr" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="deal-address">Address</Label>
            <Input id="deal-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full street address" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="deal-asset-type">Asset Type</Label>
            <Input id="deal-asset-type" value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="Multi-Family" className="mt-1.5" />
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
