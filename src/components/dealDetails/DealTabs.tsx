import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "rent-roll", label: "Rent Roll" },
  { id: "operating-statement", label: "Operating Statement" },
  { id: "firstpass", label: "FirstPass" },
  { id: "sharing", label: "Sharing" },
];

interface DealTabsProps {
  active: string;
  onSelect: (id: string) => void;
}

export function DealTabs({ active, onSelect }: DealTabsProps) {
  return (
    <div className="border-b px-6">
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              active === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
