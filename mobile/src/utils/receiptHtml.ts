import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Sale, SaleItem } from '@/types';
import { formatDateTime } from './format';

interface ReceiptOptions {
  sale: Sale;
  businessName: string;
  branchName?: string | null;
  branchAddress?: string | null;
  branchPhone?: string | null;
  storeAddress?: string | null;
  currency?: string;
  headerOverride?: string | null;
  footerOverride?: string | null;
  logoUrl?: string | null;
  cashierName?: string | null;
  customerName?: string | null;
}

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

function money(n: number, currency = 'KES'): string {
  const v = Number(n || 0);
  return `${currency} ${v.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function paymentLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'mpesa':
      return 'M-Pesa';
    case 'card':
      return 'Card';
    case 'insurance':
      return 'Insurance';
    default:
      return method;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'PAID';
    case 'partially_refunded':
      return 'PARTIALLY REFUNDED';
    case 'refunded':
      return 'REFUNDED';
    case 'voided':
      return 'VOIDED';
    default:
      return status.toUpperCase();
  }
}

export function buildReceiptHtml(opts: ReceiptOptions): string {
  const {
    sale,
    businessName,
    branchName,
    branchAddress,
    branchPhone,
    storeAddress,
    currency = 'KES',
    headerOverride,
    footerOverride,
    logoUrl,
    cashierName,
    customerName,
  } = opts;

  const items = sale.items || [];

  const itemRows = items
    .map((item: SaleItem) => {
      const name = item.name || 'Item';
      const line = `${escapeHtml(name)}`;
      return `
        <tr>
          <td class="item">
            <div class="item-name">${line}</div>
            ${item.discount ? `<div class="item-discount">Discount: ${money(item.discount, currency)}</div>` : ''}
          </td>
          <td class="qty">${item.qty}</td>
          <td class="unit">${money(item.unitPrice, currency)}</td>
          <td class="total">${money(item.total, currency)}</td>
        </tr>`;
    })
    .join('');

  const totalQty = items.reduce((s, i) => s + (i.qty || 0), 0);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${escapeHtml(sale.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: 'Courier New', Courier, monospace;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }

  .receipt {
    width: 80mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 8mm 4mm;
    background: #fff;
    font-size: 12px;
    line-height: 1.5;
  }

  .center { text-align: center; }
  .right { text-align: right; }
  .muted { color: #64748b; }
  .bold { font-weight: 700; }

  .logo {
    display: block;
    margin: 0 auto 8px;
    max-width: 60px;
    max-height: 60px;
    object-fit: contain;
  }

  .business-name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin: 0 0 2px;
  }

  .business-meta {
    font-size: 11px;
    color: #475569;
    margin: 0 0 2px;
  }

  .divider {
    border: none;
    border-top: 1px dashed #94a3b8;
    margin: 10px 0;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #64748b;
    margin: 0 0 6px;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border: 2px solid #0f172a;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 1px;
    margin: 8px 0;
  }

  table.items {
    width: 100%;
    border-collapse: collapse;
  }

  table.items th,
  table.items td {
    padding: 4px 0;
    vertical-align: top;
    font-size: 12px;
  }

  table.items thead th {
    border-bottom: 1px solid #0f172a;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
    padding-bottom: 6px;
  }

  table.items tbody td {
    border-bottom: 1px dotted #cbd5e1;
  }

  .item-name { word-break: break-word; }
  .item-discount { font-size: 10px; color: #dc2626; }
  .qty { text-align: right; width: 40px; padding-left: 6px !important; }
  .unit { text-align: right; width: 70px; padding-left: 6px !important; }
  .total { text-align: right; width: 80px; padding-left: 6px !important; }

  .totals {
    width: 100%;
    margin-top: 6px;
  }

  .totals tr td {
    padding: 2px 0;
    font-size: 12px;
  }

  .totals tr td:first-child { text-align: left; color: #475569; }
  .totals tr td:last-child { text-align: right; font-weight: 500; }

  .totals tr.grand td {
    padding-top: 8px;
    border-top: 1px solid #0f172a;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    padding: 2px 0;
  }

  .meta-row .label { color: #64748b; }
  .meta-row .value { color: #0f172a; font-weight: 500; }

  .footer {
    text-align: center;
    font-size: 11px;
    color: #475569;
    margin-top: 10px;
  }

  .footer .thanks { font-weight: 700; color: #0f172a; margin-bottom: 4px; }

  .barcode {
    margin-top: 12px;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="receipt">
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="" class="logo" onerror="this.style.display='none'" />` : ''}
    <div class="center">
      <p class="business-name">${escapeHtml(businessName)}</p>
      ${storeAddress && storeAddress !== branchAddress
        ? `<p class="business-meta">${escapeHtml(storeAddress)}</p>`
        : ''}
      ${branchName ? `<p class="business-meta">${escapeHtml(branchName)}</p>` : ''}
      ${branchAddress ? `<p class="business-meta">${escapeHtml(branchAddress)}</p>` : ''}
      ${branchPhone ? `<p class="business-meta">Tel: ${escapeHtml(branchPhone)}</p>` : ''}
    </div>

    <hr class="divider" />

    <div class="center">
      <div class="status-badge">${escapeHtml(statusLabel(sale.status))}</div>
    </div>

    <div class="meta-row">
      <span class="label">Receipt</span>
      <span class="value">${escapeHtml(sale.invoiceNo)}</span>
    </div>
    <div class="meta-row">
      <span class="label">Date</span>
      <span class="value">${escapeHtml(formatDateTime(sale.createdAt))}</span>
    </div>
    ${cashierName ? `
    <div class="meta-row">
      <span class="label">Served by</span>
      <span class="value">${escapeHtml(cashierName)}</span>
    </div>` : ''}
    ${customerName ? `
    <div class="meta-row">
      <span class="label">Customer</span>
      <span class="value">${escapeHtml(customerName)}</span>
    </div>` : ''}
    <div class="meta-row">
      <span class="label">Payment</span>
      <span class="value">${escapeHtml(paymentLabel(sale.paymentMethod))}</span>
    </div>

    <hr class="divider" />

    ${headerOverride && headerOverride !== businessName
      ? `<div class="center muted" style="font-size:11px;margin-bottom:8px;">${escapeHtml(headerOverride)}</div>`
      : ''}

    <table class="items">
      <thead>
        <tr>
          <th style="text-align:left;">Item</th>
          <th class="qty">Qty</th>
          <th class="unit">Price</th>
          <th class="total">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="4" class="center muted">No items</td></tr>'}
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Items</td>
        <td>${totalQty}</td>
      </tr>
      <tr>
        <td>Subtotal</td>
        <td>${money(sale.subtotal, currency)}</td>
      </tr>
      ${sale.discount > 0 ? `
      <tr>
        <td>Discount</td>
        <td>-${money(sale.discount, currency)}</td>
      </tr>` : ''}
      ${sale.tax > 0 ? `
      <tr>
        <td>Tax</td>
        <td>${money(sale.tax, currency)}</td>
      </tr>` : ''}
      <tr class="grand">
        <td>Total</td>
        <td>${money(sale.grandTotal, currency)}</td>
      </tr>
    </table>

    ${sale.returns && sale.returns.length > 0 ? `
    <hr class="divider" />
    <div class="section-title">Refunds</div>
    ${sale.returns.map((r) => `
      <div class="meta-row">
        <span class="label">${escapeHtml(formatDateTime(r.processedAt || r.createdAt))}</span>
        <span class="value">-${money(r.refundAmount, currency)}</span>
      </div>
      ${r.reason ? `<div class="muted" style="font-size:10px;">${escapeHtml(r.reason)}</div>` : ''}
    `).join('')}
    ` : ''}

    <hr class="divider" />

    <div class="footer">
      <div class="thanks">Thank you!</div>
      ${footerOverride
        ? `<div>${escapeHtml(footerOverride)}</div>`
        : '<div>Goods sold are not returnable after 7 days.</div>'}
      <div class="muted" style="margin-top:6px;">Powered by PharmaSys</div>
    </div>

    <div class="barcode">*${escapeHtml(sale.invoiceNo)}*</div>
  </div>
</body>
</html>`;
}

export async function printReceipt(opts: ReceiptOptions): Promise<void> {
  const html = buildReceiptHtml(opts);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Receipt ${opts.sale.invoiceNo}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function printReceiptSilent(opts: ReceiptOptions): Promise<void> {
  const html = buildReceiptHtml(opts);
  await Print.printAsync({ html });
}