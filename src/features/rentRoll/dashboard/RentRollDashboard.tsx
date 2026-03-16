import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useRentRollDashboard } from "@/hooks/useRentRoll";
import { FloorPlanSummaryTab } from "./FloorPlanSummaryTab";
import { RentRollTableTab } from "./RentRollTableTab";
import { ManageRentRollsTab } from "./ManageRentRollsTab";

const TABS = [
  { id: "dashboard", label: "Rent Roll Dashboard" },
  { id: "floorplan", label: "Floor Plan Summary" },
  { id: "rentroll", label: "Rent Roll" },
  { id: "manage", label: "Manage Rent Rolls" },
];

const COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 67%, 55%)"];

interface RentRollDashboardProps {
  dealId: string;
  rentRollId: string;
  onBack: () => void;
}

export function RentRollDashboard({ dealId, rentRollId, onBack }: RentRollDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: dashboard, isLoading } = useRentRollDashboard(dealId, rentRollId);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>{tab.label}</button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "dashboard" && (isLoading ? <p className="text-sm text-muted-foreground">Loading dashboard…</p> : dashboard ? (
          <div>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <ChartCard title="Unit Types" data={dashboard.unit_types} />
              <ChartCard title="Lease Types" data={dashboard.lease_types} />
              <ChartCard title="Renovation Status" data={dashboard.renovation_status} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="border rounded-lg p-5"><h3 className="font-semibold text-sm mb-2">Lease Expiration Schedule</h3><p className="text-sm text-muted-foreground text-center py-8">No Data Available</p></div>
              <div className="border rounded-lg p-5"><h3 className="font-semibold text-sm mb-2">Leasing Trends</h3><p className="text-sm text-muted-foreground text-center py-8">No Data Available</p></div>
            </div>
          </div>
        ) : null)}
        {activeTab === "floorplan" && <FloorPlanSummaryTab dealId={dealId} rentRollId={rentRollId} />}
        {activeTab === "rentroll" && <RentRollTableTab dealId={dealId} rentRollId={rentRollId} />}
        {activeTab === "manage" && <ManageRentRollsTab rentRollId={rentRollId} />}
      </div>
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="border rounded-lg p-5">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {data.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No Data Available</p> : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip /><Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
