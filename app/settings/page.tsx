// app/settings/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2, Phone, Mail, MapPin,
  Receipt, Palette, Save, RotateCcw,
  CheckCircle2, AlertCircle, Eye,
  Percent, Hash, Globe, CreditCard,
  FileText, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, DEFAULT_SETTINGS } from "@/lib/settings-store";
import type { CompanySettings } from "@/lib/settings-store";
import { getSettings } from "@/lib/settings-store";

// ── Field components ──────────────────────────────────────────────────────────
function FieldRow({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start py-4 border-b border-zinc-900 last:border-0">
      <div className="sm:pt-2">
        <p className="text-sm font-medium text-zinc-300">{label}</p>
        {hint && (
          <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
            {hint}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function SectionCard({
  title, icon: Icon, children,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <Card className="bg-zinc-950 border-zinc-900">
      <CardHeader className="pb-2 pt-5 px-6">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-blue-400" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}

// ── Color presets ─────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Violet", value: "#7c3aed" },
  { label: "Emerald", value: "#059669" },
  { label: "Teal", value: "#0d9488" },
  { label: "Slate", value: "#475569" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
];

// ── Invoice preview ───────────────────────────────────────────────────────────
function InvoicePreview({ settings: s }: { settings: CompanySettings }) {
  const vatPct = (s.vatRate * 100).toFixed(1).replace(".0", "");
  const addressLine = [s.poBox, s.city, s.country].filter(Boolean).join(", ");
  const phoneLine = [s.phone1, s.phone2].filter(Boolean).join(" / ");

  return (
    <div
      className="bg-white text-gray-800 rounded-lg p-5 text-[10px] shadow-2xl"
      style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
    >
      {/* Header */}
      <div
        className="text-center pb-3 mb-3"
        style={{ borderBottom: `2px solid ${s.primaryColor}` }}
      >
        <div
          className="text-base font-black tracking-wide"
          style={{ color: s.primaryColor }}
        >
          {s.companyName || "COMPANY NAME"}
        </div>
        <div className="text-[9px] text-gray-500 mt-1">
          {addressLine}
          {phoneLine && ` | ${phoneLine}`}
          {s.email && ` | ${s.email}`}
        </div>
        <div className="text-xs font-bold text-gray-600 mt-1 tracking-widest">
          TRANSPORT INVOICE
        </div>
      </div>

      {/* Meta */}
      <div
        className="flex justify-between p-2 rounded mb-3 text-[9px]"
        style={{ background: "#f0f4f8" }}
      >
        <div>
          <p>
            <strong style={{ color: s.primaryColor }}>Invoice No:</strong>{" "}
            {s.invoicePrefix}-2025-0001
          </p>
          <p>
            <strong style={{ color: s.primaryColor }}>Invoice Date:</strong>{" "}
            {new Date().toLocaleDateString("en-GB")}
          </p>
          {s.vatNumber && (
            <p>
              <strong style={{ color: s.primaryColor }}>VAT Reg:</strong>{" "}
              {s.vatNumber}
            </p>
          )}
        </div>
        <div className="text-right">
          <p>
            <strong style={{ color: s.primaryColor }}>To:</strong>{" "}
            {s.defaultBillTo || "CLIENT NAME"}
          </p>
          <p>
            <strong style={{ color: s.primaryColor }}>Terms:</strong>{" "}
            {s.paymentTerms}
          </p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-[8px] border-collapse">
        <thead>
          <tr style={{ background: s.primaryColor, color: "white" }}>
            {[
              "Despatch", "Reg No", "Route", "ATL",
              "Tons", "Rate", "Amount",
            ].map((h) => (
              <th key={h} className="p-1 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {[
              "01/06/2025", "MWK 1234", "Nchalo → Mangochi",
              "ATL-001", "25.5", "12,000.00", "306,000.00",
            ].map((v, i) => (
              <td
                key={i}
                className="p-1"
                style={{ border: "1px solid #e2e8f0" }}
              >
                {v}
              </td>
            ))}
          </tr>
          <tr style={{ background: "#eef2f7" }}>
            <td
              colSpan={6}
              className="p-1 text-right font-semibold"
              style={{ border: "1px solid #e2e8f0" }}
            >
              Subtotal:
            </td>
            <td
              className="p-1"
              style={{ border: "1px solid #e2e8f0" }}
            >
              {s.currencySymbol} 306,000.00
            </td>
          </tr>
          <tr style={{ background: "#eef2f7" }}>
            <td
              colSpan={6}
              className="p-1 text-right font-semibold"
              style={{ border: "1px solid #e2e8f0" }}
            >
              VAT ({vatPct}%):
            </td>
            <td
              className="p-1"
              style={{ border: "1px solid #e2e8f0" }}
            >
              {s.currencySymbol} 53,550.00
            </td>
          </tr>
          <tr style={{ background: s.primaryColor, color: "white" }}>
            <td
              colSpan={6}
              className="p-1 text-right font-bold"
            >
              TOTAL ({s.currencySymbol}):
            </td>
            <td className="p-1 font-bold">359,550.00</td>
          </tr>
        </tbody>
      </table>

      {s.invoiceFooterNote && (
        <div
          className="mt-2 p-1.5 text-[8px] text-gray-600 rounded"
          style={{
            background: "#f8fafc",
            borderLeft: `2px solid ${s.primaryColor}`,
          }}
        >
          {s.invoiceFooterNote}
        </div>
      )}

      <div className="mt-3 text-center text-[8px] text-gray-400 border-t pt-2">
        Generated on {new Date().toLocaleDateString("en-GB")} —{" "}
        {s.companyName}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [saved, setSaved] = useSettings();

  // Working copy — only saved on explicit save
  const [form, setForm] = useState<CompanySettings>(saved);
  const [isDirty, setIsDirty] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [toast, setToast] = useState<{
    msg: string; type: "success" | "error";
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const notify = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // Field updater
  const setField = useCallback(
    <K extends keyof CompanySettings>(
      field: K,
      value: CompanySettings[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  // Save
  const handleSave = () => {
    setSaved(form);
    setIsDirty(false);
    notify("Settings saved successfully", "success");
  };

  // Reset to defaults
  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
    setSaved(DEFAULT_SETTINGS);
    setIsDirty(false);
    setResetDialog(false);
    notify("Settings reset to defaults", "success");
  };

  // Discard changes
  const handleDiscard = () => {
    setForm(saved);
    setIsDirty(false);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              System <span className="text-zinc-600">Settings</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Company info, invoice config and appearance.
              Changes apply to all new prints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-zinc-400 h-9"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Invoice
            </Button>
            {isDirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-zinc-500 hover:text-white h-9"
              >
                Discard
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-500 h-9 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="company">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger
              value="company"
              className="data-[state=active]:bg-zinc-800 gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" /> Company
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="data-[state=active]:bg-zinc-800 gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5" /> Invoice
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="data-[state=active]:bg-zinc-800 gap-1.5"
            >
              <Percent className="w-3.5 h-3.5" /> Financial
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-zinc-800 gap-1.5"
            >
              <Palette className="w-3.5 h-3.5" /> Appearance
            </TabsTrigger>
          </TabsList>

          {/* ══════════ COMPANY TAB ══════════ */}
          <TabsContent value="company" className="mt-5 space-y-4">

            <SectionCard title="Company Identity" icon={Building2}>
              <FieldRow
                label="Company Name"
                hint="Full legal name — appears on all invoices and prints"
              >
                <Input
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  placeholder="AFFORDABLE WHOLESALE & TRANSPORT"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow
                label="Trading Name"
                hint="Short name used in the sidebar and dashboard"
              >
                <Input
                  value={form.tradingName}
                  onChange={(e) => setField("tradingName", e.target.value)}
                  placeholder="Affordable Wholesale"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow
                label="Tagline"
                hint="Shown next to the trading name in the sidebar"
              >
                <Input
                  value={form.tagline}
                  onChange={(e) => setField("tagline", e.target.value)}
                  placeholder="Logistics Invoicing"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="Logo Initials" hint="Shown as avatar when no logo uploaded">
                <Input
                  value={form.logoText}
                  onChange={(e) =>
                    setField("logoText", e.target.value.slice(0, 3).toUpperCase())
                  }
                  placeholder="AW"
                  maxLength={3}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-24 font-mono uppercase"
                />
              </FieldRow>
            </SectionCard>

            <SectionCard title="Contact Details" icon={Phone}>
              <FieldRow label="Primary Phone">
                <Input
                  value={form.phone1}
                  onChange={(e) => setField("phone1", e.target.value)}
                  placeholder="+265 993 384 770"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="Secondary Phone" hint="Optional">
                <Input
                  value={form.phone2}
                  onChange={(e) => setField("phone2", e.target.value)}
                  placeholder="+265 888 244 455"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="Email Address">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="company@gmail.com"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="Website" hint="Optional">
                <Input
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>
            </SectionCard>

            <SectionCard title="Address" icon={MapPin}>
              <FieldRow label="PO Box / Street">
                <Input
                  value={form.poBox}
                  onChange={(e) => setField("poBox", e.target.value)}
                  placeholder="Po Box 17"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="City / Town">
                <Input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="Mangochi"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow label="Country">
                <Input
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  placeholder="Malawi"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>
            </SectionCard>
          </TabsContent>

          {/* ══════════ INVOICE TAB ══════════ */}
          <TabsContent value="invoice" className="mt-5 space-y-4">

            <SectionCard title="Invoice Numbering" icon={Hash}>
              <FieldRow
                label="Invoice Prefix"
                hint="Letters prepended to every invoice number e.g. AF-2025-0001"
              >
                <Input
                  value={form.invoicePrefix}
                  onChange={(e) =>
                    setField(
                      "invoicePrefix",
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                    )
                  }
                  placeholder="AF"
                  maxLength={5}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-32 font-mono uppercase"
                />
              </FieldRow>

              <FieldRow
                label="Start Number"
                hint="The counter resets to this value when you click Reset Counter in invoicing"
              >
                <Input
                  type="number"
                  min={1}
                  value={form.invoiceStartNumber}
                  onChange={(e) =>
                    setField(
                      "invoiceStartNumber",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-32 font-mono"
                />
              </FieldRow>

              {/* Preview */}
              <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <FileText className="w-4 h-4 text-zinc-600" />
                <span className="text-xs text-zinc-500">Sample invoice number:</span>
                <span className="font-mono text-sm font-bold text-blue-400">
                  {form.invoicePrefix || "AF"}-{new Date().getFullYear()}-
                  {String(form.invoiceStartNumber || 80).padStart(4, "0")}
                </span>
              </div>
            </SectionCard>

            <SectionCard title="Invoice Defaults" icon={FileText}>
              <FieldRow
                label="Default Bill To"
                hint="Pre-filled client name on every invoice"
              >
                <Input
                  value={form.defaultBillTo}
                  onChange={(e) => setField("defaultBillTo", e.target.value)}
                  placeholder="ILLOVO SUGAR LTD"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>

              <FieldRow
                label="Payment Terms"
                hint="Printed on each invoice"
              >
                <div className="space-y-2">
                  <Input
                    value={form.paymentTerms}
                    onChange={(e) => setField("paymentTerms", e.target.value)}
                    placeholder="IMMEDIATE"
                    className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "IMMEDIATE", "NET 7", "NET 14",
                      "NET 30", "NET 60", "COD",
                    ].map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setField("paymentTerms", term);
                          setIsDirty(true);
                        }}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded border transition-colors",
                          form.paymentTerms === term
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"
                        )}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </FieldRow>

              <FieldRow
                label="Footer Note"
                hint="Optional note printed at the bottom of every invoice (bank details, thank you message, etc.)"
              >
                <textarea
                  value={form.invoiceFooterNote}
                  onChange={(e) =>
                    setField("invoiceFooterNote", e.target.value)
                  }
                  placeholder="Bank: National Bank of Malawi&#10;Account: 1234567890&#10;Branch: Mangochi"
                  rows={3}
                  className={cn(
                    "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2",
                    "text-sm text-zinc-200 placeholder:text-zinc-700",
                    "focus:outline-none focus:border-blue-500/40 focus:ring-0",
                    "resize-none leading-relaxed"
                  )}
                />
              </FieldRow>
            </SectionCard>
          </TabsContent>

          {/* ══════════ FINANCIAL TAB ══════════ */}
          <TabsContent value="financial" className="mt-5 space-y-4">

            <SectionCard title="Tax Configuration" icon={Percent}>
              <FieldRow
                label="VAT Rate"
                hint="Applied automatically to all invoice calculations"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-36">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={(form.vatRate * 100).toFixed(1)}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value);
                        if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                          setField("vatRate", pct / 100);
                        }
                      }}
                      className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      %
                    </span>
                  </div>

                  {/* Quick presets */}
                  <div className="flex gap-1.5">
                    {[
                      { label: "16.5%", value: 0.165 },
                      { label: "17.5%", value: 0.175 },
                      { label: "16%", value: 0.16 },
                      { label: "0%", value: 0 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setField("vatRate", p.value);
                          setIsDirty(true);
                        }}
                        className={cn(
                          "text-[10px] px-2 py-1.5 rounded border transition-colors font-mono",
                          Math.abs(form.vatRate - p.value) < 0.0001
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live calculation example */}
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 space-y-1">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                    Example calculation on MWK 1,000,000
                  </p>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-300">MWK 1,000,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({(form.vatRate * 100).toFixed(1)}%):</span>
                    <span className="font-mono text-amber-400">
                      MWK{" "}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                      }).format(1000000 * form.vatRate)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1 mt-1">
                    <span className="font-bold text-zinc-300">Total:</span>
                    <span className="font-mono font-bold text-white">
                      MWK{" "}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                      }).format(1000000 * (1 + form.vatRate))}
                    </span>
                  </div>
                </div>
              </FieldRow>

              <FieldRow
                label="VAT Registration No."
                hint="Printed on invoices if provided"
              >
                <Input
                  value={form.vatNumber}
                  onChange={(e) => setField("vatNumber", e.target.value)}
                  placeholder="e.g. VRT-12345678"
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40"
                />
              </FieldRow>
            </SectionCard>

            <SectionCard title="Currency" icon={CreditCard}>
              <FieldRow
                label="Currency Code"
                hint="Used in statements and totals e.g. MWK, USD, ZAR"
              >
                <Input
                  value={form.currency}
                  onChange={(e) =>
                    setField("currency", e.target.value.toUpperCase().slice(0, 3))
                  }
                  placeholder="MWK"
                  maxLength={3}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-28 font-mono uppercase"
                />
              </FieldRow>

              <FieldRow
                label="Currency Symbol / Label"
                hint="Printed before amounts on invoices e.g. MWK, $, K"
              >
                <Input
                  value={form.currencySymbol}
                  onChange={(e) =>
                    setField("currencySymbol", e.target.value.slice(0, 5))
                  }
                  placeholder="MWK"
                  maxLength={5}
                  className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-28 font-mono"
                />
              </FieldRow>
            </SectionCard>
          </TabsContent>

          {/* ══════════ APPEARANCE TAB ══════════ */}
          <TabsContent value="appearance" className="mt-5 space-y-4">

            <SectionCard title="Brand Color" icon={Palette}>
              <FieldRow
                label="Primary Color"
                hint="Used on invoice headers, tables and accents in print output"
              >
                <div className="space-y-3">
                  {/* Color presets */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          setField("primaryColor", c.value);
                          setIsDirty(true);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-lg border-2 transition-all",
                          form.primaryColor === c.value
                            ? "border-white scale-110 shadow-lg"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ background: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>

                  {/* Custom hex input */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg border border-zinc-700 flex-shrink-0"
                      style={{ background: form.primaryColor }}
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setField("primaryColor", val);
                        }
                      }}
                      placeholder="#2563eb"
                      maxLength={7}
                      className="bg-zinc-900 border-zinc-800 focus:border-blue-500/40 w-32 font-mono"
                    />
                    <span className="text-xs text-zinc-600">
                      Custom hex color
                    </span>
                  </div>
                </div>
              </FieldRow>
            </SectionCard>

            {/* Live preview card */}
            <SectionCard title="Invoice Print Preview" icon={Eye}>
              <p className="text-xs text-zinc-600 mb-4">
                This is how your invoice header will look when printed.
                Changes update live as you edit settings.
              </p>
              <div className="max-w-2xl">
                <InvoicePreview settings={form} />
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* ── Danger Zone ── */}
        <Card className="bg-zinc-950 border-red-900/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Reset to Defaults</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Restore all settings to factory defaults. Invoice data is not affected.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetDialog(true)}
                className="border-red-900/50 text-red-500 hover:bg-red-950/30 hover:border-red-800 h-9"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Sticky save bar (shows when dirty) ── */}
        {isDirty && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-6 py-3">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm text-zinc-400">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                  className="text-zinc-500 hover:text-white h-9"
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 h-9"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Preview Dialog (full size) ── */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Invoice Print Preview</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Live preview based on your current (unsaved) settings
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <InvoicePreview settings={form} />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowPreview(false)}
              className="text-zinc-400"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                handleSave();
                setShowPreview(false);
              }}
              disabled={!isDirty}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" /> Save & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Dialog ── */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset to Defaults?</DialogTitle>
            <DialogDescription className="text-zinc-500">
              All settings will return to factory defaults.
              Your invoices and data are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setResetDialog(false)}
              className="text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-500"
            >
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl",
            "text-sm font-medium border flex items-center gap-2",
            "animate-in slide-in-from-bottom-2 duration-200",
            isDirty ? "bottom-20" : "bottom-6",
            toast.type === "success"
              ? "bg-green-950 border-green-800 text-green-300"
              : "bg-red-950 border-red-800 text-red-300"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}