import type { Application, ApplicationField, ApplicationStatus, TimelineEvent } from '../types';
import { iso } from '../utils/dates';
import { userById } from './users';
import { customerById } from './customers';

export const APPLICATION_FORMS: Record<string, ApplicationField[]> = {
  'Short-Term Export Credit Insurance Application': [
    { id: 'legalName', label: 'Registered legal name of exporter', type: 'text', required: true, section: 'Applicant details' },
    { id: 'registrationNo', label: 'Company registration number', type: 'text', required: true, section: 'Applicant details', helper: 'CIPC or equivalent registration in the country of incorporation' },
    { id: 'vatNo', label: 'VAT / tax reference number', type: 'text', required: true, section: 'Applicant details' },
    { id: 'yearsTrading', label: 'Years trading', type: 'number', required: true, section: 'Applicant details' },
    { id: 'annualTurnover', label: 'Annual turnover (ZAR)', type: 'number', required: true, section: 'Applicant details' },
    { id: 'buyerCountry', label: 'Principal buyer country', type: 'select', required: true, section: 'Transaction details', options: ['Zambia', 'Ghana', 'Kenya', 'Nigeria', 'Mozambique', 'Tanzania', 'Botswana', 'Namibia', 'Zimbabwe', 'Rwanda', "Côte d'Ivoire", 'Other'] },
    { id: 'buyerName', label: 'Buyer legal name', type: 'text', required: true, section: 'Transaction details' },
    { id: 'contractValue', label: 'Contract value (ZAR)', type: 'number', required: true, section: 'Transaction details' },
    { id: 'creditPeriod', label: 'Credit period requested', type: 'select', required: true, section: 'Transaction details', options: ['30 days', '60 days', '90 days', '120 days', '180 days'] },
    { id: 'goodsDescription', label: 'Description of goods or services exported', type: 'textarea', required: true, section: 'Transaction details' },
    { id: 'localContent', label: 'South African local content (%)', type: 'number', required: true, section: 'Eligibility', helper: 'Minimum threshold applies per the ECIC mandate' },
    { id: 'previousLosses', label: 'Any buyer defaults in the last 3 years?', type: 'select', required: true, section: 'Eligibility', options: ['No', 'Yes - fully recovered', 'Yes - partially recovered', 'Yes - written off'] },
    { id: 'sanctionsDeclaration', label: 'I confirm neither party is subject to sanctions', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'informationAccurate', label: 'I confirm the information provided is accurate and complete', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'popiaConsent', label: 'I consent to the processing of personal information per the ECIC privacy notice', type: 'checkbox', required: true, section: 'Declarations' },
  ],
  'Medium/Long-Term Cover Application': [
    { id: 'legalName', label: 'Registered legal name of exporter', type: 'text', required: true, section: 'Applicant details' },
    { id: 'registrationNo', label: 'Company registration number', type: 'text', required: true, section: 'Applicant details' },
    { id: 'projectName', label: 'Project name', type: 'text', required: true, section: 'Project details' },
    { id: 'projectCountry', label: 'Project country', type: 'select', required: true, section: 'Project details', options: ['Zambia', 'Ghana', 'Kenya', 'Nigeria', 'Mozambique', 'Tanzania', 'Zimbabwe', 'Rwanda', 'Other'] },
    { id: 'projectValue', label: 'Total project value (ZAR)', type: 'number', required: true, section: 'Project details' },
    { id: 'coverRequested', label: 'Cover amount requested (ZAR)', type: 'number', required: true, section: 'Project details' },
    { id: 'tenor', label: 'Tenor requested (years)', type: 'number', required: true, section: 'Project details' },
    { id: 'obligor', label: 'Obligor / borrower', type: 'text', required: true, section: 'Project details' },
    { id: 'sovereignGuarantee', label: 'Sovereign guarantee available?', type: 'select', required: true, section: 'Project details', options: ['Yes', 'No', 'Under negotiation'] },
    { id: 'esgCategory', label: 'Environmental & social category', type: 'select', required: true, section: 'ESG', options: ['Category A', 'Category B', 'Category C'] },
    { id: 'esgSummary', label: 'Environmental & social impact summary', type: 'textarea', required: true, section: 'ESG' },
    { id: 'localContent', label: 'South African local content (%)', type: 'number', required: true, section: 'Eligibility' },
    { id: 'sanctionsDeclaration', label: 'I confirm neither party is subject to sanctions', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'informationAccurate', label: 'I confirm the information provided is accurate and complete', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'popiaConsent', label: 'I consent to the processing of personal information per the ECIC privacy notice', type: 'checkbox', required: true, section: 'Declarations' },
  ],
  'Political Risk / Investment Insurance Application': [
    { id: 'legalName', label: 'Registered legal name of investor', type: 'text', required: true, section: 'Applicant details' },
    { id: 'registrationNo', label: 'Company registration number', type: 'text', required: true, section: 'Applicant details' },
    { id: 'hostCountry', label: 'Host country of investment', type: 'select', required: true, section: 'Investment details', options: ['Zambia', 'Ghana', 'Kenya', 'Nigeria', 'Mozambique', 'Tanzania', 'Zimbabwe', 'DRC', 'Other'] },
    { id: 'investmentValue', label: 'Investment value (ZAR)', type: 'number', required: true, section: 'Investment details' },
    { id: 'investmentType', label: 'Type of investment', type: 'select', required: true, section: 'Investment details', options: ['Equity', 'Shareholder loan', 'Plant & equipment', 'Mixed'] },
    { id: 'risksCovered', label: 'Risks for which cover is sought', type: 'select', required: true, section: 'Investment details', options: ['Expropriation', 'War & civil disturbance', 'Transfer & convertibility', 'Breach of contract', 'All of the above'] },
    { id: 'tenor', label: 'Tenor requested (years)', type: 'number', required: true, section: 'Investment details' },
    { id: 'hostApproval', label: 'Host government approval obtained?', type: 'select', required: true, section: 'Investment details', options: ['Yes', 'No', 'In progress'] },
    { id: 'esgSummary', label: 'Environmental & social impact summary', type: 'textarea', required: true, section: 'ESG' },
    { id: 'sanctionsDeclaration', label: 'I confirm neither party is subject to sanctions', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'informationAccurate', label: 'I confirm the information provided is accurate and complete', type: 'checkbox', required: true, section: 'Declarations' },
    { id: 'popiaConsent', label: 'I consent to the processing of personal information per the ECIC privacy notice', type: 'checkbox', required: true, section: 'Declarations' },
  ],
};

export const APPLICATION_FORM_TYPES = Object.keys(APPLICATION_FORMS);

interface Spec {
  form: string; customerId: string; opp: string | null; owner: string;
  status: ApplicationStatus; created: number; submitted: number | null; decision: number | null;
  reviewer: string | null; approver: string | null; signed: boolean; rejection?: string;
  values: Record<string, string | number | boolean>;
}

const specs: Spec[] = [
  { form: 'Medium/Long-Term Cover Application', customerId: 'CUS-0001', opp: 'OPP-0001', owner: 'USR-004', status: 'Under Review', created: -35, submitted: -30, decision: null, reviewer: 'USR-011', approver: null, signed: true,
    values: { legalName: 'Highveld Steel & Vanadium (Pty) Ltd', registrationNo: '2006/114872/07', projectName: 'Zambian Smelter Expansion Phase 2', projectCountry: 'Zambia', projectValue: 980_000_000, coverRequested: 340_000_000, tenor: 7, obligor: 'Copperbelt Metals Processing Ltd', sovereignGuarantee: 'Under negotiation', esgCategory: 'Category B', esgSummary: 'Brownfield expansion on an existing licensed site. Air emissions and water use managed under the existing Zambian ZEMA permit. No involuntary resettlement.', localContent: 72, sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Medium/Long-Term Cover Application', customerId: 'CUS-0004', opp: 'OPP-0002', owner: 'USR-005', status: 'Submitted', created: -16, submitted: -12, decision: null, reviewer: 'USR-011', approver: null, signed: true,
    values: { legalName: 'Zambezi Power Holdings Ltd', registrationNo: '2011/009913/ZM', projectName: 'Kafue Gorge Hydro Expansion', projectCountry: 'Zambia', projectValue: 3_200_000_000, coverRequested: 890_000_000, tenor: 12, obligor: 'Zambezi Power Holdings Ltd', sovereignGuarantee: 'Yes', esgCategory: 'Category A', esgSummary: 'Category A hydro project. Full ESIA completed and disclosed for 120 days. Resettlement action plan covers 46 households with compensation agreed.', localContent: 61, sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Political Risk / Investment Insurance Application', customerId: 'CUS-0011', opp: 'OPP-0004', owner: 'USR-017', status: 'Under Review', created: -24, submitted: -20, decision: null, reviewer: 'USR-011', approver: null, signed: true,
    values: { legalName: 'Mozambique LNG Services Lda', registrationNo: '100482911/MZ', hostCountry: 'Mozambique', investmentValue: 2_100_000_000, investmentType: 'Plant & equipment', risksCovered: 'All of the above', tenor: 8, hostApproval: 'Yes', esgSummary: 'Onshore support facility within an existing industrial zone. Category B classification confirmed by the lead lender.', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0006', opp: 'OPP-0018', owner: 'USR-004', status: 'Draft', created: -3, submitted: null, decision: null, reviewer: null, approver: null, signed: false,
    values: { legalName: 'Tembisa Rail Components (Pty) Ltd', registrationNo: '2014/223318/07', vatNo: '4210338291', yearsTrading: 11, annualTurnover: 275_000_000, buyerCountry: 'Zambia', buyerName: 'Zambia Railways Ltd', contractValue: 68_000_000 } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0016', opp: 'OPP-0006', owner: 'USR-006', status: 'Approved', created: -44, submitted: -40, decision: -14, reviewer: 'USR-010', approver: 'USR-010', signed: true,
    values: { legalName: 'Port Elizabeth Automotive Components (Pty) Ltd', registrationNo: '1998/007712/07', vatNo: '4180022913', yearsTrading: 27, annualTurnover: 730_000_000, buyerCountry: 'Kenya', buyerName: 'East Africa Motor Assemblers Ltd', contractValue: 190_000_000, creditPeriod: '120 days', goodsDescription: 'Automotive wiring harnesses, moulded interior components and catalytic converter assemblies.', localContent: 84, previousLosses: 'No', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0005', opp: 'OPP-0007', owner: 'USR-006', status: 'Approved', created: -38, submitted: -34, decision: -10, reviewer: 'USR-010', approver: 'USR-010', signed: true,
    values: { legalName: 'Cape Peninsula Marine Engineering', registrationNo: '2009/118822/07', vatNo: '4390118822', yearsTrading: 16, annualTurnover: 620_000_000, buyerCountry: 'Namibia', buyerName: 'Walvis Bay Port Authority', contractValue: 155_000_000, creditPeriod: '180 days', goodsDescription: 'Design, fabrication and commissioning of two harbour tugs.', localContent: 91, previousLosses: 'No', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0002', opp: 'OPP-0010', owner: 'USR-004', status: 'Approved', created: -60, submitted: -56, decision: -24, reviewer: 'USR-010', approver: 'USR-010', signed: true,
    values: { legalName: 'Kalahari Agri Processing SOC', registrationNo: '2005/019928/30', vatNo: '4220199283', yearsTrading: 20, annualTurnover: 385_000_000, buyerCountry: 'Botswana', buyerName: 'Gaborone Milling Co-operative', contractValue: 128_000_000, creditPeriod: '90 days', goodsDescription: 'Milled grain products and packaged agricultural commodities.', localContent: 95, previousLosses: 'Yes - fully recovered', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Medium/Long-Term Cover Application', customerId: 'CUS-0003', opp: 'OPP-0009', owner: 'USR-006', status: 'Approved', created: -78, submitted: -74, decision: -20, reviewer: 'USR-011', approver: 'USR-011', signed: true,
    values: { legalName: 'Rand Merchant Trade Finance', registrationNo: '1994/002211/06', projectName: 'Ghana Eastern Rail Corridor', projectCountry: 'Ghana', projectValue: 4_100_000_000, coverRequested: 1_100_000_000, tenor: 9, obligor: 'Republic of Ghana - Ministry of Finance', sovereignGuarantee: 'Yes', esgCategory: 'Category B', esgSummary: 'Rehabilitation of an existing rail corridor. Limited new land take; resettlement framework agreed with the host government.', localContent: 66, sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0009', opp: 'OPP-0008', owner: 'USR-004', status: 'Rejected', created: -36, submitted: -32, decision: -18, reviewer: 'USR-010', approver: 'USR-010', signed: true, rejection: 'Buyer country aggregate exposure exceeded the approved limit at the time of assessment. Applicant advised to resubmit in the next limit review cycle.',
    values: { legalName: 'Gauteng Pharma Manufacturing SOC', registrationNo: '2001/044118/30', vatNo: '4110441182', yearsTrading: 24, annualTurnover: 440_000_000, buyerCountry: 'Nigeria', buyerName: 'Lagos Health Distributors Ltd', contractValue: 210_000_000, creditPeriod: '120 days', goodsDescription: 'Generic pharmaceutical formulations and cold-chain vaccines.', localContent: 78, previousLosses: 'Yes - partially recovered', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Medium/Long-Term Cover Application', customerId: 'CUS-0023', opp: 'OPP-0016', owner: 'USR-017', status: 'Submitted', created: -8, submitted: -4, decision: null, reviewer: 'USR-011', approver: null, signed: true,
    values: { legalName: 'Harare Water Utilities Ltd', registrationNo: '2013/8891/ZW', projectName: 'Morton Jaffray Treatment Plant Rehabilitation', projectCountry: 'Zimbabwe', projectValue: 1_900_000_000, coverRequested: 530_000_000, tenor: 8, obligor: 'City of Harare', sovereignGuarantee: 'Under negotiation', esgCategory: 'Category B', esgSummary: 'Rehabilitation of existing municipal water treatment infrastructure with net positive public health impact.', localContent: 58, sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Medium/Long-Term Cover Application', customerId: 'CUS-0015', opp: 'OPP-0015', owner: 'USR-005', status: 'Draft', created: -6, submitted: null, decision: null, reviewer: null, approver: null, signed: false,
    values: { legalName: 'Kigali Digital Infrastructure Ltd', registrationNo: '119228833/RW', projectName: 'National Fibre Backbone Phase 3', projectCountry: 'Rwanda', projectValue: 1_300_000_000, coverRequested: 410_000_000 } },
  { form: 'Political Risk / Investment Insurance Application', customerId: 'CUS-0013', opp: 'OPP-0014', owner: 'USR-005', status: 'Draft', created: -5, submitted: null, decision: null, reviewer: null, approver: null, signed: false,
    values: { legalName: 'Lagos Renewable Energy Ltd', registrationNo: 'RC-1188223/NG', hostCountry: 'Nigeria', investmentValue: 2_400_000_000, investmentType: 'Equity' } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0014', opp: 'OPP-0021', owner: 'USR-017', status: 'Awaiting Approval', created: -12, submitted: -9, decision: null, reviewer: 'USR-010', approver: 'USR-010', signed: true,
    values: { legalName: 'Free State Grain Handling SOC', registrationNo: '2007/118822/30', vatNo: '4230118822', yearsTrading: 18, annualTurnover: 210_000_000, buyerCountry: 'Mozambique', buyerName: 'Beira Grain Terminals Lda', contractValue: 210_000_000, creditPeriod: '90 days', goodsDescription: 'Bulk grain handling equipment and silo automation systems.', localContent: 88, previousLosses: 'No', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0012', opp: 'OPP-0022', owner: 'USR-004', status: 'Under Review', created: -20, submitted: -17, decision: null, reviewer: 'USR-010', approver: null, signed: true,
    values: { legalName: 'Durban Textile Exporters (Pty) Ltd', registrationNo: '2010/771182/07', vatNo: '4290771182', yearsTrading: 14, annualTurnover: 96_000_000, buyerCountry: 'Other', buyerName: 'Atlanta Apparel Imports LLC', contractValue: 96_000_000, creditPeriod: '60 days', goodsDescription: 'AGOA-qualifying knitted apparel and technical textiles.', localContent: 93, previousLosses: 'No', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
  { form: 'Short-Term Export Credit Insurance Application', customerId: 'CUS-0018', opp: 'OPP-0013', owner: 'USR-017', status: 'Submitted', created: -10, submitted: -6, decision: null, reviewer: 'USR-010', approver: null, signed: true,
    values: { legalName: 'Dar es Salaam Port Works Ltd', registrationNo: '118822/TZ', vatNo: 'TZ-4118822', yearsTrading: 9, annualTurnover: 1_950_000_000, buyerCountry: 'Tanzania', buyerName: 'Tanzania Ports Authority', contractValue: 275_000_000, creditPeriod: '180 days', goodsDescription: 'Quayside crane supply, installation and commissioning.', localContent: 64, previousLosses: 'No', sanctionsDeclaration: true, informationAccurate: true, popiaConsent: true } },
];

function tl(id: string, s: Spec): TimelineEvent[] {
  const out: TimelineEvent[] = [];
  let n = 1;
  const add = (at: number, actorId: string | null, type: string, title: string, detail: string, hour = 10) => {
    const u = userById(actorId ?? '');
    out.push({ id: `${id}-T${n}`, at: iso(at, hour, (n * 13) % 60), actor: u?.name ?? 'System', actorRole: u?.jobTitle ?? 'CRM Workflow Engine', type, title, detail });
    n += 1;
  };
  add(s.created, s.owner, 'Created', 'Application draft created',
    `Digital application form "${s.form}" opened against the customer and linked opportunity. Draft auto-saved to the CRM.`, 9);
  if (s.signed && s.submitted != null) {
    add(s.submitted, s.owner, 'Signature', 'Application digitally signed',
      'DEMO / SIMULATED digital signature applied. Signer identity, consent, timestamp and device fingerprint recorded; the document was locked against further amendment.', 11);
  }
  if (s.submitted != null) {
    add(s.submitted, s.owner, 'Submitted', 'Application submitted',
      'Mandatory field validation passed and the application was submitted to Underwriting. Acknowledgement notification issued to the customer.', 12);
  }
  if (s.reviewer && s.submitted != null) {
    add(s.submitted + 2, s.reviewer, 'Review', 'Underwriting review commenced',
      `${userById(s.reviewer)?.name} accepted the application into the underwriting queue and began the technical assessment.`, 10);
  }
  if (s.decision != null) {
    add(s.decision, s.approver, s.status === 'Approved' ? 'Approved' : 'Rejected',
      s.status === 'Approved' ? 'Application approved' : 'Application rejected',
      s.status === 'Approved'
        ? 'Cover approved by Underwriting. Policy documentation generation triggered and the customer notified.'
        : (s.rejection ?? 'Application declined.'), 14);
  }
  return out;
}

export const APPLICATIONS: Application[] = specs.map((s, i) => {
  const id = `APP-${String(i + 1).padStart(4, '0')}`;
  return {
    id,
    reference: `ECIC-APP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    formType: s.form,
    customerId: s.customerId,
    opportunityId: s.opp,
    ownerId: s.owner,
    status: s.status,
    createdDate: iso(s.created, 9),
    submittedDate: s.submitted != null ? iso(s.submitted, 12) : null,
    decisionDate: s.decision != null ? iso(s.decision, 14) : null,
    values: s.values,
    signature: {
      signed: s.signed,
      signerName: customerById(s.customerId)?.contactPerson ?? String(s.values.legalName ?? ''),
      signerEmail: customerById(s.customerId)?.email ?? '',
      signedAt: s.signed && s.submitted != null ? iso(s.submitted, 11) : null,
      method: 'DEMO / SIMULATED advanced electronic signature',
      ipAddress: `197.${100 + i}.${20 + i}.${11 + i}`,
      device: i % 3 === 0 ? 'Chrome 141 on Windows 11' : i % 3 === 1 ? 'Safari 19 on iPadOS 19' : 'Edge 141 on Windows 11',
      consent: s.signed,
      certificateRef: s.signed ? `DEMO-CERT-${id}-${(1000 + i * 37).toString(16).toUpperCase()}` : '',
    },
    locked: s.signed && s.status !== 'Draft',
    reviewerId: s.reviewer,
    approverId: s.approver,
    rejectionReason: s.rejection ?? null,
    documentIds: [],
    timeline: tl(id, s),
  };
});
