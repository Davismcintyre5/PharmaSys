export function slugify(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function camelCase(str: string): string {
  const parts = String(str || '').split(/[\s_\-]+/).filter(Boolean);
  if (!parts.length) return '';
  return parts[0].toLowerCase() + parts.slice(1).map(pascalSegment).join('');
}

export function pascalCase(str: string): string {
  const parts = String(str || '').split(/[\s_\-]+/).filter(Boolean);
  return parts.map(pascalSegment).join('');
}

export function kebabCase(str: string): string {
  return slugify(str);
}

export function capitalize(str: string): string {
  const s = String(str || '');
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

export function titleCase(str: string): string {
  return String(str || '')
    .split(/\s+/)
    .map(capitalize)
    .join(' ');
}

export function maskEmail(email: string): string {
  const [user, domain] = String(email || '').split('@');
  if (!domain) return '—';
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 6) return '—';
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

function pascalSegment(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
}