import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const NAVIGATION_ITEMS = [
  {
    label: "📊 Dashboard",
    path: "/",
    icon: "📊",
  },
  {
    label: "💼 Mon Portefeuille",
    path: "/portfolio",
    icon: "💼",
  },
  {
    label: "🔔 Alertes",
    path: "/alerts",
    icon: "🔔",
  },
  {
    label: "📈 Historique",
    path: "/performance",
    icon: "📈",
  },
  {
    label: "🏆 Top Cryptos",
    path: "/top-cryptos",
    icon: "🏆",
  },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  ₿
                </span>
              </div>
              <span className="font-bold text-lg text-sidebar-foreground hidden sm:inline">
                Crypto
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-sidebar-foreground hover:text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">
                  {item.label.split(" ").slice(1).join(" ")}
                </span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60">
              © 2024 Crypto Tracker
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="md:hidden border-b border-border bg-card">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-foreground hover:text-primary"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              Crypto Tracker
            </h1>
            <div className="w-6" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
