import { formatDate, formatDateTime } from './format';

/* ═════════════════════════════════════════════════════════════════
   Types
   ═════════════════════════════════════════════════════════════════ */

export interface ReportColumn<T> {
  /** Column header label */
  label: string;
  /** Key to read from the row, or a custom accessor */
  accessor: keyof T | ((row: T, index?: number) => string | number | null | undefined);
  /** Text alignment */
  align?: 'left' | 'right' | 'center';
  /** Optional fixed width (CSS value, e.g. '80px') */
  width?: string;
  /** Custom formatter — receives the raw value, the row, and optional row index */
  format?: (value: unknown, row: T, index?: number) => string;
  /** Render as HTML (already escaped by accessor) */
  raw?: boolean;
}

export interface ReportKpi {
  label: string;
  value: string;
  /** Optional sub-line */
  hint?: string;
}

export interface ReportMeta {
  label: string;
  value: string;
}

export interface ReportOptions<T> {
  /** Report title, printed at the top */
  title: string;
  /** Optional subtitle (e.g. date range) */
  subtitle?: string;
  /** Business/pharmacy name */
  businessName: string;
  /** Optional branch name */
  branchName?: string | null;
  /** Optional logo URL */
  logoUrl?: string | null;
  /** Optional meta rows (printed under the title) */
  meta?: ReportMeta[];
  /** Optional KPI strip */
  kpis?: ReportKpi[];
  /** Columns */
  columns: ReportColumn<T>[];
  /** Rows */
  rows: T[];
  /** Optional totals row — same shape as columns */
  totals?: Partial<Record<string, string>>;
  /** Optional footer text */
  footer?: string;
  /** Landscape (default) or portrait */
  orientation?: 'landscape' | 'portrait';
  /** Optional filter summary line */
  filtersSummary?: string;
}

/* ═════════════════════════════════════════════════════════════════
   Helpers
   ═════════════════════════════════════════════════════════════════ */

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

function renderCell<T>(col: ReportColumn<T>, row: T, index?: number): string {
  const raw =
    typeof col.accessor === 'function'
      ? col.accessor(row, index)
      : (row as any)[col.accessor];

  if (col.format) {
    return escapeHtml(col.format(raw, row, index));
  }
  if (col.raw) {
    return String(raw ?? '');
  }
  return escapeHtml(raw);
}

/* ═════════════════════════════════════════════════════════════════
   Builder
   ═════════════════════════════════════════════════════════════════ */

export function buildReportHtml<T>(opts: ReportOptions<T>): string {
  const {
    title,
    subtitle,
    businessName,
    branchName,
    logoUrl,
    meta = [],
    kpis = [],
    columns,
    rows,
    totals,
    footer,
    orientation = 'landscape',
    filtersSummary,
  } = opts;

  const headerCells = columns
    .map(
      (c) =>
        `<th class="col-${c.align || 'left'}"${c.width ? ` style="width:${c.width}"` : ''}>${escapeHtml(c.label)}</th>`
    )
    .join('');

  const bodyRows = rows
    .map((row, index) => {
      const cells = columns
        .map((c) => `<td class="col-${c.align || 'left'}">${renderCell(c, row, index)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const totalCells = totals
    ? columns
        .map((c, i) => {
          const key = String(c.accessor);
          const value = totals[key] ?? (i === 0 ? 'TOTAL' : '');
          const align = c.align || 'left';
          return `<td class="col-${align} bold">${escapeHtml(value)}</td>`;
        })
        .join('')
    : '';

  const kpiStrip =
    kpis.length > 0
      ? `
      <div class="kpis">
        ${kpis
          .map(
            (k) => `
          <div class="kpi">
            <div class="kpi-label">${escapeHtml(k.label)}</div>
            <div class="kpi-value">${escapeHtml(k.value)}</div>
            ${k.hint ? `<div class="kpi-hint">${escapeHtml(k.hint)}</div>` : ''}
          </div>`
          )
          .join('')}
      </div>`
      : '';

  const metaRows =
    meta.length > 0
      ? `
      <div class="meta">
        ${meta
          .map(
            (m) => `
          <div class="meta-item">
            <span class="meta-label">${escapeHtml(m.label)}</span>
            <span class="meta-value">${escapeHtml(m.value)}</span>
          </div>`
          )
          .join('')}
      </div>`
      : '';

  const orientationCss =
    orientation === 'portrait'
      ? '@page { size: A4 portrait; margin: 12mm; }'
      : '@page { size: A4 landscape; margin: 12mm; }';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} — ${escapeHtml(businessName)}</title>
<style>
  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #f1f5f9;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    background: #fff;
    padding: 16mm 12mm;
    margin: 20px auto;
    max-width: ${orientation === 'portrait' ? '210mm' : '297mm'};
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo {
    max-width: 48px;
    max-height: 48px;
    object-fit: contain;
  }

  .brand-name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin: 0;
  }

  .brand-sub {
    font-size: 11px;
    color: #64748b;
    margin: 2px 0 0;
  }

  .title-block {
    text-align: right;
  }

  .title-block h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.4px;
  }

  .title-block .subtitle {
    margin: 2px 0 0;
    font-size: 12px;
    color: #475569;
  }

  .title-block .generated {
    margin: 4px 0 0;
    font-size: 10px;
    color: #94a3b8;
  }

  /* ── Meta strip ── */
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    padding: 8px 0 12px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 12px;
  }

  .meta-item {
    display: flex;
    gap: 6px;
    font-size: 11px;
  }

  .meta-label {
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .meta-value {
    color: #0f172a;
    font-weight: 500;
  }

  /* ── Filters summary ── */
  .filters {
    margin-bottom: 12px;
    padding: 6px 10px;
    background: #f8fafc;
    border-left: 3px solid #0ea5a4;
    font-size: 11px;
    color: #475569;
    border-radius: 3px;
  }

  /* ── KPIs ── */
  .kpis {
    display: grid;
    grid-template-columns: repeat(${Math.min(kpis.length || 4, 4)}, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }

  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    background: #f8fafc;
  }

  .kpi-label {
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .kpi-value {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 4px;
  }

  .kpi-hint {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* ── Table ── */
  table.report {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  table.report thead th {
    background: #0f172a;
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 8px 8px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #0f172a;
  }

  table.report thead th.col-right { text-align: right; }
  table.report thead th.col-center { text-align: center; }

  table.report tbody td {
    padding: 7px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }

  table.report tbody tr:nth-child(even) td {
    background: #f8fafc;
  }

  table.report tbody td.col-right { text-align: right; font-variant-numeric: tabular-nums; }
  table.report tbody td.col-center { text-align: center; }
  table.report tbody td.col-left { text-align: left; }

  table.report tfoot td {
    padding: 8px 8px;
    border-top: 2px solid #0f172a;
    border-bottom: 2px solid #0f172a;
    background: #f1f5f9;
    font-size: 11px;
    color: #0f172a;
  }

  .bold { font-weight: 700; }

  /* ── Footer ── */
  .footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 10px;
    color: #64748b;
  }

  .footer .footer-text { max-width: 60%; }

  /* ── Print ── */
  ${orientationCss}

  @media print {
    html, body { background: #fff; }
    .page {
      max-width: none;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
    .no-print { display: none !important; }
    table.report thead th {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table.report tbody tr {
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="" class="brand-logo" />` : ''}
        <div>
          <h2 class="brand-name">${escapeHtml(businessName)}</h2>
          ${branchName ? `<p class="brand-sub">${escapeHtml(branchName)}</p>` : ''}
        </div>
      </div>
      <div class="title-block">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
        <p class="generated">Generated ${escapeHtml(formatDateTime(new Date()))}</p>
      </div>
    </div>

    ${metaRows}
    ${filtersSummary ? `<div class="filters"><strong>Filters:</strong> ${escapeHtml(filtersSummary)}</div>` : ''}
    ${kpiStrip}

    <table class="report">
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${
          bodyRows ||
          `<tr><td colspan="${columns.length}" class="col-center" style="padding:24px;color:#94a3b8;">No data</td></tr>`
        }
      </tbody>
      ${totals ? `<tfoot><tr>${totalCells}</tr></tfoot>` : ''}
    </table>

    <div class="footer">
      <div class="footer-text">${escapeHtml(footer || `${businessName} — Confidential`)}</div>
      <div>${escapeHtml(formatDate(new Date()))} · PharmaSys</div>
    </div>
  </div>

  <script>
    if (window.opener) {
      window.addEventListener('load', function () {
        setTimeout(function () {
          try { window.print(); } catch (e) {}
        }, 250);
      });
    }
  </script>
</body>
</html>`;
}

/* ═════════════════════════════════════════════════════════════════
   Opener
   ═════════════════════════════════════════════════════════════════ */

export function printReport<T>(opts: ReportOptions<T>): void {
  const html = buildReportHtml(opts);
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export const reportHtml = buildReportHtml;