// lib/store.ts
"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface InvoiceRow {
  invoiceNo: string;
  formattedDate: string;
  formattedDespatchDate: string;
  regNo: string;
  loadedFrom: string;
  deliveredTo: string;
  atl: string;
  orderNo: string;
  pOrder: string;
  tons: number;
  rate: number;
  amount: number;
  vat: number;
  total: number;
  printed: boolean;
  printedAt?: string;
  paid: boolean;
  paidAt?: string;
  savedAt: string;
}

// Add to KEYS object:
// BATCHES: "aw_invoice_batches",

export interface InvoiceBatch {
  id: string;
  name: string;          // e.g. "Batch #3 — 12 Jun 2025"
  savedAt: string;
  invoices: InvoiceRow[];
  firstInvoiceNo: string;
  lastInvoiceNo: string;
}



export interface WarehouseItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  location: string;
  lastUpdated: string;
}

export interface BinCardTransaction {
  id: string;
  date: string;
  reference: string;
  type: "Receipt" | "Issue";
  quantity: number;
  balance: number;
  remarks: string;
  issuedTo?: string;
}

export interface BinCard {
  id: string;
  itemName: string;
  unit: string;
  location: string;
  openingBalance: number;
  transactions: BinCardTransaction[];
  createdAt: string;
}

export interface BinCardUnit {
  id: string;
  label: string;
}

export interface BinCardCategory {
  id: string;
  label: string;
}

export interface PODEntry {
  id: string;
  date: string;
  tmsId: string;
  regNo: string;
  loadedFrom: string;
  orderNo: string;
  pOrder: string;
  atl: string;
  route: string;
  tons: number;
  driver: string;
  savedAt: string;
}

export interface Driver {
  id: string;
  name: string;
}

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEYS = {
  INVOICES: "aw_invoices",
  INVOICE_COUNTER: `aw_inv_counter_${new Date().getFullYear()}`,
 INVOICE_BATCHES: "aw_invoice_batches",   // ← new
  WAREHOUSE: "aw_warehouse",
  BINCARDS: "aw_bincards",
  BINCARD_UNITS: "aw_bincard_units",
  BINCARD_CATEGORIES: "aw_bincard_categories",
  PODS: "aw_pods",
  DRIVERS: "aw_drivers",
} as const;

// ── Default seed data ─────────────────────────────────────────────────────────
const DEFAULT_UNITS: BinCardUnit[] = [
  { id: "u1", label: "Litres" },
  { id: "u2", label: "Units" },
  { id: "u3", label: "Bags" },
  { id: "u4", label: "Kg" },
  { id: "u5", label: "Tonnes" },
  { id: "u6", label: "Boxes" },
];

const DEFAULT_CATEGORIES: BinCardCategory[] = [
  { id: "c1", label: "Fuel" },
  { id: "c2", label: "Spare Parts" },
  { id: "c3", label: "Tools" },
  { id: "c4", label: "Packaging" },
  { id: "c5", label: "Other" },
];

const DEFAULT_DRIVERS: Driver[] = [
  { id: "d1", name: "Driver Banda" },
  { id: "d2", name: "Driver Phiri" },
  { id: "d3", name: "Driver Chirwa" },
  { id: "d4", name: "Driver Mwale" },
];

// ── Generic hook for any JSON-serializable store ──────────────────────────────
function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next =
          typeof updater === "function"
            ? (updater as (p: T) => T)(prev)
            : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, set] as const;
}

// ── Exported hooks ────────────────────────────────────────────────────────────
export function useInvoices() {
  return useLocalStore<InvoiceRow[]>(KEYS.INVOICES, []);
}

export function useInvoiceBatches() {
  return useLocalStore<InvoiceBatch[]>("aw_invoice_batches", []);
}


export function useInvoiceCounter() {
  return useLocalStore<number>(KEYS.INVOICE_COUNTER, 80);
}

export function useWarehouse() {
  return useLocalStore<WarehouseItem[]>(KEYS.WAREHOUSE, []);
}

export function useBinCards() {
  return useLocalStore<BinCard[]>(KEYS.BINCARDS, []);
}

export function useBinCardUnits() {
  return useLocalStore<BinCardUnit[]>(KEYS.BINCARD_UNITS, DEFAULT_UNITS);
}

export function useBinCardCategories() {
  return useLocalStore<BinCardCategory[]>(
    KEYS.BINCARD_CATEGORIES,
    DEFAULT_CATEGORIES
  );
}

export function usePODs() {
  return useLocalStore<PODEntry[]>(KEYS.PODS, []);
}

export function useDrivers() {
  return useLocalStore<Driver[]>(KEYS.DRIVERS, DEFAULT_DRIVERS);
}

// ── Utility ───────────────────────────────────────────────────────────────────
export const genId = () =>
  Math.random().toString(36).slice(2, 10).toUpperCase();

export const todayStr = () => new Date().toLocaleDateString("en-GB");

export const nowISO = () => new Date().toISOString();

export const formatMoney = (v: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export const formatDate = (excelDate: unknown): string => {
  if (!excelDate) return "N/A";
  if (typeof excelDate === "number") {
    const d = new Date((excelDate - 25569) * 86400 * 1000);
    return d.toLocaleDateString("en-GB");
  }
  return String(excelDate);
};