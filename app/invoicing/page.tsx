// app/invoicing/page.tsx
"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Plus, FileSpreadsheet, Search, Printer,
  CheckCircle2, AlertCircle, RefreshCw, FileDown,
  DollarSign, Clock, Ban, ReceiptText, Archive,
  Trash2, ChevronRight, Package2, CalendarDays,
  ArrowRight, Eye, X, BookOpen,
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
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useInvoiceCounter, useInvoiceBatches,
  formatMoney, formatDate, genId, nowISO, todayStr,
  type InvoiceRow, type InvoiceBatch,
} from "@/lib/store";

// ── Config ────────────────────────────────────────────────────────────────────
const VAT_RATE = 0.175;
const INVOICE_PREFIX = "AF";
const START_NUMBER = 80;
const CURRENT_YEAR = new Date().getFullYear();

// ── Invoice HTML ──────────────────────────────────────────────────────────────
const generateInvoiceHTML = (data: InvoiceRow): string => `
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><title>Invoice ${data.invoiceNo}</title>
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
  <thead><tr>
    <th>Despatch Date</th><th>Reg No</th><th>Loaded From</th>
    <th>Delivered To</th><th>ATL</th><th>Order No</th>
    <th>P/Order</th><th class="right">Tons</th>
    <th class="right">Rate</th><th class="right">Amount</th>
  </tr></thead>
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

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatsCard({
  title, value, icon: Icon, highlight = false, sub, color,
}: {
  title: string; value: string; icon: React.ElementType;
  highlight?: boolean; sub?: string; color?: string;
}) {
  return (
    <Card className={cn(
      "bg-zinc-950 border-zinc-900",
      highlight && "ring-1 ring-blue-500/40"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {title}
        </CardTitle>
        <div className={color ?? (highlight ? "text-blue-400" : "text-zinc-600")}>
          <Icon size={13} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className={cn(
          "text-xl font-black tracking-tight font-mono",
          highlight ? "text-white" : "text-zinc-300"
        )}>
          {value}
        </div>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Batch Divider Row ─────────────────────────────────────────────────────────
function BatchDividerRow({
  batchName, batchId, colSpan = 9,
}: {
  batchName: string; batchId: string; colSpan?: number;
}) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="py-0 px-0"
      >
        <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/60 border-y border-dashed border-zinc-800">
          <Package2 className="w-3 h-3 text-zinc-600 flex-shrink-0" />
          <span className="text-[10px] text-zinc-600 font-mono tracking-wider uppercase">
            {batchName}
          </span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Last-of-batch marker cell ─────────────────────────────────────────────────
function BatchEndMarker({ batchName }: { batchName: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-1 h-full absolute right-0 top-0 bottom-0 bg-blue-500/60 rounded-full" />
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-zinc-800 border-zinc-700 text-xs">
        Last invoice in {batchName}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  // Persistent state
  const [counter, setCounter] = useInvoiceCounter();
  const [batches, setBatches] = useInvoiceBatches();

  // Session-only state (cleared on refresh — this IS the active working set)
  const [sessionInvoices, setSessionInvoices] = useState<InvoiceRow[]>([]);
  const [sessionBatchIds, setSessionBatchIds] = useState<string[]>([]);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [activeTab, setActiveTab] = useState("session");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<{
    invoice: InvoiceRow; batchId: string;
  } | null>(null);
  const [payDate, setPayDate] = useState(todayStr());
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<InvoiceBatch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<InvoiceBatch | null>(null);
  const [toast, setToast] = useState<{
    msg: string; type: "success" | "error" | "info";
  } | null>(null);

  const notify = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  // ── Build flat "all invoices" list from archive batches only ──
  // Sessions are kept separate — on refresh session is gone
  const allArchivedInvoices = useMemo(() => {
    // Flatten all batches, keeping track of which batch each invoice belongs to
    // and whether it's the LAST invoice in its batch
    const result: Array<{
      invoice: InvoiceRow;
      batchId: string;
      batchName: string;
      isLastInBatch: boolean;
      isFirstInBatch: boolean;
    }> = [];

    // Sort batches newest first for display
    const sorted = [...batches].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    sorted.forEach((batch) => {
      batch.invoices.forEach((inv, idx) => {
        result.push({
          invoice: inv,
          batchId: batch.id,
          batchName: batch.name,
          isLastInBatch: idx === batch.invoices.length - 1,
          isFirstInBatch: idx === 0,
        });
      });
    });

    return result;
  }, [batches]);

  // ── Session invoices with batch boundary info ──
  const sessionWithBoundaries = useMemo(() => {
    const result: Array<{
      invoice: InvoiceRow;
      batchId: string;
      batchName: string;
      isLastInBatch: boolean;
      isFirstInBatch: boolean;
    }> = [];

    // Group session invoices by their batch
    sessionBatchIds.forEach((batchId) => {
      const sessionBatch = batches.find((b) => b.id === batchId);
      if (!sessionBatch) return;
      sessionBatch.invoices.forEach((inv, idx) => {
        result.push({
          invoice: inv,
          batchId: sessionBatch.id,
          batchName: sessionBatch.name,
          isLastInBatch: idx === sessionBatch.invoices.length - 1,
          isFirstInBatch: idx === 0,
        });
      });
    });

    return result;
  }, [sessionBatchIds, batches]);

  // ── Archive stats ──
  const archiveStats = useMemo(() => {
    const allInv = allArchivedInvoices.map((r) => r.invoice);
    return {
      total: allInv.length,
      paid: allInv.filter((i) => i.paid).length,
      unpaid: allInv.filter((i) => !i.paid).length,
      paidAmount: allInv.filter((i) => i.paid).reduce((a, i) => a + i.total, 0),
      unpaidAmount: allInv.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0),
      totalAmount: allInv.reduce((a, i) => a + i.total, 0),
      batches: batches.length,
    };
  }, [allArchivedInvoices, batches]);

  // ── Session stats ──
  const sessionStats = useMemo(() => {
    const allInv = sessionWithBoundaries.map((r) => r.invoice);
    return {
      total: allInv.length,
      amount: allInv.reduce((a, i) => a + i.amount, 0),
      vat: allInv.reduce((a, i) => a + i.vat, 0),
      total: allInv.reduce((a, i) => a + i.total, 0),
      printed: allInv.filter((i) => i.printed).length,
      batches: sessionBatchIds.length,
    };
  }, [sessionWithBoundaries, sessionBatchIds]);

  // ── Filter archived invoices ──
  const filteredArchived = useMemo(() => {
    return allArchivedInvoices.filter(({ invoice: i }) => {
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
  }, [allArchivedInvoices, search, statusFilter]);

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
            tons, rate, amount, vat,
            total: amount + vat,
            printed: false,
            paid: false,
            savedAt: nowISO(),
          };
        });

        // Create a batch
        const batchNumber = batches.length + 1;
        const batchId = genId();
        const batch: InvoiceBatch = {
          id: batchId,
          name: `Batch #${batchNumber} — ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
          savedAt: nowISO(),
          invoices: processed,
          firstInvoiceNo: processed[0].invoiceNo,
          lastInvoiceNo: processed[processed.length - 1].invoiceNo,
        };

        // Save to archive
        setBatches((prev) => [...prev, batch]);

        // Add to session
        setSessionInvoices((prev) => [...prev, ...processed]);
        setSessionBatchIds((prev) => [...prev, batchId]);

        setCounter(tempCounter);
        setActiveTab("session");
        notify(`✓ Imported ${processed.length} invoices as ${batch.name}`, "success");
      } catch {
        notify("Error parsing file", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── Print ──
  const printInvoice = (inv: InvoiceRow, batchId: string) => {
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) { notify("Pop-up blocked", "error"); return; }
    win.document.write(generateInvoiceHTML(inv));
    win.document.close();

    let marked = false;
    const markOnce = () => {
      if (marked) return;
      marked = true;
      updateInvoiceInBatch(batchId, inv.invoiceNo, {
        printed: true, printedAt: nowISO(),
      });
    };
    win.onafterprint = () => { markOnce(); try { win.close(); } catch {} };
    const timer = setInterval(() => {
      if (win.closed) { clearInterval(timer); markOnce(); }
    }, 500);
  };

  // ── Update invoice inside a batch ──
  const updateInvoiceInBatch = (
    batchId: string,
    invoiceNo: string,
    updates: Partial<InvoiceRow>
  ) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? {
              ...b,
              invoices: b.invoices.map((i) =>
                i.invoiceNo === invoiceNo ? { ...i, ...updates } : i
              ),
            }
          : b
      )
    );
    // Also update session invoices if present
    setSessionInvoices((prev) =>
      prev.map((i) =>
        i.invoiceNo === invoiceNo ? { ...i, ...updates } : i
      )
    );
  };

  // ── Mark Paid ──
  const handleMarkPaid = () => {
    if (!payDialog) return;
    updateInvoiceInBatch(payDialog.batchId, payDialog.invoice.invoiceNo, {
      paid: true, paidAt: payDate,
    });
    setPayDialog(null);
    notify("Invoice marked as paid", "success");
  };

  const handleMarkUnpaid = (invoiceNo: string, batchId: string) => {
    updateInvoiceInBatch(batchId, invoiceNo, { paid: false, paidAt: undefined });
    notify("Marked as unpaid", "info");
  };

  // ── Delete batch ──
  const handleDeleteBatch = () => {
    if (!deleteBatchTarget) return;
    setBatches((prev) => prev.filter((b) => b.id !== deleteBatchTarget.id));
    setSessionBatchIds((prev) => prev.filter((id) => id !== deleteBatchTarget.id));
    setSessionInvoices((prev) =>
      prev.filter(
        (i) =>
          !deleteBatchTarget.invoices.some((bi) => bi.invoiceNo === i.invoiceNo)
      )
    );
    setDeleteBatchTarget(null);
    notify("Batch deleted", "info");
  };

  // ── Export ──
  const exportToExcel = (rows: InvoiceRow[], filename: string) => {
    if (rows.length === 0) { notify("No data to export", "error"); return; }
    const ws = XLSX.utils.json_to_sheet(
      rows.map((i) => ({
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
        "Paid": i.paid ? "Yes" : "No",
        "Paid On": i.paidAt ?? "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
    notify("Exported successfully", "success");
  };

  return (
    <AppShell>
      <TooltipProvider delayDuration={0}>
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Logistics <span className="text-zinc-600">Invoicing</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Session is temporary · Archive is permanent · Data persists per batch
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="bg-zinc-950 border-zinc-900 px-4 py-2">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
                  Next Invoice
                </p>
                <p className="text-sm font-mono font-bold text-blue-400">
                  {INVOICE_PREFIX}-{CURRENT_YEAR}-{String(counter).padStart(4, "0")}
                </p>
              </Card>
              <Button variant="ghost" size="sm"
                className="border border-red-900/40 text-red-500 hover:bg-red-950/30 h-full px-3"
                onClick={() => setIsResetOpen(true)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset Counter
              </Button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                {/* Session Tab */}
                <TabsTrigger value="session"
                  className="data-[state=active]:bg-zinc-800 gap-2">
                  <Eye className="w-3.5 h-3.5" />
                  Current Session
                  {sessionStats.total > 0 && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {sessionStats.total}
                    </Badge>
                  )}
                </TabsTrigger>

                {/* Archive Tab */}
                <TabsTrigger value="archive"
                  className="data-[state=active]:bg-zinc-800 gap-2">
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                  {archiveStats.batches > 0 && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-zinc-700 text-zinc-400 border-zinc-600">
                      {archiveStats.batches} batches
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Import always visible */}
              <div className="flex gap-2">
                <div className="relative">
                  <input type="file" accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full" />
                  <Button className="h-10 bg-blue-600 hover:bg-blue-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Import Excel
                  </Button>
                </div>
              </div>
            </div>

            {/* ══════════════════ SESSION TAB ══════════════════ */}
            <TabsContent value="session" className="mt-5 space-y-5">

              {sessionStats.total === 0 ? (
                /* Empty State */
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-7 h-7 text-zinc-700" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">No invoices in this session</h3>
                  <p className="text-zinc-600 text-sm mb-6 max-w-sm mx-auto">
                    Import an Excel manifest to begin. Each upload creates a new batch.
                    Session data clears on page refresh — batches are saved to the archive.
                  </p>
                  <div className="relative inline-block">
                    <input type="file" accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full" />
                    <Button className="bg-blue-600 hover:bg-blue-500">
                      <Plus className="w-4 h-4 mr-2" /> Import Excel Manifest
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Session Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard title="Invoices" value={sessionStats.total.toString()}
                      icon={ReceiptText} sub={`${sessionStats.batches} batch(es)`} />
                    <StatsCard title="Subtotal"
                      value={`MWK ${formatMoney(sessionStats.amount)}`}
                      icon={DollarSign} />
                    <StatsCard title="VAT 17.5%"
                      value={`MWK ${formatMoney(sessionStats.vat)}`}
                      icon={AlertCircle} />
                    <StatsCard title="Grand Total"
                      value={`MWK ${formatMoney(sessionStats.total)}`}
                      icon={CheckCircle2} highlight />
                  </div>

                  {/* Batch info pills */}
                  <div className="flex flex-wrap gap-2">
                    {sessionBatchIds.map((bid) => {
                      const b = batches.find((bx) => bx.id === bid);
                      if (!b) return null;
                      return (
                        <div key={bid}
                          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
                          <Package2 className="w-3 h-3 text-blue-400" />
                          <span className="text-zinc-300">{b.name}</span>
                          <span className="text-zinc-600">
                            {b.firstInvoiceNo} → {b.lastInvoiceNo}
                          </span>
                          <Badge className="text-[9px] bg-zinc-800 border-zinc-700 text-zinc-500 h-4 px-1.5">
                            {b.invoices.length}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export session */}
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm"
                      onClick={() => exportToExcel(
                        sessionWithBoundaries.map((r) => r.invoice),
                        "Session_Invoices"
                      )}
                      className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9">
                      <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export Session
                    </Button>
                  </div>

                  {/* Session Invoice Table */}
                  <SessionInvoiceTable
                    rows={sessionWithBoundaries}
                    onPrint={(inv, batchId) => printInvoice(inv, batchId)}
                    onMarkPaid={(inv, batchId) => {
                      setPayDialog({ invoice: inv, batchId });
                      setPayDate(todayStr());
                    }}
                    onMarkUnpaid={handleMarkUnpaid}
                  />
                </>
              )}
            </TabsContent>

            {/* ══════════════════ ARCHIVE TAB ══════════════════ */}
            <TabsContent value="archive" className="mt-5 space-y-5">

              {/* Archive Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Saved" value={archiveStats.total.toString()}
                  icon={BookOpen} sub={`${archiveStats.batches} batches`} />
                <StatsCard title="Paid"
                  value={archiveStats.paid.toString()}
                  icon={CheckCircle2}
                  color="text-green-500"
                  sub={`MWK ${formatMoney(archiveStats.paidAmount)}`} />
                <StatsCard title="Unpaid"
                  value={archiveStats.unpaid.toString()}
                  icon={Clock}
                  color="text-amber-500"
                  sub={`MWK ${formatMoney(archiveStats.unpaidAmount)}`} />
                <StatsCard title="Grand Total"
                  value={`MWK ${formatMoney(archiveStats.totalAmount)}`}
                  icon={ReceiptText} highlight />
              </div>

              {batches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
                  <Archive className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">No archived batches yet.</p>
                  <p className="text-zinc-700 text-xs mt-1">Import invoices to start building your archive.</p>
                </div>
              ) : (
                <>
                  {/* ── Archive view: Batch cards + toggled invoice table ── */}
                  <div className="space-y-3">
                    {[...batches]
                      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                      .map((batch) => (
                        <BatchCard
                          key={batch.id}
                          batch={batch}
                          isViewing={viewingBatch?.id === batch.id}
                          onToggle={() =>
                            setViewingBatch((prev) =>
                              prev?.id === batch.id ? null : batch
                            )
                          }
                          onDelete={() => setDeleteBatchTarget(batch)}
                          onExport={() =>
                            exportToExcel(batch.invoices, `Batch_${batch.name.replace(/\s+/g, "_")}`)
                          }
                          onPrint={(inv) => printInvoice(inv, batch.id)}
                          onMarkPaid={(inv) => {
                            setPayDialog({ invoice: inv, batchId: batch.id });
                            setPayDate(todayStr());
                          }}
                          onMarkUnpaid={(invNo) => handleMarkUnpaid(invNo, batch.id)}
                        />
                      ))}
                  </div>

                  {/* ── Flat all-invoices view with search ── */}
                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        All Archived Invoices
                      </h3>
                      <Button variant="outline" size="sm"
                        onClick={() => exportToExcel(
                          allArchivedInvoices.map((r) => r.invoice), "All_Invoices"
                        )}
                        className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-8 text-xs">
                        <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export All
                      </Button>
                    </div>

                    {/* Search + filter */}
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        <Input placeholder="Search invoice no, route, ATL, reg..."
                          className="pl-9 bg-zinc-950 border-zinc-800 h-9 text-sm"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)} />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as "all" | "paid" | "unpaid")}>
                        <SelectTrigger className="w-36 h-9 bg-zinc-950 border-zinc-800 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-900">All Status</SelectItem>
                          <SelectItem value="paid" className="text-zinc-300 focus:bg-zinc-900">Paid</SelectItem>
                          <SelectItem value="unpaid" className="text-zinc-300 focus:bg-zinc-900">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Flat table with batch dividers */}
                    <FlatArchiveTable
                      rows={filteredArchived}
                      onPrint={(inv, batchId) => printInvoice(inv, batchId)}
                      onMarkPaid={(inv, batchId) => {
                        setPayDialog({ invoice: inv, batchId });
                        setPayDate(todayStr());
                      }}
                      onMarkUnpaid={handleMarkUnpaid}
                    />

                    <p className="text-[11px] text-zinc-700 text-right">
                      {filteredArchived.length} of {allArchivedInvoices.length} invoices
                    </p>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Pay Dialog ── */}
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Mark Invoice as Paid</DialogTitle>
              <DialogDescription className="text-zinc-500">
                {payDialog?.invoice.invoiceNo} — MWK {formatMoney(payDialog?.invoice.total ?? 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Date Paid</Label>
              <Input type="text" placeholder="DD/MM/YYYY" value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayDialog(null)} className="text-zinc-400">Cancel</Button>
              <Button onClick={handleMarkPaid} className="bg-green-700 hover:bg-green-600">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Batch Dialog ── */}
        <Dialog open={!!deleteBatchTarget} onOpenChange={() => setDeleteBatchTarget(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Batch?</DialogTitle>
              <DialogDescription className="text-zinc-500">
                This will permanently delete{" "}
                <span className="text-white font-medium">{deleteBatchTarget?.name}</span> and all{" "}
                {deleteBatchTarget?.invoices.length} invoices in it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteBatchTarget(null)} className="text-zinc-400">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteBatch} className="bg-red-600 hover:bg-red-500">
                Delete Batch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Reset Counter Dialog ── */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset Invoice Counter?</DialogTitle>
              <DialogDescription className="text-zinc-500">
                This only resets the numbering counter back to {START_NUMBER}.
                It does <strong className="text-white">not</strong> delete any saved invoices.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsResetOpen(false)} className="text-zinc-400">Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-500"
                onClick={() => { setCounter(START_NUMBER); setIsResetOpen(false); notify("Counter reset", "success"); }}>
                Confirm Reset
              </Button>
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

// ── Session Invoice Table ─────────────────────────────────────────────────────
// Shows only current session's invoices with batch boundary highlights
function SessionInvoiceTable({
  rows, onPrint, onMarkPaid, onMarkUnpaid,
}: {
  rows: Array<{
    invoice: InvoiceRow; batchId: string;
    batchName: string; isLastInBatch: boolean; isFirstInBatch: boolean;
  }>;
  onPrint: (inv: InvoiceRow, batchId: string) => void;
  onMarkPaid: (inv: InvoiceRow, batchId: string) => void;
  onMarkUnpaid: (invNo: string, batchId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-900 hover:bg-transparent">
            {["Invoice No","Date / Despatch","Reg No","Route","ATL","Tons × Rate","Total (MWK)","Payment",""].map((h) => (
              <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ invoice: row, batchId, batchName, isLastInBatch, isFirstInBatch }, idx) => (
            <React.Fragment key={row.invoiceNo}>
              {/* Batch divider at the start of each batch (after first) */}
              {isFirstInBatch && idx > 0 && (
                <BatchDividerRow batchName={batchName} batchId={batchId} colSpan={9} />
              )}

              <InvoiceTableRow
                row={row}
                batchId={batchId}
                batchName={batchName}
                isLastInBatch={isLastInBatch}
                onPrint={() => onPrint(row, batchId)}
                onMarkPaid={() => onMarkPaid(row, batchId)}
                onMarkUnpaid={() => onMarkUnpaid(row.invoiceNo, batchId)}
              />
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Flat Archive Table ────────────────────────────────────────────────────────
// All archived invoices flat, with batch dividers between groups
function FlatArchiveTable({
  rows, onPrint, onMarkPaid, onMarkUnpaid,
}: {
  rows: Array<{
    invoice: InvoiceRow; batchId: string;
    batchName: string; isLastInBatch: boolean; isFirstInBatch: boolean;
  }>;
  onPrint: (inv: InvoiceRow, batchId: string) => void;
  onMarkPaid: (inv: InvoiceRow, batchId: string) => void;
  onMarkUnpaid: (invNo: string, batchId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-900 p-12 text-center text-zinc-700">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No invoices match your search.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-900 hover:bg-transparent">
            {["Invoice No","Date / Despatch","Reg No","Route","ATL","Tons × Rate","Total (MWK)","Payment",""].map((h) => (
              <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap">{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ invoice: row, batchId, batchName, isLastInBatch, isFirstInBatch }, idx) => (
            <React.Fragment key={row.invoiceNo}>
              {isFirstInBatch && (
                <BatchDividerRow batchName={batchName} batchId={batchId} colSpan={9} />
              )}
              <InvoiceTableRow
                row={row}
                batchId={batchId}
                batchName={batchName}
                isLastInBatch={isLastInBatch}
                onPrint={() => onPrint(row, batchId)}
                onMarkPaid={() => onMarkPaid(row, batchId)}
                onMarkUnpaid={() => onMarkUnpaid(row.invoiceNo, batchId)}
              />
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Single Invoice Row ────────────────────────────────────────────────────────
function InvoiceTableRow({
  row, batchId, batchName, isLastInBatch,
  onPrint, onMarkPaid, onMarkUnpaid,
}: {
  row: InvoiceRow; batchId: string; batchName: string; isLastInBatch: boolean;
  onPrint: () => void; onMarkPaid: () => void; onMarkUnpaid: () => void;
}) {
  return (
    <TableRow className={cn(
      "border-zinc-900 transition-colors relative",
      isLastInBatch
        ? "border-b-2 border-b-blue-500/40 bg-blue-500/[0.03]"
        : row.paid
        ? "bg-green-500/[0.03] hover:bg-green-500/[0.06]"
        : row.printed
        ? "bg-zinc-900/20 hover:bg-zinc-900/40"
        : "hover:bg-zinc-900/30"
    )}>
      {/* Invoice No */}
      <TableCell className="font-mono text-xs font-bold text-blue-400">
        <div className="flex items-center gap-2">
          {isLastInBatch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 border-zinc-700 text-xs max-w-xs">
                <p className="font-bold">Batch end marker</p>
                <p className="text-zinc-400 mt-0.5">Last invoice in {batchName}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <span>{row.invoiceNo}</span>
        </div>
        {row.printedAt && (
          <div className="text-[9px] text-zinc-700 font-normal mt-0.5 ml-3.5">
            {new Date(row.printedAt).toLocaleString("en-GB", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
            })}
          </div>
        )}
      </TableCell>

      {/* Dates */}
      <TableCell>
        <div className="text-xs text-zinc-300">{row.formattedDate}</div>
        <div className="text-[10px] text-zinc-600">{row.formattedDespatchDate}</div>
      </TableCell>

      {/* Reg No */}
      <TableCell>
        <Badge className="font-mono text-[10px] bg-zinc-900 text-zinc-300 border-zinc-800">
          {row.regNo || "—"}
        </Badge>
      </TableCell>

      {/* Route */}
      <TableCell>
        <div className="text-xs text-zinc-300 max-w-[140px] truncate">{row.loadedFrom}</div>
        <div className="text-[10px] text-zinc-600 max-w-[140px] truncate">→ {row.deliveredTo}</div>
      </TableCell>

      {/* ATL */}
      <TableCell className="text-xs text-zinc-500">{row.atl}</TableCell>

      {/* Tons × Rate */}
      <TableCell>
        <div className="text-xs text-zinc-300 font-mono">{row.tons}t</div>
        <div className="text-[10px] text-zinc-600">× {formatMoney(row.rate)}</div>
      </TableCell>

      {/* Total */}
      <TableCell className="text-right">
        <div className="font-mono font-bold text-white text-sm">{formatMoney(row.total)}</div>
        <div className="text-[10px] text-zinc-700 font-normal">VAT {formatMoney(row.vat)}</div>
      </TableCell>

      {/* Payment status */}
      <TableCell>
        {row.paid ? (
          <div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] whitespace-nowrap">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
            </Badge>
            {row.paidAt && (
              <div className="text-[9px] text-zinc-600 mt-0.5">{row.paidAt}</div>
            )}
          </div>
        ) : (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] whitespace-nowrap">
            <Clock className="w-2.5 h-2.5 mr-1" /> Unpaid
          </Badge>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onPrint}
                className={cn("h-7 w-7 p-0 rounded-full",
                  row.printed
                    ? "text-green-500 hover:bg-green-500/10"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800")}>
                {row.printed
                  ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : <Printer className="w-3.5 h-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">
              {row.printed ? "Reprint" : "Print"}
            </TooltipContent>
          </Tooltip>

          {row.paid ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onMarkUnpaid}
                  className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10">
                  <Ban className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700">Mark unpaid</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onMarkPaid}
                  className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-green-400 hover:bg-green-500/10">
                  <DollarSign className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700">Mark paid</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Batch Card (Archive view) ─────────────────────────────────────────────────
function BatchCard({
  batch, isViewing, onToggle, onDelete, onExport,
  onPrint, onMarkPaid, onMarkUnpaid,
}: {
  batch: InvoiceBatch;
  isViewing: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExport: () => void;
  onPrint: (inv: InvoiceRow) => void;
  onMarkPaid: (inv: InvoiceRow) => void;
  onMarkUnpaid: (invNo: string) => void;
}) {
  const paid = batch.invoices.filter((i) => i.paid).length;
  const unpaid = batch.invoices.length - paid;
  const total = batch.invoices.reduce((a, i) => a + i.total, 0);

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      isViewing ? "border-blue-500/40 bg-blue-500/[0.03]" : "border-zinc-900 bg-zinc-950"
    )}>
      {/* Batch Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
          <Package2 className="w-5 h-5 text-zinc-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-white text-sm">{batch.name}</h4>
            <span className="text-[10px] text-zinc-600 font-mono">
              {batch.firstInvoiceNo} → {batch.lastInvoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[10px] text-zinc-600">
              <CalendarDays className="w-3 h-3 inline mr-1" />
              {new Date(batch.savedAt).toLocaleString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}
            </span>
            <Badge className="text-[10px] h-4 px-1.5 bg-zinc-900 border-zinc-800 text-zinc-500">
              {batch.invoices.length} invoices
            </Badge>
            {paid > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 bg-green-500/10 border-green-500/20 text-green-400">
                {paid} paid
              </Badge>
            )}
            {unpaid > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 bg-amber-500/10 border-amber-500/20 text-amber-400">
                {unpaid} unpaid
              </Badge>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="text-right flex-shrink-0">
          <p className="text-white font-mono font-black text-base">
            {formatMoney(total)}
          </p>
          <p className="text-[10px] text-zinc-600">MWK total</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onExport}
                className="h-8 w-8 p-0 text-zinc-600 hover:text-white hover:bg-zinc-800">
                <FileDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">Export batch</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="ghost" onClick={onDelete}
                className="h-8 w-8 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">Delete batch</TooltipContent>
          </Tooltip>
          <Button size="sm" variant="ghost" onClick={onToggle}
            className={cn(
              "h-8 px-3 text-xs gap-1.5 transition-colors",
              isViewing
                ? "text-blue-400 hover:bg-blue-500/10"
                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
            )}>
            {isViewing ? (
              <><X className="w-3.5 h-3.5" /> Close</>
            ) : (
              <><Eye className="w-3.5 h-3.5" /> View</>
            )}
          </Button>
        </div>
      </div>

      {/* Expandable invoice table */}
      {isViewing && (
        <div className="border-t border-zinc-900">
          <div className="rounded-b-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950/50">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  {["Invoice No","Date / Despatch","Reg No","Route","ATL","Tons × Rate","Total (MWK)","Payment",""].map((h) => (
                    <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.invoices.map((inv, idx) => (
                  <InvoiceTableRow
                    key={inv.invoiceNo}
                    row={inv}
                    batchId={batch.id}
                    batchName={batch.name}
                    isLastInBatch={idx === batch.invoices.length - 1}
                    onPrint={() => onPrint(inv)}
                    onMarkPaid={() => onMarkPaid(inv)}
                    onMarkUnpaid={() => onMarkUnpaid(inv.invoiceNo)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Batch Divider Row (used in flat table) ────────────────────────────────────
function BatchDividerRow({
  batchName, batchId, colSpan = 9,
}: {
  batchName: string; batchId: string; colSpan?: number;
}) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-0 px-0">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900/40 border-y border-dashed border-zinc-800/60">
          <Package2 className="w-3 h-3 text-blue-500/50 flex-shrink-0" />
          <span className="text-[10px] text-zinc-600 font-mono tracking-wider">
            {batchName}
          </span>
          <div className="flex-1 h-px bg-zinc-800/60" />
        </div>
      </TableCell>
    </TableRow>
  );
}