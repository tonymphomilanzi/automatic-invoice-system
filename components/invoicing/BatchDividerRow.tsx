// components/invoicing/BatchDividerRow.tsx
"use client";

import React from "react";
import { Package2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

interface Props {
  batchName: string;
  colSpan?: number;
}

export function BatchDividerRow({ batchName, colSpan = 9 }: Props) {
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