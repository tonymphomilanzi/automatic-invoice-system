// app/invoicing/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Plus, Download, Trash2, FileSpreadsheet,
  Search, Printer, CheckCircle2, AlertCircle,
  Info, RefreshCw, FileDown,
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
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────
const VAT_RATE = 0.175;
const INVOICE_PREFIX = "AF";
const START_NUMBER = 80;
const CURRENT_YEAR = new Date().getFullYear();

// ── Types ─────────────────────────────────────────────────────────────────────
interface InvoiceRow {
  invoiceNo: string;
  formattedDate: string;
  formattedDespatchDate: string;
  regNo: string;
  loadedFrom: string;
  deliveredTo: string;
  atl: string;
  orderNo: string;
  pOrder: string;
  tons: number;
  rate: number;
  amount: number;
  vat: number;
  total: number;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const formatMoney = (val: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

const formatDate = (excelDate: unknown): string => {
  if (!excelDate) return "N/A";
  if (typeof excelDate === "number") {
    const d = new Date((excelDate - 25569) * 86400 * 1000);
    return d.toLocaleDateString("en-GB");
  }
  return String(excelDate);
};

const generateInvoiceHTML = (data: InvoiceRow): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #222; font-size: 13px; }
    .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
    .company-name { font-size: 22px; font-weight: 900; color: #1e3a5f; letter-spacing: 1px; }
    .company-sub { font-size: 11px; color: #555; margin-top: 2px; }
    .invoice-title { font-size: 16px; font-weight: 700; color: #333; margin-top: 8px; letter-spacing: 2px; }
    .meta { display: flex; justify-content: space-between; background: #f0f4f8; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 12px; }
    .meta strong { color: #1e3a5f; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1e3a5f; color: #fff; padding: 9px 8px; text-align: left; font-weight: 600; letter-spacing: 0.5px; }
    td { border: 1px solid #ddd; padding: 8px; }
    .right { text-align: right; }
    .total-row td { background: #1e3a5f; color: #fff; font-weight: 700; }
    .subtotal-row td { background: #eef2f7; font-weight: 600; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #eee; padding-top: 14px; }
    @media print { @page { size: landscape; margin: 10mm; } }
  </style>
</head>
<body>
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
        <td>${data.formattedDespatchDate}</td>
        <td>${data.regNo}</td>
        <td>${data.loadedFrom}</td>
        <td>${data.deliveredTo}</td>
        <td>${data.atl}</td>
        <td>${data.orderNo}</td>
        <td>${data.pOrder}</td>
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
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatsCard({
  title, value, icon, highlight = false,
}: {
  title: string; value: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "bg-zinc-950 border-zinc-900",
        highlight && "ring-1 ring-blue-500/40"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {title}
        </CardTitle>
        <div className={highlight ? "text-blue-400" : "text-zinc-600"}>
          {React.cloneElement(icon as React.ReactElement, { size: 13 })}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div
          className={cn(
            "text-xl font-black tracking-tight font-mono",
            highlight ? "text-white" : "text-zinc-300"
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [counter, setCounter] = useState(START_NUMBER);
  const [printedIds, setPrintedIds] = useState<string[]>([]);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [notification, setNotification] = useState<{
    msg: string; type: "success" | "error" | "info";
  } | null>(null);

  // ── Persistence ──
  useEffect(() => {
    const c = localStorage.getItem(`inv_counter_${CURRENT_YEAR}`);
    const p = localStorage.getItem(`inv_printed_${CURRENT_YEAR}`);
    if (c) setCounter(parseInt(c));
    if (p) setPrintedIds(JSON.parse(p));
  }, []);

  useEffect(() => {
    localStorage.setItem(`inv_counter_${CURRENT_YEAR}`, counter.toString());
  }, [counter]);

  useEffect(() => {
    localStorage.setItem(`inv_printed_${CURRENT_YEAR}`, JSON.stringify(printedIds));
  }, [printedIds]);

  // ── Notification helper ──
  const notify = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 3500);
    },
    []
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
            tons,
            rate,
            amount,
            vat,
            total: amount + vat,
          };
        });

        setCounter(tempCounter);
        setData(processed);
        notify(`Loaded ${processed.length} invoices`, "success");
      } catch {
        notify("Error parsing file", "error");
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  // ── Print Invoice ──
  const printInvoice = (row: InvoiceRow) => {
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) { notify("Pop-up blocked. Please allow pop-ups.", "error"); return; }
    win.document.write(generateInvoiceHTML(row));
    win.document.close();

    let marked = false;
    const markOnce = () => {
      if (marked) return;
      marked = true;
      setPrintedIds((prev) =>
        prev.includes(row.invoiceNo) ? prev : [...prev, row.invoiceNo]
      );
    };
    win.onafterprint = () => { markOnce(); try { win.close(); } catch {} };
    const timer = setInterval(() => {
      if (win.closed) { clearInterval(timer); markOnce(); }
    }, 500);
  };

  // ── Export ──
  const exportToExcel = () => {
    if (data.length === 0) { notify("No data to export", "error"); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `Invoices_${new Date().toISOString().split("T")[0]}.xlsx`);
    notify("Exported successfully", "success");
  };

  // ── Filtering & Totals ──
  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          item.loadedFrom.toLowerCase().includes(search.toLowerCase()) ||
          item.deliveredTo.toLowerCase().includes(search.toLowerCase()) ||
          item.atl.includes(search) ||
          item.regNo.toLowerCase().includes(search.toLowerCase()) ||
          item.invoiceNo.toLowerCase().includes(search.toLowerCase())
      ),
    [data, search]
  );

  const totals = useMemo(
    () =>
      filteredData.reduce(
        (acc, cur) => ({
          amount: acc.amount + cur.amount,
          vat: acc.vat + cur.vat,
          total: acc.total + cur.total,
        }),
        { amount: 0, vat: 0, total: 0 }
      ),
    [filteredData]
  );

  return (
    <AppShell>
      <TooltipProvider delayDuration={0}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Page Heading ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Logistics{" "}
                <span className="text-zinc-600">Invoicing</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Import a manifest to auto-generate numbered invoices
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="bg-zinc-950 border-zinc-900 px-4 py-2">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
                  Next Invoice
                </p>
                <p className="text-sm font-mono font-bold text-blue-400">
                  {INVOICE_PREFIX}-{CURRENT_YEAR}-
                  {String(counter).padStart(4, "0")}
                </p>
              </Card>
              <Button
                variant="ghost"
                size="sm"
                className="border border-red-900/40 text-red-500 hover:bg-red-950/30 h-full px-3"
                onClick={() => setIsResetOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Total Subtotal"
              value={`MWK ${formatMoney(totals.amount)}`}
              icon={<Info />}
            />
            <StatsCard
              title={`VAT (${VAT_RATE * 100}%)`}
              value={`MWK ${formatMoney(totals.vat)}`}
              icon={<AlertCircle />}
            />
            <StatsCard
              title="Grand Total"
              value={`MWK ${formatMoney(totals.total)}`}
              icon={<CheckCircle2 />}
              highlight
            />
          </div>

          {/* ── Action Bar ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <Input
                placeholder="Search invoice, route, ATL, reg no..."
                className="pl-9 bg-zinc-950 border-zinc-800 h-10 focus:border-blue-500/40"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* Import */}
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                />
                <Button className="h-10 bg-blue-600 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Import Excel
                </Button>
              </div>
              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={exportToExcel}
                    className="h-10 border-zinc-800 bg-transparent hover:bg-zinc-900"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 border-zinc-700">
                  Export as Excel
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="rounded-xl border border-zinc-900 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  {[
                    "Invoice No", "Date / Despatch", "Reg No",
                    "Route", "ATL / Order", "Tons × Rate",
                    "Total (MWK)", "Status",
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
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-48 text-center text-zinc-700"
                    >
                      <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No invoices loaded.</p>
                      <p className="text-xs mt-1 text-zinc-800">
                        Import an Excel manifest to get started.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => {
                    const isPrinted = printedIds.includes(row.invoiceNo);
                    return (
                      <TableRow
                        key={row.invoiceNo}
                        className={cn(
                          "border-zinc-900 transition-colors",
                          isPrinted
                            ? "bg-blue-500/5 hover:bg-blue-500/10"
                            : "hover:bg-zinc-900/40"
                        )}
                      >
                        {/* Invoice No */}
                        <TableCell className="font-mono text-xs font-bold text-blue-400">
                          {row.invoiceNo}
                        </TableCell>

                        {/* Dates */}
                        <TableCell>
                          <div className="text-xs text-zinc-300">
                            {row.formattedDate}
                          </div>
                          <div className="text-[10px] text-zinc-600">
                            {row.formattedDespatchDate}
                          </div>
                        </TableCell>

                        {/* Reg No */}
                        <TableCell>
                          <Badge className="font-mono text-[10px] bg-zinc-900 text-zinc-300 border-zinc-800">
                            {row.regNo || "—"}
                          </Badge>
                        </TableCell>

                        {/* Route */}
                        <TableCell>
                          <div className="text-xs text-zinc-300 max-w-[160px] truncate">
                            {row.loadedFrom}
                          </div>
                          <div className="text-[10px] text-zinc-600 max-w-[160px] truncate">
                            → {row.deliveredTo}
                          </div>
                        </TableCell>

                        {/* ATL / Order */}
                        <TableCell>
                          <div className="text-xs text-zinc-400">
                            ATL: {row.atl}
                          </div>
                          <div className="text-[10px] text-zinc-600">
                            {row.orderNo}
                          </div>
                        </TableCell>

                        {/* Tons × Rate */}
                        <TableCell>
                          <div className="text-xs text-zinc-300 font-mono">
                            {row.tons}t
                          </div>
                          <div className="text-[10px] text-zinc-600">
                            × {formatMoney(row.rate)}
                          </div>
                        </TableCell>

                        {/* Total */}
                        <TableCell className="font-mono font-bold text-sm text-white text-right">
                          {formatMoney(row.total)}
                          <div className="text-[10px] text-zinc-600 font-normal">
                            VAT: {formatMoney(row.vat)}
                          </div>
                        </TableCell>

                        {/* Print Action */}
                        <TableCell className="text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => printInvoice(row)}
                                className={cn(
                                  "h-8 w-8 p-0 rounded-full",
                                  isPrinted
                                    ? "text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                                )}
                              >
                                {isPrinted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Printer className="w-4 h-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-800 border-zinc-700">
                              {isPrinted ? "Printed — click to reprint" : "Print invoice"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Count */}
          {filteredData.length > 0 && (
            <p className="text-[11px] text-zinc-700 text-right">
              Showing {filteredData.length} of {data.length} invoices
            </p>
          )}
        </div>

        {/* ── Reset Dialog ── */}
        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white">Reset Invoice Counter?</DialogTitle>
              <DialogDescription className="text-zinc-500">
                This will reset the counter back to{" "}
                <span className="text-zinc-300 font-mono">{START_NUMBER}</span> and
                clear all printed flags. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
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
                  setPrintedIds([]);
                  setData([]);
                  setIsResetOpen(false);
                  notify("Counter reset", "success");
                }}
              >
                Confirm Reset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Toast Notification ── */}
        {notification && (
          <div
            className={cn(
              "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl",
              "text-sm font-medium border flex items-center gap-2",
              "animate-in slide-in-from-bottom-2 duration-200",
              notification.type === "success"
                ? "bg-green-950 border-green-800 text-green-300"
                : notification.type === "error"
                ? "bg-red-950 border-red-800 text-red-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            )}
          >
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === "error" && <AlertCircle className="w-4 h-4" />}
            {notification.msg}
          </div>
        )}
      </TooltipProvider>
    </AppShell>
  );
}