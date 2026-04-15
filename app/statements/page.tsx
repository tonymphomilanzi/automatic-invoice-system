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
  BarChart3, Printer, FileText,
  DollarSign, TrendingUp, Calendar,
  CheckCircle2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoices, formatMoney } from "@/lib/store";
import type { InvoiceRow } from "@/lib/store";

const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const QUARTERS = [
  { label: "Q1 (Jan–Mar)", months: [0,1,2] },
  { label: "Q2 (Apr–Jun)", months: [3,4,5] },
  { label: "Q3 (Jul–Sep)", months: [6,7,8] },
  { label: "Q4 (Oct–Dec)", months: [9,10,11] },
];

type Period = "monthly" | "quarterly" | "yearly";

// ── Parse invoice date to JS Date ─────────────────────────────────────────────
function parseInvoiceDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "N/A") return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
}

// ── Generate full print statement HTML ────────────────────────────────────────
function generateStatementHTML(
  invoices: InvoiceRow[],
  periodLabel: string,
  totals: { amount: number; vat: number; total: number; count: number },
  paid: number,
  unpaid: number
) {
  const rows = invoices.map((inv) => `
    <tr>
      <td>${inv.invoiceNo}</td>
      <td>${inv.formattedDate}</td>
      <td>${inv.formattedDespatchDate}</td>
      <td>${inv.regNo}</td>
      <td>${inv.loadedFrom} → ${inv.deliveredTo}</td>
      <td>${inv.atl}</td>
      <td class="right">${inv.tons}</td>
      <td class="right">${formatMoney(inv.rate)}</td>
      <td class="right">${formatMoney(inv.amount)}</td>
      <td class="right">${formatMoney(inv.vat)}</td>
      <td class="right"><strong>${formatMoney(inv.total)}</strong></td>
      <td style="color:${inv.paid ? "#16a34a" : "#d97706"};font-weight:600">
        ${inv.paid ? `Paid${inv.paidAt ? " " + inv.paidAt : ""}` : "Unpaid"}
      </td>
    </tr>`).join("");

  return `
<!DOCTYPE html><html><head><title>Statement — ${periodLabel} ${CURRENT_YEAR}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;font-size:11px;color:#111}
  .header{text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:14px;margin-bottom:16px}
  .company{font-size:18px;font-weight:900;color:#1e3a5f}
  .sub{font-size:10px;color:#666;margin-top:2px}
  .title{font-size:14px;font-weight:700;margin-top:6px}
  .summary{display:flex;gap:20px;background:#f0f4f8;padding:12px;border-radius:6px;margin-bottom:16px;font-size:11px}
  .s-item{flex:1}
  .s-item .val{font-size:15px;font-weight:900;color:#1e3a5f}
  .s-item .lbl{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse}
  th{background:#1e3a5f;color:#fff;padding:7px 5px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap}
  td{border:1px solid #e2e8f0;padding:6px 5px;font-size:10px}
  tr:nth-child(even) td{background:#f8fafc}
  .right{text-align:right}
  .total-row td{background:#1e3a5f;color:#fff;font-weight:700;font-size:11px}
  .footer{margin-top:16px;text-align:center;font-size:9px;color:#888;border-top:1px solid #eee;padding-top:10px}
  @media print{@page{size:landscape;margin:8mm}body{padding:0}}
</style></head><body>
<div class="header">
  <div class="company">AFFORDABLE WHOLESALE & TRANSPORT</div>
  <div class="sub">Po Box 17, Mangochi | +265 993 384 770 | affordablewholesalers@gmail.com</div>
  <div class="title">STATEMENT OF INVOICES — ${periodLabel.toUpperCase()} ${CURRENT_YEAR}</div>
</div>
<div class="summary">
  <div class="s-item"><div class="val">${totals.count}</div><div class="lbl">Total Invoices</div></div>
  <div class="s-item"><div class="val">MWK ${formatMoney(totals.amount)}</div><div class="lbl">Subtotal</div></div>
  <div class="s-item"><div class="val">MWK ${formatMoney(totals.vat)}</div><div class="lbl">VAT (17.5%)</div></div>
  <div class="s-item"><div class="val">MWK ${formatMoney(totals.total)}</div><div class="lbl">Grand Total</div></div>
  <div class="s-item"><div class="val" style="color:#16a34a">${paid}</div><div class="lbl">Paid</div></div>
  <div class="s-item"><div class="val" style="color:#d97706">${unpaid}</div><div class="lbl">Unpaid</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>Invoice No</th><th>Date</th><th>Despatch</th><th>Reg No</th>
      <th>Route</th><th>ATL</th><th class="right">Tons</th>
      <th class="right">Rate</th><th class="right">Amount</th>
      <th class="right">VAT</th><th class="right">Total</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td colspan="8" class="right">TOTALS:</td>
      <td class="right">${formatMoney(totals.amount)}</td>
      <td class="right">${formatMoney(totals.vat)}</td>
      <td class="right">${formatMoney(totals.total)}</td>
      <td>${paid} paid / ${unpaid} unpaid</td>
    </tr>
  </tbody>
</table>
<div class="footer">Generated on ${new Date().toLocaleDateString("en-GB")} — Affordable Wholesale & Transport</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;
}

export default function StatementsPage() {
  const [invoices] = useInvoices();
  const [period, setPeriod] = useState<Period>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedQuarter, setSelectedQuarter] = useState(QUARTERS[Math.floor(new Date().getMonth() / 3)].label);

  // ── Filter invoices by period ──
  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const d = parseInvoiceDate(inv.formattedDate);
      if (!d) return false;
      if (d.getFullYear() !== CURRENT_YEAR) return false;
      if (period === "monthly") return MONTHS[d.getMonth()] === selectedMonth;
      if (period === "quarterly") {
        const q = QUARTERS.find((q) => q.label === selectedQuarter);
        return q ? q.months.includes(d.getMonth()) : false;
      }
      return true;
    });
  }, [invoices, period, selectedMonth, selectedQuarter]);

  const totals = useMemo(() => ({
    count: periodInvoices.length,
    amount: periodInvoices.reduce((a, i) => a + i.amount, 0),
    vat: periodInvoices.reduce((a, i) => a + i.vat, 0),
    total: periodInvoices.reduce((a, i) => a + i.total, 0),
  }), [periodInvoices]);

  const paid = useMemo(() => periodInvoices.filter((i) => i.paid).length, [periodInvoices]);
  const unpaid = useMemo(() => periodInvoices.filter((i) => !i.paid).length, [periodInvoices]);

  // ── Group by month for yearly view ──
  const monthlyBreakdown = useMemo(() => {
    if (period !== "yearly") return [];
    return MONTHS.map((month, idx) => {
      const rows = invoices.filter((inv) => {
        const d = parseInvoiceDate(inv.formattedDate);
        return d && d.getFullYear() === CURRENT_YEAR && d.getMonth() === idx;
      });
      return {
        month,
        count: rows.length,
        amount: rows.reduce((a, i) => a + i.amount, 0),
        vat: rows.reduce((a, i) => a + i.vat, 0),
        total: rows.reduce((a, i) => a + i.total, 0),
        paid: rows.filter((i) => i.paid).length,
      };
    }).filter((m) => m.count > 0);
  }, [invoices, period]);

  const periodLabel =
    period === "monthly" ? selectedMonth :
    period === "quarterly" ? selectedQuarter :
    `Full Year ${CURRENT_YEAR}`;

  const printStatement = () => {
    const w = window.open("", "_blank", "width=1200,height=750");
    if (!w) return;
    w.document.write(generateStatementHTML(periodInvoices, periodLabel, totals, paid, unpaid));
    w.document.close();
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Financial <span className="text-zinc-600">Statements</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Aggregated from {invoices.length} saved invoices
            </p>
          </div>
          <Button onClick={printStatement} className="bg-blue-600 hover:bg-blue-500 h-10">
            <Printer className="w-4 h-4 mr-2" /> Print Statement
          </Button>
        </div>

        {/* Period Selector */}
        <Card className="bg-zinc-950 border-zinc-900">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Period Type</p>
                <div className="flex gap-1">
                  {(["monthly","quarterly","yearly"] as Period[]).map((p) => (
                    <Button key={p} size="sm"
                      variant={period === p ? "default" : "outline"}
                      className={period === p
                        ? "bg-blue-600 hover:bg-blue-500 h-9 capitalize"
                        : "border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9 capitalize"}
                      onClick={() => setPeriod(p)}>
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
                      {MONTHS.map((m) => <SelectItem key={m} value={m} className="text-zinc-300 focus:bg-zinc-900">{m}</SelectItem>)}
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
                      {QUARTERS.map((q) => <SelectItem key={q.label} value={q.label} className="text-zinc-300 focus:bg-zinc-900">{q.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-normal mb-0.5">
                <Calendar className="w-3 h-3 mr-1.5" />{CURRENT_YEAR}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Invoices", value: totals.count.toString(), icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Subtotal", value: `MWK ${formatMoney(totals.amount)}`, icon: DollarSign, color: "text-zinc-400", bg: "bg-zinc-800" },
            { label: "VAT", value: `MWK ${formatMoney(totals.vat)}`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Grand Total", value: `MWK ${formatMoney(totals.total)}`, icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10", highlight: true },
          ].map((s) => (
            <Card key={s.label} className={cn("bg-zinc-950 border-zinc-900", s.highlight && "ring-1 ring-emerald-500/30")}>
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

        {/* Paid vs Unpaid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-zinc-950 border-zinc-900">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-400">{paid}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Paid Invoices</p>
                <p className="text-xs text-zinc-500">
                  MWK {formatMoney(periodInvoices.filter((i) => i.paid).reduce((a, i) => a + i.total, 0))}
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
                <p className="text-2xl font-black text-amber-400">{unpaid}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Unpaid Invoices</p>
                <p className="text-xs text-zinc-500">
                  MWK {formatMoney(periodInvoices.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List or Monthly Breakdown */}
        {period === "yearly" ? (
          <div className="rounded-xl border border-zinc-900 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  {["Month", "Invoices", "Subtotal (MWK)", "VAT (MWK)", "Total (MWK)", "Paid"].map((h) => (
                    <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-zinc-700 text-sm">No invoices recorded for {CURRENT_YEAR} yet.</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {monthlyBreakdown.map((row) => (
                      <TableRow key={row.month} className="border-zinc-900 hover:bg-zinc-900/40">
                        <TableCell className="font-medium text-white">{row.month}</TableCell>
                        <TableCell><Badge className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono">{row.count}</Badge></TableCell>
                        <TableCell className="font-mono text-zinc-300">{formatMoney(row.amount)}</TableCell>
                        <TableCell className="font-mono text-amber-400/80">{formatMoney(row.vat)}</TableCell>
                        <TableCell className="font-mono font-black text-white">{formatMoney(row.total)}</TableCell>
                        <TableCell>
                          <span className="text-green-400 font-mono">{row.paid}</span>
                          <span className="text-zinc-700"> / {row.count}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-zinc-900/60 border-t border-zinc-800">
                      <TableCell className="font-black text-white text-xs uppercase tracking-wider">Total</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 font-mono">{totals.count}</Badge></TableCell>
                      <TableCell className="font-mono font-bold text-zinc-200">{formatMoney(totals.amount)}</TableCell>
                      <TableCell className="font-mono font-bold text-amber-400">{formatMoney(totals.vat)}</TableCell>
                      <TableCell className="font-mono font-black text-emerald-400 text-base">{formatMoney(totals.total)}</TableCell>
                      <TableCell className="font-mono text-green-400 font-bold">{paid} / {totals.count}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-900 overflow-hidden">
            <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
              <p className="text-xs font-bold text-zinc-400">
                Invoice list — <span className="text-white">{periodLabel}</span>
                <span className="text-zinc-600 ml-2">({periodInvoices.length} invoices)</span>
              </p>
            </div>
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  {["Invoice No", "Date", "Reg No", "Route", "Tons", "Amount", "VAT", "Total", "Status"].map((h) => (
                    <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-zinc-700 text-sm">
                      No invoices found for {periodLabel}.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {periodInvoices.map((inv) => (
                      <TableRow key={inv.invoiceNo} className="border-zinc-900 hover:bg-zinc-900/40">
                        <TableCell className="font-mono text-xs font-bold text-blue-400">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-xs text-zinc-400">{inv.formattedDate}</TableCell>
                        <TableCell>
                          <Badge className="font-mono text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">{inv.regNo || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400 max-w-[140px] truncate">
                          {inv.loadedFrom} → {inv.deliveredTo}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">{inv.tons}t</TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">{formatMoney(inv.amount)}</TableCell>
                        <TableCell className="font-mono text-xs text-amber-400/70">{formatMoney(inv.vat)}</TableCell>
                        <TableCell className="font-mono font-bold text-white">{formatMoney(inv.total)}</TableCell>
                        <TableCell>
                          {inv.paid ? (
                            <div>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />Paid
                              </Badge>
                              {inv.paidAt && <div className="text-[9px] text-zinc-600 mt-0.5">{inv.paidAt}</div>}
                            </div>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                              <Clock className="w-2.5 h-2.5 mr-1" />Unpaid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-zinc-900/60 border-t border-zinc-800">
                      <TableCell colSpan={5} className="font-black text-white text-xs uppercase tracking-wider text-right">Totals:</TableCell>
                      <TableCell className="font-mono font-bold text-zinc-200">{formatMoney(totals.amount)}</TableCell>
                      <TableCell className="font-mono font-bold text-amber-400">{formatMoney(totals.vat)}</TableCell>
                      <TableCell className="font-mono font-black text-emerald-400">{formatMoney(totals.total)}</TableCell>
                      <TableCell className="text-xs text-zinc-500">{paid} paid</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}