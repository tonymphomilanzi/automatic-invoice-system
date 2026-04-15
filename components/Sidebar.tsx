// components/layout/Sidebar.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Landmark,
  FileText,
  Warehouse,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSettings } from "@/lib/settings-store";


// ── Nav items definition ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    group: "Core",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        label: "Invoicing",
        href: "/invoicing",
        icon: FileText,
        badge: null,
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        label: "Warehouse",
        href: "/warehouse",
        icon: Warehouse,
        badge: "New",
      },
      {
        label: "Bin Cards",
        href: "/bincards",
        icon: ClipboardList,
        badge: null,
      },
    ],
  },
  {
    group: "Finance",
    items: [
      {
        label: "Statements",
        href: "/statements",
        icon: BarChart3,
        badge: null,
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: TrendingUp,
        badge: null,
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  

  const [settings] = useSettings();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen bg-zinc-950 border-r border-zinc-900",
          "transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* ── Logo ── */}
<div className={cn(
  "flex items-center gap-3 px-4 py-5 border-b border-zinc-900",
  collapsed && "justify-center px-0"
)}>
  <div
    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
    style={{ background: settings.primaryColor }}
  >
    {settings.logoText || "AW"}
  </div>
  {!collapsed && (
    <div className="overflow-hidden">
      <p className="text-xs font-black tracking-widest text-white uppercase leading-none truncate max-w-[160px]">
        {settings.tradingName || "Affordable"}
      </p>
      <p className="text-[9px] text-zinc-500 uppercase tracking-wider leading-none mt-0.5">
        {settings.tagline || "Management"}
      </p>
    </div>
  )}
</div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              {/* Group Label */}
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  {group.group}
                </p>
              )}

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon
                        className={cn(
                          "flex-shrink-0",
                          collapsed ? "w-5 h-5" : "w-4 h-4"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge className="h-4 px-1.5 text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right" className="bg-zinc-800 border-zinc-700">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom Actions ── */}
        <div className="border-t border-zinc-900 p-2 space-y-0.5">
          {[
            { icon: Settings, label: "Settings", href: "/settings" },
          ].map(({ icon: Icon, label, href }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full",
                    "text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-900",
                    "transition-all duration-150",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="flex-shrink-0 w-4 h-4" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-zinc-800 border-zinc-700">
                  <p>{label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>

        {/* ── Collapse Toggle ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-20 z-10",
            "w-6 h-6 rounded-full border border-zinc-800 bg-zinc-950",
            "flex items-center justify-center",
            "text-zinc-500 hover:text-white hover:border-zinc-600",
            "transition-all duration-150"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}