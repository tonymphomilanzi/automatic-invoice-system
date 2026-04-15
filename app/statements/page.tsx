// app/statements/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Download, Printer, TrendingUp,
  Calendar, FileText, DollarSign,
} from "lucide-react";

// ── Types & Config ─────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const VAT_RATE = 0.175;

const formatMoney = (v: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

// Demo summary data — in production this would come from your invoice store / DB
const MONTHLY_DATA = [
  { month: "January", invoices: 8, subtotal: 1_240_000, vat: 217_000, total: 1_457_000 },
  { month: "February", invoices: 11, subtotal: 1_680_000, vat: 294_000, total: 1_974_000 },
  { month: "March", invoices: 9, subtotal: 1_410_000, vat: 246_750, total: 1_656_750 },
  { month: "April", invoices: 14, subtotal: 2_100_000, vat: 367_500, total: 2_467_500 },
  { month: "May", invoices: 12, subtotal: 1_870_000, vat: 327_250, total: 2_197_250 },
  { month: "June", invoices: 10, subtotal: 1_550_000, vat: 271_250, total: 1_821_250 },
];

const QUARTERS = [
  { label: "Q1 (Jan–Mar)", months: [0, 1, 2] },
  { label: "Q2 (Apr–Jun)", months: [3, 4, 5] },
  { label: "Q3 (Jul–Sep)", months: [6, 7, 8] },
  { label: "Q4 (Oct–Dec)", months: [9, 10, 11] },
];

type Period = "monthly" | "quarterly" | "yearly";

export default function StatementsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [selectedQuarter, setSelectedQuarter] = useState("Q2 (Apr–Jun)");

  // Compute statement data based on period
  const statementData = useMemo(() => {
    if (period === "monthly") {
      const row = MONTHLY_DATA.find((m) => m.month === selectedMonth);
      return row ? [row] : [];
    }
    if (period === "quarterly") {
      const q = QUARTERS.find((q) => q.label === selectedQuarter);
      if (!q) return [];
      return MONTHLY_DATA.filter((_, i) => q.months.includes(i));
    }
    return MONTHLY_DATA; // yearly = all
  }, [period, selectedMonth, selectedQuarter]);

  const totals = useMemo(() =>
    statementData.reduce(
      (a, r) => ({
        invoices: a.invoices + r.invoices,
        subtotal: a.subtotal + r.subtotal,
        vat: a.vat + r.vat,
        total: a.total + r.total,
      }),
      { invoices: 0, subtotal: 0, vat: 0, total: 0 }
    ), [statementData]);

  const printStatement = () => {
    const rows = statementData.map((r) => `
      <tr>
        <td>${r.month}</td>
        <td class="right">${r.invoices}</td>
        <td class="right">${formatMoney(r.subtotal)}</td>
        <td class="right">${formatMoney(r.vat)}</td>
        <td class="right"><strong>${formatMoney(r.total)}</strong></td>
      </tr>`).join("");

    const periodLabel =
      period === "monthly" ? selectedMonth :
      period === "quarterly" ? selectedQuarter :
      `Full Year ${CURRENT_YEAR}`;

    const html = `
      <!DOCTYPE html><html><head><title>Statement — ${periodLabel}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; font-size: 12px; color: #111; }
        h1 { font-size: 20px; font-weight: 900; color: #1e3a5f; }
        .sub { font-size: 11px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: white; padding: 8px 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 7px 10px; }
        .right { text-align: right; }
        .total-row td { background: #f0f4f8; font-weight: bold; border-top: 2px solid #1e3a5f; }
        .footer { margin-top: 20px; font-size: 10px; color: #888; }
        @media print { @page { size: A4 portrait; } }
      </style></head><body>
      <h1>AFFORDABLE WHOLESALE & TRANSPORT</h1>
      <p class="sub">Statement of Invoices — ${periodLabel} ${CURRENT_YEAR}</p>
      <table>
        <thead><tr><th>Period</th><th class="right">Invoices</th><th class="right">Subtotal (MWK)</th><th class="right">VAT (MWK)</th><th class="right">Total (MWK)</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td><strong>TOTAL</strong></td>
            <td class="right">${totals.invoices}</td>
            <td class="right">${formatMoney(totals.subtotal)}</td>
            <td class="right">${formatMoney(totals.vat)}</td>
            <td class="right">${formatMoney(totals.total)}</td>
          </tr>
        </tbody>
      </table>
      <p class="footer">Generated on ${new Date().toLocaleDateString("en-GB")} — Affordable Wholesale & Transport</p>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
      </body></html>`;

    const w = window.open("", "_blank", "width=900,height=650");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Financial <span className="text-zinc-600">Statements</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Generate monthly, quarterly or yearly summaries</p>
          </div>
          <Button onClick={printStatement} variant="outline" className="border-zinc-800 bg-transparent hover:bg-zinc-900 h-10">
            <Printer className="w-4 h-4 mr-2" /> Print Statement
          </Button>
        </div>

        {/* Period Selector */}
        <Card className="bg-zinc-950 border-zinc-900">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Statement Period</p>
                <div className="flex gap-1">
                  {(["monthly", "quarterly", "yearly"] as Period[]).map((p) => (
                    <Button
                      key={p}
                      size="sm"
                      variant={period === p ? "default" : "outline"}
                      className={period === p
                        ? "bg-blue-600 hover:bg-blue-500 h-9 capitalize"
                        : "border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9 capitalize"}
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              {period === "monthly" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Month</p>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-40 h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {MONTHLY_DATA.map((m) => (
                        <SelectItem key={m.month} value={m.month} className="text-zinc-300 focus:bg-zinc-900">{m.month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {period === "quarterly" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Quarter</p>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger className="w-48 h-9 bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {QUARTERS.map((q) => (
                        <SelectItem key={q.label} value={q.label} className="text-zinc-300 focus:bg-zinc-900">{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-normal mb-0.5">
                <Calendar className="w-3 h-3 mr-1.5" />
                Year {CURRENT_YEAR}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Summary Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Invoices Issued", value: totals.invoices.toString(), icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Subtotal", value: `MWK ${formatMoney(totals.subtotal)}`, icon: DollarSign, color: "text-zinc-400", bg: "bg-zinc-800" },
            { label: "VAT Collected", value: `MWK ${formatMoney(totals.vat)}`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Grand Total", value: `MWK ${formatMoney(totals.total)}`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10", highlight: true },
          ].map((s) => (
            <Card key={s.label} className={`bg-zinc-950 border-zinc-900 ${s.highlight ? "ring-1 ring-emerald-500/30" : ""}`}>
              <CardContent className="p-5">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-lg font-black text-white font-mono leading-tight">{s.value}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Table */}
        <div className="rounded-xl border border-zinc-900 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-900 hover:bg-transparent">
                {["Period", "Invoices", "Subtotal (MWK)", "VAT (MWK)", "Total (MWK)"].map((h) => (
                  <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statementData.map((row) => (
                <TableRow key={row.month} className="border-zinc-900 hover:bg-zinc-900/40">
                  <TableCell className="font-medium text-white">{row.month}</TableCell>
                  <TableCell>
                    <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono">{row.invoices}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300">{formatMoney(row.subtotal)}</TableCell>
                  <TableCell className="font-mono text-amber-400/80">{formatMoney(row.vat)}</TableCell>
                  <TableCell className="font-mono font-black text-white">{formatMoney(row.total)}</TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="border-zinc-900 bg-zinc-900/60 border-t border-zinc-800">
                <TableCell className="font-black text-white uppercase text-xs tracking-wider">Total</TableCell>
                <TableCell>
                  <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 font-mono">{totals.invoices}</Badge>
                </TableCell>
                <TableCell className="font-mono font-bold text-zinc-200">{formatMoney(totals.subtotal)}</TableCell>
                <TableCell className="font-mono font-bold text-amber-400">{formatMoney(totals.vat)}</TableCell>
                <TableCell className="font-mono font-black text-emerald-400 text-base">{formatMoney(totals.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <p className="text-[11px] text-zinc-700 text-right">
          * Statement data is aggregated from processed invoices. {CURRENT_YEAR}.
        </p>
      </div>
    </AppShell>
  );
}