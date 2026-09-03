export function zar(value: number, compact = false): string {
  if (!Number.isFinite(value)) return 'R 0';
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `R ${(value / 1_000_000_000).toFixed(1)}bn`;
    if (abs >= 1_000_000) return `R ${(value / 1_000_000).toFixed(1)}m`;
    if (abs >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  }
  return `R ${Math.round(value).toLocaleString('en-ZA')}`;
}

export function pct(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(digits)}%`;
}

export function num(value: number): string {
  return Math.round(value).toLocaleString('en-ZA');
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '••••••';
  const head = local.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(3, local.length - 2))}@${domain.replace(/^[^.]*/, (m) => m[0] + '•'.repeat(Math.max(2, m.length - 1)))}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•••••';
  return `${phone.slice(0, 4)} ••• ${digits.slice(-3)}`;
}

export function maskText(text: string): string {
  if (!text) return '—';
  return `${text.slice(0, 2)}${'•'.repeat(Math.max(4, text.length - 2))}`;
}

export function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]): void {
  if (rows.length === 0) return;
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(csvEscape).join(',');
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(',')).join('\n');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const content = `ECIC CRM Platform - DEMO EXPORT\nGenerated: ${new Date().toLocaleString('en-ZA')}\n\n${header}\n${body}\n`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

let counter = 1000;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36).slice(-5)}${counter.toString(36)}`.toUpperCase();
}

export function pseudoHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `0x${(h >>> 0).toString(16).padStart(8, '0')}${(input.length * 2654435761 % 0xffff).toString(16).padStart(4, '0')}`;
}

/** Deterministic pseudo-random generator so the seed dataset is stable. */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
