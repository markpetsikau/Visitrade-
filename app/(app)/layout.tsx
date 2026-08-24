import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { CommandPalette } from "@/components/app/CommandPalette";
import { LivePricesProvider } from "@/components/app/LivePrices";
import { AlertsWatcher } from "@/components/app/AlertsWatcher";
import { Toaster } from "@/components/app/notifications";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LivePricesProvider>
      <div className="min-h-screen bg-base">
        <Sidebar />
        <div className="lg:pl-60">
          <Topbar />
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
            {children}
          </div>
        </div>
        <CommandPalette />
        <AlertsWatcher />
        <Toaster />
      </div>
    </LivePricesProvider>
  );
}
