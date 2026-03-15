import { Bell, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Deals", href: "/" },
  { label: "Shared Deals", href: "/shared" },
  { label: "Comps", href: "/comps" },
  { label: "Research", href: "/research" },
];

export function TopNavbar() {
  const location = useLocation();

  return (
    <header className="h-12 border-b flex items-center justify-between px-4 bg-foreground">
      <div className="flex items-center gap-1">
        <span className="font-semibold text-sm tracking-tight text-primary-foreground mr-4 px-2">
          RealDeal
        </span>
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? location.pathname === "/" || location.pathname.startsWith("/deals") : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button className="text-primary-foreground/70 hover:text-primary-foreground">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-success flex items-center justify-center text-success-foreground text-xs font-semibold">
            SM
          </div>
          <span className="text-sm text-primary-foreground/90">Sonali</span>
        </div>
        <button className="text-primary-foreground/70 hover:text-primary-foreground flex items-center gap-1 text-sm">
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
