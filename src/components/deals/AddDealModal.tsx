import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddDealModal({ open, onClose }: AddDealModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  if (!open) return null;

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
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Create Deal</Button>
        </div>
      </div>
    </div>
  );
}
