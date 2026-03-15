import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DealHeader } from "@/components/dealDetails/DealHeader";
import { DealTabs } from "@/components/dealDetails/DealTabs";
import { DealSummaryCard } from "@/components/dealDetails/DealSummaryCard";
import { DealInfoCard } from "@/components/dealDetails/DealInfoCard";
import { DealActionsCard } from "@/components/dealDetails/DealActionsCard";
import { DealDetailsForm } from "@/components/dealDetails/DealDetailsForm";
import { RentRollViewer } from "@/components/dealDetails/RentRollViewer";
import { mockDeals, mockRentRoll } from "@/data/mockDeals";

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSection, setOverviewSection] = useState("summary");

  const deal = mockDeals.find((d) => d.id === dealId);

  if (!deal) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Deal not found.</p>
            <Link to="/" className="text-primary text-sm hover:underline">
              Back to Deals
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const overviewSections = [
    { id: "summary", label: "Deal Summary" },
    { id: "details", label: "Deal Details" },
    { id: "comps", label: "Sales Comps" },
  ];

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-w-0">
        <DealHeader deal={deal} />
        <DealTabs active={activeTab} onSelect={setActiveTab} />

        {activeTab === "overview" && (
          <div className="flex-1 flex min-h-0">
            {/* Overview sub-nav */}
            <div className="w-40 border-r pt-4 px-3 flex-shrink-0">
              {overviewSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setOverviewSection(s.id)}
                  className={`block w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors mb-0.5 ${
                    overviewSection === s.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
              {overviewSection === "summary" && (
                <div className="p-6 grid grid-cols-[1fr_280px_280px] gap-4">
                  <DealSummaryCard deal={deal} />
                  <DealInfoCard deal={deal} />
                  <DealActionsCard />
                </div>
              )}
              {overviewSection === "details" && (
                <DealDetailsForm deal={deal} />
              )}
              {overviewSection === "comps" && (
                <div className="flex items-center justify-center py-20">
                  <p className="text-muted-foreground text-sm">Sales Comps not available yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "rent-roll" && (
          <div className="flex-1 overflow-auto">
            <RentRollViewer units={deal.id === "1" ? mockRentRoll : []} />
          </div>
        )}

        {activeTab !== "overview" && activeTab !== "rent-roll" && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {activeTab === "operating-statement" && "Operating Statement — coming soon."}
              {activeTab === "firstpass" && "FirstPass analysis — coming soon."}
              {activeTab === "sharing" && "Sharing settings — coming soon."}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
