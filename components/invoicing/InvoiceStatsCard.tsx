// components/invoicing/InvoiceStatsCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
  sub?: string;
  color?: string;
}

export function InvoiceStatsCard({
  title,
  value,
  icon: Icon,
  highlight = false,
  sub,
  color,
}: Props) {
  return (
    <Card
      className={cn(
        "bg-zinc-950 border-zinc-900",
        highlight && "ring-1 ring-blue-500/40"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {title}
        </CardTitle>
        <div className={color ?? (highlight ? "text-blue-400" : "text-zinc-600")}>
          <Icon size={13} />
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
        {sub && (
          <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}