// app/warehouse/page.tsx
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
  Plus, Search, Package, AlertTriangle,
  CheckCircle2, Edit2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWarehouse, useBinCardUnits, useBinCardCategories,
  genId, todayStr, type WarehouseItem,
} from "@/lib/store";

type DialogMode = "add" | "edit" | null;
const EMPTY: Omit<WarehouseItem, "id" | "lastUpdated"> = {
  name: "", category: "", unit: "", quantity: 0, minStock: 0, location: "",
};

export default function WarehousePage() {
  const [items, setItems] = useWarehouse();
  const [units] = useBinCardUnits();
  const [categories] = useBinCardCategories();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editTarget, setEditTarget] = useState<WarehouseItem | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseItem | null>(null);

  const filtered = useMemo(() => items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.location.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || i.category === categoryFilter;
    return matchSearch && matchCat;
  }), [items, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    lowStock: items.filter((i) => i.quantity <= i.minStock).length,
    outOfStock: items.filter((i) => i.quantity === 0).length,
  }), [items]);

  const openAdd = () => {
    setForm({ ...EMPTY, category: categories[0]?.label ?? "", unit: units[0]?.label ?? "" });
    setEditTarget(null);
    setDialogMode("add");
  };
  const openEdit = (item: WarehouseItem) => {
    setForm({ name: item.name, category: item.category, unit: item.unit, quantity: item.quantity, minStock: item.minStock, location: item.location });
    setEditTarget(item);
    setDialogMode("edit");
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (dialogMode === "add") {
      setItems((prev) => [...prev, { ...form, id: genId(), lastUpdated: todayStr() }]);
    } else if (editTarget) {
      setItems((prev) => prev.map((i) => i.id === editTarget.id ? { ...i, ...form, lastUpdated: todayStr() } : i));
    }
    setDialogMode(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const stockStatus = (item: WarehouseItem) => {
    if (item.quantity === 0) return { label: "Out of Stock", cls: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (item.quantity <= item.minStock) return { label: "Low Stock", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: "In Stock", cls: "bg-green-500/10 text-green-400 border-green-500/20" };
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Warehouse <span className="text-zinc-600">Management</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Manage inventory, stock levels and locations</p>
          </div>
          <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-500 h-10">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Items", value: stats.total, icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Low / Out of Stock", value: stats.lowStock, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
            { label: "Out of Stock", value: stats.outOfStock, icon: CheckCircle2, color: "text-red-400", bg: "bg-red-500/10" },
          ].map((s) => (
            <Card key={s.label} className="bg-zinc-950 border-zinc-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <Input placeholder="Search items, location..."
              className="pl-9 bg-zinc-950 border-zinc-800 h-10"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-10 bg-zinc-950 border-zinc-800"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
              <SelectItem value="All" className="text-zinc-300 focus:bg-zinc-900">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.label} className="text-zinc-300 focus:bg-zinc-900">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-zinc-900 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-950">
              <TableRow className="border-zinc-900 hover:bg-transparent">
                {["Item Name","Category","Location","Qty / Min","Unit","Status","Last Updated",""].map((h) => (
                  <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-zinc-700">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{items.length === 0 ? "No items yet. Add your first item." : "No items match your search."}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const status = stockStatus(item);
                  return (
                    <TableRow key={item.id} className="border-zinc-900 hover:bg-zinc-900/40">
                      <TableCell className="font-medium text-white text-sm">{item.name}</TableCell>
                      <TableCell><Badge className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">{item.category}</Badge></TableCell>
                      <TableCell className="text-zinc-400 text-xs">{item.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={cn("text-sm font-bold font-mono", item.quantity <= item.minStock ? "text-amber-400" : "text-white")}>
                            {item.quantity}
                          </span>
                          <span className="text-zinc-700 text-xs">/ {item.minStock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">{item.unit}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${status.cls}`}>{status.label}</Badge></TableCell>
                      <TableCell className="text-zinc-600 text-xs">{item.lastUpdated}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-white" onClick={() => openEdit(item)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400" onClick={() => setDeleteTarget(item)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={() => setDialogMode(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader><DialogTitle>{dialogMode === "add" ? "Add New Item" : "Edit Item"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Item Name", field: "name" as const, type: "text", placeholder: "e.g. Engine Oil" },
              { label: "Location", field: "location" as const, type: "text", placeholder: "e.g. Shelf B2" },
              { label: "Quantity", field: "quantity" as const, type: "number", placeholder: "0" },
              { label: "Minimum Stock Level", field: "minStock" as const, type: "number", placeholder: "0" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</Label>
                <Input type={type} placeholder={placeholder} value={form[field]}
                  onChange={(e) => setForm((f) => ({
                    ...f, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                  }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {categories.map((c) => <SelectItem key={c.id} value={c.label} className="text-zinc-300 focus:bg-zinc-900">{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {units.map((u) => <SelectItem key={u.id} value={u.label} className="text-zinc-300 focus:bg-zinc-900">{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogMode(null)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500">
              {dialogMode === "add" ? "Add Item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader><DialogTitle>Delete Item?</DialogTitle></DialogHeader>
          <p className="text-zinc-500 text-sm">Remove <span className="text-white font-medium">{deleteTarget?.name}</span>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="text-zinc-400">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-500">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}