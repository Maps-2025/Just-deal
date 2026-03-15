import { TopNavbar } from "./TopNavbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar />
      <div className="flex-1 flex">
        {children}
      </div>
    </div>
  );
}
