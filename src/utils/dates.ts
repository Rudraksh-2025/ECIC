/** Demo clock helpers. The dataset is generated relative to "today" so the
 *  demo always looks live regardless of when it is presented. */

export const DAY_MS = 86_400_000;

export function today(): Date {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d;
}

export function daysFromNow(days: number, hour = 9, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function iso(days: number, hour = 9, minute = 0): string {
  return daysFromNow(days, hour, minute).toISOString();
}

export function isoDate(days: number): string {
  return daysFromNow(days).toISOString().slice(0, 10);
}

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let remaining = Math.floor(days);
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  const fraction = days - Math.floor(days);
  if (fraction > 0) d.setHours(d.getHours() + Math.round(fraction * 8));
  return d;
}

export function businessDaysBetween(a: Date, b: Date): number {
  const sign = b >= a ? 1 : -1;
  const start = sign > 0 ? new Date(a) : new Date(b);
  const end = sign > 0 ? new Date(b) : new Date(a);
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
  }
  return count * sign;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function fmtTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 1) return 'just now';
  if (Math.abs(mins) < 60) return mins > 0 ? `${mins}m ago` : `in ${-mins}m`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : `in ${-hours}h`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return days > 0 ? `${days}d ago` : `in ${-days}d`;
  return fmtDate(d);
}

export function monthKey(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
}

/** Last n months as {key, start, end} buckets, oldest first. */
export function monthBuckets(n: number): { key: string; start: Date; end: Date }[] {
  const out: { key: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    out.push({ key: monthKey(start), start, end });
  }
  return out;
}
