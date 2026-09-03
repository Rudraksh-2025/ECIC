import type { CrmDocument, DocumentClassification } from '../types';
import { iso, isoDate } from '../utils/dates';
import { APPLICATIONS } from './applications';
import { COMPLAINTS } from './complaints';
import { LEADS } from './leads';
import { OPPORTUNITIES } from './opportunities';
import { makeRng, intBetween } from '../utils/format';

const rng = makeRng(77120260);

interface Def {
  name: string; type: string; classification: DocumentClassification; mime: string;
}

const APPLICATION_DOCS: Def[] = [
  { name: 'Signed application form', type: 'Signed Application', classification: 'Confidential', mime: 'application/pdf' },
  { name: 'Audited annual financial statements', type: 'Financial Statements', classification: 'Restricted', mime: 'application/pdf' },
  { name: 'Company registration certificate', type: 'Constitutional Document', classification: 'Internal', mime: 'application/pdf' },
  { name: 'Export contract', type: 'Contract', classification: 'Confidential', mime: 'application/pdf' },
  { name: 'Buyer credit report', type: 'Credit Report', classification: 'Restricted', mime: 'application/pdf' },
];

const OPP_DOCS: Def[] = [
  { name: 'Indicative quotation', type: 'Quote', classification: 'Confidential', mime: 'application/pdf' },
  { name: 'Cover proposal pack', type: 'Proposal', classification: 'Confidential', mime: 'application/pdf' },
  { name: 'Underwriting handover memorandum', type: 'Internal Memorandum', classification: 'Internal', mime: 'application/pdf' },
  { name: 'Premium calculation worksheet', type: 'Worksheet', classification: 'Internal', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];

const LEAD_DOCS: Def[] = [
  { name: 'Company profile', type: 'Company Profile', classification: 'Internal', mime: 'application/pdf' },
  { name: 'Enquiry correspondence', type: 'Correspondence', classification: 'Internal', mime: 'application/vnd.ms-outlook' },
  { name: 'Desktop analysis worksheet', type: 'Analysis', classification: 'Internal', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];

const COMPLAINT_DOCS: Def[] = [
  { name: 'Complaint correspondence', type: 'Correspondence', classification: 'Confidential', mime: 'application/vnd.ms-outlook' },
  { name: 'Investigation report', type: 'Investigation Report', classification: 'Confidential', mime: 'application/pdf' },
  { name: 'Resolution letter', type: 'Customer Communication', classification: 'Confidential', mime: 'application/pdf' },
];

const docs: CrmDocument[] = [];
let seq = 0;

function push(def: Def, ownerId: string, at: number, links: Partial<CrmDocument>, signed = false): CrmDocument {
  seq += 1;
  const id = `DOC-${String(seq).padStart(4, '0')}`;
  const versionCount = intBetween(rng, 1, 3);
  const sizeKb = intBetween(rng, 84, 6400);
  const versions = Array.from({ length: versionCount }, (_, v) => ({
    version: `v${v + 1}.0`,
    uploadedById: ownerId,
    uploadedAt: iso(at - (versionCount - v - 1) * 3, 10 + v),
    note: v === 0 ? 'Initial upload' : v === 1 ? 'Revised following internal review' : 'Final version issued to counterparty',
    sizeKb: Math.round(sizeKb * (0.8 + v * 0.1)),
  }));
  const d: CrmDocument = {
    id,
    name: `${def.name}`,
    docType: def.type,
    classification: def.classification,
    customerId: null, leadId: null, opportunityId: null, applicationId: null,
    complaintId: null, campaignId: null,
    uploadedById: ownerId,
    uploadedAt: iso(at, 11),
    version: `v${versionCount}.0`,
    status: signed ? 'Signed' : 'Saved',
    sizeKb,
    mimeType: def.mime,
    scanResult: 'Clean',
    transactionRef: '',
    versions,
    retentionUntil: isoDate(at + 2555),
    ...links,
  };
  docs.push(d);
  return d;
}

APPLICATIONS.forEach((app) => {
  const created = Math.round((new Date(app.createdDate).getTime() - Date.now()) / 86400000);
  const set = app.status === 'Draft' ? APPLICATION_DOCS.slice(1, 3) : APPLICATION_DOCS;
  set.forEach((def, i) => {
    const isSigned = def.type === 'Signed Application' && app.signature.signed;
    const d = push(
      { ...def, name: `${def.name} - ${app.reference}` },
      app.ownerId, created + i,
      {
        customerId: app.customerId, applicationId: app.id, opportunityId: app.opportunityId,
        transactionRef: app.reference,
      },
      isSigned,
    );
    app.documentIds.push(d.id);
  });
});

OPPORTUNITIES.forEach((opp) => {
  const created = Math.round((new Date(opp.createdDate).getTime() - Date.now()) / 86400000);
  const set = opp.stage === 'Qualification' ? OPP_DOCS.slice(0, 2) : OPP_DOCS;
  set.forEach((def, i) => {
    if (def.type === 'Internal Memorandum' && !opp.handoverDate) return;
    const d = push(
      { ...def, name: `${def.name} - ${opp.reference}` },
      opp.ownerId, Math.min(created + i * 4, -1),
      { customerId: opp.customerId, opportunityId: opp.id, transactionRef: opp.reference },
    );
    opp.documentIds.push(d.id);
  });
});

LEADS.filter((l) => l.status !== 'New').forEach((lead) => {
  const created = Math.round((new Date(lead.createdDate).getTime() - Date.now()) / 86400000);
  const set = lead.desktopAnalysis.completed ? LEAD_DOCS : LEAD_DOCS.slice(0, 2);
  set.forEach((def, i) => {
    const d = push(
      { ...def, name: `${def.name} - ${lead.reference}` },
      lead.ownerId ?? 'USR-004', Math.min(created + i, -1),
      {
        customerId: lead.customerId, leadId: lead.id, campaignId: lead.campaignId,
        transactionRef: lead.reference,
      },
    );
    lead.documentIds.push(d.id);
  });
});

COMPLAINTS.forEach((c) => {
  const created = Math.round((new Date(c.loggedDate).getTime() - Date.now()) / 86400000);
  const set = ['Resolved', 'Closed'].includes(c.status) ? COMPLAINT_DOCS
    : c.status === 'Logged' ? COMPLAINT_DOCS.slice(0, 1) : COMPLAINT_DOCS.slice(0, 2);
  set.forEach((def, i) => {
    const d = push(
      { ...def, name: `${def.name} - ${c.reference}` },
      c.assignedToId ?? 'USR-001', Math.min(created + i, 0),
      {
        customerId: c.customerId, complaintId: c.id, opportunityId: c.linkedOpportunityId,
        applicationId: c.linkedApplicationId, transactionRef: c.reference,
      },
    );
    c.documentIds.push(d.id);
  });
});

/** One deliberately blocked upload so the file-security control is demonstrable. */
seq += 1;
docs.push({
  id: `DOC-${String(seq).padStart(4, '0')}`,
  name: 'buyer_statement_final.pdf.exe',
  docType: 'Unclassified Upload',
  classification: 'Internal',
  customerId: 'CUS-0013', leadId: null, opportunityId: 'OPP-0014', applicationId: null,
  complaintId: null, campaignId: null,
  uploadedById: 'USR-005',
  uploadedAt: iso(-2, 14),
  version: 'v1.0',
  status: 'Blocked',
  sizeKb: 1840,
  mimeType: 'application/x-msdownload',
  scanResult: 'Threat Detected',
  transactionRef: 'OPP-0014',
  versions: [{ version: 'v1.0', uploadedById: 'USR-005', uploadedAt: iso(-2, 14), note: 'Upload rejected by security scan', sizeKb: 1840 }],
  retentionUntil: isoDate(90),
});

export const DOCUMENTS: CrmDocument[] = docs;
export const DOC_TYPES = Array.from(new Set(docs.map((d) => d.docType))).sort();
export const DOC_CLASSIFICATIONS: DocumentClassification[] = ['Public', 'Internal', 'Confidential', 'Restricted'];

