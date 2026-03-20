import { Search, Plus, Filter, SlidersHorizontal } from "lucide-react";

interface DealsPageSidebarProps {
  onAddDeal?: () => void;
}

export function DealsPageSidebar({ onAddDeal }: DealsPageSidebarProps) {
  return (
    <div className="w-[190px] flex-shrink-0 border-r bg-[#fafafa] flex flex-col">
      {/* Add deal button */}
      <div className="p-3 border-b">
        <button
          onClick={onAddDeal}
          className="w-full h-7 flex items-center justify-center gap-1.5 rounded text-[12px] font-medium
                     bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Deal
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            placeholder="Search deals…"
            className="w-full h-7 pl-7 pr-2 text-[12px] border rounded bg-white
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 space-y-3 flex-1 overflow-y-auto pb-4">
        <div>
          <p className="section-label mb-1.5">Status</p>
          {["Active", "Pipeline", "Closed", "Dead"].map(s => (
            <label key={s} className="flex items-center gap-2 py-0.5 cursor-pointer group">
              <input type="checkbox" defaultChecked={s === "Active"}
                className="h-3 w-3 rounded border accent-primary" />
              <span className="text-[12px] text-foreground group-hover:text-primary transition-colors">{s}</span>
            </label>
          ))}
        </div>

        <div>
          <p className="section-label mb-1.5">Asset Type</p>
          {["Multifamily", "Office", "Retail", "Industrial"].map(a => (
            <label key={a} className="flex items-center gap-2 py-0.5 cursor-pointer group">
              <input type="checkbox"
                className="h-3 w-3 rounded border accent-primary" />
              <span className="text-[12px] text-foreground group-hover:text-primary transition-colors">{a}</span>
            </label>
          ))}
        </div>

        <div>
          <p className="section-label mb-1.5">Fund</p>
          <input placeholder="Filter by fund…"
            className="w-full h-6 px-2 text-[11px] border rounded bg-white
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
        </div>

        <div>
          <p className="section-label mb-1.5">Bid Due Date</p>
          <input type="date"
            className="w-full h-6 px-2 text-[11px] border rounded bg-white
                       focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
        </div>

        <div>
          <p className="section-label mb-1.5">Sort By</p>
          <select className="w-full h-7 px-2 text-[12px] border rounded bg-white
                             focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
            <option>Date Added</option>
            <option>Deal Name</option>
            <option>Bid Due Date</option>
            <option>Units</option>
          </select>
        </div>
      </div>
    </div>
  );
}
