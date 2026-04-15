// lib/invoice-html.ts
import { formatMoney } from "@/lib/store";
import type { InvoiceRow } from "@/lib/store";

const VAT_RATE = 0.175;

export function generateInvoiceHTML(data: InvoiceRow): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${data.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#222;font-size:13px}
  .header{text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:16px;margin-bottom:20px}
  .company-name{font-size:22px;font-weight:900;color:#1e3a5f;letter-spacing:1px}
  .company-sub{font-size:11px;color:#555;margin-top:2px}
  .invoice-title{font-size:16px;font-weight:700;color:#333;margin-top:8px;letter-spacing:2px}
  .meta{display:flex;justify-content:space-between;background:#f0f4f8;padding:14px 18px;border-radius:6px;margin-bottom:20px;font-size:12px}
  .meta strong{color:#1e3a5f}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#1e3a5f;color:#fff;padding:9px 8px;text-align:left;font-weight:600;letter-spacing:.5px}
  td{border:1px solid #ddd;padding:8px}
  .right{text-align:right}
  .total-row td{background:#1e3a5f;color:#fff;font-weight:700}
  .subtotal-row td{background:#eef2f7;font-weight:600}
  .footer{margin-top:30px;text-align:center;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:14px}
  @media print{@page{size:landscape;margin:10mm}}
</style>
</head>
<body>
<div class="header">
  <div class="company-name">AFFORDABLE WHOLESALE &amp; TRANSPORT</div>
  <div class="company-sub">
    Po Box 17, Mangochi &nbsp;|&nbsp;
    +265 993 384 770 / +265 888 244 455 &nbsp;|&nbsp;
    affordablewholesalers@gmail.com
  </div>
  <div class="invoice-title">TRANSPORT INVOICE</div>
</div>
<div class="meta">
  <div>
    <p><strong>Invoice No:</strong> ${data.invoiceNo}</p>
    <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
  </div>
  <div style="text-align:right">
    <p><strong>To:</strong> ILLOVO SUGAR LTD</p>
    <p><strong>Payment Terms:</strong> IMMEDIATE</p>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>Despatch Date</th>
      <th>Reg No</th>
      <th>Loaded From</th>
      <th>Delivered To</th>
      <th>ATL</th>
      <th>Order No</th>
      <th>P/Order</th>
      <th class="right">Tons</th>
      <th class="right">Rate</th>
      <th class="right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${data.formattedDespatchDate}</td>
      <td>${data.regNo}</td>
      <td>${data.loadedFrom}</td>
      <td>${data.deliveredTo}</td>
      <td>${data.atl}</td>
      <td>${data.orderNo}</td>
      <td>${data.pOrder}</td>
      <td class="right">${data.tons}</td>
      <td class="right">${formatMoney(data.rate)}</td>
      <td class="right">${formatMoney(data.amount)}</td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="9" class="right">Subtotal:</td>
      <td class="right">${formatMoney(data.amount)}</td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="9" class="right">VAT (${VAT_RATE * 100}%):</td>
      <td class="right">${formatMoney(data.vat)}</td>
    </tr>
    <tr class="total-row">
      <td colspan="9" class="right">TOTAL (MWK):</td>
      <td class="right">${formatMoney(data.total)}</td>
    </tr>
  </tbody>
</table>
<div class="footer">
  Generated on ${new Date().toLocaleDateString("en-GB")} — Affordable Wholesale &amp; Transport
</div>
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
<\/script>
</body>
</html>`;
}