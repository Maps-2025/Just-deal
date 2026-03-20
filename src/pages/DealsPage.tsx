import { useState, useMemo, useCallback, useRef } from "react";
import {
  Search, SlidersHorizontal, Filter, Download, Plus,
  ChevronRight, ChevronLeft, Star, MoreVertical,
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AddDealModal } from "@/components/deals/AddDealModal";
import { useDeals } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";
import type { DealWithProperty } from "@/types/deals";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { color: string; dot: string }> = {
  Active:   { color: "text-emerald-700 bg-emerald-50 border border-emerald-200",   dot: "bg-emerald-500" },
  New:      { color: "text-sky-700 bg-sky-50 border border-sky-200",               dot: "bg-sky-500" },
  Pipeline: { color: "text-violet-700 bg-violet-50 border border-violet-200",      dot: "bg-violet-500" },
  Closed:   { color: "text-slate-600 bg-slate-100 border border-slate-200",        dot: "bg-slate-400" },
  Dead:     { color: "text-red-700 bg-red-50 border border-red-200",              dot: "bg-red-400" },
};
const getStatus = (s: string) => STATUS_CFG[s] ?? STATUS_CFG["New"];

// ── Column definitions ────────────────────────────────────────────────────────
type SortKey = "deal_name" | "deal_id" | "status" | "market" | "units" | "fund" | "bid_due_date" | "asset_type" | "date_added" | "date_modified";

interface ColDef {
  key: SortKey;
  label: string;
  width: number;
  align?: "right" | "left";
  sortable?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: "deal_name",     label: "Deal Name",    width: 230, sortable: true },
  { key: "deal_id",       label: "Deal ID",      width: 80,  sortable: true },
  { key: "status",        label: "Status",       width: 90,  sortable: true },
  { key: "market",        label: "Market",       width: 160, sortable: true },
  { key: "units",         label: "Units",        width: 60,  align: "right", sortable: true },
  { key: "fund",          label: "Fund",         width: 90,  sortable: true },
  { key: "bid_due_date",  label: "Bid Due Date", width: 100, sortable: true },
  { key: "date_added",    label: "Added",        width: 100, sortable: true },
  { key: "date_modified", label: "Modified",     width: 100, sortable: true },
  { key: "asset_type",    label: "Asset Type",   width: 100, sortable: true },
];

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: "all",      label: "All Deals" },
  { id: "pipeline", label: "Pipeline Report" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  } catch { return "—"; }
}
function cell(val: string | number | null | undefined, mono = false) {
  if (val == null || val === "") return <span className="text-muted-foreground/40">—</span>;
  return <span className={mono ? "font-mono" : ""}>{val}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DealsPage() {
  const [search,       setSearch]       = useState("");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [sidebarView,  setSidebarView]  = useState("all");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [sortKey,      setSortKey]      = useState<SortKey>("date_modified");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterAsset,  setFilterAsset]  = useState<string[]>([]);
  const [hoveredRow,   setHoveredRow]   = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: deals = [], isLoading } = useDeals();

  // ── All unique values for filter dropdowns ──
  const allStatuses = useMemo(() => [...new Set(deals.map(d => d.status))].sort(), [deals]);
  const allAssets   = useMemo(() => [...new Set(deals.map(d => d.asset_type).filter(Boolean))].sort(), [deals]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = deals;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.deal_name.toLowerCase().includes(q) ||
        d.deal_id.toString().includes(q)
      );
    }
    if (filterStatus.length) {
      list = list.filter(d => filterStatus.includes(d.status));
    }
    if (filterAsset.length) {
      list = list.filter(d => filterAsset.includes(d.asset_type));
    }

    return [...list].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "deal_name":     av = a.deal_name;                   bv = b.deal_name; break;
        case "deal_id":       av = a.deal_id;                     bv = b.deal_id; break;
        case "status":        av = a.status;                      bv = b.status; break;
        case "market":        av = a.properties?.market ?? "";    bv = b.properties?.market ?? ""; break;
        case "units":         av = a.properties?.total_units ?? 0; bv = b.properties?.total_units ?? 0; break;
        case "fund":          av = a.fund ?? "";                  bv = b.fund ?? ""; break;
        case "bid_due_date":  av = a.bid_due_date ?? "";          bv = b.bid_due_date ?? ""; break;
        case "date_added":    av = a.date_added ?? "";            bv = b.date_added ?? ""; break;
        case "date_modified": av = a.date_modified ?? "";         bv = b.date_modified ?? ""; break;
        case "asset_type":    av = a.asset_type ?? "";            bv = b.asset_type ?? ""; break;
        default:              return 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [deals, search, filterStatus, filterAsset, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  const toggleStatus = (s: string) =>
    setFilterStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleAsset = (a: string) =>
    setFilterAsset(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const SortIcon = ({ col }: { col: ColDef }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp   className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  // ── Total width ─────────────────────────────────────────────────────────────
  const STAR_W = 32;
  const MENU_W = 32;
  const tableW = STAR_W + COLUMNS.reduce((s, c) => s + c.width, 0) + MENU_W;

  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden">

        {/* ── Collapsed sidebar toggle ─────────────────────────────────── */}
        {!sidebarOpen && (
          <div className="w-[22px] flex-shrink-0 border-r bg-[#f8f9fa] flex flex-col items-center pt-3">
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-[200px] flex-shrink-0 border-r bg-[#f8f9fa] flex flex-col overflow-hidden">

            {/* Sidebar header — "All Deals" + collapse */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b">
              <span className="text-[13px] font-semibold text-foreground tracking-tight">Deals</span>
              <button
                onClick={() => setSidebarOpen(false)}
                title="Collapse sidebar"
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nav items */}
            <div className="py-1 border-b">
              {SIDEBAR_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSidebarView(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-[12px] transition-colors rounded-none",
                    sidebarView === item.id
                      ? "text-primary font-medium bg-primary/8"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {/* Status */}
              <div>
                <p className="section-label mb-1.5">Status</p>
                <div className="space-y-1">
                  {allStatuses.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        checked={filterStatus.includes(s)}
                        onChange={() => toggleStatus(s)}
                        className="h-3 w-3 rounded accent-primary border"
                      />
                      <span className="text-[12px] text-foreground group-hover:text-primary transition-colors">{s}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {deals.filter(d => d.status === s).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Asset Type */}
              <div>
                <p className="section-label mb-1.5">Asset Type</p>
                <div className="space-y-1">
                  {allAssets.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        checked={filterAsset.includes(a)}
                        onChange={() => toggleAsset(a)}
                        className="h-3 w-3 rounded accent-primary border"
                      />
                      <span className="text-[12px] text-foreground group-hover:text-primary transition-colors">{a}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {deals.filter(d => d.asset_type === a).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="section-label mb-1.5">Sort By</p>
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as SortKey)}
                  className="w-full h-6 px-2 text-[11px] border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="date_modified">Date Modified</option>
                  <option value="date_added">Date Added</option>
                  <option value="deal_name">Deal Name</option>
                  <option value="bid_due_date">Bid Due Date</option>
                  <option value="units">Units</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Active filters count */}
              {(filterStatus.length > 0 || filterAsset.length > 0) && (
                <button
                  onClick={() => { setFilterStatus([]); setFilterAsset([]); }}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* ── Page header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[15px] font-semibold text-foreground tracking-tight">All Deals</h1>
              <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
                {filtered.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  placeholder="Search by Deal Name or Id"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-7 pl-8 pr-3 w-52 text-[12px] border rounded bg-white
                             focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <button className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] border rounded hover:bg-muted/30 transition-colors">
                <SlidersHorizontal className="h-3 w-3" strokeWidth={1.5} />
                Settings
              </button>
              <button className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] border rounded hover:bg-muted/30 transition-colors">
                <Filter className="h-3 w-3" strokeWidth={1.5} />
                Filter
                {(filterStatus.length + filterAsset.length) > 0 && (
                  <span className="h-4 w-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                    {filterStatus.length + filterAsset.length}
                  </span>
                )}
              </button>
              <button className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] border rounded hover:bg-muted/30 transition-colors">
                <Download className="h-3 w-3" strokeWidth={1.5} />
                Export
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="h-7 px-3 flex items-center gap-1.5 text-[12px] rounded font-medium
                           bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                New Deal
              </button>
            </div>
          </div>

          {/* ── Table area ──────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[12px] text-muted-foreground">Loading deals…</p>
              </div>
            </div>
          ) : (
            <div ref={tableRef} className="flex-1 overflow-auto">
              <table style={{ minWidth: tableW, width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>

                {/* ── Column widths ─────────────────────────────── */}
                <colgroup>
                  <col style={{ width: STAR_W }} />
                  {COLUMNS.map(c => <col key={c.key} style={{ width: c.width, minWidth: c.width }} />)}
                  <col style={{ width: MENU_W }} />
                </colgroup>

                {/* ── Header ────────────────────────────────────── */}
                <thead>
                  <tr style={{ backgroundColor: "#f4f5f7", borderBottom: "1px solid #e5e7eb" }}>
                    {/* Star */}
                    <th style={{ width: STAR_W, padding: "0 8px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }} />

                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        style={{
                          width: col.width,
                          minWidth: col.width,
                          padding: "9px 10px",
                          textAlign: col.align || "left",
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          color: sortKey === col.key ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                          cursor: col.sortable ? "pointer" : "default",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center" }}>
                          {col.label}
                          {col.sortable && (
                            sortKey === col.key
                              ? sortDir === "asc"
                                ? <ArrowUp   className="h-2.5 w-2.5 ml-1 text-primary" />
                                : <ArrowDown className="h-2.5 w-2.5 ml-1 text-primary" />
                              : <ArrowUpDown className="h-2.5 w-2.5 ml-1 opacity-25" />
                          )}
                        </span>
                      </th>
                    ))}

                    {/* Menu */}
                    <th style={{ width: MENU_W, borderBottom: "1px solid #e5e7eb" }} />
                  </tr>
                </thead>

                {/* ── Body ──────────────────────────────────────── */}
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={COLUMNS.length + 2}
                        style={{ textAlign: "center", padding: "48px 0", color: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      >
                        No deals found. Try adjusting your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((deal, idx) => {
                      const isHovered  = hoveredRow === deal.id;
                      const isEven     = idx % 2 === 0;
                      const statusCfg  = getStatus(deal.status);
                      const rowBg      = isHovered ? "#e8f0fe" : isEven ? "#fff" : "#fafbfc";

                      return (
                        <tr
                          key={deal.id}
                          onMouseEnter={() => setHoveredRow(deal.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            backgroundColor: rowBg,
                            borderBottom: "1px solid #f0f1f3",
                            cursor: "pointer",
                            transition: "background-color 120ms ease",
                            height: 32,
                            maxHeight: 32,
                          }}
                        >
                          {/* Star */}
                          <td style={{ width: STAR_W, padding: "0 8px", textAlign: "center" }}>
                            <Star
                              className={cn(
                                "h-3 w-3 transition-colors",
                                deal.is_starred ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30 hover:text-amber-400"
                              )}
                            />
                          </td>

                          {/* Deal Name */}
                          <td style={{ padding: "5px 10px", width: 230, minWidth: 230 }}>
                            <Link
                              to={`/deals/${deal.id}`}
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: isHovered ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                                textDecoration: "none",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 220,
                              }}
                              title={deal.deal_name}
                            >
                              {deal.deal_name}
                            </Link>
                          </td>

                          {/* Deal ID */}
                          <td style={{ padding: "5px 10px", fontSize: 11, color: "hsl(var(--muted-foreground))", fontFamily: "monospace", width: 80 }}>
                            {deal.deal_id}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "5px 10px", width: 90 }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: 4,
                            }} className={statusCfg.color}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0 }} className={statusCfg.dot} />
                              {deal.status}
                            </span>
                          </td>

                          {/* Market */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--foreground))", width: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                            {deal.properties?.market || <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>—</span>}
                          </td>

                          {/* Units */}
                          <td style={{ padding: "5px 10px", fontSize: 12, textAlign: "right", fontFamily: "monospace", width: 60 }}>
                            {deal.properties?.total_units != null
                              ? deal.properties.total_units
                              : <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}>—</span>}
                          </td>

                          {/* Fund */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--muted-foreground))", width: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {deal.fund || <span style={{ opacity: 0.4 }}>—</span>}
                          </td>

                          {/* Bid Due */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--muted-foreground))", width: 100, whiteSpace: "nowrap" }}>
                            {fmtDate(deal.bid_due_date)}
                          </td>

                          {/* Date Added */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--muted-foreground))", width: 100, whiteSpace: "nowrap" }}>
                            {fmtDate(deal.date_added)}
                          </td>

                          {/* Date Modified */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--muted-foreground))", width: 100, whiteSpace: "nowrap" }}>
                            {fmtDate(deal.date_modified)}
                          </td>

                          {/* Asset Type */}
                          <td style={{ padding: "5px 10px", fontSize: 12, color: "hsl(var(--muted-foreground))", width: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {deal.asset_type || <span style={{ opacity: 0.4 }}>—</span>}
                          </td>

                          {/* Menu */}
                          <td style={{ padding: "0 6px", textAlign: "center", width: MENU_W }}>
                            <button
                              style={{
                                opacity: isHovered ? 1 : 0,
                                transition: "opacity 120ms",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "2px",
                                borderRadius: 4,
                                color: "hsl(var(--muted-foreground))",
                              }}
                              className="hover:bg-muted/50 hover:text-foreground"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Bottom status bar ────────────────────────────────────── */}
          <div className="border-t px-5 py-1.5 flex items-center gap-3 bg-white flex-shrink-0">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} deal{filtered.length !== 1 ? "s" : ""}
              {(filterStatus.length + filterAsset.length) > 0 && ` (filtered from ${deals.length})`}
            </span>
            {(filterStatus.length + filterAsset.length) > 0 && (
              <button
                onClick={() => { setFilterStatus([]); setFilterAsset([]); }}
                className="text-[11px] text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <AddDealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppLayout>
  );
}
