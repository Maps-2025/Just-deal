import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "All Deals", id: "all" },
  { label: "Pipeline Report", id: "pipeline" },
];

interface DealsPageSidebarProps {
  active: string;
  onSelect: (id: string) => void;
}

export function DealsPageSidebar({ active, onSelect }: DealsPageSidebarProps) {
  return (
    <aside className="w-40 border-r pt-4 px-3 flex-shrink-0">
      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "block w-full text-left px-3 py-1.5 text-sm rounded-sm transition-colors",
              active === item.id
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
