// app/statements/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3, Printer, FileText, DollarSign,
  TrendingUp, Calendar, CheckCircle2, Clock,
  Package2, FileDown, AlertCircle, Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceBatches, formatMoney } from "@/lib/store";
import type { InvoiceRow, InvoiceBatch } from "@/lib/store";

// ── Constants ─────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const QUARTERS = [
  { label: "Q1 (Jan–Mar)", months: [0, 1, 2] },
  { label: "Q2 (Apr–Jun)", months: [3, 4, 5] },
  { label: "Q3 (Jul–Sep)", months: [6, 7, 8] },
  { label: "Q4 (Oct–Dec)", months: [9, 10, 11] },
];

type Period = "monthly" | "quarterly" | "yearly" | "batch";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "N/A") return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
  }
  return null;
}

interface InvoiceTotals {
  count: number;
  amount: number;
  vat: number;
  total: number;
  paid: number;
  unpaid: number;
  paidAmount: number;
  unpaidAmount: number;
}

function calcTotals(invoices: InvoiceRow[]): InvoiceTotals {
  return {
    count: invoices.length,
    amount: invoices.reduce((a, i) => a + i.amount, 0),
    vat: invoices.reduce((a, i) => a + i.vat, 0),
    total: invoices.reduce((a, i) => a + i.total, 0),
    paid: invoices.filter((i) => i.paid).length,
    unpaid: invoices.filter((i) => !i.paid).length,
    paidAmount: invoices
      .filter((i) => i.paid)
      .reduce((a, i) => a + i.total, 0),
    unpaidAmount: invoices
      .filter((i) => !i.paid)
      .reduce((a, i) => a + i.total, 0),
  };
}

// ── Print HTML builder ────────────────────────────────────────────────────────
function buildPrintHTML(
  invoices: InvoiceRow[],
  periodLabel: string,
  totals: InvoiceTotals,
  showBatchColumn = false,
  batchMap?: Map<string, string>
): string {
  const rows = invoices
    .map(
      (inv) => `
    <tr>
      <td>${inv.invoiceNo}</td>
      <td>${inv.formattedDate}</td>
      <td>${inv.formattedDespatchDate}</td>
      <td>${inv.regNo}</td>
      <td>${inv.loadedFrom} → ${inv.deliveredTo}</td>
      <td>${inv.atl}</td>
      <td>${inv.orderNo}</td>
      <td class="right">${inv.tons}</td>
      <td class="right">${formatMoney(inv.rate)}</td>
      <td class="right">${formatMoney(inv.amount)}</td>
      <td class="right">${formatMoney(inv.vat)}</td>
      <td class="right"><strong>${formatMoney(inv.total)}</strong></td>
      <td style="color:${inv.paid ? "#16a34a" : "#d97706"};font-weight:600">
        ${inv.paid
          ? `Paid${inv.paidAt ? "<br><span style='font-size:9px;color:#555'>" + inv.paidAt + "</span>" : ""}`
          : "Unpaid"}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<title>Statement — ${periodLabel} ${CURRENT_YEAR}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;font-size:10px;color:#111}
  .header{text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:12px;margin-bottom:14px}
  .company{font-size:17px;font-weight:900;color:#1e3a5f;letter-spacing:.5px}
  .sub{font-size:9px;color:#555;margin-top:2px}
  .title{font-size:13px;font-weight:700;margin-top:5px;letter-spacing:1px}
  .summary{display:flex;gap:12px;background:#f0f4f8;padding:10px 12px;border-radius:5px;margin-bottom:14px}
  .s-item{flex:1;text-align:center}
  .s-val{font-size:13px;font-weight:900;color:#1e3a5f}
  .s-lbl{font-size:8px;color:#666;text-transform:uppercase;letter-spacing:.4px;margin-top:1px}
  .s-paid .s-val{color:#16a34a}
  .s-unpaid .s-val{color:#d97706}
  table{width:100%;border-collapse:collapse;font-size:9px}
  th{background:#1e3a5f;color:#fff;padding:6px 4px;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}
  td{border:1px solid #e2e8f0;padding:5px 4px;vertical-align:top}
  tr:nth-child(even) td{background:#f8fafc}
  .right{text-align:right}
  .total-row td{background:#1e3a5f !important;color:#fff;font-weight:700;font-size:10px}
  .footer{margin-top:14px;text-align:center;font-size:8px;color:#888;border-top:1px solid #eee;padding-top:8px}
  @media print{
    @page{size:landscape;margin:6mm}
    body{padding:0}
  }
</style>
</head>
<body>
<div class="header">
  <div class="company">AFFORDABLE WHOLESALE &amp; TRANSPORT</div>
  <div class="sub">Po Box 17, Mangochi &nbsp;|&nbsp; +265 993 384 770 / +265 888 244 455 &nbsp;|&nbsp; affordablewholesalers@gmail.com</div>
  <div class="title">STATEMENT OF INVOICES — ${periodLabel.toUpperCase()} ${CURRENT_YEAR}</div>
</div>

<div class="summary">
  <div class="s-item">
    <div class="s-val">${totals.count}</div>
    <div class="s-lbl">Total Invoices</div>
  </div>
  <div class="s-item">
    <div class="s-val">MWK ${formatMoney(totals.amount)}</div>
    <div class="s-lbl">Subtotal</div>
  </div>
  <div class="s-item">
    <div class="s-val">MWK ${formatMoney(totals.vat)}</div>
    <div class="s-lbl">VAT (17.5%)</div>
  </div>
  <div class="s-item">
    <div class="s-val">MWK ${formatMoney(totals.total)}</div>
    <div class="s-lbl">Grand Total</div>
  </div>
  <div class="s-item s-paid">
    <div class="s-val">${totals.paid}</div>
    <div class="s-lbl">Paid (MWK ${formatMoney(totals.paidAmount)})</div>
  </div>
  <div class="s-item s-unpaid">
    <div class="s-val">${totals.unpaid}</div>
    <div class="s-lbl">Unpaid (MWK ${formatMoney(totals.unpaidAmount)})</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Invoice No</th>
      <th>Date</th>
      <th>Despatch</th>
      <th>Reg No</th>
      <th>Route</th>
      <th>ATL</th>
      <th>Order No</th>
      <th class="right">Tons</th>
      <th class="right">Rate</th>
      <th class="right">Amount</th>
      <th class="right">VAT</th>
      <th class="right">Total</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="9" class="right">TOTALS:</td>
      <td class="right">${formatMoney(totals.amount)}</td>
      <td class="right">${formatMoney(totals.vat)}</td>
      <td class="right">${formatMoney(totals.total)}</td>
      <td>${totals.paid} paid / ${totals.unpaid} unpaid</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  Generated on ${new Date().toLocaleDateString("en-GB")} &nbsp;|&nbsp;
  Affordable Wholesale &amp; Transport &nbsp;|&nbsp;
  ${totals.count} invoice(s) in this statement
</div>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
<\/script>
</body>
</html>`;
}

function printStatement(
  invoices: InvoiceRow[],
  periodLabel: string,
  totals: InvoiceTotals
) {
  if (invoices.length === 0) return;
  const w = window.open("", "_blank", "width=1300,height=800");
  if (!w) return;
  w.document.write(buildPrintHTML(invoices, periodLabel, totals));
  w.document.close();
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, sub, color = "text-white", bg = "bg-zinc-800",
  icon: Icon, highlight = false,
}: {
  label: string; value: string; sub?: string;
  color?: string; bg?: string;
  icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <Card className={cn(
      "bg-zinc-950 border-zinc-900",
      highlight && "ring-1 ring-emerald-500/30"
    )}>
      <CardContent className="p-5">
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <p className={`text-lg font-black font-mono leading-tight ${color}`}>
          {value}
        </p>
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">
          {label}
        </p>
        {sub && (
          <p className="text-[10px] text-zinc-700 mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceListTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-900 p-12 text-center text-zinc-700">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No invoices for this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-900 hover:bg-transparent">
            {[
              "Invoice No", "Date", "Despatch", "Reg No",
              "Route", "ATL", "Order No", "Tons",
              "Rate", "Amount", "VAT", "Total", "Status",
            ].map((h) => (
              <TableHead
                key={h}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow
              key={inv.invoiceNo}
              className={cn(
                "border-zinc-900 hover:bg-zinc-900/40",
                inv.paid && "bg-green-500/[0.03]"
              )}
            >
              <TableCell className="font-mono text-xs font-bold text-blue-400">
                {inv.invoiceNo}
              </TableCell>
              <TableCell className="text-xs text-zinc-400 whitespace-nowrap">
                {inv.formattedDate}
              </TableCell>
              <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                {inv.formattedDespatchDate}
              </TableCell>
              <TableCell>
                <Badge className="font-mono text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
                  {inv.regNo || "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-zinc-400 max-w-[160px]">
                <div className="truncate">{inv.loadedFrom}</div>
                <div className="text-[10px] text-zinc-600 truncate">
                  → {inv.deliveredTo}
                </div>
              </TableCell>
              <TableCell className="text-xs text-zinc-500">
                {inv.atl}
              </TableCell>
              <TableCell className="text-xs text-zinc-500">
                {inv.orderNo}
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-300 text-right">
                {inv.tons}t
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-500 text-right">
                {formatMoney(inv.rate)}
              </TableCell>
              <TableCell className="font-mono text-xs text-zinc-300 text-right">
                {formatMoney(inv.amount)}
              </TableCell>
              <TableCell className="font-mono text-xs text-amber-400/70 text-right">
                {formatMoney(inv.vat)}
              </TableCell>
              <TableCell className="font-mono font-bold text-white text-right">
                {formatMoney(inv.total)}
              </TableCell>
              <TableCell>
                {inv.paid ? (
                  <div>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
                    </Badge>
                    {inv.paidAt && (
                      <div className="text-[9px] text-zinc-600 mt-0.5">
                        {inv.paidAt}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5 mr-1" /> Unpaid
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Totals row */}
          <TableRow className="bg-zinc-900/80 border-t-2 border-zinc-800">
            <TableCell
              colSpan={9}
              className="text-right text-xs font-black text-white uppercase tracking-wider"
            >
              Totals
            </TableCell>
            <TableCell className="font-mono font-bold text-zinc-200 text-right">
              {formatMoney(invoices.reduce((a, i) => a + i.amount, 0))}
            </TableCell>
            <TableCell className="font-mono font-bold text-amber-400 text-right">
              {formatMoney(invoices.reduce((a, i) => a + i.vat, 0))}
            </TableCell>
            <TableCell className="font-mono font-black text-emerald-400 text-right text-base">
              {formatMoney(invoices.reduce((a, i) => a + i.total, 0))}
            </TableCell>
            <TableCell className="text-xs text-zinc-500">
              {invoices.filter((i) => i.paid).length} paid /{" "}
              {invoices.filter((i) => !i.paid).length} unpaid
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// ── Storage size utility ──────────────────────────────────────────────────────
function useStorageInfo() {
  const used = useMemo(() => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += (localStorage[key].length + key.length) * 2; // UTF-16
        }
      }
      return total;
    } catch {
      return 0;
    }
  }, []);

  const usedKB = (used / 1024).toFixed(1);
  const usedMB = (used / 1024 / 1024).toFixed(2);
  const limitMB = 5;
  const percentUsed = Math.min(
    ((used / 1024 / 1024) / limitMB) * 100,
    100
  ).toFixed(1);

  return { usedKB, usedMB, percentUsed, limitMB };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StatementsPage() {
  const [batches] = useInvoiceBatches();

  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(
    MONTHS[new Date().getMonth()]
  );
  const [selectedQuarter, setSelectedQuarter] = useState(
    QUARTERS[Math.floor(new Date().getMonth() / 3)].label
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const storage = useStorageInfo();

  // ── All invoices flat from batches ──
  const allInvoices = useMemo(
    () => batches.flatMap((b) => b.invoices),
    [batches]
  );

  // ── Filter invoices by selected period ──
  const periodInvoices = useMemo(() => {
    if (period === "batch") {
      const batch = batches.find((b) => b.id === selectedBatchId);
      return batch ? batch.invoices : [];
    }

    return allInvoices.filter((inv) => {
      const d = parseInvoiceDate(inv.formattedDate);
      if (!d) return false;
      if (d.getFullYear() !== CURRENT_YEAR) return false;

      if (period === "monthly") {
        return MONTHS[d.getMonth()] === selectedMonth;
      }
      if (period === "quarterly") {
        const q = QUARTERS.find((q) => q.label === selectedQuarter);
        return q ? q.months.includes(d.getMonth()) : false;
      }
      return true; // yearly
    });
  }, [allInvoices, batches, period, selectedMonth, selectedQuarter, selectedBatchId]);

  const totals = useMemo(() => calcTotals(periodInvoices), [periodInvoices]);

  // ── Yearly breakdown by month ──
  const monthlyBreakdown = useMemo(() => {
    if (period !== "yearly") return [];
    return MONTHS.map((month, idx) => {
      const rows = allInvoices.filter((inv) => {
        const d = parseInvoiceDate(inv.formattedDate);
        return (
          d &&
          d.getFullYear() === CURRENT_YEAR &&
          d.getMonth() === idx
        );
      });
      return { month, ...calcTotals(rows) };
    }).filter((m) => m.count > 0);
  }, [allInvoices, period]);

  // ── Batch breakdown ──
  const batchBreakdown = useMemo(() => {
    return [...batches]
      .sort(
        (a, b) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      )
      .map((batch) => ({
        batch,
        ...calcTotals(batch.invoices),
      }));
  }, [batches]);

  const periodLabel =
    period === "monthly"
      ? selectedMonth
      : period === "quarterly"
      ? selectedQuarter
      : period === "batch"
      ? batches.find((b) => b.id === selectedBatchId)?.name ?? "Batch"
      : `Full Year ${CURRENT_YEAR}`;

  const handlePrint = () =>
    printStatement(periodInvoices, periodLabel, totals);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Heading ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Financial <span className="text-zinc-600">Statements</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Live data from {batches.length} saved batch
              {batches.length !== 1 ? "es" : ""} ·{" "}
              {allInvoices.length} total invoices
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              disabled={periodInvoices.length === 0}
              className="bg-blue-600 hover:bg-blue-500 h-10 disabled:opacity-40"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Statement
            </Button>
          </div>
        </div>

        {/* ── Storage Warning Banner ── */}
        <StorageBanner {...storage} />

        {/* ── Period Selector ── */}
        <Card className="bg-zinc-950 border-zinc-900">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Period type buttons */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Statement Type
                </p>
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      { value: "monthly", label: "Monthly" },
                      { value: "quarterly", label: "Quarterly" },
                      { value: "yearly", label: "Full Year" },
                      { value: "batch", label: "By Batch" },
                    ] as { value: Period; label: string }[]
                  ).map((p) => (
                    <Button
                      key={p.value}
                      size="sm"
                      variant={period === p.value ? "default" : "outline"}
                      className={
                        period === p.value
                          ? "bg-blue-600 hover:bg-blue-500 h-9"
                          : "border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9"
                      }
                      onClick={() => setPeriod(p.value)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Month picker */}
              {period === "monthly" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    Month
                  </p>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-40 h-9 bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {MONTHS.map((m) => (
                        <SelectItem
                          key={m}
                          value={m}
                          className="text-zinc-300 focus:bg-zinc-900"
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quarter picker */}
              {period === "quarterly" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    Quarter
                  </p>
                  <Select
                    value={selectedQuarter}
                    onValueChange={setSelectedQuarter}
                  >
                    <SelectTrigger className="w-48 h-9 bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {QUARTERS.map((q) => (
                        <SelectItem
                          key={q.label}
                          value={q.label}
                          className="text-zinc-300 focus:bg-zinc-900"
                        >
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Batch picker */}
              {period === "batch" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    Select Batch
                  </p>
                  <Select
                    value={selectedBatchId}
                    onValueChange={setSelectedBatchId}
                  >
                    <SelectTrigger className="w-72 h-9 bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Choose a batch..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {[...batches]
                        .sort(
                          (a, b) =>
                            new Date(b.savedAt).getTime() -
                            new Date(a.savedAt).getTime()
                        )
                        .map((b) => (
                          <SelectItem
                            key={b.id}
                            value={b.id}
                            className="text-zinc-300 focus:bg-zinc-900"
                          >
                            <div className="flex items-center gap-2">
                              <Package2 className="w-3 h-3 text-blue-400" />
                              <span>{b.name}</span>
                              <span className="text-zinc-600 text-[10px]">
                                ({b.invoices.length} inv)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-normal mb-0.5 h-9 px-3">
                <Calendar className="w-3 h-3 mr-1.5" />
                {period === "batch" ? "All years" : CURRENT_YEAR}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Invoices"
            value={totals.count.toString()}
            icon={FileText}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
          <SummaryCard
            label="Subtotal"
            value={`MWK ${formatMoney(totals.amount)}`}
            icon={DollarSign}
            color="text-zinc-400"
            bg="bg-zinc-800"
          />
          <SummaryCard
            label="VAT 17.5%"
            value={`MWK ${formatMoney(totals.vat)}`}
            icon={TrendingUp}
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
          <SummaryCard
            label="Grand Total"
            value={`MWK ${formatMoney(totals.total)}`}
            icon={BarChart3}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            highlight
          />
        </div>

        {/* Paid / Unpaid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-400">
                  {totals.paid}
                </p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Paid Invoices
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  MWK {formatMoney(totals.paidAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400">
                  {totals.unpaid}
                </p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Unpaid Invoices
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  MWK {formatMoney(totals.unpaidAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Detail view: breakdown or invoice list ── */}
        {period === "yearly" ? (
          /* Yearly → monthly breakdown table */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Monthly Breakdown — {CURRENT_YEAR}
              </h3>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={allInvoices.length === 0}
                variant="outline"
                className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-8 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print All
              </Button>
            </div>
            <div className="rounded-xl border border-zinc-900 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-950">
                  <TableRow className="border-zinc-900 hover:bg-transparent">
                    {[
                      "Month", "Invoices", "Subtotal (MWK)",
                      "VAT (MWK)", "Total (MWK)", "Paid", "Unpaid",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-600"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-zinc-700 text-sm"
                      >
                        No invoices recorded for {CURRENT_YEAR} yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {monthlyBreakdown.map((row) => (
                        <TableRow
                          key={row.month}
                          className="border-zinc-900 hover:bg-zinc-900/40"
                        >
                          <TableCell className="font-medium text-white">
                            {row.month}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono">
                              {row.count}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-zinc-300">
                            {formatMoney(row.amount)}
                          </TableCell>
                          <TableCell className="font-mono text-amber-400/80">
                            {formatMoney(row.vat)}
                          </TableCell>
                          <TableCell className="font-mono font-black text-white">
                            {formatMoney(row.total)}
                          </TableCell>
                          <TableCell className="text-green-400 font-mono">
                            {row.paid}
                          </TableCell>
                          <TableCell className="text-amber-400 font-mono">
                            {row.unpaid}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="bg-zinc-900/60 border-t border-zinc-800">
                        <TableCell className="font-black text-white text-xs uppercase tracking-wider">
                          Total
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 font-mono">
                            {totals.count}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-zinc-200">
                          {formatMoney(totals.amount)}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-amber-400">
                          {formatMoney(totals.vat)}
                        </TableCell>
                        <TableCell className="font-mono font-black text-emerald-400 text-base">
                          {formatMoney(totals.total)}
                        </TableCell>
                        <TableCell className="text-green-400 font-mono font-bold">
                          {totals.paid}
                        </TableCell>
                        <TableCell className="text-amber-400 font-mono font-bold">
                          {totals.unpaid}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : period === "batch" && !selectedBatchId ? (
          /* Batch mode — no batch selected yet: show batch overview table */
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              All Batches Overview
            </h3>
            <div className="rounded-xl border border-zinc-900 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-950">
                  <TableRow className="border-zinc-900 hover:bg-transparent">
                    {[
                      "Batch", "Saved", "Invoice Range",
                      "Count", "Subtotal", "VAT", "Total", "Paid", "Unpaid",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-32 text-center text-zinc-700 text-sm"
                      >
                        No batches saved yet. Import invoices first.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {batchBreakdown.map(({ batch, ...t }) => (
                        <TableRow
                          key={batch.id}
                          className="border-zinc-900 hover:bg-zinc-900/40 cursor-pointer"
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package2 className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-white font-medium text-sm">
                                {batch.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                            {new Date(batch.savedAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-zinc-500">
                            {batch.firstInvoiceNo} → {batch.lastInvoiceNo}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono">
                              {t.count}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-zinc-300 text-xs">
                            {formatMoney(t.amount)}
                          </TableCell>
                          <TableCell className="font-mono text-amber-400/70 text-xs">
                            {formatMoney(t.vat)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-white">
                            {formatMoney(t.total)}
                          </TableCell>
                          <TableCell className="text-green-400 font-mono">
                            {t.paid}
                          </TableCell>
                          <TableCell className="text-amber-400 font-mono">
                            {t.unpaid}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals */}
                      <TableRow className="bg-zinc-900/60 border-t border-zinc-800">
                        <TableCell
                          colSpan={3}
                          className="font-black text-white text-xs uppercase tracking-wider"
                        >
                          All Batches
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 font-mono">
                            {allInvoices.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-zinc-200 text-xs">
                          {formatMoney(
                            allInvoices.reduce((a, i) => a + i.amount, 0)
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-amber-400 text-xs">
                          {formatMoney(
                            allInvoices.reduce((a, i) => a + i.vat, 0)
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-black text-emerald-400">
                          {formatMoney(
                            allInvoices.reduce((a, i) => a + i.total, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-green-400 font-mono font-bold">
                          {allInvoices.filter((i) => i.paid).length}
                        </TableCell>
                        <TableCell className="text-amber-400 font-mono font-bold">
                          {allInvoices.filter((i) => !i.paid).length}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[11px] text-zinc-700">
              Click a batch row to view its invoices
            </p>
          </div>
        ) : (
          /* Monthly, quarterly, or specific batch → invoice list */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Invoice List —{" "}
                <span className="text-zinc-300">{periodLabel}</span>
                <span className="text-zinc-700 ml-2">
                  ({periodInvoices.length} invoices)
                </span>
              </h3>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={periodInvoices.length === 0}
                variant="outline"
                className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-8 text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
            </div>
            <InvoiceListTable invoices={periodInvoices} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Storage Banner ────────────────────────────────────────────────────────────
function StorageBanner({
  usedKB, usedMB, percentUsed, limitMB,
}: {
  usedKB: string; usedMB: string;
  percentUsed: string; limitMB: number;
}) {
  const pct = parseFloat(percentUsed);

  const barColor =
    pct >= 85 ? "bg-red-500" :
    pct >= 60 ? "bg-amber-500" :
    "bg-emerald-500";

  const textColor =
    pct >= 85 ? "text-red-400" :
    pct >= 60 ? "text-amber-400" :
    "text-emerald-400";

  const borderColor =
    pct >= 85 ? "border-red-900/40" :
    pct >= 60 ? "border-amber-900/40" :
    "border-zinc-800";

  return (
    <div className={cn(
      "rounded-xl border bg-zinc-950 p-4",
      borderColor
    )}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            pct >= 85 ? "bg-red-500/10" :
            pct >= 60 ? "bg-amber-500/10" :
            "bg-emerald-500/10"
          )}>
            <Database className={`w-4 h-4 ${textColor}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Local Storage Usage
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Browser localStorage · ~{limitMB}MB limit per origin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`text-lg font-black font-mono ${textColor}`}>
              {usedMB} MB
            </p>
            <p className="text-[10px] text-zinc-600">{usedKB} KB used</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black font-mono text-zinc-400">
              {percentUsed}%
            </p>
            <p className="text-[10px] text-zinc-600">of {limitMB}MB</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Warning messages */}
      {pct >= 85 && (
        <div className="mt-3 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-900/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Storage almost full.</strong> Export and delete old batches
            from the Invoicing archive to free space. New imports may fail when
            full.
          </span>
        </div>
      )}
      {pct >= 60 && pct < 85 && (
        <div className="mt-3 flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-900/30 rounded-lg p-2.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Storage is getting full. Consider exporting older batches.
          </span>
        </div>
      )}
    </div>
  );
}