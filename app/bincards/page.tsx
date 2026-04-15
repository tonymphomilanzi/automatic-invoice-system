// app/bincards/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus, Search, ClipboardList, TrendingUp,
  TrendingDown, Printer, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BinCardTransaction {
  id: string;
  date: string;
  reference: string;
  type: "Receipt" | "Issue";
  quantity: number;
  balance: number;
  remarks: string;
  issuedTo?: string;
}

interface BinCard {
  id: string;
  itemName: string;
  unit: string;
  location: string;
  openingBalance: number;
  transactions: BinCardTransaction[];
}

const genId = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const today = () => new Date().toLocaleDateString("en-GB");

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_CARDS: BinCard[] = [
  {
    id: genId(), itemName: "Diesel Fuel", unit: "Litres",
    location: "Tank A", openingBalance: 3000,
    transactions: [
      { id: genId(), date: "01/06/2025", reference: "REC-001", type: "Receipt", quantity: 1000, balance: 4000, remarks: "Fuel delivery" },
      { id: genId(), date: "03/06/2025", reference: "ISS-001", type: "Issue", quantity: 600, balance: 3400, remarks: "Vehicle MWK 1234", issuedTo: "Driver Banda" },
      { id: genId(), date: "05/06/2025", reference: "ISS-002", type: "Issue", quantity: 400, balance: 3000, remarks: "Vehicle MWK 5678", issuedTo: "Driver Phiri" },
    ],
  },
  {
    id: genId(), itemName: "Engine Oil 15W-40", unit: "Litres",
    location: "Shelf B2", openingBalance: 60,
    transactions: [
      { id: genId(), date: "02/06/2025", reference: "REC-002", type: "Receipt", quantity: 40, balance: 100, remarks: "Purchase order #44" },
      { id: genId(), date: "04/06/2025", reference: "ISS-003", type: "Issue", quantity: 15, balance: 85, remarks: "Service MWK-1234", issuedTo: "Mechanic John" },
    ],
  },
];

export default function BinCardsPage() {
  const [cards, setCards] = useState<BinCard[]>(DEMO_CARDS);
  const [selectedCard, setSelectedCard] = useState<BinCard | null>(DEMO_CARDS[0]);
  const [search, setSearch] = useState("");
  const [txDialog, setTxDialog] = useState(false);
  const [newCardDialog, setNewCardDialog] = useState(false);

  // Transaction form
  const [txForm, setTxForm] = useState({
    type: "Receipt" as "Receipt" | "Issue",
    quantity: 0, reference: "", remarks: "", issuedTo: "",
  });

  // New card form
  const [cardForm, setCardForm] = useState({ itemName: "", unit: "Litres", location: "", openingBalance: 0 });

  // Filtered cards list
  const filteredCards = useMemo(() =>
    cards.filter((c) =>
      c.itemName.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase())
    ), [cards, search]);

  // Current balance of selected card
  const currentBalance = useMemo(() => {
    if (!selectedCard) return 0;
    const txs = selectedCard.transactions;
    return txs.length > 0 ? txs[txs.length - 1].balance : selectedCard.openingBalance;
  }, [selectedCard]);

  // Add transaction
  const handleAddTransaction = () => {
    if (!selectedCard || txForm.quantity <= 0) return;

    const prevBalance = currentBalance;
    const newBalance =
      txForm.type === "Receipt"
        ? prevBalance + txForm.quantity
        : Math.max(0, prevBalance - txForm.quantity);

    const tx: BinCardTransaction = {
      id: genId(),
      date: today(),
      reference: txForm.reference || `${txForm.type.slice(0, 3).toUpperCase()}-${genId().slice(0, 4)}`,
      type: txForm.type,
      quantity: txForm.quantity,
      balance: newBalance,
      remarks: txForm.remarks,
      issuedTo: txForm.issuedTo || undefined,
    };

    const updated = cards.map((c) =>
      c.id === selectedCard.id
        ? { ...c, transactions: [...c.transactions, tx] }
        : c
    );
    setCards(updated);
    setSelectedCard(updated.find((c) => c.id === selectedCard.id) || null);
    setTxForm({ type: "Receipt", quantity: 0, reference: "", remarks: "", issuedTo: "" });
    setTxDialog(false);
  };

  // Add new bin card
  const handleAddCard = () => {
    if (!cardForm.itemName.trim()) return;
    const newCard: BinCard = {
      id: genId(),
      itemName: cardForm.itemName,
      unit: cardForm.unit,
      location: cardForm.location,
      openingBalance: cardForm.openingBalance,
      transactions: [],
    };
    setCards((prev) => [...prev, newCard]);
    setSelectedCard(newCard);
    setCardForm({ itemName: "", unit: "Litres", location: "", openingBalance: 0 });
    setNewCardDialog(false);
  };

  // Print bin card
  const printBinCard = () => {
    if (!selectedCard) return;
    const rows = selectedCard.transactions.map((tx) => `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.reference}</td>
        <td style="color:${tx.type === "Receipt" ? "#16a34a" : "#dc2626"}">${tx.type}</td>
        <td class="right">${tx.type === "Receipt" ? tx.quantity : ""}</td>
        <td class="right">${tx.type === "Issue" ? tx.quantity : ""}</td>
        <td class="right"><strong>${tx.balance}</strong></td>
        <td>${tx.remarks}${tx.issuedTo ? ` — ${tx.issuedTo}` : ""}</td>
      </tr>`).join("");

    const html = `
      <!DOCTYPE html><html><head><title>Bin Card — ${selectedCard.itemName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; font-size: 12px; color: #111; }
        h1 { font-size: 18px; font-weight: 900; color: #1e3a5f; }
        .meta { display: flex; gap: 40px; margin: 12px 0 20px; font-size: 11px; background: #f5f7fa; padding: 10px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: white; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 7px; }
        .right { text-align: right; }
        @media print { @page { size: A4 portrait; } }
      </style></head><body>
      <h1>BIN CARD</h1>
      <div class="meta">
        <div><strong>Item:</strong> ${selectedCard.itemName}</div>
        <div><strong>Unit:</strong> ${selectedCard.unit}</div>
        <div><strong>Location:</strong> ${selectedCard.location}</div>
        <div><strong>Opening Balance:</strong> ${selectedCard.openingBalance}</div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Reference</th><th>Type</th><th class="right">Receipt</th><th class="right">Issue</th><th class="right">Balance</th><th>Remarks</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:20px; font-size:10px; color:#888">Printed on ${today()} — Affordable Wholesale & Transport</p>
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

        {/* Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Digital <span className="text-zinc-600">Bin Cards</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Track receipts and issues for each inventory item</p>
          </div>
          <Button onClick={() => setNewCardDialog(true)} className="bg-blue-600 hover:bg-blue-500 h-10">
            <Plus className="w-4 h-4 mr-2" /> New Bin Card
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Card List ── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <Input
                placeholder="Search bin cards..."
                className="pl-9 bg-zinc-950 border-zinc-800 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              {filteredCards.map((card) => {
                const bal = card.transactions.length > 0
                  ? card.transactions[card.transactions.length - 1].balance
                  : card.openingBalance;
                const isSelected = selectedCard?.id === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all duration-150",
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30 text-white"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{card.itemName}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{card.location} · {card.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black font-mono">{bal}</p>
                        <p className="text-[10px] text-zinc-600">{card.transactions.length} entries</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Bin Card Detail ── */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCard ? (
              <>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white">{selectedCard.itemName}</h3>
                    <p className="text-xs text-zinc-500">
                      {selectedCard.location} · {selectedCard.unit} · Opening: {selectedCard.openingBalance}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={printBinCard}
                      className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white h-9"
                    >
                      <Printer className="w-4 h-4 mr-1.5" /> Print
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setTxDialog(true)}
                      className="bg-blue-600 hover:bg-blue-500 h-9"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add Entry
                    </Button>
                  </div>
                </div>

                {/* Balance Card */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Current Balance", value: currentBalance,
                      color: "text-white", bg: "bg-blue-500/10",
                    },
                    {
                      label: "Total Receipts",
                      value: selectedCard.transactions.filter((t) => t.type === "Receipt").reduce((a, t) => a + t.quantity, 0),
                      color: "text-green-400", bg: "bg-green-500/10",
                    },
                    {
                      label: "Total Issues",
                      value: selectedCard.transactions.filter((t) => t.type === "Issue").reduce((a, t) => a + t.quantity, 0),
                      color: "text-red-400", bg: "bg-red-500/10",
                    },
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
                        {["Date", "Reference", "Type", "Receipt", "Issue", "Balance", "Remarks"].map((h) => (
                          <TableHead key={h} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow className="border-zinc-900 bg-zinc-900/20">
                        <TableCell className="text-xs text-zinc-500" colSpan={5}>Opening Balance</TableCell>
                        <TableCell className="font-mono font-bold text-zinc-400">{selectedCard.openingBalance}</TableCell>
                        <TableCell className="text-zinc-600 text-xs">—</TableCell>
                      </TableRow>

                      {selectedCard.transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-zinc-900 hover:bg-zinc-900/40">
                          <TableCell className="text-xs text-zinc-400">{tx.date}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-500">{tx.reference}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-[10px]",
                                tx.type === "Receipt"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              )}
                            >
                              {tx.type === "Receipt" ? (
                                <TrendingUp className="w-2.5 h-2.5 mr-1 inline" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5 mr-1 inline" />
                              )}
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-400 font-mono text-sm font-bold">
                            {tx.type === "Receipt" ? `+${tx.quantity}` : ""}
                          </TableCell>
                          <TableCell className="text-red-400 font-mono text-sm font-bold">
                            {tx.type === "Issue" ? `-${tx.quantity}` : ""}
                          </TableCell>
                          <TableCell className="font-mono font-black text-white text-sm">
                            {tx.balance}
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs">
                            <div>{tx.remarks}</div>
                            {tx.issuedTo && (
                              <div className="text-zinc-700 text-[10px]">→ {tx.issuedTo}</div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}

                      {selectedCard.transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-zinc-700 text-sm">
                            No transactions yet. Add the first entry.
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
          <DialogHeader>
            <DialogTitle>Add Bin Card Entry</DialogTitle>
          </DialogHeader>
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
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={txForm[field]}
                  onChange={(e) => setTxForm((f) => ({
                    ...f,
                    [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                  }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </div>
            ))}
            {txForm.type === "Issue" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Issued To</Label>
                <Input
                  placeholder="e.g. Driver Banda"
                  value={txForm.issuedTo}
                  onChange={(e) => setTxForm((f) => ({ ...f, issuedTo: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTxDialog(false)} className="text-zinc-400">Cancel</Button>
            <Button
              onClick={handleAddTransaction}
              className={txForm.type === "Receipt" ? "bg-green-700 hover:bg-green-600" : "bg-red-700 hover:bg-red-600"}
            >
              Add {txForm.type}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Bin Card Dialog */}
      <Dialog open={newCardDialog} onOpenChange={setNewCardDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Bin Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Item Name", field: "itemName" as const, type: "text", placeholder: "e.g. Diesel Fuel" },
              { label: "Location", field: "location" as const, type: "text", placeholder: "e.g. Tank A" },
              { label: "Opening Balance", field: "openingBalance" as const, type: "number", placeholder: "0" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">{label}</Label>
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={cardForm[field]}
                  onChange={(e) => setCardForm((f) => ({
                    ...f,
                    [field]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                  }))}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">Unit of Measure</Label>
              <Select value={cardForm.unit} onValueChange={(v) => setCardForm((f) => ({ ...f, unit: v }))}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {["Litres", "Units", "Bags", "Kg", "Tonnes", "Boxes"].map((u) => (
                    <SelectItem key={u} value={u} className="text-zinc-300 focus:bg-zinc-900">{u}</SelectItem>
                  ))}
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
    </AppShell>
  );
}