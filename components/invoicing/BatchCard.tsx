// components/invoicing/BatchCard.tsx
"use client";

import React from "react";
import {
  Package2, CalendarDays, FileDown,
  Trash2, Eye, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/store";
import { InvoiceTableRow } from "./InvoiceTableRow";
import type { InvoiceRow, InvoiceBatch } from "@/lib/store";

const TABLE_HEADERS = [
  "Invoice No",
  "Date / Despatch",
  "Reg No",
  "Route",
  "ATL",
  "Tons × Rate",
  "Total (MWK)",
  "Payment",
  "",
];

interface Props {
  batch: InvoiceBatch;
  isViewing: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onExport: () => void;
  onPrint: (inv: InvoiceRow) => void;
  onMarkPaid: (inv: InvoiceRow) => void;
  onMarkUnpaid: (invNo: string) => void;
}

export function BatchCard({
  batch,
  isViewing,
  onToggle,
  onDelete,
  onExport,
  onPrint,
  onMarkPaid,
  onMarkUnpaid,
}: Props) {
  const paid = batch.invoices.filter((i) => i.paid).length;
  const unpaid = batch.invoices.length - paid;
  const total = batch.invoices.reduce((a, i) => a + i.total, 0);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        isViewing
          ? "border-blue-500/40 bg-blue-500/[0.03]"
          : "border-zinc-900 bg-zinc-950"
      )}
    >
      {/* ── Batch Header ── */}
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
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
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
              <Button
                size="sm"
                variant="ghost"
                onClick={onExport}
                className="h-8 w-8 p-0 text-zinc-600 hover:text-white hover:bg-zinc-800"
              >
                <FileDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">
              Export batch
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">
              Delete batch
            </TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className={cn(
              "h-8 px-3 text-xs gap-1.5 transition-colors",
              isViewing
                ? "text-blue-400 hover:bg-blue-500/10"
                : "text-zinc-500 hover:text-white hover:bg-zinc-800"
            )}
          >
            {isViewing ? (
              <>
                <X className="w-3.5 h-3.5" /> Close
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> View
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Expandable Invoice Table ── */}
      {isViewing && (
        <div className="border-t border-zinc-900">
          <div className="rounded-b-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950/50">
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  {TABLE_HEADERS.map((h) => (
                    <TableHead
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 whitespace-nowrap"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.invoices.map((inv, idx) => (
                  <InvoiceTableRow
                    key={inv.invoiceNo}
                    row={inv}
                    isLastInBatch={idx === batch.invoices.length - 1}
                    batchName={batch.name}
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