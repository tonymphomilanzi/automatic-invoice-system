"use client";

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, Download, Trash2, FileSpreadsheet, Search, 
  Printer, CheckCircle2, AlertCircle, Info, Landmark
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";

// --- CONFIGURATION & UTILS ---
const VAT_RATE = 0.175;
const INVOICE_PREFIX = "AF";
const START_NUMBER = 80;
const CURRENT_YEAR = new Date().getFullYear();

const formatMoney = (val: number) => new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(val);

const formatDate = (excelDate: any) => {
  if (!excelDate) return "N/A";
  if (typeof excelDate === "number") {
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    return jsDate.toLocaleDateString("en-GB");
  }
  return String(excelDate);
};

export default function ProfessionalInvoicing() {
  // --- STATE ---
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [counter, setCounter] = useState(START_NUMBER);
  const [printedIds, setPrintedIds] = useState<string[]>([]);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedCounter = localStorage.getItem(`inv_counter_${CURRENT_YEAR}`);
    const savedPrinted = localStorage.getItem(`inv_printed_${CURRENT_YEAR}`);
    if (savedCounter) setCounter(parseInt(savedCounter));
    if (savedPrinted) setPrintedIds(JSON.parse(savedPrinted));
  }, []);

  useEffect(() => {
    localStorage.setItem(`inv_counter_${CURRENT_YEAR}`, counter.toString());
    localStorage.setItem(`inv_printed_${CURRENT_YEAR}`, JSON.stringify(printedIds));
  }, [counter, printedIds]);

  // --- LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      
      let tempCounter = counter;
      const processed = rows.map((row) => {
        const tons = parseFloat(row.Tons) || 0;
        const rate = parseFloat(row.Rate) || 0;
        const amount = tons * rate;
        const vat = amount * VAT_RATE;
        const invNo = `${INVOICE_PREFIX}-${CURRENT_YEAR}-${String(tempCounter++).padStart(4, "0")}`;
        
        return {
          ...row,
          invoiceNo: invNo,
          formattedDate: formatDate(row.Date),
          despatchDate: formatDate(row["Despatch Date"]),
          amount,
          vat,
          total: amount + vat
        };
      });

      setCounter(tempCounter);
      setData(processed);
    };
    reader.readAsBinaryString(file);
  };

  const markAsPrinted = (id: string) => {
    if (!printedIds.includes(id)) setPrintedIds(prev => [...prev, id]);
  };

  const exportProcessedExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, `Invoices_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- FILTERING & TOTALS ---
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item["Loaded From"]?.toLowerCase().includes(search.toLowerCase()) || 
      item["Delivered To"]?.toLowerCase().includes(search.toLowerCase()) ||
      item.ATL?.toString().includes(search)
    );
  }, [data, search]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      amount: acc.amount + curr.amount,
      vat: acc.vat + curr.vat,
      total: acc.total + curr.total
    }), { amount: 0, vat: 0, total: 0 });
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-200 p-6 md:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* TOP NAVIGATION & STATS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="text-blue-500 w-6 h-6" />
              <span className="text-sm font-bold tracking-widest text-blue-500 uppercase">AFFORDABLE WHOLESALE</span><span className="text-sm text-zinc-500">Logistics Invoicing</span> 
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">
              Automatic <span className="text-zinc-500">Invoicing</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
             <Card className="bg-zinc-950 border-zinc-900 px-6 py-2">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Next Invoice</p>
                <p className="text-xl font-mono text-white tracking-tighter">
                    {INVOICE_PREFIX}-{CURRENT_YEAR}-{String(counter).padStart(4, "0")}
                </p>
             </Card>
             <Button 
                variant="destructive" 
                className="h-full bg-red-950/20 border border-red-900/50 text-red-500 hover:bg-red-900/40"
                onClick={() => setIsResetOpen(true)}
             >
                <Trash2 className="w-4 h-4 mr-2" /> Reset Counter
             </Button>
          </div>
        </div>

        {/* ANALYTICS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Total Subtotal" value={`MWK ${formatMoney(totals.amount)}`} icon={<Info />} color="text-zinc-400" />
            <StatsCard title="Total VAT (17.5%)" value={`MWK ${formatMoney(totals.vat)}`} icon={<AlertCircle />} color="text-zinc-400" />
            <StatsCard title="Grand Total" value={`MWK ${formatMoney(totals.total)}`} icon={<CheckCircle2 />} color="text-blue-500" highlight />
        </div>

        {/* ACTION BAR */}
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                <Input 
                  placeholder="Search Route, ATL, or Location..." 
                  className="pl-10 bg-black border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all h-12"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <div className="relative overflow-hidden group">
                    <Input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Button variant="secondary" className="h-12 px-6 bg-zinc-100 text-black hover:bg-white">
                        <Plus className="w-4 h-4 mr-2" /> Import Excel
                    </Button>
                </div>
                <Button variant="outline" onClick={exportProcessedExcel} className="h-12 px-6 border-zinc-800 bg-transparent hover:bg-zinc-900">
                    <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DATA TABLE */}
        <div className="rounded-xl border border-zinc-900 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-zinc-950/80">
              <TableRow className="border-zinc-900">
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Invoice ID</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Details</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Route Info</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Tons/Rate</TableHead>
                <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Total (Inc. VAT)</TableHead>
                <TableHead className="text-center text-zinc-500 font-bold uppercase text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-zinc-600 italic">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    No logistics data found. Please upload a manifest.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => {
                  const isPrinted = printedIds.includes(row.invoiceNo);
                  return (
                    <TableRow key={row.invoiceNo} className={`border-zinc-900 transition-colors ${isPrinted ? 'bg-blue-500/5' : 'hover:bg-zinc-900/50'}`}>
                      <TableCell className="font-mono text-xs text-blue-500 font-bold">{row.invoiceNo}</TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{row["Reg No"] || "NO REG"}</div>
                        <div className="text-[10px] text-zinc-500">ATL: {row.ATL} • Date: {row.formattedDate}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{row["Loaded From"]}</div>
                        <div className="text-[10px] text-zinc-500">→ {row["Delivered To"]}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs">{row.Tons} Tons</div>
                        <div className="text-[10px] text-zinc-400">@ MWK {formatMoney(row.rate)}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-white">
                        {formatMoney(row.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="sm" 
                          variant={isPrinted ? "ghost" : "outline"} 
                          onClick={() => {
                            markAsPrinted(row.invoiceNo);
                            alert("Printing triggered for: " + row.invoiceNo);
                            // Integrate your generateInvoiceHTML logic here
                          }}
                          className={`h-8 w-8 p-0 rounded-full ${isPrinted ? 'text-green-500' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {isPrinted ? <CheckCircle2 className="w-4 h-4" /> : <Printer className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* RESET CONFIRMATION DIALOG */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Reset Invoice Sequence?</DialogTitle>
            <DialogDescription className="text-zinc-500">
              This will return the invoice counter to {START_NUMBER}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsResetOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
                setCounter(START_NUMBER);
                setPrintedIds([]);
                setIsResetOpen(false);
            }}>Confirm Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function StatsCard({ title, value, icon, color, highlight = false }: any) {
  return (
    <Card className={`bg-zinc-950 border-zinc-900 ${highlight ? 'ring-1 ring-blue-500/50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{title}</CardTitle>
        <div className={color}>{React.cloneElement(icon, { size: 14 })}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black tracking-tighter ${highlight ? 'text-white' : 'text-zinc-300'}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}