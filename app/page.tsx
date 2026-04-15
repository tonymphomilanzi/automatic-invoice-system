// app/page.tsx
import AppShell from "@/components/layout/AppShell";
import {
  FileText,
  Warehouse,
  ClipboardList,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ── Stat Cards ────────────────────────────────────────────────────────────────
const STATS = [
  {
    title: "Total Invoices",
    value: "—",
    change: null,
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    href: "/invoicing",
  },
  {
    title: "Warehouse Items",
    value: "—",
    change: null,
    icon: Warehouse,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    href: "/warehouse",
  },
  {
    title: "Bin Cards",
    value: "—",
    change: null,
    icon: ClipboardList,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    href: "/bincards",
  },
  {
    title: "This Month",
    value: "MWK —",
    change: null,
    icon: BarChart3,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    href: "/statements",
  },
];

// ── Quick Links ───────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  {
    title: "Create Invoices",
    description: "Import manifest and generate logistics invoices",
    href: "/invoicing",
    icon: FileText,
    color: "from-blue-600 to-blue-800",
  },
  {
    title: "Warehouse Stock",
    description: "Manage inventory levels and stock movements",
    href: "/warehouse",
    icon: Warehouse,
    color: "from-violet-600 to-violet-800",
  },
  {
    title: "Digital Bin Cards",
    description: "Record stock transactions, receipts and issues",
    href: "/bincards",
    icon: ClipboardList,
    color: "from-emerald-600 to-emerald-800",
  },
  {
    title: "Generate Statement",
    description: "Monthly, quarterly, or yearly financial summaries",
    href: "/statements",
    icon: BarChart3,
    color: "from-amber-600 to-amber-800",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* ── Welcome ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Good morning 👋
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Here's what's happening at Affordable Wholesale today.
            </p>
          </div>
          <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 font-normal text-xs">
            <Activity className="w-3 h-3 mr-1.5 text-green-400" />
            System Online
          </Badge>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link href={stat.href} key={stat.title}>
                <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-colors cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wider">
                      {stat.title}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ── Quick Access ── */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Quick Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link href={link.href} key={link.title}>
                  <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all duration-200 cursor-pointer group overflow-hidden">
                    <CardContent className="p-5">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="font-bold text-white text-sm mb-1">
                        {link.title}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {link.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Recent Activity Placeholder ── */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Recent Activity
          </h3>
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-12 text-center">
              <Activity className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 text-sm">
                Activity will appear here as you use the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}