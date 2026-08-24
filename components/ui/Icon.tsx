import {
  LayoutDashboard,
  CandlestickChart,
  Radar,
  Star,
  Sparkles,
  GitBranch,
  Wallet,
  NotebookPen,
  Bell,
  Settings,
  BarChart3,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  LayoutDashboard,
  CandlestickChart,
  Radar,
  Star,
  Sparkles,
  GitBranch,
  Wallet,
  NotebookPen,
  Bell,
  Settings,
  BarChart3,
  MessageSquare,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp className={className} />;
}
