import type { Campaign, CimVersion, CrmEvent, MarketingAsset, Organizer } from '../types';
import { isoDate, iso } from '../utils/dates';

export const ORGANIZERS: Organizer[] = [
  { id: 'ORG-001', name: 'Lindiwe Mahlaba', organisation: 'Africa Trade Events (Pty) Ltd', email: 'lindiwe@africatradeevents.demo.co.za', phone: '+27 11 447 8800', vendorClassification: 'Preferred', previousEvents: 14, averageRoi: 412, performanceRating: 4.6, notes: 'Long-standing ECIC partner for continental export expos. Consistently delivers above target lead volumes.' },
  { id: 'ORG-002', name: 'Gerhard Steenkamp', organisation: 'Expo Dynamics SA', email: 'gerhard@expodynamics.demo.co.za', phone: '+27 21 555 2210', vendorClassification: 'Approved', previousEvents: 9, averageRoi: 268, performanceRating: 3.9, notes: 'Strong logistics execution; lead quality has been variable in the last two cycles.' },
  { id: 'ORG-003', name: 'Amara Nwosu', organisation: 'West Africa Business Forums Ltd', email: 'amara@wabforums.demo.africa', phone: '+234 1 270 9911', vendorClassification: 'Approved', previousEvents: 6, averageRoi: 331, performanceRating: 4.2, notes: 'Good access to Nigerian and Ghanaian project sponsors.' },
  { id: 'ORG-004', name: 'Sello Mokoena', organisation: 'dtic Export Council Secretariat', email: 'sello.mokoena@dtic.demo.gov.za', phone: '+27 12 394 0000', vendorClassification: 'Preferred', previousEvents: 21, averageRoi: 505, performanceRating: 4.8, notes: 'Government-led trade missions. Highest converting channel for medium/long-term business.' },
  { id: 'ORG-005', name: 'Ruth Chilufya', organisation: 'SADC Infrastructure Summit Trust', email: 'ruth@sadcsummit.demo.africa', phone: '+260 21 125 6600', vendorClassification: 'Provisional', previousEvents: 3, averageRoi: 142, performanceRating: 2.9, notes: 'ROI has declined across the last three summits. Recommend reduced investment pending review.' },
  { id: 'ORG-006', name: 'Marcus Delport', organisation: 'Cape Maritime Exhibitions CC', email: 'marcus@capemaritime.demo.co.za', phone: '+27 21 421 7788', vendorClassification: 'Under Review', previousEvents: 4, averageRoi: 118, performanceRating: 2.4, notes: 'Consistently under-delivers on attendance projections. Under vendor review.' },
];

interface EvSpec {
  name: string; venue: string; city: string; country: string; start: number; end: number;
  audience: string; products: string[]; campaign: string | null; budget: number; spend: number;
  expLeads: number; expRev: number; actRev: number; organizer: string;
  status: CrmEvent['status']; series?: string | null; qr?: boolean;
}

const evSpecs: EvSpec[] = [
  { name: 'Africa Trade Expo 2026', venue: 'Gallagher Convention Centre', city: 'Midrand', country: 'South Africa', start: -25, end: -22, audience: 'Exporters, project sponsors and financial institutions across the continent', products: ['Export Credit Insurance (Short-Term)', 'Investment Insurance', 'Political Risk Cover'], campaign: 'CMP-0001', budget: 1_450_000, spend: 1_388_000, expLeads: 150, expRev: 5_400_000, actRev: 6_210_000, organizer: 'ORG-001', status: 'Completed', series: 'Africa Trade Expo', qr: true },
  { name: 'SADC Infrastructure Summit 2026', venue: 'Mulungushi International Conference Centre', city: 'Lusaka', country: 'Zambia', start: -95, end: -93, audience: 'Regional infrastructure project sponsors and development finance institutions', products: ['Investment Insurance', 'Buyer Credit Guarantee'], campaign: 'CMP-0001', budget: 980_000, spend: 1_040_000, expLeads: 90, expRev: 4_200_000, actRev: 1_352_000, organizer: 'ORG-005', status: 'Completed', series: 'SADC Infrastructure Summit', qr: true },
  { name: 'Southern Africa Manufacturing Indaba', venue: 'Durban ICC', city: 'Durban', country: 'South Africa', start: -2, end: 1, audience: 'Manufacturing exporters and industry associations', products: ['Export Credit Insurance (Short-Term)', 'Working Capital Support'], campaign: 'CMP-0007', budget: 720_000, spend: 640_000, expLeads: 80, expRev: 2_050_000, actRev: 0, organizer: 'ORG-002', status: 'Active', series: 'Manufacturing Indaba', qr: true },
  { name: 'West Africa Export Finance Forum 2026', venue: 'Accra International Conference Centre', city: 'Accra', country: 'Ghana', start: -60, end: -58, audience: 'West African project sponsors, EPC contractors and banks', products: ['Buyer Credit Guarantee', 'Political Risk Cover'], campaign: 'CMP-0002', budget: 1_120_000, spend: 1_095_000, expLeads: 70, expRev: 4_800_000, actRev: 2_596_000, organizer: 'ORG-003', status: 'Completed', series: 'West Africa Export Finance Forum', qr: true },
  { name: 'dtic Trade Mission - East Africa', venue: 'Kenyatta International Convention Centre', city: 'Nairobi', country: 'Kenya', start: 21, end: 24, audience: 'South African exporters targeting the East African Community', products: ['Export Credit Insurance (Short-Term)', 'Export Credit Insurance (Medium/Long-Term)'], campaign: 'CMP-0008', budget: 890_000, spend: 145_000, expLeads: 60, expRev: 2_700_000, actRev: 0, organizer: 'ORG-004', status: 'Planned', series: 'dtic Trade Mission', qr: true },
  { name: 'Cape Maritime & Shipbuilding Show', venue: 'Cape Town International Convention Centre', city: 'Cape Town', country: 'South Africa', start: -140, end: -138, audience: 'Marine engineering and shipbuilding exporters', products: ['Performance Bond Cover', 'Contract Frustration Cover'], campaign: 'CMP-0002', budget: 640_000, spend: 655_000, expLeads: 55, expRev: 1_320_000, actRev: 478_000, organizer: 'ORG-006', status: 'Completed', series: 'Cape Maritime Show', qr: false },
  { name: 'Renewable Energy Africa Conference', venue: 'Sandton Convention Centre', city: 'Johannesburg', country: 'South Africa', start: 45, end: 47, audience: 'Renewable energy developers, EPCs and equipment exporters', products: ['Investment Insurance', 'Political Risk Cover'], campaign: 'CMP-0005', budget: 1_050_000, spend: 0, expLeads: 100, expRev: 7_200_000, actRev: 0, organizer: 'ORG-001', status: 'Planned', series: 'Renewable Energy Africa', qr: true },
  { name: 'Agri-Processing Export Showcase', venue: 'Bloemfontein Showgrounds', city: 'Bloemfontein', country: 'South Africa', start: -180, end: -179, audience: 'Agricultural and agro-processing exporters', products: ['Export Credit Insurance (Short-Term)'], campaign: 'CMP-0006', budget: 380_000, spend: 402_000, expLeads: 45, expRev: 840_000, actRev: 611_000, organizer: 'ORG-002', status: 'Completed', series: 'Agri-Processing Showcase', qr: true },
];

export const EVENTS: CrmEvent[] = evSpecs.map((e, i) => ({
  id: `EVT-${String(i + 1).padStart(4, '0')}`,
  reference: `ECIC-EVT-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
  name: e.name, venue: e.venue, city: e.city, country: e.country,
  startDate: isoDate(e.start), endDate: isoDate(e.end),
  targetAudience: e.audience, productsPromoted: e.products,
  campaignId: e.campaign, budget: e.budget, actualSpend: e.spend,
  expectedLeads: e.expLeads, expectedRevenue: e.expRev, actualRevenue: e.actRev,
  organizerId: e.organizer, status: e.status, recurringSeries: e.series ?? null,
  qrCaptureEnabled: e.qr ?? true,
}));

interface CampSpec {
  name: string; type: Campaign['type']; objective: string; kpi: string; audience: string;
  segmentation: string; budget: number; spend: number; start: number; end: number;
  expRev: number; fcRev: number; actRev: number; status: Campaign['status'];
  owner: string; template: string | null; event: string | null;
  approval: Campaign['approvalStatus']; leads: number; qLeads: number; opps: number;
}

const campSpecs: CampSpec[] = [
  { name: 'Continental Export Expo Programme 2026', type: 'Exhibition', objective: 'Generate qualified medium/long-term cover leads across SADC and East Africa through ECIC exhibition presence.', kpi: '150 leads, 40% qualification rate, ROI > 350%', audience: 'Exporters and project sponsors across SADC and EAC', segmentation: 'Mixed - project sponsors and corporate exporters', budget: 2_600_000, spend: 2_428_000, start: -120, end: -20, expRev: 9_600_000, fcRev: 11_000_000, actRev: 11_420_000, status: 'Completed', owner: 'USR-008', template: 'TPL-EXH', event: 'EVT-0001', approval: 'Approved', leads: 148, qLeads: 61, opps: 22 },
  { name: 'West Africa Project Finance Push', type: 'Exhibition', objective: 'Establish ECIC presence with West African infrastructure sponsors and EPC contractors.', kpi: '70 leads, 30% qualification rate, ROI > 250%', audience: 'West African project sponsors and EPC contractors', segmentation: 'Project Sponsors', budget: 1_400_000, spend: 1_392_000, start: -95, end: -50, expRev: 5_400_000, fcRev: 4_900_000, actRev: 4_310_000, status: 'Completed', owner: 'USR-008', template: 'TPL-EXH', event: 'EVT-0004', approval: 'Approved', leads: 64, qLeads: 19, opps: 6 },
  { name: 'Buyer Credit Guarantee Awareness (Banks)', type: 'Digital', objective: 'Raise awareness of the ECIC buyer credit guarantee product among African trade finance banks.', kpi: '200 leads, 25% qualification rate, ROI > 260%', audience: 'Trade finance banks and financial institutions', segmentation: 'Banks & FIs', budget: 640_000, spend: 618_000, start: -150, end: -30, expRev: 2_300_000, fcRev: 2_500_000, actRev: 2_604_000, status: 'Completed', owner: 'USR-008', template: 'TPL-DIG', event: null, approval: 'Approved', leads: 211, qLeads: 54, opps: 11 },
  { name: 'Political Risk Cover Product Launch', type: 'Product Launch', objective: 'Launch the enhanced political risk cover proposition to priority sectors.', kpi: '90 leads, 45% qualification rate, ROI > 450%', audience: 'Oil & gas, power and infrastructure exporters', segmentation: 'Priority sectors', budget: 1_250_000, spend: 980_000, start: -70, end: 20, expRev: 6_900_000, fcRev: 7_300_000, actRev: 5_596_000, status: 'Active', owner: 'USR-008', template: 'TPL-PRD', event: null, approval: 'Approved', leads: 58, qLeads: 27, opps: 8 },
  { name: 'Renewable Energy Exporter Programme', type: 'Digital', objective: 'Support South African renewable energy component exporters entering African markets.', kpi: '120 leads, 35% qualification rate, ROI > 300%', audience: 'Renewable energy component exporters and developers', segmentation: 'Priority sectors', budget: 820_000, spend: 465_000, start: -60, end: 60, expRev: 1_900_000, fcRev: 2_200_000, actRev: 1_902_000, status: 'Active', owner: 'USR-008', template: 'TPL-DIG', event: 'EVT-0007', approval: 'Approved', leads: 72, qLeads: 31, opps: 9 },
  { name: 'SME Exporter Digital Nurture', type: 'Digital', objective: 'Build a qualified pipeline of small and medium exporters new to export credit insurance.', kpi: '250 leads, 20% qualification rate, ROI > 180%', audience: 'SME exporters with turnover below R 100m', segmentation: 'SME Exporters', budget: 380_000, spend: 341_000, start: -190, end: -10, expRev: 960_000, fcRev: 780_000, actRev: 689_000, status: 'Completed', owner: 'USR-008', template: 'TPL-DIG', event: 'EVT-0008', approval: 'Approved', leads: 268, qLeads: 41, opps: 7 },
  { name: 'Manufacturing Indaba Activation 2026', type: 'Exhibition', objective: 'Capture manufacturing exporter leads at the Southern Africa Manufacturing Indaba using QR lead capture.', kpi: '80 leads, 35% qualification rate, ROI > 280%', audience: 'Manufacturing exporters and industry associations', segmentation: 'Exporters - Manufacturing', budget: 780_000, spend: 651_000, start: -14, end: 3, expRev: 2_100_000, fcRev: 2_200_000, actRev: 421_000, status: 'Active', owner: 'USR-008', template: 'TPL-EXH', event: 'EVT-0003', approval: 'Approved', leads: 34, qLeads: 9, opps: 1 },
  { name: 'East Africa Trade Mission 2026', type: 'Trade Mission', objective: 'Support the dtic-led East Africa trade mission with ECIC cover propositions.', kpi: '60 leads, 45% qualification rate, ROI > 400%', audience: 'South African exporters targeting the EAC', segmentation: 'Mixed', budget: 950_000, spend: 152_000, start: 7, end: 40, expRev: 3_800_000, fcRev: 3_900_000, actRev: 0, status: 'Planned', owner: 'USR-008', template: 'TPL-EXH', event: 'EVT-0005', approval: 'Pending Approval', leads: 0, qLeads: 0, opps: 0 },
  { name: 'Broker Channel Enablement', type: 'Webinar', objective: 'Enable the intermediary channel to position ECIC products accurately and in line with the CIM.', kpi: '40 broker registrations, 15 new introductions', audience: 'Registered insurance brokers and intermediaries', segmentation: 'Brokers', budget: 220_000, spend: 0, start: 30, end: 75, expRev: 900_000, fcRev: 900_000, actRev: 0, status: 'Planned', owner: 'USR-009', template: 'TPL-DIG', event: null, approval: 'Draft', leads: 0, qLeads: 0, opps: 0 },
  { name: 'Agri Export Season Roadshow', type: 'Roadshow', objective: 'Regional roadshow across agricultural export hubs ahead of the citrus and grain export season.', kpi: '90 leads, 30% qualification rate, ROI > 220%', audience: 'Agricultural and agro-processing exporters', segmentation: 'Exporters - Agri', budget: 540_000, spend: 0, start: 55, end: 110, expRev: 1_400_000, fcRev: 1_400_000, actRev: 0, status: 'Planned', owner: 'USR-008', template: 'TPL-EXH', event: null, approval: 'Draft', leads: 0, qLeads: 0, opps: 0 },
];

export const CAMPAIGNS: Campaign[] = campSpecs.map((c, i) => ({
  id: `CMP-${String(i + 1).padStart(4, '0')}`,
  reference: `ECIC-CAM-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
  name: c.name, type: c.type, objective: c.objective, kpi: c.kpi,
  targetAudience: c.audience, segmentation: c.segmentation,
  budget: c.budget, actualSpend: c.spend,
  startDate: isoDate(c.start), endDate: isoDate(c.end),
  expectedRevenue: c.expRev, forecastRevenue: c.fcRev, actualRevenue: c.actRev,
  status: c.status, ownerId: c.owner, templateId: c.template, eventId: c.event,
  approvalStatus: c.approval,
  approverId: c.approval === 'Approved' ? 'USR-009' : null,
  cimVersion: 'v4.2',
  leadsGenerated: c.leads, qualifiedLeads: c.qLeads, opportunitiesCreated: c.opps,
  extraFields: {},
}));

export const CIM_VERSIONS: CimVersion[] = [
  {
    id: 'CIM-005', version: 'v4.3', title: 'ECIC Corporate Identity Manual v4.3 (Draft)',
    status: 'Communications Review', effectiveDate: isoDate(45), ownerId: 'USR-009',
    current: false, restricted: false,
    summary: 'Introduces the refreshed digital brand system, revised co-branding rules for dtic trade missions and updated accessibility contrast minimums.',
    approvalSteps: [
      { step: 'Draft prepared', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-20, 11), comment: 'Draft prepared incorporating the digital brand refresh.' },
      { step: 'Marketing review', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-12, 14), comment: 'Reviewed. Co-branding hierarchy agreed with the dtic liaison.' },
      { step: 'Marketing Communications Specialist review', actorId: 'USR-009', role: 'Marketing Communications Specialist', status: 'In Progress', date: null, comment: 'Reviewing accessibility contrast ratios against WCAG 2.1 AA.' },
      { step: 'Executive approval', actorId: 'USR-012', role: 'Chief Operations Officer', status: 'Not Started', date: null, comment: '' },
    ],
    changeLog: ['Digital brand system added (sections 9-12)', 'Co-branding rules for government trade missions', 'Minimum contrast ratio raised to 4.5:1', 'Legacy 2019 logo lockups formally retired'],
  },
  {
    id: 'CIM-004', version: 'v4.2', title: 'ECIC Corporate Identity Manual v4.2',
    status: 'Published', effectiveDate: isoDate(-210), ownerId: 'USR-009',
    current: true, restricted: false,
    summary: 'The current approved Corporate Identity Manual. All marketing assets and campaign templates must comply with this version.',
    approvalSteps: [
      { step: 'Draft prepared', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-280, 10), comment: 'Draft prepared.' },
      { step: 'Marketing review', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-265, 10), comment: 'Approved with minor typographic amendments.' },
      { step: 'Marketing Communications Specialist review', actorId: 'USR-009', role: 'Marketing Communications Specialist', status: 'Approved', date: iso(-240, 14), comment: 'Brand wording and disclaimer library verified.' },
      { step: 'Executive approval', actorId: 'USR-012', role: 'Chief Operations Officer', status: 'Approved', date: iso(-215, 9), comment: 'Approved for publication.' },
    ],
    changeLog: ['Revised primary colour palette', 'New exhibition stand specification', 'Mandatory financial services disclaimer library', 'Photography and imagery guidelines'],
  },
  {
    id: 'CIM-003', version: 'v4.1', title: 'ECIC Corporate Identity Manual v4.1',
    status: 'Obsolete', effectiveDate: isoDate(-620), ownerId: 'USR-009',
    current: false, restricted: true,
    summary: 'Superseded by v4.2. Retained for audit purposes only — assets may not be produced against this version.',
    approvalSteps: [
      { step: 'Draft prepared', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-700, 10), comment: '' },
      { step: 'Marketing review', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-680, 10), comment: '' },
      { step: 'Marketing Communications Specialist review', actorId: 'USR-009', role: 'Marketing Communications Specialist', status: 'Approved', date: iso(-650, 10), comment: '' },
      { step: 'Executive approval', actorId: 'USR-012', role: 'Chief Operations Officer', status: 'Approved', date: iso(-625, 10), comment: '' },
    ],
    changeLog: ['Digital template pack introduced', 'Updated stationery specification'],
  },
  {
    id: 'CIM-002', version: 'v4.0', title: 'ECIC Corporate Identity Manual v4.0',
    status: 'Obsolete', effectiveDate: isoDate(-1050), ownerId: 'USR-009',
    current: false, restricted: true,
    summary: 'Superseded. Restricted from use.',
    approvalSteps: [
      { step: 'Draft prepared', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-1120, 10), comment: '' },
      { step: 'Marketing review', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-1100, 10), comment: '' },
      { step: 'Marketing Communications Specialist review', actorId: 'USR-009', role: 'Marketing Communications Specialist', status: 'Approved', date: iso(-1080, 10), comment: '' },
      { step: 'Executive approval', actorId: 'USR-012', role: 'Chief Operations Officer', status: 'Approved', date: iso(-1055, 10), comment: '' },
    ],
    changeLog: ['Full brand refresh following corporate repositioning'],
  },
  {
    id: 'CIM-001', version: 'v3.4', title: 'ECIC Corporate Identity Manual v3.4',
    status: 'Obsolete', effectiveDate: isoDate(-1560), ownerId: 'USR-009',
    current: false, restricted: true,
    summary: 'Superseded. Restricted from use.',
    approvalSteps: [
      { step: 'Draft prepared', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-1620, 10), comment: '' },
      { step: 'Marketing review', actorId: 'USR-008', role: 'Marketing Manager', status: 'Approved', date: iso(-1600, 10), comment: '' },
      { step: 'Marketing Communications Specialist review', actorId: 'USR-009', role: 'Marketing Communications Specialist', status: 'Approved', date: iso(-1580, 10), comment: '' },
      { step: 'Executive approval', actorId: 'USR-012', role: 'Chief Operations Officer', status: 'Approved', date: iso(-1565, 10), comment: '' },
    ],
    changeLog: ['Legacy manual'],
  },
];

const checkSet = (pass: boolean[]): MarketingAsset['checks'] => [
  { id: 'chk_logo', label: 'Approved ECIC logo lockup used at minimum clear space', passed: pass[0], detail: pass[0] ? 'Primary horizontal lockup detected at 24px clear space.' : 'Legacy 2019 lockup detected — retired in CIM v4.2 section 3.1.' },
  { id: 'chk_colour', label: 'Colour palette matches the approved CIM palette', passed: pass[1], detail: pass[1] ? 'All colour values resolve to the CIM v4.2 primary and accent palette.' : 'Accent colour #1F9E8F is not in the approved palette (nearest approved: #0E7C7B).' },
  { id: 'chk_disclaimer', label: 'Mandatory financial services disclaimer present', passed: pass[2], detail: pass[2] ? 'Standard disclaimer block present and legible at final output size.' : 'Required disclaimer block is absent from the artwork.' },
  { id: 'chk_template', label: 'Approved CIM template used', passed: pass[3], detail: pass[3] ? 'Asset built from the approved exhibition template pack.' : 'Asset was not produced from an approved template.' },
  { id: 'chk_wording', label: 'Brand wording and product naming compliant', passed: pass[4], detail: pass[4] ? 'Product naming matches the controlled product nomenclature.' : '"ECIC Credit Cover" is not an approved product name — use "Export Credit Insurance".' },
  { id: 'chk_reviewer', label: 'Marketing Communications Specialist assigned as reviewer', passed: pass[5], detail: pass[5] ? 'Reviewer assigned in line with the mandatory CIM approval step.' : 'No Marketing Communications Specialist has been assigned — mandatory approval step is unassigned.' },
];

export const MARKETING_ASSETS: MarketingAsset[] = [
  { id: 'AST-001', name: 'Africa Trade Expo - Stand Backdrop 6x3m', campaignId: 'CMP-0001', assetType: 'Exhibition stand graphic', templateUsed: 'Exhibition Stand Pack v4.2', cimVersion: 'v4.2', submittedById: 'USR-008', submittedAt: iso(-40, 11), status: 'Approved', checks: checkSet([true, true, true, true, true, true]), reviewerId: 'USR-009' },
  { id: 'AST-002', name: 'Political Risk Launch - LinkedIn Carousel', campaignId: 'CMP-0004', assetType: 'Digital advertisement', templateUsed: 'Digital Social Pack v4.2', cimVersion: 'v4.2', submittedById: 'USR-008', submittedAt: iso(-18, 9), status: 'Compliance Review', checks: checkSet([true, false, true, true, false, true]), reviewerId: 'USR-009' },
  { id: 'AST-003', name: 'Manufacturing Indaba - Leaflet A5', campaignId: 'CMP-0007', assetType: 'Print collateral', templateUsed: 'Print Collateral Pack v4.2', cimVersion: 'v4.2', submittedById: 'USR-008', submittedAt: iso(-9, 15), status: 'Approved', checks: checkSet([true, true, true, true, true, true]), reviewerId: 'USR-009' },
  { id: 'AST-004', name: 'Broker Enablement - Webinar Deck', campaignId: 'CMP-0009', assetType: 'Presentation', templateUsed: 'Unbranded deck', cimVersion: 'v4.2', submittedById: 'USR-008', submittedAt: iso(-3, 10), status: 'Submitted', checks: checkSet([false, true, false, false, true, false]), reviewerId: null },
  { id: 'AST-005', name: 'East Africa Mission - Roll-up Banner', campaignId: 'CMP-0008', assetType: 'Exhibition banner', templateUsed: 'Exhibition Stand Pack v4.2', cimVersion: 'v4.2', submittedById: 'USR-008', submittedAt: iso(-1, 16), status: 'Compliance Review', checks: checkSet([true, true, false, true, true, true]), reviewerId: 'USR-009' },
];

export const currentCim = () => CIM_VERSIONS.find((c) => c.current) ?? CIM_VERSIONS[1];
