// lib/settings-store.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface CompanySettings {
  // Identity
  companyName: string;
  tradingName: string;
  tagline: string;

  // Contact
  phone1: string;
  phone2: string;
  email: string;
  website: string;

  // Address
  poBox: string;
  city: string;
  country: string;

  // Financial
  vatRate: number;         // e.g. 0.175
  vatNumber: string;
  currency: string;        // e.g. "MWK"
  currencySymbol: string;  // e.g. "MWK"
  paymentTerms: string;    // e.g. "IMMEDIATE"

  // Invoice
  invoicePrefix: string;   // e.g. "AF"
  invoiceStartNumber: number;
  invoiceFooterNote: string;
  defaultBillTo: string;   // e.g. "ILLOVO SUGAR LTD"

  // Appearance
  primaryColor: string;    // hex
  logoText: string;        // initials fallback
}

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "AFFORDABLE WHOLESALE & TRANSPORT",
  tradingName: "Affordable Wholesale",
  tagline: "Logistics Invoicing",
  phone1: "+265 993 384 770",
  phone2: "+265 888 244 455",
  email: "affordablewholesalers@gmail.com",
  website: "",
  poBox: "Po Box 17",
  city: "Mangochi",
  country: "Malawi",
  vatRate: 0.175,
  vatNumber: "",
  currency: "MWK",
  currencySymbol: "MWK",
  paymentTerms: "IMMEDIATE",
  invoicePrefix: "AF",
  invoiceStartNumber: 80,
  invoiceFooterNote: "",
  defaultBillTo: "ILLOVO SUGAR LTD",
  primaryColor: "#2563eb",
  logoText: "AW",
};

const SETTINGS_KEY = "aw_company_settings";

function useLocalStore<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      // Merge with defaults so new fields are always present
      return raw
        ? { ...initial, ...(JSON.parse(raw) as Partial<T>) }
        : initial;
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

export function useSettings() {
  return useLocalStore<CompanySettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

// Read-only sync helper for non-hook contexts (e.g. print HTML)
export function getSettings(): CompanySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<CompanySettings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}