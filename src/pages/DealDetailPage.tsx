import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DealHeader } from "@/components/dealDetails/DealHeader";
import { DealTabs } from "@/components/dealDetails/DealTabs";
import { DealSummaryCard } from "@/components/dealDetails/DealSummaryCard";
import { DealInfoCard } from "@/components/dealDetails/DealInfoCard";
import { DealActionsCard } from "@/components/dealDetails/DealActionsCard";
import { DealDetailsForm } from "@/components/dealDetails/DealDetailsForm";
import { RentRollModule } from "@/features/rentRoll/RentRollModule";
import { LocationCard } from "@/components/dealDetails/LocationCard";
import { CharacteristicsCard } from "@/components/dealDetails/CharacteristicsCard";
import { AmenitiesCard } from "@/components/dealDetails/AmenitiesCard";
import { ValuationCard } from "@/components/dealDetails/ValuationCard";
import { TransactionInfoCard } from "@/components/dealDetails/TransactionInfoCard";
import { PreviousSaleCard } from "@/components/dealDetails/PreviousSaleCard";
import { CommentsCard } from "@/components/dealDetails/CommentsCard";
import { useDeal } from "@/hooks/useDeals";

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const [searchParams] = useSearchParams();
  const defaultSection = searchParams.get("section") || "summary";
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewSection, setOverviewSection] = useState(defaultSection);

  const { data: deal, isLoading } = useDeal(dealId);
  const { data: rentRollUnits = [] } = useRentRollUnits(dealId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading deal…</p>
        </div>
      </AppLayout>
    );
  }

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
      <div className="flex-1 flex flex-col min-w-0" id="page-top">
        <DealHeader deal={deal} />
        <DealTabs active={activeTab} onSelect={setActiveTab} />

        {activeTab === "overview" && (
          <div className="flex-1 flex min-h-0">
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

            <div className="flex-1 overflow-auto">
              {overviewSection === "summary" && (
                <div className="p-6">
                  {/* Top row: Summary + Info + Actions */}
                  <div className="grid grid-cols-[1fr_280px_280px] gap-4 mb-6">
                    <DealSummaryCard deal={deal} />
                    <DealInfoCard deal={deal} />
                    <DealActionsCard />
                  </div>

                  {/* Full summary sections */}
                  <div className="space-y-6">
                    <LocationCard deal={deal} />
                    <CharacteristicsCard deal={deal} />
                    <AmenitiesCard deal={deal} />
                    <ValuationCard />
                    <TransactionInfoCard deal={deal} />
                    <PreviousSaleCard />
                    <CommentsCard deal={deal} />
                  </div>
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
            <RentRollViewer units={rentRollUnits} />
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
