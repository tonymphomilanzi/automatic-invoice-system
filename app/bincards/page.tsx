// app/bincards/page.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, ClipboardList, TrendingUp,
  TrendingDown, Printer, Trash2, Edit2,
  Settings2, Tag, Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBinCards, useBinCardUnits, useBinCardCategories,
  genId, todayStr, nowISO,
  type BinCard, type BinCardTransaction,
  type BinCardUnit, type BinCardCategory,
} from "@/lib/store";

export default function BinCardsPage() {
  const [cards, setCards] = useBinCards();
  const [units, setUnits] = useBinCardUnits();
  const [categories, setCategories] = useBinCardCategories();

  const [selectedCard, setSelectedCard] = useState<BinCard | null>(null);
  const [search, setSearch] = useState("");

  // Dialogs
  const [txDialog, setTxDialog] = useState(false);
  const [newCardDialog, setNewCardDialog] = useState(false);
  const [manageDialog, setManageDialog] = useState(false);
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");

  // Transaction form
  const [txForm, setTxForm] = useState({
    type: "Receipt" as "Receipt" | "Issue",
    quantity: 0, reference: "", remarks: "", issuedTo: "",
  });

  // New card form
  const [cardForm, setCardForm] = useState({
    itemName: "", unit: "", location: "", openingBalance: 0,
  });

  // ── Sync selected card when cards change ──
  const syncedSelected = useMemo(() => {
    if (!selectedCard) return null;
    return cards.find((c) => c.id === selectedCard.id) ?? null;
  }, [cards, selectedCard]);

  const filteredCards = useMemo(() =>
    cards.filter((c) =>
      c.itemName.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
    ), [cards, search]);

  const currentBalance = useMemo(() => {
    if (!syncedSelected) return 0;
    const txs = syncedSelected.transactions;
    return txs.length > 0 ? txs[txs.length - 1].balance : syncedSelected.openingBalance;
  }, [syncedSelected]);

  // ── Add Transaction ──
  const handleAddTransaction = () => {
    if (!syncedSelected || txForm.quantity <= 0) return;
    const prevBal = currentBalance;
    const newBal = txForm.type === "Receipt"
      ? prevBal + txForm.quantity
      : Math.max(0, prevBal - txForm.quantity);

    const tx: BinCardTransaction = {
      id: genId(), date: todayStr(),
      reference: txForm.reference || `${txForm.type.slice(0, 3).toUpperCase()}-${genId().slice(0, 4)}`,
      type: txForm.type, quantity: txForm.quantity, balance: newBal,
      remarks: txForm.remarks, issuedTo: txForm.issuedTo || undefined,
    };

    setCards((prev) =>
      prev.map((c) =>
        c.id === syncedSelected.id
          ? { ...c, transactions: [...c.transactions, tx] }
          : c
      )
    );
    setSelectedCard((prev) =>
      prev ? { ...prev, transactions: [...prev.transactions, tx] } : prev
    );
    setTxForm({ type: "Receipt", quantity: 0, reference: "", remarks: "", issuedTo: "" });
    setTxDialog(false);
  };

  // ── Add Bin Card ──
  const handleAddCard = () => {
    if (!cardForm.itemName.trim()) return;
    const newCard: BinCard = {
      id: genId(), itemName: cardForm.itemName, unit: cardForm.unit || units[0]?.label || "Units",
      location: cardForm.location, openingBalance: cardForm.openingBalance,
      transactions: [], createdAt: nowISO(),
    };
    setCards((prev) => [...prev, newCard]);
    setSelectedCard(newCard);
    setCardForm({ itemName: "", unit: "", location: "", openingBalance: 0 });
    setNewCardDialog(false);
  };

  // ���─ Delete Bin Card ──
  const handleDeleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCard?.id === id) setSelectedCard(null);
  };

  // ── Delete Transaction ──
  const handleDeleteTx = (txId: string) => {
    if (!syncedSelected) return;
    // Recalculate balances after removal
    const remaining = syncedSelected.transactions.filter((t) => t.id !== txId);
    let bal = syncedSelected.openingBalance;
    const recalc = remaining.map((t) => {
      bal = t.type === "Receipt" ? bal + t.quantity : Math.max(0, bal - t.quantity);
      return { ...t, balance: bal };
    });
    setCards((prev) =>
      prev.map((c) =>
        c.id === syncedSelected.id ? { ...c, transactions: recalc } : c
      )
    );
  };

  // ── Add/Remove Unit ──
  const handleAddUnit = () => {
    if (!newUnitLabel.trim()) return;
    setUnits((prev) => [...prev, { id: genId(), label: newUnitLabel.trim() }]);
    setNewUnitLabel("");
  };
  const handleDeleteUnit = (id: string) => setUnits((prev) => prev.filter((u) => u.id !== id));

  // ── Add/Remove Category ──
  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    setCategories((prev) => [...prev, { id: genId(), label: newCatLabel.trim() }]);
    setNewCatLabel("");
  };
  const handleDeleteCategory = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));

  // ── Print ──
  const printBinCard = () => {
    if (!syncedSelected) return;
    const rows = syncedSelected.transactions.map((tx) => `
      <tr>
        <td>${tx.date}</td><td>${tx.reference}</td>
        <td style="color:${tx.type === "Receipt" ? "#16a34a" : "#dc2626"}">${tx.type}</td>
        <td class="right">${tx.type === "Receipt" ? tx.quantity : ""}</td>
        <td class="right">${tx.type === "Issue" ? tx.quantity : ""}</td>
        <td class="right"><strong>${tx.balance}</strong></td>
        <td>${tx.remarks}${tx.issuedTo ? ` — ${tx.issuedTo}` : ""}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><title>Bin Card — ${syncedSelected.itemName}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;font-size:12px;color:#111}
      h1{font-size:18px;font-weight:900;color:#1e3a5f}
      .meta{display:flex;gap:40px;margin:12px 0 20px;font-size:11px;background:#f5f7fa;padding:10px;border-radius:4px}
      table{width:100%;border-collapse:collapse}
      th{background:#1e3a5f;color:white;padding:8px;text-align:left}
      td{border:1px solid #ddd;padding:7px}
      .right{text-align:right}
      .open-row td{background:#eef2f7;font-weight:600}
      @media print{@page{size:A4 portrait}}
    </style></head><body>
    <h1>BIN CARD — AFFORDABLE WHOLESALE & TRANSPORT</h1>
    <div class="meta">
      <div><strong>Item:</strong> ${syncedSelected.itemName}</div>
      <div><strong>Unit:</strong> ${syncedSelected.unit}</div>
      <div><strong>Location:</strong> ${syncedSelected.location}</div>
      <div><strong>Opening Balance:</strong> ${syncedSelected.openingBalance}</div>
      <div><strong>Current Balance:</strong> ${currentBalance}</div>
    </div>
    <table>
      <thead><tr><th>Date</th><th>Reference</th><th>Type</th><th class="right">Receipt</th><th class="right">Issue</th><th class="right">Balance</th><th>Remarks</th></tr></thead>
      <tbody>
        <tr class="open-row"><td colspan="5">Opening Balance</td><td class="right">${syncedSelected.openingBalance}</td><td>—</td></tr>
        ${rows}
      </tbody>
    </table>
    <p style="margin-top:16px;font-size:10px;color:#888">Printed on ${todayStr()} — Affordable Wholesale & Transport</p>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
    </body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Digital <span className="text-zinc-600">Bin Cards</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Track receipts and issues per inventory item</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"
              onClick={() => setManageDialog(true)}
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9">
              <Settings2 className="w-4 h-4 mr-1.5" /> Manage Lists
            </Button>
            <Button onClick={() => setNewCardDialog(true)} className="bg-blue-600 hover:bg-blue-500 h-9">
              <Plus className="w-4 h-4 mr-2" /> New Bin Card
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Card List */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <Input placeholder="Search bin cards..." className="pl-9 bg-zinc-950 border-zinc-800 h-9"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {filteredCards.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-zinc-700">
                <div className="text-center">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No bin cards yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredCards.map((card) => {
                  const bal = card.transactions.length > 0
                    ? card.transactions[card.transactions.length - 1].balance
                    : card.openingBalance;
                  const isSelected = selectedCard?.id === card.id;
                  return (
                    <div key={card.id} className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all group",
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30"
                        : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
                    )}>
                      <div className="flex items-center justify-between">
                        <button className="flex-1 text-left" onClick={() => setSelectedCard(card)}>
                          <p className={cn("text-sm font-bold", isSelected ? "text-white" : "text-zinc-300")}>{card.itemName}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{card.location} · {card.unit}</p>
                        </button>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={cn("text-lg font-black font-mono", isSelected ? "text-white" : "text-zinc-300")}>{bal}</p>
                            <p className="text-[10px] text-zinc-600">{card.transactions.length} entries</p>
                          </div>
                          <Button size="sm" variant="ghost"
                            onClick={() => handleDeleteCard(card.id)}
                            className="h-7 w-7 p-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bin Card Detail */}
          <div className="lg:col-span-2 space-y-4">
            {syncedSelected ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">{syncedSelected.itemName}</h3>
                    <p className="text-xs text-zinc-500">
                      {syncedSelected.location} · {syncedSelected.unit} · Opening: {syncedSelected.openingBalance}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={printBinCard}
                      className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9">
                      <Printer className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                    <Button size="sm" onClick={() => setTxDialog(true)} className="bg-blue-600 hover:bg-blue-500 h-9">
                      <Plus className="w-4 h-4 mr-1.5" /> Add Entry
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Balance", value: currentBalance, color: "text-white" },
                    { label: "Total Receipts", value: syncedSelected.transactions.filter((t) => t.type === "Receipt").reduce((a, t) => a + t.quantity, 0), color: "text-green-400" },
                    { label: "Total Issues", value: syncedSelected.transactions.filter((t) => t.type === "Issue").reduce((a, t) => a + t.quantity, 0), color: "text-red-400" },
                  ].map((s) => (
                    <Card key={s.label} className="bg-zinc-950 border-zinc-900">
                      <CardContent className="p-4">
                        <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{s.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Transactions Table */}
                <div className="rounded-xl border border-zinc-900 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-zinc-950">
                      <TableRow className="border-zinc-900 hover:bg-transparent">
                        {["Date","Reference","Type","Receipt","Issue","Balance","Remarks",""].map((h) => (
                          <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-zinc-900 bg-zinc-900/20">
                        <TableCell className="text-xs text-zinc-500" colSpan={5}>Opening Balance</TableCell>
                        <TableCell className="font-mono font-bold text-zinc-400">{syncedSelected.openingBalance}</TableCell>
                        <TableCell className="text-zinc-600 text-xs">—</TableCell>
                        <TableCell />
                      </TableRow>
                      {syncedSelected.transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-zinc-900 hover:bg-zinc-900/40 group">
                          <TableCell className="text-xs text-zinc-400">{tx.date}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-500">{tx.reference}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px]",
                              tx.type === "Receipt"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20")}>
                              {tx.type === "Receipt" ? <TrendingUp className="w-2.5 h-2.5 mr-1 inline" /> : <TrendingDown className="w-2.5 h-2.5 mr-1 inline" />}
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-400 font-mono text-sm font-bold">
                            {tx.type === "Receipt" ? `+${tx.quantity}` : ""}
                          </TableCell>
                          <TableCell className="text-red-400 font-mono text-sm font-bold">
                            {tx.type === "Issue" ? `-${tx.quantity}` : ""}
                          </TableCell>
                          <TableCell className="font-mono font-black text-white text-sm">{tx.balance}</TableCell>
                          <TableCell className="text-zinc-500 text-xs">
                            <div>{tx.remarks}</div>
                            {tx.issuedTo && <div className="text-zinc-700 text-[10px]">→ {tx.issuedTo}</div>}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost"
                              onClick={() => handleDeleteTx(tx.id)}
                              className="h-6 w-6 p-0 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {syncedSelected.transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-zinc-700 text-sm">
                            No entries yet. Click "Add Entry" to start.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-700">
                <div className="text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a bin card to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader><DialogTitle>Add Bin Card Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Transaction Type</Label>
              <Select value={txForm.type} onValueChange={(v: "Receipt" | "Issue") => setTxForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  <SelectItem value="Receipt" className="text-green-400 focus:bg-zinc-900">Receipt (Stock In)</SelectItem>
                  <SelectItem value="Issue" className="text-red-400 focus:bg-zinc-900">Issue (Stock Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Quantity", field: "quantity" as const, type: "number", placeholder: "0" },
              { label: "Reference No.", field: "reference" as const, type: "text", placeholder: "e.g. REC-001" },
              { label: "Remarks", field: "remarks" as const, type: "text", placeholder: "e.g. Fuel delivery" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</Label>
                <Input type={type} placeholder={placeholder} value={txForm[field]}
                  onChange={(e) => setTxForm((f) => ({
                    ...f, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                  }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40" />
              </div>
            ))}
            {txForm.type === "Issue" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Issued To</Label>
                <Input placeholder="e.g. Driver Banda" value={txForm.issuedTo}
                  onChange={(e) => setTxForm((f) => ({ ...f, issuedTo: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTxDialog(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleAddTransaction}
              className={txForm.type === "Receipt" ? "bg-green-700 hover:bg-green-600" : "bg-red-700 hover:bg-red-600"}>
              Add {txForm.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Bin Card Dialog */}
      <Dialog open={newCardDialog} onOpenChange={setNewCardDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader><DialogTitle>Create Bin Card</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Item Name", field: "itemName" as const, type: "text", placeholder: "e.g. Diesel Fuel" },
              { label: "Location", field: "location" as const, type: "text", placeholder: "e.g. Tank A" },
              { label: "Opening Balance", field: "openingBalance" as const, type: "number", placeholder: "0" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</Label>
                <Input type={type} placeholder={placeholder} value={cardForm[field]}
                  onChange={(e) => setCardForm((f) => ({
                    ...f, [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
                  }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40" />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Unit of Measure</Label>
              <Select value={cardForm.unit || units[0]?.label} onValueChange={(v) => setCardForm((f) => ({ ...f, unit: v }))}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {units.map((u) => <SelectItem key={u.id} value={u.label} className="text-zinc-300 focus:bg-zinc-900">{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewCardDialog(false)} className="text-zinc-400">Cancel</Button>
            <Button onClick={handleAddCard} className="bg-blue-600 hover:bg-blue-500">Create Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Units & Categories */}
      <Dialog open={manageDialog} onOpenChange={setManageDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader><DialogTitle>Manage Lists</DialogTitle></DialogHeader>
          <Tabs defaultValue="units" className="mt-2">
            <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
              <TabsTrigger value="units" className="flex-1 data-[state=active]:bg-zinc-800">
                <Ruler className="w-3.5 h-3.5 mr-1.5" /> Units
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1 data-[state=active]:bg-zinc-800">
                <Tag className="w-3.5 h-3.5 mr-1.5" /> Categories
              </TabsTrigger>
            </TabsList>

            {/* Units Tab */}
            <TabsContent value="units" className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input placeholder="New unit name..." value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddUnit()}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 h-9" />
                <Button onClick={handleAddUnit} size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 px-4">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                    <span className="text-sm text-zinc-300">{u.label}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteUnit(u.id)}
                      className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="mt-4 space-y-3">
              <div className="flex gap-2">
                <Input placeholder="New category name..." value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 h-9" />
                <Button onClick={handleAddCategory} size="sm" className="bg-blue-600 hover:bg-blue-500 h-9 px-4">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2">
                    <span className="text-sm text-zinc-300">{c.label}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(c.id)}
                      className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setManageDialog(false)} className="bg-zinc-800 hover:bg-zinc-700">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}