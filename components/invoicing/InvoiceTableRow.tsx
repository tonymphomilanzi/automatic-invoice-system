// components/invoicing/InvoiceTableRow.tsx
"use client";

import React from "react";
import {
  Printer, CheckCircle2, Ban, DollarSign, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TableCell, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/store";
import type { InvoiceRow } from "@/lib/store";

interface Props {
  row: InvoiceRow;
  isLastInBatch: boolean;
  batchName: string;
  onPrint: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
}

export function InvoiceTableRow({
  row,
  isLastInBatch,
  batchName,
  onPrint,
  onMarkPaid,
  onMarkUnpaid,
}: Props) {
  return (
    <TableRow
      className={cn(
        "border-zinc-900 transition-colors",
        isLastInBatch
          ? "border-b-2 border-b-blue-500/40 bg-blue-500/[0.03]"
          : row.paid
          ? "bg-green-500/[0.03] hover:bg-green-500/[0.06]"
          : row.printed
          ? "bg-zinc-900/20 hover:bg-zinc-900/40"
          : "hover:bg-zinc-900/30"
      )}
    >
      {/* Invoice No */}
      <TableCell className="font-mono text-xs font-bold text-blue-400">
        <div className="flex items-center gap-2">
          {isLastInBatch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-zinc-800 border-zinc-700 text-xs max-w-xs"
              >
                <p className="font-bold">Batch end</p>
                <p className="text-zinc-400 mt-0.5">
                  Last invoice in {batchName}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <span>{row.invoiceNo}</span>
        </div>
        {row.printedAt && (
          <div className="text-[9px] text-zinc-700 font-normal mt-0.5 ml-3.5">
            {new Date(row.printedAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </TableCell>

      {/* Dates */}
      <TableCell>
        <div className="text-xs text-zinc-300">{row.formattedDate}</div>
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
        <div className="text-xs text-zinc-300 max-w-[140px] truncate">
          {row.loadedFrom}
        </div>
        <div className="text-[10px] text-zinc-600 max-w-[140px] truncate">
          → {row.deliveredTo}
        </div>
      </TableCell>

      {/* ATL */}
      <TableCell className="text-xs text-zinc-500">{row.atl}</TableCell>

      {/* Tons × Rate */}
      <TableCell>
        <div className="text-xs text-zinc-300 font-mono">{row.tons}t</div>
        <div className="text-[10px] text-zinc-600">
          × {formatMoney(row.rate)}
        </div>
      </TableCell>

      {/* Total */}
      <TableCell className="text-right">
        <div className="font-mono font-bold text-white text-sm">
          {formatMoney(row.total)}
        </div>
        <div className="text-[10px] text-zinc-700 font-normal">
          VAT {formatMoney(row.vat)}
        </div>
      </TableCell>

      {/* Payment */}
      <TableCell>
        {row.paid ? (
          <div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] whitespace-nowrap">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Paid
            </Badge>
            {row.paidAt && (
              <div className="text-[9px] text-zinc-600 mt-0.5">
                {row.paidAt}
              </div>
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
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrint}
                className={cn(
                  "h-7 w-7 p-0 rounded-full",
                  row.printed
                    ? "text-green-500 hover:bg-green-500/10"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                )}
              >
                {row.printed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700">
              {row.printed ? "Reprint" : "Print"}
            </TooltipContent>
          </Tooltip>

          {row.paid ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMarkUnpaid}
                  className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
                >
                  <Ban className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700">
                Mark unpaid
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onMarkPaid}
                  className="h-7 w-7 p-0 rounded-full text-zinc-500 hover:text-green-400 hover:bg-green-500/10"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700">
                Mark paid
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}