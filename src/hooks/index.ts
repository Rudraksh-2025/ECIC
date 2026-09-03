import * as React from 'react';
import { useStore } from '../store';
import type { Complaint, Lead } from '../types';
import { businessDaysBetween } from '../utils/dates';

/* ------------------------------------------------------------------ */
/* SLA                                                                 */
/* ------------------------------------------------------------------ */

export interface SlaPosition {
  targetDays: number;
  elapsedDays: number;
  remainingDays: number;
  consumed: number;
  dueDate: Date;
  risk: 'On Track' | 'At Risk' | 'Breached' | 'Met';
  paused: boolean;
}

export function complaintSla(c: Complaint, targetDays: number, warningPercent: number): SlaPosition {
  const start = new Date(c.loggedDate);
  const end = c.resolvedDate ? new Date(c.resolvedDate) : new Date();
  const elapsed = Math.max(0, businessDaysBetween(start, end));
  const due = new Date(start);
  let d = targetDays;
  while (d > 0) {
    due.setDate(due.getDate() + 1);
    if (due.getDay() !== 0 && due.getDay() !== 6) d -= 1;
  }
  const consumed = targetDays > 0 ? (elapsed / targetDays) * 100 : 0;
  const remaining = targetDays - elapsed;
  const paused = c.status === 'Pending Information';
  let risk: SlaPosition['risk'];
  if (c.status === 'Closed' || c.status === 'Resolved') {
    risk = elapsed <= targetDays ? 'Met' : 'Breached';
  } else if (consumed >= 100) risk = 'Breached';
  else if (consumed >= warningPercent) risk = 'At Risk';
  else risk = 'On Track';
  return { targetDays, elapsedDays: elapsed, remainingDays: remaining, consumed, dueDate: due, risk, paused };
}

export function useComplaintSla() {
  const rules = useStore((s) => s.configuration.slaRules);
  return React.useCallback((c: Complaint): SlaPosition => {
    const complaintRules = rules.filter((r) => r.entity === 'Complaint' && r.scope.startsWith('Severity'));
    const match = complaintRules.find((r) => r.scope.toLowerCase().includes(c.severity.toLowerCase()))
      ?? complaintRules.find((r) => r.scope.toLowerCase().includes('medium'));
    return complaintSla(c, match?.targetDays ?? 5, match?.warningPercent ?? 80);
  }, [rules]);
}

export function leadSla(l: Lead): SlaPosition {
  const start = new Date(l.createdDate);
  const end = l.firstContactDate ? new Date(l.firstContactDate) : new Date();
  const due = new Date(l.slaDueDate);
  const targetDays = Math.max(1, businessDaysBetween(start, due));
  const elapsed = Math.max(0, businessDaysBetween(start, end));
  const consumed = (elapsed / targetDays) * 100;
  let risk: SlaPosition['risk'];
  if (l.firstContactDate) risk = elapsed <= targetDays ? 'Met' : 'Breached';
  else if (consumed >= 100) risk = 'Breached';
  else if (consumed >= 75) risk = 'At Risk';
  else risk = 'On Track';
  return { targetDays, elapsedDays: elapsed, remainingDays: targetDays - elapsed, consumed, dueDate: due, risk, paused: false };
}

/* ------------------------------------------------------------------ */
/* Toast / snackbar                                                    */
/* ------------------------------------------------------------------ */

export interface Toast {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  detail?: string;
  action?: { label: string; to: string };
}

type ToastInput = Omit<Toast, 'id'>;

const listeners = new Set<(t: Toast) => void>();

export function toast(input: ToastInput) {
  const t: Toast = { id: `${Date.now()}-${Math.random()}`, ...input };
  listeners.forEach((l) => l(t));
}

export function useToastListener(handler: (t: Toast) => void) {
  React.useEffect(() => {
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, [handler]);
}

/* ------------------------------------------------------------------ */
/* Async simulation for loading states                                 */
/* ------------------------------------------------------------------ */

export function useSimulatedLoad(ms = 260): boolean {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/** Measures the render time of a screen, used by the performance evidence panel. */
export function useRenderTiming(): number {
  const started = React.useRef(performance.now());
  const [ms, setMs] = React.useState(0);
  React.useEffect(() => {
    setMs(Math.max(1, Math.round(performance.now() - started.current)));
  }, []);
  return ms;
}

/** Debounces a value. Compares by serialised value rather than identity so that
 *  callers may pass an inline object without causing a render loop. */
export function useDebounced<T>(value: T, delay = 250): T {
  const key = React.useMemo(() => JSON.stringify(value), [value]);
  const [v, setV] = React.useState(value);
  const latest = React.useRef(value);
  latest.current = value;
  React.useEffect(() => {
    const t = setTimeout(() => setV(latest.current), delay);
    return () => clearTimeout(t);
  }, [key, delay]);
  return v;
}
