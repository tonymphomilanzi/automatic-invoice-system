// components/invoicing/SessionInvoiceTable.tsx
"use client";

import React from "react";
import {
  Table, TableBody, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { InvoiceTableRow } from "./InvoiceTableRow";
import { BatchDividerRow } from "./BatchDividerRow";
import type { InvoiceRow } from "@/lib/store";

interface RowData {
  invoice: InvoiceRow;
  batchId: string;
  batchName: string;
  isLastInBatch: boolean;
  isFirstInBatch: boolean;
}

interface Props {
  rows: RowData[];
  onPrint: (inv: InvoiceRow, batchId: string) => void;
  onMarkPaid: (inv: InvoiceRow, batchId: string) => void;
  onMarkUnpaid: (invNo: string, batchId: string) => void;
}

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

export function SessionInvoiceTable({
  rows,
  onPrint,
  onMarkPaid,
  onMarkUnpaid,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-900 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-950">
          <TableRow className="border-zinc-900 hover:bg-transparent">
            {TABLE_HEADERS.map((h) => (
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
          {rows.map(
            (
              { invoice, batchId, batchName, isLastInBatch, isFirstInBatch },
              idx
            ) => (
              <React.Fragment key={invoice.invoiceNo}>
                {isFirstInBatch && idx > 0 && (
                  <BatchDividerRow batchName={batchName} colSpan={9} />
                )}
                <InvoiceTableRow
                  row={invoice}
                  isLastInBatch={isLastInBatch}
                  batchName={batchName}
                  onPrint={() => onPrint(invoice, batchId)}
                  onMarkPaid={() => onMarkPaid(invoice, batchId)}
                  onMarkUnpaid={() => onMarkUnpaid(invoice.invoiceNo, batchId)}
                />
              </React.Fragment>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}