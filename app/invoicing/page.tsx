// app/invoicing/page.tsx
"use client";

import React, { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Plus, FileSpreadsheet, Search,
  CheckCircle2, AlertCircle, RefreshCw, FileDown,
  DollarSign, Clock, ReceiptText, Archive,
  Package2, CalendarDays, BookOpen, Eye,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useInvoiceCounter,
  useInvoiceBatches,
  formatMoney,
  formatDate,
  genId,
  nowISO,
  todayStr,
  type InvoiceRow,
  type InvoiceBatch,
} from "@/lib/store";
import { generateInvoiceHTML } from "@/lib/invoice-html";
import { InvoiceStatsCard } from "@/components/invoicing/InvoiceStatsCard";
import { SessionInvoiceTable } from "@/components/invoicing/SessionInvoiceTable";
import { FlatArchiveTable } from "@/components/invoicing/FlatArchiveTable";
import { BatchCard } from "@/components/invoicing/BatchCard";

// ── Config ────────────────────────────────────────────────────────────────────
const VAT_RATE = 0.175;
const INVOICE_PREFIX = "AF";
const START_NUMBER = 80;
const CURRENT_YEAR = new Date().getFullYear();

// ── Row data shape used by table components ───────────────────────────────────
interface RowData {
  invoice: InvoiceRow;
  batchId: string;
  batchName: string;
  isLastInBatch: boolean;
  isFirstInBatch: boolean;
}

export default function InvoicingPage() {
  // ── Persistent state ──
  const [counter, setCounter] = useInvoiceCounter();
  const [batches, setBatches] = useInvoiceBatches();

  // ── Session-only state (clears on refresh) ──
  const [sessionBatchIds, setSessionBatchIds] = useState<string[]>([]);

  // ── UI state ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [activeTab, setActiveTab] = useState("session");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<{
    invoice: InvoiceRow;
    batchId: string;
  } | null>(null);
  const [payDate, setPayDate] = useState(todayStr());
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<InvoiceBatch | null>(null);
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // ── Toast helper ──
  const notify = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3500);
    },
    []
  );

  // ── All archived invoices (flat, newest batch first) ──
  const allArchivedRows = useMemo((): RowData[] => {
    const sorted = [...batches].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    return sorted.flatMap((batch) =>
      batch.invoices.map((inv, idx) => ({
        invoice: inv,
        batchId: batch.id,
        batchName: batch.name,
        isLastInBatch: idx === batch.invoices.length - 1,
        isFirstInBatch: idx === 0,
      }))
    );
  }, [batches]);

  // ── Session rows (only batches uploaded this session) ──
  const sessionRows = useMemo((): RowData[] => {
    const rows: RowData[] = [];
    sessionBatchIds.forEach((batchId) => {
      const batch = batches.find((b) => b.id === batchId);
      if (!batch) return;
      batch.invoices.forEach((inv, idx) => {
        rows.push({
          invoice: inv,
          batchId: batch.id,
          batchName: batch.name,
          isLastInBatch: idx === batch.invoices.length - 1,
          isFirstInBatch: idx === 0,
        });
      });
    });
    return rows;
  }, [sessionBatchIds, batches]);

  // ── Stats ──
  const sessionStats = useMemo(() => {
    const invoices = sessionRows.map((r) => r.invoice);
    return {
      total: invoices.length,
      amount: invoices.reduce((a, i) => a + i.amount, 0),
      vat: invoices.reduce((a, i) => a + i.vat, 0),
      grandTotal: invoices.reduce((a, i) => a + i.total, 0),
      printed: invoices.filter((i) => i.printed).length,
      batches: sessionBatchIds.length,
    };
  }, [sessionRows, sessionBatchIds]);

  const archiveStats = useMemo(() => {
    const invoices = allArchivedRows.map((r) => r.invoice);
    return {
      total: invoices.length,
      paid: invoices.filter((i) => i.paid).length,
      unpaid: invoices.filter((i) => !i.paid).length,
      paidAmount: invoices.filter((i) => i.paid).reduce((a, i) => a + i.total, 0),
      unpaidAmount: invoices.filter((i) => !i.paid).reduce((a, i) => a + i.total, 0),
      totalAmount: invoices.reduce((a, i) => a + i.total, 0),
      batches: batches.length,
    };
  }, [allArchivedRows, batches]);

  // ── Filtered archived rows ──
  const filteredArchived = useMemo(() => {
    return allArchivedRows.filter(({ invoice: i }) => {
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
  }, [allArchivedRows, search, statusFilter]);

  // ── Update invoice inside a batch (persistent) ──
  const updateInvoiceInBatch = useCallback(
    (batchId: string, invoiceNo: string, updates: Partial<InvoiceRow>) => {
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
    },
    [setBatches]
  );

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
        if (rows.length === 0) {
          notify("File is empty", "error");
          return;
        }

        let tempCounter = counter;
        const processed: InvoiceRow[] = rows.map((row) => {
          const tons = parseFloat(String(row.Tons ?? 0)) || 0;
          const rate = parseFloat(String(row.Rate ?? 0)) || 0;
          const amount = tons * rate;
          const vat = amount * VAT_RATE;
          const invNo = `${INVOICE_PREFIX}-${CURRENT_YEAR}-${String(
            tempCounter++
          ).padStart(4, "0")}`;
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
            tons,
            rate,
            amount,
            vat,
            total: amount + vat,
            printed: false,
            paid: false,
            savedAt: nowISO(),
          };
        });

        // Build batch
        const batchNumber = batches.length + 1;
        const batchId = genId();
        const batch: InvoiceBatch = {
          id: batchId,
          name: `Batch #${batchNumber} — ${new Date().toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short", year: "numeric" }
          )}`,
          savedAt: nowISO(),
          invoices: processed,
          firstInvoiceNo: processed[0].invoiceNo,
          lastInvoiceNo: processed[processed.length - 1].invoiceNo,
        };

        setBatches((prev) => [...prev, batch]);
        setSessionBatchIds((prev) => [...prev, batchId]);
        setCounter(tempCounter);
        setActiveTab("session");
        notify(
          `✓ Imported ${processed.length} invoices — ${batch.name}`,
          "success"
        );
      } catch {
        notify("Error parsing file", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── Print ──
  const printInvoice = useCallback(
    (inv: InvoiceRow, batchId: string) => {
      const win = window.open("", "_blank", "width=1100,height=750");
      if (!win) {
        notify("Pop-up blocked. Please allow pop-ups.", "error");
        return;
      }
      win.document.write(generateInvoiceHTML(inv));
      win.document.close();

      let marked = false;
      const markOnce = () => {
        if (marked) return;
        marked = true;
        updateInvoiceInBatch(batchId, inv.invoiceNo, {
          printed: true,
          printedAt: nowISO(),
        });
      };
      win.onafterprint = () => {
        markOnce();
        try { win.close(); } catch { /* ignore */ }
      };
      const timer = setInterval(() => {
        if (win.closed) {
          clearInterval(timer);
          markOnce();
        }
      }, 500);
    },
    [notify, updateInvoiceInBatch]
  );

  // ── Mark Paid ──
  const handleMarkPaid = useCallback(() => {
    if (!payDialog) return;
    updateInvoiceInBatch(payDialog.batchId, payDialog.invoice.invoiceNo, {
      paid: true,
      paidAt: payDate,
    });
    setPayDialog(null);
    notify("Invoice marked as paid", "success");
  }, [payDialog, payDate, updateInvoiceInBatch, notify]);

  const handleMarkUnpaid = useCallback(
    (invoiceNo: string, batchId: string) => {
      updateInvoiceInBatch(batchId, invoiceNo, {
        paid: false,
        paidAt: undefined,
      });
      notify("Marked as unpaid", "info");
    },
    [updateInvoiceInBatch, notify]
  );

  // ── Delete Batch ──
  const handleDeleteBatch = useCallback(() => {
    if (!deleteBatchTarget) return;
    setBatches((prev) => prev.filter((b) => b.id !== deleteBatchTarget.id));
    setSessionBatchIds((prev) =>
      prev.filter((id) => id !== deleteBatchTarget.id)
    );
    if (viewingBatchId === deleteBatchTarget.id) setViewingBatchId(null);
    setDeleteBatchTarget(null);
    notify("Batch deleted", "info");
  }, [deleteBatchTarget, viewingBatchId, setBatches, notify]);

  // ── Export ──
  const exportToExcel = useCallback(
    (rows: InvoiceRow[], filename: string) => {
      if (rows.length === 0) {
        notify("No data to export", "error");
        return;
      }
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
      XLSX.writeFile(
        wb,
        `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      notify("Exported successfully", "success");
    },
    [notify]
  );

  // ── Sorted batches for archive display ──
  const sortedBatches = useMemo(
    () =>
      [...batches].sort(
        (a, b) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ),
    [batches]
  );

  return (
    <AppShell>
      <TooltipProvider delayDuration={0}>
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Logistics{" "}
                <span className="text-zinc-600">Invoicing</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Session clears on refresh · Every upload is auto-saved as a batch
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg px-4 py-2">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
                  Next Invoice
                </p>
                <p className="text-sm font-mono font-bold text-blue-400">
                  {INVOICE_PREFIX}-{CURRENT_YEAR}-
                  {String(counter).padStart(4, "0")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="border border-red-900/40 text-red-500 hover:bg-red-950/30 h-full px-3"
                onClick={() => setIsResetOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger
                  value="session"
                  className="data-[state=active]:bg-zinc-800 gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Current Session
                  {sessionStats.total > 0 && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {sessionStats.total}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="archive"
                  className="data-[state=active]:bg-zinc-800 gap-2"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                  {archiveStats.batches > 0 && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-zinc-700 text-zinc-400 border-zinc-600">
                      {archiveStats.batches}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Import button — always visible */}
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                />
                <Button className="h-10 bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Import Excel
                </Button>
              </div>
            </div>

            {/* ══════════ SESSION TAB ══════════ */}
            <TabsContent value="session" className="mt-5 space-y-5">
              {sessionStats.total === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-7 h-7 text-zinc-700" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    No invoices in this session
                  </h3>
                  <p className="text-zinc-600 text-sm mb-6 max-w-sm mx-auto">
                    Import an Excel manifest to begin. Each upload creates a
                    new batch. Session clears on refresh — all batches are
                    saved automatically.
                  </p>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-500">
                      <Plus className="w-4 h-4 mr-2" /> Import Excel Manifest
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <InvoiceStatsCard
                      title="Invoices"
                      value={sessionStats.total.toString()}
                      icon={ReceiptText}
                      sub={`${sessionStats.batches} batch(es) this session`}
                    />
                    <InvoiceStatsCard
                      title="Subtotal"
                      value={`MWK ${formatMoney(sessionStats.amount)}`}
                      icon={DollarSign}
                    />
                    <InvoiceStatsCard
                      title="VAT 17.5%"
                      value={`MWK ${formatMoney(sessionStats.vat)}`}
                      icon={AlertCircle}
                    />
                    <InvoiceStatsCard
                      title="Grand Total"
                      value={`MWK ${formatMoney(sessionStats.grandTotal)}`}
                      icon={CheckCircle2}
                      highlight
                    />
                  </div>

                  {/* Batch pills */}
                  <div className="flex flex-wrap gap-2">
                    {sessionBatchIds.map((bid) => {
                      const b = batches.find((bx) => bx.id === bid);
                      if (!b) return null;
                      return (
                        <div
                          key={bid}
                          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs"
                        >
                          <Package2 className="w-3 h-3 text-blue-400" />
                          <span className="text-zinc-300">{b.name}</span>
                          <span className="text-zinc-600 font-mono text-[10px]">
                            {b.firstInvoiceNo} → {b.lastInvoiceNo}
                          </span>
                          <Badge className="text-[9px] bg-zinc-800 border-zinc-700 text-zinc-500 h-4 px-1.5">
                            {b.invoices.length}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportToExcel(
                          sessionRows.map((r) => r.invoice),
                          "Session_Invoices"
                        )
                      }
                      className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9"
                    >
                      <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export Session
                    </Button>
                  </div>

                  {/* Table */}
                  <SessionInvoiceTable
                    rows={sessionRows}
                    onPrint={printInvoice}
                    onMarkPaid={(inv, batchId) => {
                      setPayDialog({ invoice: inv, batchId });
                      setPayDate(todayStr());
                    }}
                    onMarkUnpaid={handleMarkUnpaid}
                  />
                </>
              )}
            </TabsContent>

            {/* ══════════ ARCHIVE TAB ══════════ */}
            <TabsContent value="archive" className="mt-5 space-y-5">

              {/* Archive stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <InvoiceStatsCard
                  title="Total Saved"
                  value={archiveStats.total.toString()}
                  icon={BookOpen}
                  sub={`${archiveStats.batches} batches`}
                />
                <InvoiceStatsCard
                  title="Paid"
                  value={archiveStats.paid.toString()}
                  icon={CheckCircle2}
                  color="text-green-500"
                  sub={`MWK ${formatMoney(archiveStats.paidAmount)}`}
                />
                <InvoiceStatsCard
                  title="Unpaid"
                  value={archiveStats.unpaid.toString()}
                  icon={Clock}
                  color="text-amber-500"
                  sub={`MWK ${formatMoney(archiveStats.unpaidAmount)}`}
                />
                <InvoiceStatsCard
                  title="Grand Total"
                  value={`MWK ${formatMoney(archiveStats.totalAmount)}`}
                  icon={ReceiptText}
                  highlight
                />
              </div>

              {batches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
                  <Archive className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">No archived batches yet.</p>
                  <p className="text-zinc-700 text-xs mt-1">
                    Import invoices to start building your archive.
                  </p>
                </div>
              ) : (
                <>
                  {/* Batch Cards */}
                  <div className="space-y-3">
                    {sortedBatches.map((batch) => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        isViewing={viewingBatchId === batch.id}
                        onToggle={() =>
                          setViewingBatchId((prev) =>
                            prev === batch.id ? null : batch.id
                          )
                        }
                        onDelete={() => setDeleteBatchTarget(batch)}
                        onExport={() =>
                          exportToExcel(
                            batch.invoices,
                            `Batch_${batch.name.replace(/\s+/g, "_")}`
                          )
                        }
                        onPrint={(inv) => printInvoice(inv, batch.id)}
                        onMarkPaid={(inv) => {
                          setPayDialog({ invoice: inv, batchId: batch.id });
                          setPayDate(todayStr());
                        }}
                        onMarkUnpaid={(invNo) =>
                          handleMarkUnpaid(invNo, batch.id)
                        }
                      />
                    ))}
                  </div>

                  {/* Flat all-invoices view */}
                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        All Archived Invoices
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          exportToExcel(
                            allArchivedRows.map((r) => r.invoice),
                            "All_Invoices"
                          )
                        }
                        className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-8 text-xs"
                      >
                        <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export All
                      </Button>
                    </div>

                    {/* Search + status filter */}
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                        <Input
                          placeholder="Search invoice no, route, ATL, reg..."
                          className="pl-9 bg-zinc-950 border-zinc-800 h-9 text-sm"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) =>
                          setStatusFilter(v as "all" | "paid" | "unpaid")
                        }
                      >
                        <SelectTrigger className="w-36 h-9 bg-zinc-950 border-zinc-800 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          <SelectItem
                            value="all"
                            className="text-zinc-300 focus:bg-zinc-900"
                          >
                            All Status
                          </SelectItem>
                          <SelectItem
                            value="paid"
                            className="text-zinc-300 focus:bg-zinc-900"
                          >
                            Paid
                          </SelectItem>
                          <SelectItem
                            value="unpaid"
                            className="text-zinc-300 focus:bg-zinc-900"
                          >
                            Unpaid
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <FlatArchiveTable
                      rows={filteredArchived}
                      onPrint={printInvoice}
                      onMarkPaid={(inv, batchId) => {
                        setPayDialog({ invoice: inv, batchId });
                        setPayDate(todayStr());
                      }}
                      onMarkUnpaid={handleMarkUnpaid}
                    />

                    <p className="text-[11px] text-zinc-700 text-right">
                      {filteredArchived.length} of {allArchivedRows.length}{" "}
                      invoices
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
                {payDialog?.invoice.invoiceNo} — MWK{" "}
                {formatMoney(payDialog?.invoice.total ?? 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Date Paid
              </Label>
              <Input
                type="text"
                placeholder="DD/MM/YYYY"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setPayDialog(null)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkPaid}
                className="bg-green-700 hover:bg-green-600"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Paid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Batch Dialog ── */}
        <Dialog
          open={!!deleteBatchTarget}
          onOpenChange={() => setDeleteBatchTarget(null)}
        >
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Batch?</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Permanently delete{" "}
                <span className="text-white font-medium">
                  {deleteBatchTarget?.name}
                </span>{" "}
                and all {deleteBatchTarget?.invoices.length} invoices? This
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteBatchTarget(null)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBatch}
                className="bg-red-600 hover:bg-red-500"
              >
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
                Resets numbering back to{" "}
                <span className="text-white font-mono">{START_NUMBER}</span>.
                Does <strong className="text-white">not</strong> delete saved
                invoices.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setIsResetOpen(false)}
                className="text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-500"
                onClick={() => {
                  setCounter(START_NUMBER);
                  setIsResetOpen(false);
                  notify("Counter reset to " + START_NUMBER, "success");
                }}
              >
                Confirm Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Toast ── */}
        {toast && (
          <div
            className={cn(
              "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl",
              "text-sm font-medium border flex items-center gap-2",
              "animate-in slide-in-from-bottom-2 duration-200",
              toast.type === "success"
                ? "bg-green-950 border-green-800 text-green-300"
                : toast.type === "error"
                ? "bg-red-950 border-red-800 text-red-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </TooltipProvider>
    </AppShell>
  );
}