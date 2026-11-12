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
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  useWarehouse,
  useBinCards,
  useInvoices,
  useInvoiceBatches,
  formatMoney,
  type BinCard,
  type WarehouseItem,
  type InvoiceRow,
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
  const m = String(value).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
    return Date.parse(`${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
  }
  return 0;
}

function inThisMonth(value?: string) {
  const t = parseDate(value);
  if (!t) return false;
  const d = new Date(t);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function invoiceWhen(inv: InvoiceRow) {
  return inv.formattedDate || inv.savedAt || inv.printedAt || inv.paidAt || "";
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

type ActivityItem = {
  id: string;
  sort: number;
  date: string;
  href: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  amountClass: string;
  meta: string;
  icon: "invoice" | "receipt" | "issue" | "paid";
};

export default function DashboardPage() {
  const [items] = useWarehouse();
  const [cards] = useBinCards();
  const [invoices] = useInvoices();
  const [batches] = useInvoiceBatches();

  const allInvoices = useMemo(() => {
    const map = new Map<string, InvoiceRow>();
    for (const inv of invoices) map.set(inv.invoiceNo, inv);
    for (const batch of batches) {
      for (const inv of batch.invoices) {
        if (!map.has(inv.invoiceNo)) map.set(inv.invoiceNo, inv);
      }
    }
    return Array.from(map.values());
  }, [invoices, batches]);

  const cardByName = useMemo(() => {
    const map = new Map<string, BinCard>();
    for (const c of cards) map.set(norm(c.itemName), c);
    return map;
  }, [cards]);

  const inventory = useMemo(() => {
    const byName = new Map<string, WarehouseItem>();

    for (const item of items) {
      const card = cardByName.get(norm(item.name));
      byName.set(norm(item.name), {
        ...item,
        quantity: card ? cardBalance(card) : item.quantity,
        unit: card?.unit || item.unit,
        location: card?.location || item.location,
        lastUpdated: card ? lastActivityDate(card) : item.lastUpdated,
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
      });
    }

    return Array.from(byName.values());
  }, [items, cardByName]);

  const monthInvoices = useMemo(
    () => allInvoices.filter((inv) => inThisMonth(invoiceWhen(inv))),
    [allInvoices]
  );

  const monthRevenue = useMemo(
    () => monthInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0),
    [monthInvoices]
  );

  const stats = useMemo(() => {
    const lowStock = inventory.filter((i) => i.minStock > 0 && i.quantity <= i.minStock).length;
    const outOfStock = inventory.filter((i) => i.quantity === 0).length;
    return {
      invoices: allInvoices.length,
      warehouse: inventory.length,
      binCards: cards.length,
      monthRevenue,
      alerts: lowStock + outOfStock,
    };
  }, [allInvoices.length, inventory, cards.length, monthRevenue]);

  const recentActivity = useMemo(() => {
    const rows: ActivityItem[] = [];

    for (const card of cards) {
      card.transactions.forEach((tx, idx) => {
        rows.push({
          id: `tx-${tx.id}`,
          sort: parseDate(tx.date) + idx,
          date: tx.date,
          href: "/bincards",
          title: `${tx.type} · ${card.itemName}`,
          subtitle: [
            tx.reference,
            tx.remarks,
            tx.issuedTo ? `→ ${tx.issuedTo}` : "",
            card.location,
          ].filter(Boolean).join(" · "),
          amountLabel: `${tx.type === "Receipt" ? "+" : "-"}${tx.quantity} ${card.unit}`,
          amountClass: tx.type === "Receipt" ? "text-green-400" : "text-red-400",
          meta: `Bal ${tx.balance}`,
          icon: tx.type === "Receipt" ? "receipt" : "issue",
        });
      });
    }

    for (const inv of allInvoices) {
      const when = invoiceWhen(inv);
      rows.push({
        id: `inv-${inv.invoiceNo}-${inv.savedAt}`,
        sort: parseDate(when) || parseDate(inv.savedAt),
        date: inv.formattedDate || todayish(inv.savedAt),
        href: "/invoicing",
        title: inv.paid ? `Invoice ${inv.invoiceNo} paid` : `Invoice ${inv.invoiceNo}`,
        subtitle: [
          inv.regNo,
          inv.loadedFrom && inv.deliveredTo ? `${inv.loadedFrom} → ${inv.deliveredTo}` : inv.loadedFrom || inv.deliveredTo,
          inv.orderNo ? `Order ${inv.orderNo}` : "",
        ].filter(Boolean).join(" · "),
        amountLabel: `MWK ${formatMoney(Number(inv.total) || 0)}`,
        amountClass: inv.paid ? "text-green-400" : "text-white",
        meta: inv.paid ? "Paid" : inv.printed ? "Printed" : "Saved",
        icon: inv.paid ? "paid" : "invoice",
      });
    }

    rows.sort((a, b) => b.sort - a.sort);
    return rows.slice(0, 14);
  }, [cards, allInvoices]);

  const STATS = [
    {
      title: "Total Invoices",
      value: String(stats.invoices),
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      href: "/invoicing",
    },
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
      title: "This Month",
      value: `MWK ${formatMoney(stats.monthRevenue)}`,
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/statements",
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
              Live invoices, stock and bin card activity at Affordable Wholesale.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.alerts > 0 && (
              <Link href="/warehouse">
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-normal text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  {stats.alerts} stock {stats.alerts === 1 ? "alert" : "alerts"}
                </Badge>
              </Link>
            )}
            <Badge className="bg-zinc-900 text-zinc-400 border-zinc-800 font-normal text-xs">
              <Activity className="w-3 h-3 mr-1.5 text-green-400" />
              System Online
            </Badge>
          </div>
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
                    <p className="text-2xl font-black text-white tracking-tight truncate">
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
            <div className="flex gap-3">
              <Link href="/invoicing" className="text-[11px] text-zinc-500 hover:text-zinc-300">
                Invoices →
              </Link>
              <Link href="/bincards" className="text-[11px] text-zinc-500 hover:text-zinc-300">
                Bin cards →
              </Link>
            </div>
          </div>
          <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
            {recentActivity.length === 0 ? (
              <CardContent className="p-12 text-center">
                <Package className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm">
                  Activity will appear here as you create invoices and record stock movements.
                </p>
              </CardContent>
            ) : (
              <div className="divide-y divide-zinc-900">
                {recentActivity.map((row) => (
                  <Link href={row.href} key={row.id} className="block hover:bg-zinc-900/40 transition-colors">
                    <div className="px-5 py-3.5 flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        row.icon === "receipt" || row.icon === "paid" ? "bg-green-500/10"
                          : row.icon === "issue" ? "bg-red-500/10"
                          : "bg-blue-500/10"
                      )}>
                        {row.icon === "receipt" && <TrendingUp className="w-4 h-4 text-green-400" />}
                        {row.icon === "issue" && <TrendingDown className="w-4 h-4 text-red-400" />}
                        {row.icon === "invoice" && <FileText className="w-4 h-4 text-blue-400" />}
                        {row.icon === "paid" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{row.title}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{row.subtitle || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("font-mono text-sm font-bold", row.amountClass)}>{row.amountLabel}</p>
                        <p className="text-[10px] text-zinc-600">{row.meta} · {row.date}</p>
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

function todayish(iso?: string) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso.slice(0, 10);
  return new Date(t).toLocaleDateString("en-GB");
}