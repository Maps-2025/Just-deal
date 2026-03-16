import { Download } from "lucide-react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={`bg-background border rounded-xl shadow-sm p-5 ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <button className="text-primary hover:text-primary/80 transition-colors">
          <Download className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  );
}
