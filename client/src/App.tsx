import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import AppSidebar from "@/components/AppSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import DepartmentAnalysis from "@/pages/DepartmentAnalysis";
import AccountAnalysis from "@/pages/AccountAnalysis";
import DetailsPage from "@/pages/DetailsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettlementEntryPage from "@/pages/SettlementEntryPage";
import SettingsPage from "@/pages/SettingsPage";
import { VIEW_TITLES, type ViewType } from "@/lib/constants";
import { useFilterState } from "@/hooks/useFilterState";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const { filters, updateFilters, resetFilters } = useFilterState();

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    updateFilters(newFilters);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard filters={filters} />;
      case "department":
        return <DepartmentAnalysis filters={filters} />;
      case "account":
        return <AccountAnalysis filters={filters} />;
      case "details":
        return <DetailsPage filters={filters} />;
      case "reports":
        return <ReportsPage filters={filters} />;
      case "settlement":
        return <SettlementEntryPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard filters={filters} />;
    }
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full overflow-hidden bg-background">
                <AppSidebar 
                  currentView={currentView}
                  onViewChange={setCurrentView}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={resetFilters}
                  initialFilters={filters}
                />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <SidebarTrigger className="min-h-[44px] min-w-[44px]" />
                      <h2 className="text-lg font-semibold text-foreground hidden sm:block">{VIEW_TITLES[currentView]}</h2>
                    </div>
                    <ThemeToggle />
                  </header>
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <ErrorBoundary>
                      {renderCurrentView()}
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
