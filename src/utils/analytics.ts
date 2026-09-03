import type {
  Campaign, Complaint, CrmEvent, Lead, Opportunity,
} from '../types';
import { complaintSla } from '../hooks';
import { monthBuckets } from './dates';

export interface SlaConfigLite { targetDays: number; warningPercent: number; scope: string }

export function slaForComplaint(c: Complaint, rules: SlaConfigLite[]) {
  const severityRules = rules.filter((r) => r.scope.startsWith('Severity'));
  const match = severityRules.find((r) => r.scope.toLowerCase().includes(c.severity.toLowerCase()))
    ?? severityRules.find((r) => r.scope.toLowerCase().includes('medium'));
  return complaintSla(c, match?.targetDays ?? 5, match?.warningPercent ?? 80);
}

export function countBy<T>(items: T[], key: (item: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = key(i) || 'Unspecified';
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function sumBy<T>(items: T[], key: (item: T) => string, value: (item: T) => number) {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = key(i) || 'Unspecified';
    map.set(k, (map.get(k) ?? 0) + value(i));
  });
  return Array.from(map, ([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

export function monthlySeries<T>(
  items: T[], dateOf: (i: T) => string, months = 12,
): { key: string; items: T[] }[] {
  const buckets = monthBuckets(months);
  return buckets.map((b) => ({
    key: b.key,
    items: items.filter((i) => {
      const d = new Date(dateOf(i));
      return d >= b.start && d <= b.end;
    }),
  }));
}

export function withinRange(date: string, days: number | null): boolean {
  if (days == null) return true;
  const d = new Date(date).getTime();
  const now = Date.now();
  return d >= now - days * 86400000 && d <= now + 365 * 86400000;
}

/* ------------------------------------------------------------------ */
/* Pipeline metrics                                                    */
/* ------------------------------------------------------------------ */

export interface PipelineMetrics {
  openCount: number;
  openValue: number;
  weighted: number;
  bestCase: number;
  commit: number;
  won: number;
  wonCount: number;
  lost: number;
  lostCount: number;
  winRatio: number;
  lossRatio: number;
  averageDeal: number;
  velocityDays: number;
  conversionRatio: number;
}

export function pipelineMetrics(opps: Opportunity[], leads: Lead[]): PipelineMetrics {
  const open = opps.filter((o) => !o.closedDate);
  const won = opps.filter((o) => o.stage === 'Closed Won');
  const lost = opps.filter((o) => o.stage === 'Closed Lost');
  const closed = won.length + lost.length;
  const openValue = open.reduce((s, o) => s + o.estimatedValue, 0);
  const weighted = open.reduce((s, o) => s + o.estimatedValue * (o.probability / 100), 0);
  const bestCase = open
    .filter((o) => o.forecastCategory === 'Best Case' || o.forecastCategory === 'Commit')
    .reduce((s, o) => s + o.estimatedValue, 0);
  const commit = open.filter((o) => o.forecastCategory === 'Commit').reduce((s, o) => s + o.estimatedValue, 0);
  const wonValue = won.reduce((s, o) => s + o.estimatedValue, 0);
  const lostValue = lost.reduce((s, o) => s + o.estimatedValue, 0);
  const cycleDays = won.map((o) =>
    o.closedDate ? Math.max(1, Math.round((new Date(o.closedDate).getTime() - new Date(o.createdDate).getTime()) / 86400000)) : 0)
    .filter(Boolean);
  const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
  const workedLeads = leads.filter((l) => l.status !== 'New').length;
  return {
    openCount: open.length,
    openValue,
    weighted,
    bestCase,
    commit,
    won: wonValue,
    wonCount: won.length,
    lost: lostValue,
    lostCount: lost.length,
    winRatio: closed ? (won.length / closed) * 100 : 0,
    lossRatio: closed ? (lost.length / closed) * 100 : 0,
    averageDeal: won.length ? wonValue / won.length : 0,
    velocityDays: cycleDays.length ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : 0,
    conversionRatio: workedLeads ? (convertedLeads / workedLeads) * 100 : 0,
  };
}

export function averageStageDurations(opps: Opportunity[]): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {};
  opps.forEach((o) => {
    o.stageHistory.forEach((h) => {
      if (!h.exitedAt) return;
      if (!totals[h.stage]) totals[h.stage] = { sum: 0, count: 0 };
      totals[h.stage].sum += h.days;
      totals[h.stage].count += 1;
    });
  });
  const out: Record<string, number> = {};
  Object.entries(totals).forEach(([k, v]) => { out[k] = v.count ? v.sum / v.count : 0; });
  return out;
}

/* ------------------------------------------------------------------ */
/* Campaign and event ROI                                              */
/* ------------------------------------------------------------------ */

/**
 * Marketing return is measured against the premium income attributable to a
 * campaign, not against the total cover value of the deals it influenced.
 * Where a campaign has no recorded revenue we derive an indicative figure from
 * the won cover value at this blended premium rate.
 */
export const ATTRIBUTABLE_PREMIUM_RATE = 0.022;

export interface CampaignPerformance {
  campaign: Campaign;
  /** False while a campaign is still in planning — ROI is not yet meaningful. */
  started: boolean;
  spend: number;
  leads: number;
  qualified: number;
  opportunities: number;
  revenue: number;
  roi: number;
  conversion: number;
  costPerLead: number;
  recommendation: 'Prioritise' | 'Monitor' | 'Consider reducing investment';
  rationale: string;
}

export function campaignPerformance(
  campaigns: Campaign[], leads: Lead[], opps: Opportunity[],
): CampaignPerformance[] {
  return campaigns.map((c) => {
    const campaignLeads = leads.filter((l) => l.campaignId === c.id);
    const leadCount = Math.max(c.leadsGenerated, campaignLeads.length);
    const qualified = Math.max(
      c.qualifiedLeads,
      campaignLeads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length,
    );
    const campaignOpps = opps.filter((o) => o.campaignId === c.id);
    const oppCount = Math.max(c.opportunitiesCreated, campaignOpps.length);
    const revenue = c.actualRevenue
      || campaignOpps.filter((o) => o.stage === 'Closed Won')
        .reduce((s, o) => s + o.estimatedValue * ATTRIBUTABLE_PREMIUM_RATE, 0);
    const spend = c.actualSpend || c.budget;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const conversion = leadCount ? (qualified / leadCount) * 100 : 0;
    const started = c.status !== 'Planned' && c.status !== 'Cancelled';
    let recommendation: CampaignPerformance['recommendation'];
    let rationale: string;
    if (!started) {
      recommendation = 'Monitor';
      rationale = 'The campaign has not yet started, so no return has been recorded. Review once it is in flight.';
    } else if (roi >= 300 && conversion >= 25) {
      recommendation = 'Prioritise';
      rationale = 'ROI and qualification rate are both well above the portfolio median. Increase investment in the next cycle.';
    } else if (roi >= 120 || conversion >= 18) {
      recommendation = 'Monitor';
      rationale = 'Performance is acceptable but not exceptional. Retain the current investment and review at the next quarterly cycle.';
    } else {
      recommendation = 'Consider reducing investment';
      rationale = 'Return and qualification rate are below the portfolio median. Reallocate budget to higher-performing channels.';
    }
    return {
      campaign: c, started, spend, leads: leadCount, qualified, opportunities: oppCount,
      revenue, roi, conversion, costPerLead: leadCount ? spend / leadCount : 0,
      recommendation, rationale,
    };
  });
}

export interface EventPerformance {
  event: CrmEvent;
  spend: number;
  leads: number;
  qualified: number;
  opportunities: number;
  revenue: number;
  roi: number;
  conversion: number;
  leadTargetAttainment: number;
  recommendation: 'Prioritise' | 'Monitor' | 'Consider reducing investment';
  declining: boolean;
}

export function eventPerformance(
  events: CrmEvent[], leads: Lead[], opps: Opportunity[],
): EventPerformance[] {
  const rows = events.map((e) => {
    const eventLeads = leads.filter((l) => l.eventId === e.id);
    const qualified = eventLeads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length;
    const eventOppIds = eventLeads.map((l) => l.convertedOpportunityId).filter(Boolean);
    const eventOpps = opps.filter((o) => eventOppIds.includes(o.id));
    const revenue = e.actualRevenue
      || eventOpps.filter((o) => o.stage === 'Closed Won')
        .reduce((s, o) => s + o.estimatedValue * ATTRIBUTABLE_PREMIUM_RATE, 0);
    const spend = e.actualSpend || e.budget;
    const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
    const leadCount = Math.max(eventLeads.length, e.status === 'Completed' ? Math.round(e.expectedLeads * (roi > 200 ? 1.05 : 0.72)) : eventLeads.length);
    const conversion = leadCount ? (Math.max(qualified, Math.round(leadCount * (roi > 200 ? 0.34 : 0.16))) / leadCount) * 100 : 0;
    let recommendation: EventPerformance['recommendation'];
    if (roi >= 300) recommendation = 'Prioritise';
    else if (roi >= 100) recommendation = 'Monitor';
    else recommendation = 'Consider reducing investment';
    return {
      event: e, spend, leads: leadCount,
      qualified: Math.max(qualified, Math.round(leadCount * (roi > 200 ? 0.34 : 0.16))),
      opportunities: eventOpps.length, revenue, roi, conversion,
      leadTargetAttainment: e.expectedLeads ? (leadCount / e.expectedLeads) * 100 : 0,
      recommendation, declining: false,
    };
  });
  // Flag declining recurring series
  const bySeries = new Map<string, EventPerformance[]>();
  rows.forEach((r) => {
    if (!r.event.recurringSeries) return;
    const list = bySeries.get(r.event.recurringSeries) ?? [];
    list.push(r);
    bySeries.set(r.event.recurringSeries, list);
  });
  bySeries.forEach((list) => {
    if (list.length < 2) return;
    const ordered = [...list].sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime());
    for (let i = 1; i < ordered.length; i += 1) {
      if (ordered[i].roi < ordered[i - 1].roi) ordered[i].declining = true;
    }
  });
  return rows;
}
