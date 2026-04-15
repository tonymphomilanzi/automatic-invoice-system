// app/invoicing/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Plus, Download, Trash2, FileSpreadsheet,
  Search, Printer, CheckCircle2, AlertCircle,
  Info, RefreshCw, FileDown, DollarSign,
  Clock, Ban, CalendarCheck, ChevronDown,
  Archive, ReceiptText, TrendingUp, Eye,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useInvoices, useInvoiceCounter,
  formatMoney, formatDate, genId, nowISO, todayStr,
  type InvoiceRow,
} from "@/lib/store";

// ── Config ────────────────────────────────────────────────────────────────────
const VAT_RATE = 0.175;
const INVOICE_PREFIX = "AF";
const START_NUMBER = 80;
const CURRENT_YEAR = new Date().getFullYear();

// ── Invoice HTML Generator ────────────────────────────────────────────────────
const generateInvoiceHTML = (data: InvoiceRow): string => `
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>Invoice ${data.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#222;font-size:13px}
  .header{text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:16px;margin-bottom:20px}
  .company-name{font-size:22px;font-weight:900;color:#1e3a5f;letter-spacing:1px}
  .company-sub{font-size:11px;color:#555;margin-top:2px}
  .invoice-title{font-size:16px;font-weight:700;color:#333;margin-top:8px;letter-spacing:2px}
  .meta{display:flex;justify-content:space-between;background:#f0f4f8;padding:14px 18px;border-radius:6px;margin-bottom:20px;font-size:12px}
  .meta strong{color:#1e3a5f}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#1e3a5f;color:#fff;padding:9px 8px;text-align:left;font-weight:600;letter-spacing:.5px}
  td{border:1px solid #ddd;padding:8px}
  .right{text-align:right}
  .total-row td{background:#1e3a5f;color:#fff;font-weight:700}
  .subtotal-row td{background:#eef2f7;font-weight:600}
  .footer{margin-top:30px;text-align:center;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:14px}
  @media print{@page{size:landscape;margin:10mm}}
</style></head><body>
<div class="header">
  <div class="company-name">AFFORDABLE WHOLESALE & TRANSPORT</div>
  <div class="company-sub">Po Box 17, Mangochi &nbsp;|&nbsp; +265 993 384 770 / +265 888 244 455 &nbsp;|&nbsp; affordablewholesalers@gmail.com</div>
  <div class="invoice-title">TRANSPORT INVOICE</div>
</div>
<div class="meta">
  <div>
    <p><strong>Invoice No:</strong> ${data.invoiceNo}</p>
    <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
  </div>
  <div style="text-align:right">
    <p><strong>To:</strong> ILLOVO SUGAR LTD</p>
    <p><strong>Payment Terms:</strong> IMMEDIATE</p>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>Despatch Date</th><th>Reg No</th><th>Loaded From</th>
      <th>Delivered To</th><th>ATL</th><th>Order No</th>
      <th>P/Order</th><th class="right">Tons</th>
      <th class="right">Rate</th><th class="right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${data.formattedDespatchDate}</td><td>${data.regNo}</td>
      <td>${data.loadedFrom}</td><td>${data.deliveredTo}</td>
      <td>${data.atl}</td><td>${data.orderNo}</td><td>${data.pOrder}</td>
      <td class="right">${data.tons}</td>
      <td class="right">${formatMoney(data.rate)}</td>
      <td class="right">${formatMoney(data.amount)}</td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="9" class="right">Subtotal:</td>
      <td class="right">${formatMoney(data.amount)}</td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="9" class="right">VAT (${VAT_RATE * 100}%):</td>
      <td class="right">${formatMoney(data.vat)}</td>
    </tr>
    <tr class="total-row">
      <td colspan="9" class="right">TOTAL (MWK):</td>
      <td class="right">${formatMoney(data.total)}</td>
    </tr>
  </tbody>
</table>
<div class="footer">Generated on ${new Date().toLocaleDateString("en-GB")} — Affordable Wholesale & Transport</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`;

// ── Stats Card ─────────────────────────────────────────────────────────────────
function StatsCard({
  title, value, icon: Icon, highlight = false, sub,
}: {
  title: string; value: string; icon: React.ElementType;
  highlight?: boolean; sub?: string;
}) {
  return (
    <Card className={cn("bg-zinc-950 border-zinc-900", highlight && "ring-1 ring-blue-500/40")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</CardTitle>
        <div className={highlight ? "text-blue-400" : "text-zinc-600"}><Icon size={13} /></div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className={cn("text-xl font-black tracking-tight font-mono", highlight ? "text-white" : "text-zinc-300")}>{value}</div>
        {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  const [invoices, setInvoices] = useInvoices();
  const [counter, setCounter] = useInvoiceCounter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<InvoiceRow | null>(null);
  const [payDate, setPayDate] = useState(todayStr());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [viewPrintedToday, setViewPrintedToday] = useState(false);

  const notify = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Derived ──
  const today = todayStr();

  const printedToday = useMemo(
    () => invoices.filter((i) => i.printedAt?.startsWith(new Date().toISOString().split("T")[0])),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchSearch =
        i.loadedFrom.toLowerCase().includes(search.toLowerCase()) ||
        i.deliveredTo.toLowerCase().includes(search.toLowerCase()) ||
        i.atl.includes(search) ||
        i.regNo.toLowerCase().includes(search.toLowerCase()) ||
        i.invoiceNo.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" && i.paid) ||
        (statusFilter === "unpaid" && !i.paid);
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const totals = useMemo(() =>
    filteredInvoices.reduce(
      (a, c) => ({ amount: a.amount + c.amount, vat: a.vat + c.vat, total: a.total + c.total }),
      { amount: 0, vat: 0, total: 0 }
    ), [filteredInvoices]);

  const dashStats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((i) => i.paid).length,
    unpaid: invoices.filter((i) => !i.paid).length,
    paidAmount: invoices.filter((i) => i.paid).reduce((a, i) => a + i.total, 0),
    unpaidAmount: invoices.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0),
    printedTodayCount: printedToday.length,
  }), [invoices, printedToday]);

  // ── File Upload ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(
          wb.Sheets[wb.SheetNames[0]]
        );
        if (rows.length === 0) { notify("File is empty", "error"); return; }

        let tempCounter = counter;
        const processed: InvoiceRow[] = rows.map((row) => {
          const tons = parseFloat(String(row.Tons ?? 0)) || 0;
          const rate = parseFloat(String(row.Rate ?? 0)) || 0;
          const amount = tons * rate;
          const vat = amount * VAT_RATE;
          const invNo = `${INVOICE_PREFIX}-${CURRENT_YEAR}-${String(tempCounter++).padStart(4, "0")}`;
          return {
            invoiceNo: invNo,
            formattedDate: formatDate(row["Date"]),
            formattedDespatchDate: formatDate(row["Despatch Date"]),
            regNo: String(row["Reg No"] ?? ""),
            loadedFrom: String(row["Loaded From"] ?? ""),
            deliveredTo: String(row["Delivered To"] ?? ""),
            atl: String(row["ATL"] ?? ""),
            orderNo: String(row["Order No"] ?? ""),
            pOrder: String(row["P/Order"] ?? ""),
            tons, rate, amount, vat, total: amount + vat,
            printed: false,
            paid: false,
            savedAt: nowISO(),
          };
        });

        setCounter(tempCounter);
        setInvoices((prev) => [...prev, ...processed]);
        notify(`Saved ${processed.length} invoices`, "success");
      } catch {
        notify("Error parsing file", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── Print Invoice ──
  const printInvoice = (row: InvoiceRow) => {
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) { notify("Pop-up blocked", "error"); return; }
    win.document.write(generateInvoiceHTML(row));
    win.document.close();

    let marked = false;
    const markOnce = () => {
      if (marked) return;
      marked = true;
      setInvoices((prev) =>
        prev.map((i) =>
          i.invoiceNo === row.invoiceNo
            ? { ...i, printed: true, printedAt: nowISO() }
            : i
        )
      );
    };
    win.onafterprint = () => { markOnce(); try { win.close(); } catch {} };
    const timer = setInterval(() => {
      if (win.closed) { clearInterval(timer); markOnce(); }
    }, 500);
  };

  // ── Mark Paid ──
  const handleMarkPaid = () => {
    if (!payDialog) return;
    setInvoices((prev) =>
      prev.map((i) =>
        i.invoiceNo === payDialog.invoiceNo
          ? { ...i, paid: true, paidAt: payDate }
          : i
      )
    );
    setPayDialog(null);
    notify("Invoice marked as paid", "success");
  };

  const handleMarkUnpaid = (invoiceNo: string) => {
    setInvoices((prev) =>
      prev.map((i) =>
        i.invoiceNo === invoiceNo ? { ...i, paid: false, paidAt: undefined } : i
      )
    );
    notify("Marked as unpaid", "info");
  };

  // ── Delete Invoice ──
  const handleDelete = (invoiceNo: string) => {
    setInvoices((prev) => prev.filter((i) => i.invoiceNo !== invoiceNo));
    notify("Invoice removed", "info");
  };

  // ── Export ──
  const exportToExcel = () => {
    if (invoices.length === 0) { notify("No data to export", "error"); return; }
    const ws = XLSX.utils.json_to_sheet(filteredInvoices.map((i) => ({
      "Invoice No": i.invoiceNo,
      "Date": i.formattedDate,
      "Despatch Date": i.formattedDespatchDate,
      "Reg No": i.regNo,
      "Loaded From": i.loadedFrom,
      "Delivered To": i.deliveredTo,
      "ATL": i.atl,
      "Order No": i.orderNo,
      "P/Order": i.pOrder,
      "Tons": i.tons,
      "Rate": i.rate,
      "Amount": i.amount,
      "VAT": i.vat,
      "Total": i.total,
      "Printed": i.printed ? "Yes" : "No",
      "Printed At": i.printedAt ? new Date(i.printedAt).toLocaleString("en-GB") : "",
      "Paid": i.paid ? "Yes" : "No",
      "Paid On": i.paidAt ?? "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoices_${new Date().toISOString().split("T")[0]}.xlsx`);
    notify("Exported successfully", "success");
  };

  return (
    <AppShell>
      <TooltipProvider delayDuration={0}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Page Heading ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Logistics <span className="text-zinc-600">Invoicing</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Import manifests · Track payments · Print invoices</p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="bg-zinc-950 border-zinc-900 px-4 py-2">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Next Invoice</p>
                <p className="text-sm font-mono font-bold text-blue-400">
                  {INVOICE_PREFIX}-{CURRENT_YEAR}-{String(counter).padStart(4, "0")}
                </p>
              </Card>
              <Button
                variant="ghost" size="sm"
                className="border border-red-900/40 text-red-500 hover:bg-red-950/30 h-full px-3"
                onClick={() => setIsResetOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
            </div>
          </div>

          {/* ── Mini Dashboard ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Invoices" value={dashStats.total.toString()} icon={ReceiptText} sub={`MWK ${formatMoney(totals.total)} shown`} />
            <StatsCard title="Paid" value={dashStats.paid.toString()} icon={CheckCircle2} sub={`MWK ${formatMoney(dashStats.paidAmount)}`} />
            <StatsCard title="Unpaid" value={dashStats.unpaid.toString()} icon={Ban} sub={`MWK ${formatMoney(dashStats.unpaidAmount)}`} />
            <StatsCard title="Printed Today" value={dashStats.printedTodayCount.toString()} icon={Printer}
              highlight={dashStats.printedTodayCount > 0}
            />
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="all">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">All Invoices</TabsTrigger>
                <TabsTrigger value="printed" className="data-[state=active]:bg-zinc-800">
                  Printed Today
                  {dashStats.printedTodayCount > 0 && (
                    <Badge className="ml-2 h-4 px-1.5 text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {dashStats.printedTodayCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-zinc-800">Paid</TabsTrigger>
                <TabsTrigger value="unpaid" className="data-[state=active]:bg-zinc-800">Unpaid</TabsTrigger>
              </TabsList>

              {/* Actions */}
              <div className="flex gap-2">
                <div className="relative">
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full" />
                  <Button className="h-10 bg-blue-600 hover:bg-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Import Excel
                  </Button>
                </div>
                <Button variant="outline" onClick={exportToExcel}
                  className="h-10 border-zinc-800 bg-transparent hover:bg-zinc-900">
                  <FileDown className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>

            {/* All Invoices Tab */}
            <TabsContent value="all" className="mt-4 space-y-4">
              <InvoiceTable
                data={filteredInvoices}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onPrint={printInvoice}
                onMarkPaid={(row) => { setPayDialog(row); setPayDate(todayStr()); }}
                onMarkUnpaid={handleMarkUnpaid}
                onDelete={handleDelete}
              />
              <TotalsRow totals={totals} count={filteredInvoices.length} total={invoices.length} />
            </TabsContent>

            {/* Printed Today Tab */}
            <TabsContent value="printed" className="mt-4 space-y-4">
              <div className="rounded-xl border border-zinc-900 overflow-hidden">
                <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-900">
                  <p className="text-xs font-bold text-zinc-400">
                    Invoices printed on <span className="text-white">{today}</span>
                    <span className="text-zinc-600 ml-2">({printedToday.length} records)</span>
                  </p>
                </div>
                <InvoiceTableInner
                  data={printedToday}
                  onPrint={printInvoice}
                  onMarkPaid={(row) => { setPayDialog(row); setPayDate(todayStr()); }}
                  onMarkUnpaid={handleMarkUnpaid}
                  onDelete={handleDelete}
                />
              </div>
            </TabsContent>

            {/* Paid Tab */}
            <TabsContent value="paid" className="mt-4">
              <InvoiceTableInner
                data={invoices.filter((i) => i.paid)}
                onPrint={printInvoice}
                onMarkPaid={(row) => { setPayDialog(row); setPayDate(todayStr()); }}
                onMarkUnpaid={handleMarkUnpaid}
                onDelete={handleDelete}
              />
            </TabsContent>

            {/* Unpaid Tab */}
            <TabsContent value="unpaid" className="mt-4">
              <InvoiceTableInner
                data={invoices.filter((i) => !i.paid)}
                onPrint={printInvoice}
                onMarkPaid={(row) => { setPayDialog(row); setPayDate(todayStr()); }}
                onMarkUnpaid={handleMarkUnpaid}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Pay Dialog ── */}
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Mark Invoice as Paid</DialogTitle>
              <DialogDescription className="text-zinc-500">
                {payDialog?.invoiceNo} — MWK {formatMoney(payDialog?.total ?? 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Date Paid</Label>
              <Input
                type="text"
                placeholder="DD/MM/YYYY"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayDialog(null)} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleMarkPaid} className="bg-green-700 hover:bg-green-600">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reset Dialog ── */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset Invoice Counter?</DialogTitle>
              <DialogDescription className="text-zinc-500">
                This resets the counter to {START_NUMBER} and clears all saved invoices.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsResetOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-500" onClick={() => {
                setCounter(START_NUMBER);
                setInvoices([]);
                setIsResetOpen(false);
                notify("Counter reset", "success");
              }}>Confirm Reset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Toast ── */}
        {toast && (
          <div className={cn(
            "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl",
            "text-sm font-medium border flex items-center gap-2",
            "animate-in slide-in-from-bottom-2 duration-200",
            toast.type === "success" ? "bg-green-950 border-green-800 text-green-300" :
            toast.type === "error" ? "bg-red-950 border-red-800 text-red-300" :
            "bg-zinc-900 border-zinc-700 text-zinc-200"
          )}>
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </TooltipProvider>
    </AppShell>
  );
}

// ── Invoice Table with Search/Filter ─────────────────────────────────────────
function InvoiceTable({
  data, search, setSearch, statusFilter, setStatusFilter,
  onPrint, onMarkPaid, onMarkUnpaid, onDelete,
}: {
  data: InvoiceRow[];
  search: string; setSearch: (v: string) => void;
  statusFilter: "all" | "paid" | "unpaid"; setStatusFilter: (v: "all" | "paid" | "unpaid") => void;
  onPrint: (r: InvoiceRow) => void;
  onMarkPaid: (r: InvoiceRow) => void;
  onMarkUnpaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <Input placeholder="Search invoice, route, ATL, reg no..."
            className="pl-9 bg-zinc-950 border-zinc-800 h-10 focus:border-blue-500/40"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "paid" | "unpaid")}>
          <SelectTrigger className="w-36 h-10 bg-zinc-950 border-zinc-800"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-900">All Status</SelectItem>
            <SelectItem value="paid" className="text-zinc-300 focus:bg-zinc-900">Paid Only</SelectItem>
            <SelectItem value="unpaid" className="text-zinc-300 focus:bg-zinc-900">Unpaid Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <InvoiceTableInner data={data} onPrint={onPrint} onMarkPaid={onMarkPaid} onMarkUnpaid={onMarkUnpaid} onDelete={onDelete} />
    </div>
  );
}

// ── Invoice Table Inner ───────────────────────────────────────────────────────
function InvoiceTableInner({
  data, onPrint, onMarkPaid, onMarkUnpaid, onDelete,
}: {
  data: InvoiceRow[];
  onPrint: (r: InvoiceRow) => void;
  onMarkPaid: (r: InvoiceRow) => void;
  onMarkUnpaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-900 hover:bg-transparent">
            {["Invoice No", "Date / Despatch", "Reg No", "Route", "ATL / Order", "Tons × Rate", "Total (MWK)", "Payment", "Actions"].map((h) => (
              <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-40 text-center text-zinc-700">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No invoices found.</p>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.invoiceNo}
                className={cn("border-zinc-900 transition-colors",
                  row.paid ? "bg-green-500/5 hover:bg-green-500/10" :
                  row.printed ? "bg-blue-500/5 hover:bg-blue-500/10" :
                  "hover:bg-zinc-900/40")}>
                <TableCell className="font-mono text-xs font-bold text-blue-400">
                  {row.invoiceNo}
                  {row.printed && (
                    <div className="text-[9px] text-zinc-600 font-normal mt-0.5">
                      {row.printedAt ? new Date(row.printedAt).toLocaleString("en-GB") : ""}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs text-zinc-300">{row.formattedDate}</div>
                  <div className="text-[10px] text-zinc-600">{row.formattedDespatchDate}</div>
                </TableCell>
                <TableCell>
                  <Badge className="font-mono text-[10px] bg-zinc-900 text-zinc-300 border-zinc-800">{row.regNo || "—"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-zinc-300 max-w-[140px] truncate">{row.loadedFrom}</div>
                  <div className="text-[10px] text-zinc-600 max-w-[140px] truncate">→ {row.deliveredTo}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-zinc-400">ATL: {row.atl}</div>
                  <div className="text-[10px] text-zinc-600">{row.orderNo}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-zinc-300 font-mono">{row.tons}t</div>
                  <div className="text-[10px] text-zinc-600">× {formatMoney(row.rate)}</div>
                </TableCell>
                <TableCell className="font-mono font-bold text-white text-right">
                  {formatMoney(row.total)}
                  <div className="text-[10px] text-zinc-600 font-normal">VAT: {formatMoney(row.vat)}</div>
                </TableCell>
                <TableCell>
                  {row.paid ? (
                    <div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
                      </Badge>
                      {row.paidAt && <div className="text-[9px] text-zinc-600 mt-0.5">{row.paidAt}</div>}
                    </div>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                      <Clock className="w-2.5 h-2.5 mr-1" /> Unpaid
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost"
                          onClick={() => onPrint(row)}
                          className={cn("h-7 w-7 p-0 rounded-full",
                            row.printed ? "text-green-500 hover:bg-green-500/10" : "text-zinc-500 hover:text-white hover:bg-zinc-800")}>
                          {row.printed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Printer className="w-3.5 h-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 border-zinc-700">
                        {row.printed ? "Reprint" : "Print invoice"}
                      </TooltipContent>
                    </Tooltip>
                    {row.paid ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost"
                            onClick={() => onMarkUnpaid(row.invoiceNo)}
                            className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10">
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 border-zinc-700">Mark unpaid</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost"
                            onClick={() => onMarkPaid(row)}
                            className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-green-400 hover:bg-green-500/10">
                            <DollarSign className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 border-zinc-700">Mark as paid</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost"
                          onClick={() => onDelete(row.invoiceNo)}
                          className="h-7 w-7 p-0 rounded-full text-zinc-700 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 border-zinc-700">Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Totals Row ────────────────────────────────────────────────────────────────
function TotalsRow({
  totals, count, total,
}: { totals: { amount: number; vat: number; total: number }; count: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-4 justify-end items-center">
      <span className="text-[11px] text-zinc-700">{count} of {total} invoices</span>
      <div className="flex gap-6 bg-zinc-950 border border-zinc-900 rounded-lg px-5 py-2.5">
        <div className="text-right">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Subtotal</p>
          <p className="text-sm font-mono font-bold text-zinc-400">{formatMoney(totals.amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">VAT</p>
          <p className="text-sm font-mono font-bold text-zinc-400">{formatMoney(totals.vat)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Grand Total</p>
          <p className="text-sm font-mono font-bold text-white">{formatMoney(totals.total)}</p>
        </div>
      </div>
    </div>
  );
}