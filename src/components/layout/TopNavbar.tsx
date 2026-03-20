import { Bell, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Deals",        href: "/" },
  { label: "Shared Deals", href: "/shared" },
  { label: "Comps",        href: "/comps" },
  { label: "Research",     href: "/research" },
];

export function TopNavbar() {
  const location = useLocation();

  return (
    <header className="h-10 border-b flex items-center justify-between px-4 bg-[hsl(222,47%,11%)] flex-shrink-0">
      <div className="flex items-center gap-0.5">
        <span className="font-semibold text-[13px] tracking-tight text-white mr-3 px-1">
          RealDeal
        </span>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/deals")
              : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "px-2.5 py-1 text-[12px] rounded transition-colors",
                isActive
                  ? "bg-primary text-white font-medium"
                  : "text-white/65 hover:text-white hover:bg-white/10",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <button className="text-white/60 hover:text-white transition-colors">
          <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-success flex items-center justify-center text-white text-[10px] font-bold">
            SM
          </div>
          <span className="text-[12px] text-white/80">Sonali</span>
        </div>
        <button className="text-white/60 hover:text-white flex items-center gap-1 text-[12px] transition-colors">
          <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
