import type { Opportunity, OpportunityStage, StageHistoryEntry, TimelineEvent, UnderwritingStatus } from '../types';
import { daysFromNow, iso, isoDate } from '../utils/dates';
import { userById } from './users';

interface Spec {
  name: string; customerId: string; owner: string; value: number; stage: OpportunityStage;
  created: number; close: number; lead: string | null; campaign: string | null;
  bu: string; products: { product: string; cover: string; value: number; tenor: string }[];
  uw?: UnderwritingStatus | null; uwUnit?: 'STI' | 'Medium/Long-Term Insurance' | null;
  uwOwner?: string | null; handover?: number | null;
  lostReason?: Opportunity['closedLostReason']; lostDetail?: string;
}

const specs: Spec[] = [
  {
    name: 'Highveld Steel - Zambian Smelter Expansion Cover', customerId: 'CUS-0001', owner: 'USR-004',
    value: 340_000_000, stage: 'Negotiation', created: -110, close: 25, lead: 'LED-0001', campaign: 'CMP-0003',
    bu: 'Business Development Unit', uw: 'Under Review', uwUnit: 'Medium/Long-Term Insurance', uwOwner: 'USR-011', handover: -30,
    products: [
      { product: 'Export Credit Insurance (Medium/Long-Term)', cover: 'Buyer default & political risk', value: 280_000_000, tenor: '7 years' },
      { product: 'Political Risk Cover', cover: 'Transfer & convertibility', value: 60_000_000, tenor: '7 years' },
    ],
  },
  {
    name: 'Zambezi Power - Hydro Expansion Investment Insurance', customerId: 'CUS-0004', owner: 'USR-005',
    value: 890_000_000, stage: 'Proposal / Solution', created: -90, close: 55, lead: 'LED-0002', campaign: 'CMP-0001',
    bu: 'Business Development Unit', uw: 'In Underwriting Queue', uwUnit: 'Medium/Long-Term Insurance', uwOwner: 'USR-011', handover: -12,
    products: [
      { product: 'Investment Insurance', cover: 'Expropriation, war & civil disturbance', value: 890_000_000, tenor: '12 years' },
    ],
  },
  {
    name: 'Accra Infrastructure - Ring Road Buyer Credit', customerId: 'CUS-0008', owner: 'USR-005',
    value: 620_000_000, stage: 'Qualification', created: -72, close: 88, lead: 'LED-0003', campaign: 'CMP-0002',
    bu: 'Business Development Unit', uw: 'Awaiting Handover', uwUnit: 'Medium/Long-Term Insurance', uwOwner: null, handover: null,
    products: [
      { product: 'Buyer Credit Guarantee', cover: 'Sovereign buyer credit', value: 620_000_000, tenor: '10 years' },
    ],
  },
  {
    name: 'Mozambique LNG - Contractor Political Risk Programme', customerId: 'CUS-0011', owner: 'USR-017',
    value: 1_450_000_000, stage: 'Negotiation', created: -60, close: 32, lead: 'LED-0004', campaign: 'CMP-0004',
    bu: 'Business Development Unit', uw: 'Information Requested', uwUnit: 'Medium/Long-Term Insurance', uwOwner: 'USR-011', handover: -20,
    products: [
      { product: 'Political Risk Cover', cover: 'Contract frustration & expropriation', value: 1_100_000_000, tenor: '8 years' },
      { product: 'Contract Frustration Cover', cover: 'Buyer non-performance', value: 350_000_000, tenor: '5 years' },
    ],
  },
  {
    name: 'Eastern Cape Wind Farm - Turbine Supply Cover', customerId: 'CUS-0024', owner: 'USR-006',
    value: 720_000_000, stage: 'Proposal / Solution', created: -54, close: 47, lead: 'LED-0005', campaign: 'CMP-0005',
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Investment Insurance', cover: 'Renewable project equity cover', value: 720_000_000, tenor: '15 years' },
    ],
  },
  {
    name: 'PE Automotive - Component Export Facility Renewal', customerId: 'CUS-0016', owner: 'USR-006',
    value: 190_000_000, stage: 'Closed Won', created: -50, close: -8, lead: 'LED-0019', campaign: null,
    bu: 'Business Development Unit', uw: 'Approved', uwUnit: 'STI', uwOwner: 'USR-010', handover: -30,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Whole-turnover buyer default', value: 190_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Cape Peninsula Marine - Performance Bond Support', customerId: 'CUS-0005', owner: 'USR-006',
    value: 155_000_000, stage: 'Closed Won', created: -45, close: -5, lead: 'LED-0020', campaign: 'CMP-0002',
    bu: 'Business Development Unit', uw: 'Approved', uwUnit: 'STI', uwOwner: 'USR-010', handover: -25,
    products: [
      { product: 'Performance Bond Cover', cover: 'Unfair calling & contract frustration', value: 155_000_000, tenor: '3 years' },
    ],
  },
  {
    name: 'Gauteng Pharma - SADC Distribution Cover', customerId: 'CUS-0009', owner: 'USR-004',
    value: 210_000_000, stage: 'Closed Lost', created: -38, close: -6, lead: 'LED-0021', campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    lostReason: 'Competitor', lostDetail: 'Client placed the cover with a private credit insurer offering a lower premium rate and a shorter waiting period.',
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Whole-turnover buyer default', value: 210_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Rand Merchant - Ghana Rail Buyer Credit Facility', customerId: 'CUS-0003', owner: 'USR-006',
    value: 1_100_000_000, stage: 'Closed Won', created: -84, close: -14, lead: 'LED-0024', campaign: 'CMP-0003',
    bu: 'Business Development Unit', uw: 'Approved', uwUnit: 'Medium/Long-Term Insurance', uwOwner: 'USR-011', handover: -50,
    products: [
      { product: 'Buyer Credit Guarantee', cover: 'Bank buyer credit', value: 800_000_000, tenor: '9 years' },
      { product: 'Political Risk Cover', cover: 'Transfer & convertibility', value: 300_000_000, tenor: '9 years' },
    ],
  },
  {
    name: 'Kalahari Agri - Grain Export Whole-Turnover Renewal', customerId: 'CUS-0002', owner: 'USR-004',
    value: 128_000_000, stage: 'Closed Won', created: -66, close: -20, lead: 'LED-0026', campaign: null,
    bu: 'Business Development Unit', uw: 'Approved', uwUnit: 'STI', uwOwner: 'USR-010', handover: -40,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Whole-turnover buyer default', value: 128_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Standard Trade Bank Botswana - Buyer Credit Line', customerId: 'CUS-0010', owner: 'USR-007',
    value: 640_000_000, stage: 'Qualification', created: -30, close: 75, lead: 'LED-0025', campaign: 'CMP-0003',
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Buyer Credit Guarantee', cover: 'Bank buyer credit', value: 640_000_000, tenor: '6 years' },
    ],
  },
  {
    name: 'Vaal Chemical - Specialty Export Programme', customerId: 'CUS-0022', owner: 'USR-006',
    value: 460_000_000, stage: 'Proposal / Solution', created: -24, close: 60, lead: 'LED-0018', campaign: 'CMP-0005',
    bu: 'Business Development Unit', uw: 'Awaiting Handover', uwUnit: 'Medium/Long-Term Insurance', uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Medium/Long-Term)', cover: 'Buyer default', value: 460_000_000, tenor: '5 years' },
    ],
  },
  {
    name: 'Dar es Salaam Port Works - Performance Bond Cover', customerId: 'CUS-0018', owner: 'USR-017',
    value: 275_000_000, stage: 'Qualification', created: -18, close: 92, lead: 'LED-0012', campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Performance Bond Cover', cover: 'Unfair calling', value: 275_000_000, tenor: '4 years' },
    ],
  },
  {
    name: 'Lagos Renewable - Solar Park Political Risk Cover', customerId: 'CUS-0013', owner: 'USR-005',
    value: 980_000_000, stage: 'Qualification', created: -26, close: 105, lead: 'LED-0007', campaign: 'CMP-0006',
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Political Risk Cover', cover: 'Expropriation & currency inconvertibility', value: 980_000_000, tenor: '10 years' },
    ],
  },
  {
    name: 'Kigali Digital - Fibre Backbone Export Cover', customerId: 'CUS-0015', owner: 'USR-005',
    value: 410_000_000, stage: 'Qualification', created: -20, close: 80, lead: 'LED-0006', campaign: 'CMP-0001',
    bu: 'Business Development Unit', uw: 'Awaiting Handover', uwUnit: 'Medium/Long-Term Insurance', uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Medium/Long-Term)', cover: 'Buyer default', value: 410_000_000, tenor: '7 years' },
    ],
  },
  {
    name: 'Harare Water Utilities - Treatment Plant Cover', customerId: 'CUS-0023', owner: 'USR-017',
    value: 530_000_000, stage: 'Proposal / Solution', created: -16, close: 68, lead: 'LED-0011', campaign: 'CMP-0004',
    bu: 'Business Development Unit', uw: 'In Underwriting Queue', uwUnit: 'Medium/Long-Term Insurance', uwOwner: 'USR-011', handover: -4,
    products: [
      { product: 'Export Credit Insurance (Medium/Long-Term)', cover: 'Sovereign buyer default', value: 530_000_000, tenor: '8 years' },
    ],
  },
  {
    name: 'Pretoria Defence Systems - Contract Frustration Cover', customerId: 'CUS-0027', owner: 'USR-004',
    value: 385_000_000, stage: 'Proposal / Solution', created: -14, close: 58, lead: 'LED-0022', campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Contract Frustration Cover', cover: 'Sovereign buyer non-performance', value: 385_000_000, tenor: '5 years' },
    ],
  },
  {
    name: 'Tembisa Rail - Component Export Extension', customerId: 'CUS-0006', owner: 'USR-004',
    value: 68_000_000, stage: 'Qualification', created: -10, close: 70, lead: 'LED-0013', campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Buyer default', value: 68_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Limpopo Citrus - EU Export Whole-Turnover Cover', customerId: 'CUS-0019', owner: 'USR-004',
    value: 145_000_000, stage: 'Closed Lost', created: -70, close: -22, lead: null, campaign: 'CMP-0002',
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    lostReason: 'Timing', lostDetail: 'The co-operative deferred the export programme by a full season following adverse weather; opportunity to be re-engaged next cycle.',
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Whole-turnover buyer default', value: 145_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Windhoek Mining Equipment - Regional Cover', customerId: 'CUS-0020', owner: 'USR-007',
    value: 62_000_000, stage: 'Closed Lost', created: -95, close: -40, lead: null, campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    lostReason: 'Risk appetite', lostDetail: 'Buyer country aggregate exposure exceeded the approved country limit at the time of decision.',
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Buyer default', value: 62_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Free State Grain - Bulk Handling Export Cover', customerId: 'CUS-0014', owner: 'USR-017',
    value: 210_000_000, stage: 'Negotiation', created: -34, close: 18, lead: null, campaign: 'CMP-0005',
    bu: 'Business Development Unit', uw: 'Under Review', uwUnit: 'STI', uwOwner: 'USR-010', handover: -9,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Whole-turnover buyer default', value: 210_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Durban Textile - AGOA Export Programme', customerId: 'CUS-0012', owner: 'USR-004',
    value: 96_000_000, stage: 'Negotiation', created: -28, close: 21, lead: 'LED-0023', campaign: null,
    bu: 'Business Development Unit', uw: 'Awaiting Handover', uwUnit: 'STI', uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Buyer default', value: 96_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Namib Desert Logistics - Cross-Border Cover', customerId: 'CUS-0007', owner: 'USR-005',
    value: 45_000_000, stage: 'Qualification', created: -9, close: 84, lead: 'LED-0010', campaign: null,
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Buyer default', value: 45_000_000, tenor: '12 months' },
    ],
  },
  {
    name: 'Abidjan Cocoa - Processing Equipment Export Cover', customerId: 'CUS-0025', owner: 'USR-004',
    value: 88_000_000, stage: 'Qualification', created: -7, close: 96, lead: 'LED-0009', campaign: 'CMP-0002',
    bu: 'Business Development Unit', uw: 'Not Handed Over', uwUnit: null, uwOwner: null, handover: null,
    products: [
      { product: 'Export Credit Insurance (Short-Term)', cover: 'Buyer default', value: 88_000_000, tenor: '18 months' },
    ],
  },
];

const STAGE_ORDER: OpportunityStage[] = ['Qualification', 'Proposal / Solution', 'Negotiation', 'Closed Won', 'Closed Lost'];

function buildStageHistory(s: Spec): StageHistoryEntry[] {
  const closed = s.stage === 'Closed Won' || s.stage === 'Closed Lost';
  const activeIdx = closed ? 3 : STAGE_ORDER.indexOf(s.stage);
  const span = Math.abs(closed ? s.close - s.created : -s.created);
  const out: StageHistoryEntry[] = [];
  let cursor = s.created;
  for (let i = 0; i <= activeIdx && i < 3; i += 1) {
    const isLast = i === activeIdx && !closed;
    const share = [0.35, 0.4, 0.25][i];
    const days = Math.max(2, Math.round(span * share));
    const enteredAt = daysFromNow(cursor, 9).toISOString();
    const exit = isLast ? null : daysFromNow(cursor + days, 17).toISOString();
    out.push({ stage: STAGE_ORDER[i], enteredAt, exitedAt: exit, days: isLast ? Math.max(1, -cursor) : days });
    cursor += days;
  }
  if (closed) {
    out.push({
      stage: s.stage, enteredAt: daysFromNow(s.close, 15).toISOString(),
      exitedAt: daysFromNow(s.close, 15).toISOString(), days: 0,
    });
  }
  return out;
}

function timelineFor(id: string, s: Spec): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  let n = 1;
  const add = (at: number, actorId: string | null, type: string, title: string, detail: string, hour = 10) => {
    const u = userById(actorId ?? '');
    out.push({
      id: `${id}-T${n}`, at: iso(at, hour, (n * 9) % 60),
      actor: u?.name ?? 'System', actorRole: u?.jobTitle ?? 'CRM Workflow Engine', type, title, detail,
    });
    n += 1;
  };
  add(s.created, s.owner, 'Created',
    s.lead ? `Opportunity created from lead ${s.lead}` : 'Opportunity created',
    s.lead
      ? `Converted from the originating lead ${s.lead}. Account, contacts, interaction history, documents, campaign attribution and desktop analysis outcome were carried across automatically.`
      : 'Opportunity created directly against an existing account relationship.', 9);
  const hist = buildStageHistory(s);
  hist.slice(1).forEach((h, idx) => {
    const d = Math.round((new Date(h.enteredAt).getTime() - Date.now()) / 86400000);
    add(d, s.owner, 'Stage Change', `Stage advanced to ${h.stage}`,
      `Previous stage "${hist[idx].stage}" completed in ${hist[idx].days} days. Weighted forecast recalculated on the new stage probability.`, 11);
  });
  if (s.handover != null) {
    add(s.handover, s.owner, 'Handover', `Handed over to ${s.uwUnit} underwriting`,
      `Work-in-progress record transferred to the ${s.uwUnit} underwriting queue. The Business Development Unit retains full lifecycle visibility after handover.`, 14);
  }
  if (s.uw && !['Not Handed Over', 'Awaiting Handover'].includes(s.uw) && s.uwOwner) {
    add((s.handover ?? -5) + 2, s.uwOwner, 'Underwriting', `Underwriting status: ${s.uw}`,
      `${userById(s.uwOwner)?.name} updated the underwriting status on the work-in-progress ticket.`, 10);
  }
  if (s.stage === 'Closed Won') {
    add(s.close, s.owner, 'Closed Won', 'Opportunity closed won',
      'Cover approved and policy documentation issued. Revenue recognised against the attributed campaign.', 15);
  }
  if (s.stage === 'Closed Lost') {
    add(s.close, s.owner, 'Closed Lost', `Opportunity closed lost - ${s.lostReason}`,
      `${s.lostDetail} Record made read-only for standard users.`, 15);
  }
  return out;
}

const PROBABILITY: Record<OpportunityStage, number> = {
  Qualification: 20, 'Proposal / Solution': 45, Negotiation: 70, 'Closed Won': 100, 'Closed Lost': 0,
};

export const OPPORTUNITIES: Opportunity[] = specs.map((s, i) => {
  const id = `OPP-${String(i + 1).padStart(4, '0')}`;
  const closed = s.stage === 'Closed Won' || s.stage === 'Closed Lost';
  return {
    id,
    reference: `ECIC-OPP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    name: s.name,
    customerId: s.customerId,
    ownerId: s.owner,
    estimatedValue: s.value,
    expectedCloseDate: isoDate(s.close),
    stage: s.stage,
    products: s.products.map((p, j) => ({ id: `${id}-P${j + 1}`, ...p })),
    campaignId: s.campaign,
    originatingLeadId: s.lead,
    probability: PROBABILITY[s.stage],
    forecastCategory: closed ? 'Closed' : s.stage === 'Negotiation' ? 'Commit' : s.stage === 'Proposal / Solution' ? 'Best Case' : 'Pipeline',
    createdDate: daysFromNow(s.created, 9).toISOString(),
    closedDate: closed ? daysFromNow(s.close, 15).toISOString() : null,
    closedLostReason: s.lostReason ?? null,
    closedLostDetail: s.lostDetail ?? '',
    businessUnit: s.bu,
    underwritingStatus: s.uw ?? 'Not Handed Over',
    underwritingUnit: s.uwUnit ?? null,
    underwritingOwnerId: s.uwOwner ?? null,
    handoverDate: s.handover != null ? daysFromNow(s.handover, 14).toISOString() : null,
    stageHistory: buildStageHistory(s),
    documentIds: [],
    timeline: timelineFor(id, s),
  };
});

export const CLOSED_LOST_REASONS: Opportunity['closedLostReason'][] = [
  'Pricing', 'Competitor', 'Timing', 'Customer decision', 'Risk appetite', 'Product mismatch', 'Other',
];
