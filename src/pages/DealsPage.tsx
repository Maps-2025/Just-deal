import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Filter, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { DealsPageSidebar } from "@/components/deals/DealsPageSidebar";
import { DealsTable } from "@/components/deals/DealsTable";
import { AddDealModal } from "@/components/deals/AddDealModal";
import { mockDeals } from "@/data/mockDeals";

export default function DealsPage() {
  const [search, setSearch] = useState("");
  const [sidebarActive, setSidebarActive] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredDeals = useMemo(() => {
    if (!search) return mockDeals;
    const q = search.toLowerCase();
    return mockDeals.filter(
      (d) => d.name.toLowerCase().includes(q) || d.dealId.includes(q)
    );
  }, [search]);

  return (
    <AppLayout>
      <DealsPageSidebar active={sidebarActive} onSelect={setSidebarActive} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-tight">All Deals</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <Input
                placeholder="Search by Deal Name or Id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              Export
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
              New Deal
            </Button>
          </div>
        </div>

        {/* Table */}
        <DealsTable deals={filteredDeals} />
      </div>

      <AddDealModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppLayout>
  );
}
