// app/pods/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus, Search, FileCheck, Truck,
  Route, Trash2, Download, UserCheck,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  usePODs, useDrivers,
  genId, nowISO, todayStr,
  type PODEntry, type Driver,
} from "@/lib/store";
import * as XLSX from "xlsx";

const EMPTY_POD: Omit<PODEntry, "id" | "savedAt"> = {
  date: todayStr(), tmsId: "", regNo: "", loadedFrom: "",
  orderNo: "", pOrder: "", atl: "", route: "", tons: 0, driver: "",
};

export default function PODsPage() {
  const [pods, setPods] = usePODs();
  const [drivers, setDrivers] = useDrivers();

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoute, setFilterRoute] = useState("");

  const [addDialog, setAddDialog] = useState(false);
  const [driverDialog, setDriverDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PODEntry | null>(null);
  const [newDriverName, setNewDriverName] = useState("");

  const [form, setForm] = useState(EMPTY_POD);

  // ── Unique routes for filter ──
  const routes = useMemo(() =>
    [...new Set(pods.map((p) => p.route).filter(Boolean))].sort(),
    [pods]);

  // ── Filtered ──
  const filtered = useMemo(() => {
    return pods.filter((p) => {
      const matchSearch =
        p.tmsId.toLowerCase().includes(search.toLowerCase()) ||
        p.regNo.toLowerCase().includes(search.toLowerCase()) ||
        p.driver.toLowerCase().includes(search.toLowerCase()) ||
        p.atl.toLowerCase().includes(search.toLowerCase()) ||
        p.orderNo.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterDate || p.date === filterDate;
      const matchRoute = !filterRoute || p.route === filterRoute;
      return matchSearch && matchDate && matchRoute;
    });
  }, [pods, search, filterDate, filterRoute]);

  const stats = useMemo(() => ({
    total: pods.length,
    today: pods.filter((p) => p.date === todayStr()).length,
    totalTons: pods.reduce((a, p) => a + p.tons, 0),
    routes: new Set(pods.map((p) => p.route)).size,
  }), [pods]);

  // ── Handlers ──
  const handleSavePOD = () => {
    if (!form.tmsId.trim() || !form.regNo.trim()) return;
    setPods((prev) => [
      { ...form, id: genId(), savedAt: nowISO() },
      ...prev,
    ]);
    setForm(EMPTY_POD);
    setAddDialog(false);
  };

  const handleDeletePOD = () => {
    if (!deleteTarget) return;
    setPods((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleAddDriver = () => {
    if (!newDriverName.trim()) return;
    setDrivers((prev) => [...prev, { id: genId(), name: newDriverName.trim() }]);
    setNewDriverName("");
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  const exportPODs = () => {
    if (filtered.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filtered.map((p) => ({
      "Date": p.date,
      "TMS ID": p.tmsId,
      "Reg No": p.regNo,
      "Loaded From": p.loadedFrom,
      "Order No": p.orderNo,
      "P/Order": p.pOrder,
      "ATL": p.atl,
      "Route": p.route,
      "Tons": p.tons,
      "Driver": p.driver,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PODs");
    XLSX.writeFile(wb, `PODs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const setField = (field: keyof typeof EMPTY_POD, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Proof of <span className="text-zinc-600">Delivery</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Record and track delivery PODs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setDriverDialog(true)}
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-10">
              <UserCheck className="w-4 h-4 mr-1.5" /> Manage Drivers
            </Button>
            <Button variant="outline" size="sm"
              onClick={exportPODs}
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-10">
              <Download className="w-4 h-4 mr-1.5" /> Export
            </Button>
            <Button onClick={() => setAddDialog(true)} className="bg-blue-600 hover:bg-blue-500 h-10">
              <Plus className="w-4 h-4 mr-2" /> Add POD
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total PODs", value: stats.total.toString(), icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Today", value: stats.today.toString(), icon: FileCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Total Tons", value: stats.totalTons.toFixed(2), icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Routes", value: stats.routes.toString(), icon: Route, color: "text-violet-400", bg: "bg-violet-500/10" },
          ].map((s) => (
            <Card key={s.label} className="bg-zinc-950 border-zinc-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white font-mono">{s.value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input placeholder="Search TMS ID, Reg No, ATL, Driver..."
              className="pl-9 bg-zinc-950 border-zinc-800 h-10"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input
            placeholder="Filter by date (DD/MM/YYYY)"
            className="bg-zinc-950 border-zinc-800 h-10 w-52"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Select value={filterRoute || "all"} onValueChange={(v) => setFilterRoute(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48 h-10 bg-zinc-950 border-zinc-800">
              <Filter className="w-3.5 h-3.5 mr-2 text-zinc-600" />
              <SelectValue placeholder="All Routes" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
              <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-900">All Routes</SelectItem>
              {routes.map((r) => (
                <SelectItem key={r} value={r} className="text-zinc-300 focus:bg-zinc-900">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(filterDate || filterRoute) && (
            <Button variant="ghost" size="sm"
              onClick={() => { setFilterDate(""); setFilterRoute(""); }}
              className="text-zinc-500 hover:text-white h-10 px-3">
              Clear Filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-900 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-900 hover:bg-transparent">
                {["Date","TMS ID","Reg No","Loaded From","Order / P-Order","ATL","Route","Tons","Driver",""].map((h) => (
                  <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center text-zinc-700">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{pods.length === 0 ? "No PODs recorded yet." : "No PODs match your filters."}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pod) => (
                  <TableRow key={pod.id} className="border-zinc-900 hover:bg-zinc-900/40">
                    <TableCell className="text-xs text-zinc-300 whitespace-nowrap">{pod.date}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-400">{pod.tmsId}</TableCell>
                    <TableCell>
                      <Badge className="font-mono text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300">{pod.regNo}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400 max-w-[120px] truncate">{pod.loadedFrom}</TableCell>
                    <TableCell>
                      <div className="text-xs text-zinc-400">{pod.orderNo}</div>
                      <div className="text-[10px] text-zinc-600">{pod.pOrder}</div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">{pod.atl}</TableCell>
                    <TableCell>
                      <Badge className="text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20 whitespace-nowrap">
                        <Route className="w-2.5 h-2.5 mr-1 inline" />{pod.route}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-white">{pod.tons}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <UserCheck className="w-2.5 h-2.5 text-blue-400" />
                        </div>
                        <span className="text-xs text-zinc-300">{pod.driver}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost"
                        onClick={() => setDeleteTarget(pod)}
                        className="h-7 w-7 p-0 text-zinc-700 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filtered.length > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-zinc-700">
              {filtered.length} of {pods.length} records
            </p>
            <div className="bg-zinc-950 border border-zinc-900 rounded-lg px-4 py-2 flex gap-6">
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Total Tons (filtered)</p>
                <p className="text-sm font-mono font-black text-white">
                  {filtered.reduce((a, p) => a + p.tons, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Deliveries</p>
                <p className="text-sm font-mono font-black text-white">{filtered.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add POD Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Record New POD</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              { label: "Date", field: "date" as const, type: "text", placeholder: "DD/MM/YYYY", full: false },
              { label: "TMS ID", field: "tmsId" as const, type: "text", placeholder: "TMS-001", full: false },
              { label: "Reg No", field: "regNo" as const, type: "text", placeholder: "MWK 1234", full: false },
              { label: "Loaded From", field: "loadedFrom" as const, type: "text", placeholder: "e.g. Nchalo", full: false },
              { label: "Order No", field: "orderNo" as const, type: "text", placeholder: "ORD-001", full: false },
              { label: "P/Order", field: "pOrder" as const, type: "text", placeholder: "PO-001", full: false },
              { label: "ATL", field: "atl" as const, type: "text", placeholder: "ATL No.", full: false },
              { label: "Route", field: "route" as const, type: "text", placeholder: "e.g. Nchalo → Mangochi", full: false },
              { label: "Tons", field: "tons" as const, type: "number", placeholder: "0.00", full: false },
            ].map(({ label, field, type, placeholder, full }) => (
              <div key={field} className={cn("space-y-1.5", full && "col-span-2")}>
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</Label>
                <Input type={type} placeholder={placeholder} value={form[field]}
                  onChange={(e) => setField(field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 h-9" />
              </div>
            ))}

            {/* Driver Dropdown */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Driver</Label>
              <Select value={form.driver} onValueChange={(v) => setField("driver", v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 h-9">
                  <SelectValue placeholder="Select driver..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {drivers.map((d) => (
                    <SelectItem key={d.id} value={d.name} className="text-zinc-300 focus:bg-zinc-900">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                        {d.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialog(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSavePOD} className="bg-blue-600 hover:bg-blue-500">
              Save POD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader><DialogTitle>Delete POD?</DialogTitle></DialogHeader>
          <p className="text-zinc-500 text-sm">
            Remove POD <span className="text-white font-mono">{deleteTarget?.tmsId}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-zinc-400">Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePOD} className="bg-red-600 hover:bg-red-500">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Drivers Dialog */}
      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader><DialogTitle>Manage Drivers</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input placeholder="Driver name..."
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDriver()}
                className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 h-9" />
              <Button onClick={handleAddDriver} size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 px-4">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {drivers.map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <UserCheck className="w-3 h-3 text-blue-400" />
                    </div>
                    <span className="text-sm text-zinc-300">{d.name}</span>
                  </div>
                  <Button size="sm" variant="ghost"
                    onClick={() => handleDeleteDriver(d.id)}
                    className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-center text-zinc-700 text-sm py-4">No drivers added yet.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDriverDialog(false)} className="bg-zinc-800 hover:bg-zinc-700">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}