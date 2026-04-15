// components/layout/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  User,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map routes to readable titles
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Welcome back" },
  "/invoicing": { title: "Invoicing", subtitle: "Logistics invoice management" },
  "/warehouse": { title: "Warehouse", subtitle: "Stock & inventory management" },
  "/bincards": { title: "Bin Cards", subtitle: "Digital bin card system" },
  "/statements": { title: "Statements", subtitle: "Financial statement generation" },
  "/analytics": { title: "Analytics", subtitle: "Business insights & reports" },
  "/settings": { title: "Settings", subtitle: "System configuration" },
};

export default function Header() {
  const pathname = usePathname();

  // Match the most specific route
  const routeKey =
    Object.keys(PAGE_TITLES)
      .filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] || "/";

  const { title, subtitle } = PAGE_TITLES[routeKey];

  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 gap-4 flex-shrink-0">
      {/* Page Title */}
      <div>
        <h1 className="text-base font-bold text-white leading-none">{title}</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Global Search */}
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
        <Input
          placeholder="Search anything..."
          className="pl-9 h-9 bg-zinc-900 border-zinc-800 text-sm focus:border-blue-500/50 focus:ring-0"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Admin Badge */}
        <Badge className="hidden sm:flex gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20 font-normal">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-zinc-500 hover:text-white hover:bg-zinc-900"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-2 text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm hidden sm:block">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-zinc-950 border-zinc-800"
          >
            <DropdownMenuLabel className="text-zinc-400 text-xs">
              Affordable Wholesale
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-900">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-zinc-300 hover:text-white focus:bg-zinc-900">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-red-400 hover:text-red-300 focus:bg-zinc-900">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}