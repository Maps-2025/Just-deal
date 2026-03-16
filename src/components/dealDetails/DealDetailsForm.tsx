import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateDeal } from "@/hooks/useDeals";
import { toast } from "sonner";
import type { DealWithProperty } from "@/types/deals";

interface DealDetailsFormProps {
  deal: DealWithProperty;
}

const AMENITY_KEYS = ["elevator", "doorman", "waterfront", "fitness_center", "pool", "roof_deck"] as const;
const AMENITY_LABELS: Record<string, string> = {
  elevator: "Elevator", doorman: "Doorman", waterfront: "Waterfront",
  fitness_center: "Fitness Center", pool: "Pool", roof_deck: "Roof Deck",
};

const STATUSES = ["New", "Active", "Bid Placed", "Closed", "Dormant", "Passed", "Lost", "Withdrawn", "Exited", "Owned Property", "Property Comp"];

function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Label className="w-40 text-sm text-muted-foreground flex-shrink-0">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DealDetailsForm({ deal }: DealDetailsFormProps) {
  const prop = deal.properties;
  const amenities = (prop?.amenities ?? {}) as Record<string, boolean>;
  const updateDeal = useUpdateDeal(deal.id);

  const [form, setForm] = useState({
    // Deal
    deal_name: deal.deal_name ?? "",
    asset_type: deal.asset_type ?? "",
    deal_type: deal.deal_type ?? "",
    fund: deal.fund ?? "",
    status: deal.status ?? "New",
    bid_due_date: deal.bid_due_date ?? "",
    due_diligence_date: deal.due_diligence_date ?? "",
    broker: deal.broker ?? "",
    broker_email: deal.broker_email ?? "",
    broker_phone: deal.broker_phone ?? "",
    comments: deal.comments ?? "",
    // Property
    address: prop?.address ?? "",
    city: prop?.city ?? "",
    state: prop?.state ?? "",
    zip: prop?.zip ?? "",
    market: prop?.market ?? "",
    building_type: prop?.building_type ?? "",
    year_built: prop?.year_built?.toString() ?? "",
    year_renovated: prop?.year_renovated?.toString() ?? "",
    total_units: prop?.total_units?.toString() ?? "",
    buildings: prop?.buildings?.toString() ?? "",
    stories: prop?.stories?.toString() ?? "",
    residential_sqft: prop?.residential_sqft?.toString() ?? "",
    acres: prop?.acres?.toString() ?? "",
    parking_spaces: prop?.parking_spaces?.toString() ?? "",
    asset_quality: prop?.asset_quality ?? "",
    location_quality: prop?.location_quality ?? "",
    affordable_units_pct: prop?.affordable_units_pct?.toString() ?? "",
    age_restricted: prop?.age_restricted ?? false,
    affordability_status: prop?.affordability_status ?? "",
    property_manager: prop?.property_manager ?? "",
    // Amenities
    amenities: Object.fromEntries(AMENITY_KEYS.map(k => [k, !!amenities[k]])),
  });

  useEffect(() => {
    setForm({
      deal_name: deal.deal_name ?? "",
      asset_type: deal.asset_type ?? "",
      deal_type: deal.deal_type ?? "",
      fund: deal.fund ?? "",
      status: deal.status ?? "New",
      bid_due_date: deal.bid_due_date ?? "",
      due_diligence_date: deal.due_diligence_date ?? "",
      broker: deal.broker ?? "",
      broker_email: deal.broker_email ?? "",
      broker_phone: deal.broker_phone ?? "",
      comments: deal.comments ?? "",
      address: prop?.address ?? "",
      city: prop?.city ?? "",
      state: prop?.state ?? "",
      zip: prop?.zip ?? "",
      market: prop?.market ?? "",
      building_type: prop?.building_type ?? "",
      year_built: prop?.year_built?.toString() ?? "",
      year_renovated: prop?.year_renovated?.toString() ?? "",
      total_units: prop?.total_units?.toString() ?? "",
      buildings: prop?.buildings?.toString() ?? "",
      stories: prop?.stories?.toString() ?? "",
      residential_sqft: prop?.residential_sqft?.toString() ?? "",
      acres: prop?.acres?.toString() ?? "",
      parking_spaces: prop?.parking_spaces?.toString() ?? "",
      asset_quality: prop?.asset_quality ?? "",
      location_quality: prop?.location_quality ?? "",
      affordable_units_pct: prop?.affordable_units_pct?.toString() ?? "",
      age_restricted: prop?.age_restricted ?? false,
      affordability_status: prop?.affordability_status ?? "",
      property_manager: prop?.property_manager ?? "",
      amenities: Object.fromEntries(AMENITY_KEYS.map(k => [k, !!((prop?.amenities as Record<string, boolean>) ?? {})[k]])),
    });
  }, [deal.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));
  const setAmenity = (key: string, checked: boolean) =>
    setForm(prev => ({ ...prev, amenities: { ...prev.amenities, [key]: checked } }));

  const handleUpdate = async () => {
    if (!form.deal_name.trim()) { toast.error("Deal name is required"); return; }

    try {
      await updateDeal.mutateAsync({
        deal_name: form.deal_name,
        asset_type: form.asset_type,
        deal_type: form.deal_type || null,
        fund: form.fund || null,
        status: form.status,
        bid_due_date: form.bid_due_date || null,
        due_diligence_date: form.due_diligence_date || null,
        broker: form.broker || null,
        broker_email: form.broker_email || null,
        broker_phone: form.broker_phone || null,
        comments: form.comments || null,
        property: {
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          market: form.market || null,
          building_type: form.building_type || null,
          year_built: form.year_built ? Number(form.year_built) : null,
          year_renovated: form.year_renovated ? Number(form.year_renovated) : null,
          total_units: form.total_units ? Number(form.total_units) : null,
          buildings: form.buildings ? Number(form.buildings) : null,
          stories: form.stories ? Number(form.stories) : null,
          residential_sqft: form.residential_sqft ? Number(form.residential_sqft) : null,
          acres: form.acres ? Number(form.acres) : null,
          parking_spaces: form.parking_spaces ? Number(form.parking_spaces) : null,
          asset_quality: form.asset_quality || null,
          location_quality: form.location_quality || null,
          affordable_units_pct: form.affordable_units_pct ? Number(form.affordable_units_pct) : null,
          age_restricted: form.age_restricted,
          affordability_status: form.affordability_status || null,
          property_manager: form.property_manager || null,
          amenities: form.amenities,
        },
      });
      toast.success("Deal updated successfully");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to update deal");
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Property Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Property</h2>
          <Button size="sm" onClick={handleUpdate} disabled={updateDeal.isPending}>
            {updateDeal.isPending ? "Updating…" : "Update"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Deal Name">
            <Input value={form.deal_name} onChange={e => set("deal_name", e.target.value)} />
          </FormField>
          <FormField label="Asset Type">
            <Input value={form.asset_type} onChange={e => set("asset_type", e.target.value)} />
          </FormField>
          <FormField label="Deal Type">
            <Input value={form.deal_type} onChange={e => set("deal_type", e.target.value)} />
          </FormField>
          <FormField label="Fund">
            <Input value={form.fund} onChange={e => set("fund", e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Location */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Address">
            <Input value={form.address} onChange={e => set("address", e.target.value)} />
          </FormField>
          <FormField label="Market">
            <Input value={form.market} onChange={e => set("market", e.target.value)} />
          </FormField>
          <FormField label="City">
            <Input value={form.city} onChange={e => set("city", e.target.value)} />
          </FormField>
          <FormField label="State">
            <Input value={form.state} onChange={e => set("state", e.target.value)} />
          </FormField>
          <FormField label="ZIP">
            <Input value={form.zip} onChange={e => set("zip", e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Characteristics */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Characteristics</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="No. of Residential Units">
            <Input type="number" value={form.total_units} onChange={e => set("total_units", e.target.value)} />
          </FormField>
          <FormField label="No. of Buildings">
            <Input type="number" value={form.buildings} onChange={e => set("buildings", e.target.value)} />
          </FormField>
          <FormField label="Residential Sq. Footage">
            <Input type="number" value={form.residential_sqft} onChange={e => set("residential_sqft", e.target.value)} />
          </FormField>
          <FormField label="No. of Stories">
            <Input type="number" value={form.stories} onChange={e => set("stories", e.target.value)} />
          </FormField>
          <FormField label="Building Type">
            <Input value={form.building_type} onChange={e => set("building_type", e.target.value)} />
          </FormField>
          <FormField label="Asset Quality">
            <Input value={form.asset_quality} onChange={e => set("asset_quality", e.target.value)} />
          </FormField>
          <FormField label="Year Built">
            <Input type="number" value={form.year_built} onChange={e => set("year_built", e.target.value)} />
          </FormField>
          <FormField label="Property Manager">
            <Input value={form.property_manager} onChange={e => set("property_manager", e.target.value)} />
          </FormField>
          <FormField label="Year Renovated">
            <Input type="number" value={form.year_renovated} onChange={e => set("year_renovated", e.target.value)} />
          </FormField>
          <FormField label="Acres">
            <Input type="number" value={form.acres} onChange={e => set("acres", e.target.value)} />
          </FormField>
          <FormField label="Affordable Units %">
            <Input type="number" value={form.affordable_units_pct} onChange={e => set("affordable_units_pct", e.target.value)} />
          </FormField>
          <FormField label="Parking Spaces">
            <Input type="number" value={form.parking_spaces} onChange={e => set("parking_spaces", e.target.value)} />
          </FormField>
          <FormField label="Age Restricted">
            <Select value={form.age_restricted ? "yes" : "no"} onValueChange={v => set("age_restricted", v === "yes" ? true as unknown as string : false as unknown as string)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Affordability Status">
            <Input value={form.affordability_status} onChange={e => set("affordability_status", e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Amenities */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Amenities</h2>
        <div className="grid grid-cols-3 gap-3">
          {AMENITY_KEYS.map(key => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.amenities[key]}
                onCheckedChange={(checked) => setAmenity(key, !!checked)}
              />
              {AMENITY_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      {/* Deal */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Deal</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Deal Status">
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Fund">
            <Input value={form.fund} onChange={e => set("fund", e.target.value)} />
          </FormField>
          <FormField label="Bid Due Date">
            <Input type="date" value={form.bid_due_date} onChange={e => set("bid_due_date", e.target.value)} />
          </FormField>
          <FormField label="Deal Type">
            <Input value={form.deal_type} onChange={e => set("deal_type", e.target.value)} />
          </FormField>
          <FormField label="Due Diligence Date">
            <Input type="date" value={form.due_diligence_date} onChange={e => set("due_diligence_date", e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Valuation */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Valuation</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Underwritten Purchase Price"><Input placeholder="$" /></FormField>
          <FormField label="Asking Price"><Input placeholder="$" /></FormField>
          <FormField label="Required Equity"><Input placeholder="$" /></FormField>
          <FormField label="Expected Purchase Price"><Input placeholder="$" /></FormField>
          <FormField label="Equity Multiple"><Input placeholder="×" /></FormField>
          <FormField label="Unleveraged IRR"><Input placeholder="%" /></FormField>
          <FormField label="Leveraged IRR"><Input placeholder="%" /></FormField>
          <FormField label="Going-In Cap Rate (Fwd.)"><Input placeholder="%" /></FormField>
        </div>
      </div>

      {/* Transaction Information */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Transaction Information</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Bid Price"><Input placeholder="$" /></FormField>
          <FormField label="NOI (Trailing 12)"><Input placeholder="$" /></FormField>
          <FormField label="Bid Date"><Input type="date" /></FormField>
          <FormField label="Buyer"><Input /></FormField>
          <FormField label="Sale Price"><Input placeholder="$" /></FormField>
          <FormField label="Seller"><Input /></FormField>
          <FormField label="Sale Date"><Input type="date" /></FormField>
          <FormField label="Broker">
            <Input value={form.broker} onChange={e => set("broker", e.target.value)} />
          </FormField>
          <FormField label="Cap Rate (Trailing)"><Input placeholder="%" /></FormField>
          <FormField label="Broker Email">
            <Input value={form.broker_email} onChange={e => set("broker_email", e.target.value)} />
          </FormField>
          <div />
          <FormField label="Broker Phone">
            <Input value={form.broker_phone} onChange={e => set("broker_phone", e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* Previous Sale */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Previous Sale</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <FormField label="Last Sale Date"><Input type="date" /></FormField>
          <FormField label="Last Sale Price"><Input placeholder="$" /></FormField>
          <FormField label="Current Owner"><Input /></FormField>
        </div>
      </div>

      {/* Comments */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <Textarea
          rows={6}
          value={form.comments}
          onChange={e => set("comments", e.target.value)}
          placeholder="Enter comments about this deal..."
        />
      </div>

      {/* Bottom Update Button */}
      <div className="border-t pt-6 flex justify-end">
        <Button onClick={handleUpdate} disabled={updateDeal.isPending}>
          {updateDeal.isPending ? "Updating…" : "Update"}
        </Button>
      </div>
    </div>
  );
}
