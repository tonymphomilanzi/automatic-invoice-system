// app/page.tsx
"use client";

import { useMemo } from "react";
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
  AlertTriangle,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useWarehouse,
  useBinCards,
  type BinCard,
  type WarehouseItem,
} from "@/lib/store";

function cardBalance(card: BinCard) {
  const txs = card.transactions;
  return txs.length > 0 ? txs[txs.length - 1].balance : card.openingBalance;
}

function lastActivityDate(card: BinCard) {
  if (card.transactions.length > 0) return card.transactions[card.transactions.length - 1].date;
  return card.createdAt?.slice(0, 10) ?? "";
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function parseDate(value?: string) {
  if (!value) return 0;
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return iso;
  const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return Date.parse(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
  return 0;
}

function inThisMonth(value?: string) {
  const t = parseDate(value);
  if (!t) return false;
  const d = new Date(t);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

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
  const [items] = useWarehouse();
  const [cards] = useBinCards();

  const cardByName = useMemo(() => {
    const map = new Map<string, BinCard>();
    for (const c of cards) map.set(norm(c.itemName), c);
    return map;
  }, [cards]);

  const inventory = useMemo(() => {
    const byName = new Map<string, WarehouseItem & { entries: number }>();

    for (const item of items) {
      const card = cardByName.get(norm(item.name));
      byName.set(norm(item.name), {
        ...item,
        quantity: card ? cardBalance(card) : item.quantity,
        unit: card?.unit || item.unit,
        location: card?.location || item.location,
        lastUpdated: card ? lastActivityDate(card) : item.lastUpdated,
        entries: card?.transactions.length ?? 0,
      });
    }

    for (const card of cards) {
      const key = norm(card.itemName);
      if (byName.has(key)) continue;
      byName.set(key, {
        id: card.id,
        name: card.itemName,
        category: "",
        unit: card.unit,
        quantity: cardBalance(card),
        minStock: 0,
        location: card.location,
        lastUpdated: lastActivityDate(card),
        entries: card.transactions.length,
      });
    }

    return Array.from(byName.values());
  }, [items, cardByName]);

  const monthTx = useMemo(
    () => cards.flatMap((c) => c.transactions.filter((t) => inThisMonth(t.date))),
    [cards]
  );

  const stats = useMemo(() => {
    const lowStock = inventory.filter((i) => i.minStock > 0 && i.quantity <= i.minStock).length;
    const outOfStock = inventory.filter((i) => i.quantity === 0).length;
    return {
      warehouse: inventory.length,
      binCards: cards.length,
      movements: monthTx.length,
      alerts: lowStock + outOfStock,
    };
  }, [inventory, cards.length, monthTx.length]);

  const recentActivity = useMemo(() => {
    const rows = cards.flatMap((card) =>
      card.transactions.map((tx, idx) => ({
        id: tx.id,
        date: tx.date,
        sort: parseDate(tx.date) + idx,
        itemName: card.itemName,
        location: card.location,
        unit: card.unit,
        type: tx.type,
        quantity: tx.quantity,
        balance: tx.balance,
        reference: tx.reference,
        remarks: tx.remarks,
        issuedTo: tx.issuedTo,
        href: "/bincards",
      }))
    );

    rows.sort((a, b) => b.sort - a.sort);
    return rows.slice(0, 12);
  }, [cards]);

  const STATS = [
    {
      title: "Warehouse Items",
      value: String(stats.warehouse),
      icon: Warehouse,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      href: "/warehouse",
    },
    {
      title: "Bin Cards",
      value: String(stats.binCards),
      icon: ClipboardList,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/bincards",
    },
    {
      title: "Movements This Month",
      value: String(stats.movements),
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/warehouse",
    },
    {
      title: "Stock Alerts",
      value: String(stats.alerts),
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      href: "/warehouse",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {greeting()} 👋
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Live stock and bin card activity at Affordable Wholesale.
            </p>
          </div>
          <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 font-normal text-xs">
            <Activity className="w-3 h-3 mr-1.5 text-green-400" />
            System Online
          </Badge>
        </div>

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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Recent Activity
            </h3>
            <Link href="/bincards" className="text-[11px] text-zinc-500 hover:text-zinc-300">
              View bin cards →
            </Link>
          </div>
          <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
            {recentActivity.length === 0 ? (
              <CardContent className="p-12 text-center">
                <Package className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm">
                  Activity will appear here as you record receipts and issues.
                </p>
              </CardContent>
            ) : (
              <div className="divide-y divide-zinc-900">
                {recentActivity.map((tx) => (
                  <Link href={tx.href} key={tx.id} className="block hover:bg-zinc-900/40 transition-colors">
                    <div className="px-5 py-3.5 flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        tx.type === "Receipt" ? "bg-green-500/10" : "bg-red-500/10"
                      )}>
                        {tx.type === "Receipt"
                          ? <TrendingUp className="w-4 h-4 text-green-400" />
                          : <TrendingDown className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {tx.type} · {tx.itemName}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {tx.reference}
                          {tx.remarks ? ` · ${tx.remarks}` : ""}
                          {tx.issuedTo ? ` → ${tx.issuedTo}` : ""}
                          {tx.location ? ` · ${tx.location}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "font-mono text-sm font-bold",
                          tx.type === "Receipt" ? "text-green-400" : "text-red-400"
                        )}>
                          {tx.type === "Receipt" ? `+${tx.quantity}` : `-${tx.quantity}`}
                          <span className="text-zinc-600 text-[10px] font-medium ml-1">{tx.unit}</span>
                        </p>
                        <p className="text-[10px] text-zinc-600">
                          Bal {tx.balance} · {tx.date}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}