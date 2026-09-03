import type { DesktopAnalysis, Lead, LeadSource, LeadStatus, TimelineEvent } from '../types';
import { addBusinessDays, daysFromNow, iso } from '../utils/dates';
import { userById } from './users';
import { makeRng, pick, intBetween } from '../utils/format';

interface Spec {
  contact: string; company: string; customerId: string | null; sector: string;
  product: string; source: LeadSource; status: LeadStatus; created: number;
  owner: string | null; backup: string | null; value: number; country: string;
  campaign?: string | null; event?: string | null; score?: number;
  enquiry: string; notes?: string; disq?: string; converted?: string;
  offline?: boolean;
}

const PRODUCTS = [
  'Export Credit Insurance (Short-Term)', 'Export Credit Insurance (Medium/Long-Term)',
  'Investment Insurance', 'Political Risk Cover', 'Buyer Credit Guarantee',
  'Working Capital Support', 'Performance Bond Cover', 'Contract Frustration Cover',
];

const ENQUIRY_TYPES = [
  'New cover enquiry', 'Existing policy extension', 'Country limit availability',
  'Premium indication request', 'Broker introduction', 'Product information',
  'Tender support request', 'Project finance support',
];

const specs: Spec[] = [
  { contact: 'Grace Mabaso', company: 'Highveld Steel & Vanadium (Pty) Ltd', customerId: 'CUS-0001', sector: 'Metals & Mining', product: PRODUCTS[1], source: 'Manual Capture', status: 'Converted', created: -120, owner: 'USR-004', backup: 'USR-017', value: 340_000_000, country: 'Zambia', campaign: 'CMP-0003', score: 92, enquiry: 'Project finance support', converted: 'OPP-0001', notes: 'Follow-on cover for the Zambian smelter expansion; existing policyholder in good standing.' },
  { contact: 'Chanda Mulenga', company: 'Zambezi Power Holdings Ltd', customerId: 'CUS-0004', sector: 'Energy & Power', product: PRODUCTS[2], source: 'Exhibition / QR', status: 'Converted', created: -96, owner: 'USR-005', backup: 'USR-004', value: 890_000_000, country: 'Zambia', campaign: 'CMP-0001', event: 'EVT-0002', score: 88, enquiry: 'Project finance support', converted: 'OPP-0002' },
  { contact: 'Kwame Boateng', company: 'Accra Infrastructure Partners Ltd', customerId: 'CUS-0008', sector: 'Construction & Infrastructure', product: PRODUCTS[4], source: 'Web Form', status: 'Converted', created: -78, owner: 'USR-005', backup: 'USR-017', value: 620_000_000, country: 'Ghana', campaign: 'CMP-0002', score: 84, enquiry: 'Tender support request', converted: 'OPP-0003' },
  { contact: 'Ana Macuácua', company: 'Mozambique LNG Services Lda', customerId: 'CUS-0011', sector: 'Oil & Gas', product: PRODUCTS[3], source: 'Referral', status: 'Converted', created: -64, owner: 'USR-017', backup: 'USR-005', value: 1_450_000_000, country: 'Mozambique', campaign: 'CMP-0004', score: 95, enquiry: 'New cover enquiry', converted: 'OPP-0004' },
  { contact: 'Lindiwe Jacobs', company: 'Eastern Cape Wind Farm Consortium', customerId: 'CUS-0024', sector: 'Energy & Power', product: PRODUCTS[2], source: 'Customer Portal', status: 'Converted', created: -58, owner: 'USR-006', backup: 'USR-007', value: 720_000_000, country: 'South Africa', campaign: 'CMP-0005', score: 81, enquiry: 'New cover enquiry', converted: 'OPP-0005' },
  { contact: 'Uwase Mukamana', company: 'Kigali Digital Infrastructure Ltd', customerId: 'CUS-0015', sector: 'Telecommunications', product: PRODUCTS[1], source: 'Exhibition / QR', status: 'Qualified', created: -22, owner: 'USR-005', backup: 'USR-004', value: 410_000_000, country: 'Rwanda', campaign: 'CMP-0001', event: 'EVT-0001', score: 78, enquiry: 'Project finance support', notes: 'Captured at the Africa Trade Expo stand. Fibre backbone project with a confirmed off-take agreement.' },
  { contact: 'Adebayo Okonkwo', company: 'Lagos Renewable Energy Ltd', customerId: 'CUS-0013', sector: 'Energy & Power', product: PRODUCTS[3], source: 'Social Media', status: 'Qualified', created: -30, owner: 'USR-005', backup: 'USR-017', value: 980_000_000, country: 'Nigeria', campaign: 'CMP-0006', score: 74, enquiry: 'New cover enquiry' },
  { contact: 'Wanjiru Kamau', company: 'Nairobi Agritech Solutions Ltd', customerId: 'CUS-0021', sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Exhibition / QR', status: 'Qualified', created: -14, owner: 'USR-004', backup: 'USR-017', value: 62_000_000, country: 'Kenya', campaign: 'CMP-0001', event: 'EVT-0001', score: 71, enquiry: 'New cover enquiry' },
  { contact: 'Yao Koffi', company: 'Abidjan Cocoa Processing SA', customerId: 'CUS-0025', sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Web Form', status: 'Contacted', created: -9, owner: 'USR-004', backup: 'USR-005', value: 88_000_000, country: "Côte d'Ivoire", campaign: 'CMP-0002', score: 58, enquiry: 'Premium indication request' },
  { contact: 'Helena Shipanga', company: 'Namib Desert Logistics CC', customerId: 'CUS-0007', sector: 'Logistics', product: PRODUCTS[0], source: 'Email', status: 'Contacted', created: -11, owner: 'USR-005', backup: 'USR-004', value: 45_000_000, country: 'Namibia', score: 54, enquiry: 'New cover enquiry' },
  { contact: 'Tendai Chikwanha', company: 'Harare Water Utilities Ltd', customerId: 'CUS-0023', sector: 'Water & Sanitation', product: PRODUCTS[1], source: 'API Integration', status: 'Assigned', created: -5, owner: 'USR-017', backup: 'USR-005', value: 530_000_000, country: 'Zimbabwe', campaign: 'CMP-0004', score: 66, enquiry: 'Project finance support', notes: 'Received via the dtic Integrated Financial Workflow (IFW) API feed.' },
  { contact: 'Juma Mwakalinga', company: 'Dar es Salaam Port Works Ltd', customerId: 'CUS-0018', sector: 'Construction & Infrastructure', product: PRODUCTS[6], source: 'Referral', status: 'Assigned', created: -4, owner: 'USR-017', backup: 'USR-004', value: 275_000_000, country: 'Tanzania', score: 63, enquiry: 'Tender support request' },
  { contact: 'Sibusiso Ngwenya', company: 'Tembisa Rail Components (Pty) Ltd', customerId: 'CUS-0006', sector: 'Rail & Transport', product: PRODUCTS[0], source: 'Customer Portal', status: 'Assigned', created: -3, owner: 'USR-004', backup: 'USR-017', value: 68_000_000, country: 'South Africa', score: 60, enquiry: 'Existing policy extension' },
  { contact: 'Marius Lombard', company: 'Free State Grain Handling SOC', customerId: 'CUS-0014', sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Manual Capture', status: 'New', created: -1, owner: null, backup: null, value: 39_000_000, country: 'South Africa', score: 0, enquiry: 'Premium indication request' },
  { contact: 'Tshepo Malatji', company: 'Limpopo Citrus Growers Co-operative', customerId: 'CUS-0019', sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Web Form', status: 'New', created: 0, owner: null, backup: null, value: 24_000_000, country: 'South Africa', score: 0, enquiry: 'New cover enquiry' },
  { contact: 'Nadia Abrahams', company: 'Trade Assure Brokers (Pty) Ltd', customerId: 'CUS-0017', sector: 'Insurance Broking', product: PRODUCTS[5], source: 'Email', status: 'New', created: 0, owner: null, backup: null, value: 15_000_000, country: 'South Africa', score: 0, enquiry: 'Broker introduction' },
  { contact: 'Erastus Nangolo', company: 'Windhoek Mining Equipment (Pty) Ltd', customerId: 'CUS-0020', sector: 'Metals & Mining', product: PRODUCTS[0], source: 'Social Media', status: 'Disqualified', created: -44, owner: 'USR-007', backup: 'USR-006', value: 12_000_000, country: 'Namibia', score: 22, enquiry: 'Product information', disq: 'Transaction value below the minimum ECIC underwriting threshold and no South African content.' },
  { contact: 'Hendrik Steyn', company: 'Vaal Chemical Industries SOC', customerId: 'CUS-0022', sector: 'Chemicals', product: PRODUCTS[1], source: 'Manual Capture', status: 'Qualified', created: -26, owner: 'USR-006', backup: 'USR-007', value: 460_000_000, country: 'South Africa', campaign: 'CMP-0005', score: 83, enquiry: 'New cover enquiry' },
  { contact: 'Charl van Rensburg', company: 'Port Elizabeth Automotive Components', customerId: 'CUS-0016', sector: 'Automotive', product: PRODUCTS[0], source: 'Manual Capture', status: 'Converted', created: -52, owner: 'USR-006', backup: 'USR-007', value: 190_000_000, country: 'South Africa', score: 79, enquiry: 'Existing policy extension', converted: 'OPP-0006' },
  { contact: 'Anton Fourie', company: 'Cape Peninsula Marine Engineering', customerId: 'CUS-0005', sector: 'Marine & Shipbuilding', product: PRODUCTS[6], source: 'Web Form', status: 'Converted', created: -47, owner: 'USR-006', backup: 'USR-004', value: 155_000_000, country: 'South Africa', campaign: 'CMP-0002', score: 76, enquiry: 'Tender support request', converted: 'OPP-0007' },
  { contact: 'Dr Rebecca Sithole', company: 'Gauteng Pharma Manufacturing SOC', customerId: 'CUS-0009', sector: 'Pharmaceutical', product: PRODUCTS[0], source: 'Referral', status: 'Converted', created: -40, owner: 'USR-004', backup: 'USR-017', value: 210_000_000, country: 'South Africa', score: 80, enquiry: 'New cover enquiry', converted: 'OPP-0008' },
  { contact: 'Colonel (Ret.) Neo Setshedi', company: 'Pretoria Defence Systems (Pty) Ltd', customerId: 'CUS-0027', sector: 'Defence & Aerospace', product: PRODUCTS[7], source: 'Manual Capture', status: 'Contacted', created: -18, owner: 'USR-004', backup: 'USR-005', value: 385_000_000, country: 'South Africa', score: 68, enquiry: 'New cover enquiry' },
  { contact: 'Yusuf Ismail', company: 'Durban Textile Exporters (Pty) Ltd', customerId: 'CUS-0012', sector: 'Textiles & Apparel', product: PRODUCTS[0], source: 'Customer Portal', status: 'Contacted', created: -16, owner: 'USR-004', backup: 'USR-017', value: 34_000_000, country: 'South Africa', score: 51, enquiry: 'Existing policy extension' },
  { contact: 'Priya Govender', company: 'Rand Merchant Trade Finance', customerId: 'CUS-0003', sector: 'Banking', product: PRODUCTS[4], source: 'Manual Capture', status: 'Converted', created: -88, owner: 'USR-006', backup: 'USR-007', value: 1_100_000_000, country: 'South Africa', campaign: 'CMP-0003', score: 91, enquiry: 'Project finance support', converted: 'OPP-0009' },
  { contact: 'Tebogo Kgosi', company: 'Standard Trade Bank of Botswana', customerId: 'CUS-0010', sector: 'Banking', product: PRODUCTS[4], source: 'Email', status: 'Qualified', created: -33, owner: 'USR-007', backup: 'USR-006', value: 640_000_000, country: 'Botswana', campaign: 'CMP-0003', score: 77, enquiry: 'Buyer credit enquiry' },
  { contact: 'Willem de Beer', company: 'Kalahari Agri Processing SOC', customerId: 'CUS-0002', sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Manual Capture', status: 'Converted', created: -70, owner: 'USR-004', backup: 'USR-017', value: 128_000_000, country: 'South Africa', score: 82, enquiry: 'Existing policy extension', converted: 'OPP-0010' },
  { contact: 'Thandeka Buthelezi', company: 'Richards Bay Bulk Terminals (Pty) Ltd', customerId: null, sector: 'Logistics', product: PRODUCTS[0], source: 'Exhibition / QR', status: 'Contacted', created: -12, owner: 'USR-017', backup: 'USR-004', value: 92_000_000, country: 'South Africa', campaign: 'CMP-0001', event: 'EVT-0001', score: 57, enquiry: 'New cover enquiry' },
  { contact: 'Gift Sibanda', company: 'Bulawayo Engineering Works Ltd', customerId: null, sector: 'Manufacturing', product: PRODUCTS[0], source: 'Exhibition / QR', status: 'New', created: -2, owner: 'USR-005', backup: 'USR-017', value: 28_000_000, country: 'Zimbabwe', campaign: 'CMP-0007', event: 'EVT-0003', score: 0, enquiry: 'Product information', offline: true },
  { contact: 'Amina Hassan', company: 'Mombasa Cold Chain Ltd', customerId: null, sector: 'Logistics', product: PRODUCTS[0], source: 'Exhibition / QR', status: 'New', created: -2, owner: 'USR-005', backup: 'USR-004', value: 41_000_000, country: 'Kenya', campaign: 'CMP-0007', event: 'EVT-0003', score: 0, enquiry: 'New cover enquiry', offline: true },
  { contact: 'Pieter Nel', company: 'Saldanha Steel Exports (Pty) Ltd', customerId: null, sector: 'Metals & Mining', product: PRODUCTS[1], source: 'Web Form', status: 'Assigned', created: -6, owner: 'USR-006', backup: 'USR-007', value: 310_000_000, country: 'South Africa', campaign: 'CMP-0006', score: 62, enquiry: 'New cover enquiry' },
  { contact: 'Lebo Motaung', company: 'Sasolburg Speciality Chemicals CC', customerId: null, sector: 'Chemicals', product: PRODUCTS[0], source: 'Email', status: 'Contacted', created: -20, owner: 'USR-007', backup: 'USR-006', value: 57_000_000, country: 'South Africa', score: 49, enquiry: 'Premium indication request' },
  { contact: 'Nokuthula Zwane', company: 'Mbombela Fresh Produce Exporters', customerId: null, sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Web Form', status: 'Disqualified', created: -37, owner: 'USR-004', backup: 'USR-017', value: 8_000_000, country: 'South Africa', score: 18, enquiry: 'New cover enquiry', disq: 'Exporter does not meet the minimum trading history requirement of three years.' },
  { contact: 'Emmanuel Osei', company: 'Tema Industrial Fabrication Ltd', customerId: null, sector: 'Manufacturing', product: PRODUCTS[6], source: 'Exhibition / QR', status: 'Qualified', created: -25, owner: 'USR-005', backup: 'USR-017', value: 148_000_000, country: 'Ghana', campaign: 'CMP-0002', event: 'EVT-0004', score: 73, enquiry: 'Tender support request' },
  { contact: 'Sarah Adams', company: 'Cape Wine Export Alliance', customerId: null, sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Social Media', status: 'Contacted', created: -13, owner: 'USR-006', backup: 'USR-007', value: 31_000_000, country: 'South Africa', campaign: 'CMP-0006', score: 46, enquiry: 'Product information' },
  { contact: 'Kabelo Selepe', company: 'Rustenburg Platinum Services (Pty) Ltd', customerId: null, sector: 'Metals & Mining', product: PRODUCTS[1], source: 'Manual Capture', status: 'Assigned', created: -7, owner: 'USR-017', backup: 'USR-004', value: 420_000_000, country: 'South Africa', score: 64, enquiry: 'New cover enquiry' },
  { contact: 'Maria Santos', company: 'Beira Corridor Logistics Lda', customerId: null, sector: 'Logistics', product: PRODUCTS[0], source: 'API Integration', status: 'New', created: -1, owner: null, backup: null, value: 76_000_000, country: 'Mozambique', score: 0, enquiry: 'New cover enquiry' },
  { contact: 'David Mwangi', company: 'Kenya Tea Packers Export Ltd', customerId: null, sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Referral', status: 'Contacted', created: -19, owner: 'USR-004', backup: 'USR-005', value: 52_000_000, country: 'Kenya', score: 55, enquiry: 'New cover enquiry' },
  { contact: 'Refilwe Dikgale', company: 'Polokwane Solar Components (Pty) Ltd', customerId: null, sector: 'Energy & Power', product: PRODUCTS[0], source: 'Web Form', status: 'Qualified', created: -29, owner: 'USR-006', backup: 'USR-007', value: 118_000_000, country: 'South Africa', campaign: 'CMP-0005', score: 70, enquiry: 'New cover enquiry' },
  { contact: 'Chipo Nyathi', company: 'Victoria Falls Hospitality Group', customerId: null, sector: 'Tourism', product: PRODUCTS[2], source: 'Exhibition / QR', status: 'Disqualified', created: -35, owner: 'USR-005', backup: 'USR-017', value: 21_000_000, country: 'Zimbabwe', event: 'EVT-0004', score: 26, enquiry: 'Product information', disq: 'Sector falls outside the current ECIC investment insurance mandate.' },
  { contact: 'Andile Mkhize', company: 'KwaZulu Sugar Terminals SOC', customerId: null, sector: 'Agriculture & Agro-processing', product: PRODUCTS[0], source: 'Customer Portal', status: 'Assigned', created: -8, owner: 'USR-004', backup: 'USR-017', value: 84_000_000, country: 'South Africa', score: 59, enquiry: 'Existing policy extension' },
  { contact: 'Bernadette Kalonji', company: 'Lubumbashi Mining Supplies SARL', customerId: null, sector: 'Metals & Mining', product: PRODUCTS[3], source: 'Email', status: 'Contacted', created: -23, owner: 'USR-017', backup: 'USR-005', value: 240_000_000, country: 'DRC', score: 61, enquiry: 'Country limit availability' },
  { contact: 'Stefan Kruger', company: 'George Aviation Components (Pty) Ltd', customerId: null, sector: 'Defence & Aerospace', product: PRODUCTS[0], source: 'Manual Capture', status: 'New', created: 0, owner: null, backup: null, value: 47_000_000, country: 'South Africa', score: 0, enquiry: 'New cover enquiry' },
  { contact: 'Portia Mnisi', company: 'Nelspruit Timber Exports CC', customerId: null, sector: 'Forestry', product: PRODUCTS[0], source: 'Social Media', status: 'New', created: 0, owner: null, backup: null, value: 19_000_000, country: 'South Africa', campaign: 'CMP-0006', score: 0, enquiry: 'Product information' },
];

const rng = makeRng(20260901);

function analysisFor(status: LeadStatus, score: number, ownerId: string | null, created: number): DesktopAnalysis {
  const done = status === 'Qualified' || status === 'Converted' || status === 'Disqualified';
  if (!done) {
    return { completed: false, completedBy: null, completedAt: null, values: {}, decision: null, notes: '', riskRating: null };
  }
  const proceed = status !== 'Disqualified';
  return {
    completed: true,
    completedBy: ownerId,
    completedAt: iso(created + 3, 14),
    values: {
      af_export_history: proceed,
      af_registered: true,
      af_buyer_country: proceed,
      af_local_content: proceed || rng() > 0.5,
      af_financials: proceed,
      af_credit_rating: proceed ? pick(rng, ['AAA - A', 'BBB', 'BB']) : pick(rng, ['B', 'Below B', 'Unrated']),
      af_country_risk: proceed ? pick(rng, ['2', '3', '4']) : pick(rng, ['5', '6', '7 - Highest']),
      af_sector_risk: proceed
        ? 'Sector fundamentals stable; buyer operates in a regulated market with predictable offtake.'
        : 'Sector exposure exceeds current appetite and the buyer has limited trading history.',
      af_sanctions: true,
      af_esg: 'No category A environmental impacts identified in the preliminary screening.',
      af_competitor: pick(rng, ['None identified', 'UKEF indicated interest', 'SACE approached by sponsor', 'None identified']),
      af_indicative_premium: `${(1.2 + rng() * 2.6).toFixed(2)}%`,
    },
    decision: proceed ? (score > 75 ? 'Proceed' : 'Refer') : 'Decline',
    notes: proceed
      ? 'Desktop analysis supports progression. Buyer country within limits, exporter has demonstrable track record and required local content is met.'
      : 'Desktop analysis does not support progression against the current qualification criteria.',
    riskRating: proceed ? (score > 80 ? 'Low' : 'Moderate') : 'High',
  };
}

function timelineFor(id: string, s: Spec): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  let n = 1;
  const add = (at: number, actorId: string | null, type: string, title: string, detail: string, hour = 10) => {
    const u = userById(actorId ?? '');
    out.push({
      id: `${id}-T${n}`, at: iso(at, hour, (n * 11) % 60),
      actor: u?.name ?? 'System', actorRole: u?.jobTitle ?? 'CRM Workflow Engine',
      type, title, detail,
    });
    n += 1;
  };
  add(s.created, s.owner, 'Created', `Lead captured via ${s.source}`,
    `Lead record created from the ${s.source} channel${s.event ? ` at event ${s.event}` : ''}. Duplicate detection executed against email, telephone and company name with no blocking match.`, 9);
  if (s.owner) {
    add(s.created, null, 'Assigned', `Assigned to ${userById(s.owner)?.name}`,
      `Assignment rule matched on sector "${s.sector}" and territory "${s.country}". Backup owner ${userById(s.backup ?? '')?.name ?? 'not set'} recorded to maintain resource-pool visibility.`, 11);
  }
  if (['Contacted', 'Qualified', 'Disqualified', 'Converted'].includes(s.status)) {
    add(s.created + 1, s.owner, 'Contact', 'First contact completed',
      'Introductory call held with the client. Requirement, transaction value and target buyer country captured against the lead.', 13);
  }
  if (['Qualified', 'Disqualified', 'Converted'].includes(s.status)) {
    add(s.created + 3, s.owner, 'Analysis', 'Desktop analysis completed',
      `Structured desktop analysis completed against the configured qualification and risk criteria. Qualification score: ${s.score ?? 0}/100.`, 14);
  }
  if (s.status === 'Disqualified') {
    add(s.created + 4, s.owner, 'Disqualified', 'Lead disqualified', s.disq ?? '', 15);
  }
  if (s.status === 'Converted') {
    add(s.created + 5, s.owner, 'Converted', `Converted to opportunity ${s.converted}`,
      'Conversion wizard copied the account, contact, interaction history, supporting documents, campaign attribution and desktop analysis outcome onto the new opportunity. The originating lead relationship is retained permanently for traceability.', 10);
  }
  return out;
}

export const LEADS: Lead[] = specs.map((s, i) => {
  const id = `LED-${String(i + 1).padStart(4, '0')}`;
  const created = daysFromNow(s.created, 9);
  return {
    id,
    reference: `ECIC-LED-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    contactName: s.contact,
    company: s.company,
    customerId: s.customerId,
    email: `${s.contact.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).slice(-2).join('.')}@${s.company.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).slice(0, 2).join('')}.demo.africa`,
    phone: `+27 ${intBetween(rng, 10, 87)} ${intBetween(rng, 200, 999)} ${intBetween(rng, 1000, 9999)}`,
    source: s.source,
    enquiryType: s.enquiry || pick(rng, ENQUIRY_TYPES),
    sector: s.sector,
    productInterest: s.product,
    campaignId: s.campaign ?? null,
    eventId: s.event ?? null,
    ownerId: s.owner,
    backupOwnerId: s.backup,
    status: s.status,
    qualificationScore: s.score ?? 0,
    estimatedValue: s.value,
    createdDate: created.toISOString(),
    slaDueDate: addBusinessDays(created, 2).toISOString(),
    firstContactDate: ['Contacted', 'Qualified', 'Disqualified', 'Converted'].includes(s.status)
      ? iso(s.created + 1, 13) : null,
    disqualifiedReason: s.disq ?? null,
    convertedOpportunityId: s.converted ?? null,
    desktopAnalysis: analysisFor(s.status, s.score ?? 0, s.owner, s.created),
    syncStatus: s.offline ? 'Pending Sync' : 'Synced',
    country: s.country,
    notes: s.notes ?? '',
    documentIds: [],
    timeline: timelineFor(id, s),
  };
});

export const LEAD_PRODUCTS = PRODUCTS;
export const LEAD_ENQUIRY_TYPES = ENQUIRY_TYPES;
export const leadById = (id: string) => LEADS.find((l) => l.id === id);

