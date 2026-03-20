import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview" },
  {
    id: "rent-roll",
    label: "Rent Roll",
    subItems: [
      { id: "rent-roll-dashboard", label: "Rent Roll Dashboard" },
      { id: "rent-roll-floorplan", label: "Floor Plan Summary" },
      { id: "rent-roll-table",     label: "Rent Roll" },
      { id: "rent-roll-comps",     label: "Rent Roll Comps" },
      { id: "rent-roll-manage",    label: "Manage Rent Rolls" },
    ],
  },
  {
    id: "operating-statement",
    label: "Operating Statement",
    subItems: [
      { id: "os-summary",      label: "Summary" },
      { id: "os-cash-flows",   label: "Cash Flows" },
      { id: "os-revenue",      label: "Revenue Analysis" },
      { id: "os-adjustments",  label: "Adjustments" },
      { id: "os-comps",        label: "Operating Statement Comps" },
      { id: "os-market-comp",  label: "Market Comp Data (Beta)" },
      { id: "os-source-data",  label: "Source Data" },
      { id: "os-manage",       label: "Manage Operating Statement" },
    ],
  },
  { id: "firstpass", label: "FirstPass" },
  { id: "sharing",   label: "Sharing" },
];

interface DealTabsProps {
  active: string;
  onSelect: (id: string) => void;
}

export function DealTabs({ active, onSelect }: DealTabsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isRentRollActive = active.startsWith("rent-roll");
  const isOsActive       = active.startsWith("os-");

  return (
    <div className="border-b px-4 bg-white flex-shrink-0" ref={containerRef}>
      <nav className="flex -mb-px">
        {tabs.map((tab) => {
          const isActive = tab.subItems
            ? tab.id === "rent-roll"
              ? isRentRollActive
              : tab.id === "operating-statement"
              ? isOsActive
              : false
            : active === tab.id;

          return (
            <div key={tab.id} className="relative">
              <button
                onClick={() => {
                  if (tab.subItems) {
                    setOpenDropdown(openDropdown === tab.id ? null : tab.id);
                  } else {
                    onSelect(tab.id);
                    setOpenDropdown(null);
                  }
                }}
                className={cn(
                  "px-3.5 py-2 text-[12px] font-medium border-b-2 transition-colors flex items-center gap-0.5 whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {tab.label}
                {tab.subItems && <ChevronDown className="h-2.5 w-2.5 ml-0.5" />}
              </button>

              {tab.subItems && openDropdown === tab.id && (
                <div className="absolute left-0 top-full z-50 mt-px min-w-[190px] bg-white border rounded-md shadow-lg py-1">
                  {tab.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { onSelect(sub.id); setOpenDropdown(null); }}
                      className={cn(
                        "block w-full text-left px-3.5 py-1.5 text-[12px] transition-colors",
                        active === sub.id
                          ? "text-primary font-medium bg-muted/40"
                          : "text-foreground hover:bg-muted/40",
                      )}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
