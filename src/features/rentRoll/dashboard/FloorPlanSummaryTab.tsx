import { useState, useMemo, useCallback } from "react";
import { useFloorPlanSummary, useRentRollList } from "@/hooks/useRentRoll";
import { FloorPlanSettingsPanel } from "./FloorPlanSettingsPanel";
import { FloorPlanRentTable } from "./FloorPlanRentTable";
import { FloorPlanUnitTable } from "./FloorPlanUnitTable";
import { FloorPlanCharts } from "./FloorPlanCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileSpreadsheet } from "lucide-react";
import { REPORT_TYPE_API_MAP } from "@/services/rentRollApi";
import type { FloorPlanSummaryRow, ReportTypeView } from "@/services/rentRollApi";

interface FloorPlanSummaryTabProps {
  dealId: string;
  rentRollId: string;
  onNavigate?: (view: string) => void;
}

export function FloorPlanSummaryTab({ dealId, rentRollId, onNavigate }: FloorPlanSummaryTabProps) {
  const [selectedRRId, setSelectedRRId] = useState(rentRollId);
  const [reportType, setReportType] = useState<ReportTypeView>("floorplan");
  const [monthlyRentMode, setMonthlyRentMode] = useState<"0" | "1" | "2">("1");
  const [inPlaceRentType, setInPlaceRentType] = useState("contractual");
  const [includeSupplemental, setIncludeSupplemental] = useState(false);

  const unitMixType = REPORT_TYPE_API_MAP[reportType];
  const { data: rentRolls = [] } = useRentRollList(dealId);
  const { data: rawSummary = [], isLoading } = useFloorPlanSummary(dealId, selectedRRId, unitMixType);

  const { dataRows, totalRow } = useMemo(() => {
    const total = rawSummary.find((r) => r.floor_plan === "Total / Average");
    const rows = rawSummary.filter((r) => r.floor_plan !== "Total / Average");
    return { dataRows: rows, totalRow: total || null };
  }, [rawSummary]);

  const computedTotals = useMemo(() => {
    if (totalRow) return totalRow;
    if (!dataRows.length) return null;
    const units = dataRows.reduce((s, r) => s + r.units, 0);
    const occupied = dataRows.reduce((s, r) => s + r.occupied, 0);
    const vacant = dataRows.reduce((s, r) => s + r.vacant, 0);
    const nonRev = dataRows.reduce((s, r) => s + (r.non_rev ?? 0), 0);
    const avgSqft = units > 0 ? Math.round(dataRows.reduce((s, r) => s + r.avg_sqft * r.units, 0) / units) : 0;
    const avgMarket = units > 0 ? dataRows.reduce((s, r) => s + r.avg_market_rent * r.units, 0) / units : 0;
    const avgContract = units > 0 ? dataRows.reduce((s, r) => s + r.avg_contract_rent * r.units, 0) / units : 0;
    const occMarket = occupied > 0 ? dataRows.reduce((s, r) => s + (r.occupied_market_rent ?? r.avg_market_rent) * r.occupied, 0) / occupied : 0;
    const inPlace = occupied > 0 ? dataRows.reduce((s, r) => s + (r.in_place_rent ?? r.avg_contract_rent) * r.occupied, 0) / occupied : 0;
    return {
      floor_plan: "Total / Average",
      bedrooms: null,
      bathrooms: null,
      units,
      occupied,
      vacant,
      non_rev: nonRev,
      occupancy_pct: units > 0 ? (occupied / units) * 100 : 0,
      avg_sqft: avgSqft,
      avg_market_rent: avgMarket,
      avg_contract_rent: avgContract,
      occupied_market_rent: occMarket,
      in_place_rent: inPlace,
      market_rent_total: dataRows.reduce((s, r) => s + (r.market_rent_total ?? r.avg_market_rent * r.units), 0),
      in_place_rent_total: dataRows.reduce((s, r) => s + (r.in_place_rent_total ?? r.avg_contract_rent * r.occupied), 0),
      market_rent_psf: 0,
      in_place_rent_psf: 0,
    } as FloorPlanSummaryRow;
  }, [dataRows, totalRow]);

  const handleExportExcel = useCallback(() => {
    const csvRows: string[] = [];
    csvRows.push("Floor Plan,Market Rent,Occupied Market Rent,In-Place Rent,% of Market Rent");
    dataRows.forEach((r) => {
      const mr = r.avg_market_rent;
      const omr = r.occupied_market_rent ?? r.avg_market_rent;
      const ipr = r.in_place_rent ?? r.avg_contract_rent;
      const pct = omr > 0 ? ((ipr / omr) * 100).toFixed(1) : "0";
      csvRows.push(`${r.floor_plan},${mr},${omr},${ipr},${pct}%`);
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "floor_plan_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [dataRows]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Sidebar */}
      <FloorPlanSettingsPanel
        rentRolls={rentRolls}
        selectedRentRollId={selectedRRId}
        onSelectRentRoll={setSelectedRRId}
        onManage={() => onNavigate?.("rent-roll-manage")}
        onView={() => onNavigate?.("rent-roll-table")}
        hasAnomalies={rentRolls.find((r) => r.id === selectedRRId)?.has_anomalies}
        reportType={reportType}
        onReportTypeChange={(v) => setReportType(v as ReportTypeView)}
        monthlyRentMode={monthlyRentMode}
        onMonthlyRentModeChange={(v) => setMonthlyRentMode(v as "0" | "1" | "2")}
        inPlaceRentType={inPlaceRentType}
        onInPlaceRentTypeChange={setInPlaceRentType}
        includeSupplemental={includeSupplemental}
        onIncludeSupplementalChange={setIncludeSupplemental}
      />

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {/* Export Button */}
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </button>
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-xl font-normal text-foreground text-center mb-6">Floor Plan Summary</h2>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ) : !dataRows.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No Floor Plan Data</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Floor plan summary will appear here once rent roll data has been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Table 1: Rent Summary */}
              <FloorPlanRentTable
                data={dataRows}
                totals={computedTotals}
                monthlyRentMode={monthlyRentMode}
                reportType={reportType}
              />

              {/* Table 2: Unit Information & Occupancy */}
              <FloorPlanUnitTable
                data={dataRows}
                totals={computedTotals}
                reportType={reportType}
              />

              {/* Charts */}
              <FloorPlanCharts
                data={dataRows}
                reportType={reportType}
                monthlyRentMode={monthlyRentMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
