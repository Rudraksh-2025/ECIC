import type { Complaint, ComplaintChannel, ComplaintStatus, Severity, TimelineEvent } from '../types';
import { addBusinessDays, daysFromNow, iso, isoDate } from '../utils/dates';
import { COMPLAINT_SUB_CATEGORIES } from './configuration';
import { userById } from './users';
import { customerById } from './customers';

interface Spec {
  subject: string;
  customerId: string;
  description: string;
  category: string;
  sub: string;
  severity: Severity;
  channel: ComplaintChannel;
  status: ComplaintStatus;
  logged: number;
  assignee: string | null;
  team: string;
  bu: string;
  escalated?: boolean;
  feedback?: Complaint['customerFeedback'];
  investigation?: string;
  outcome?: string;
  resolution?: string;
  corrective?: string;
  kind?: 'Internal' | 'External';
  opp?: string | null;
  app?: string | null;
}

const specs: Spec[] = [
  { subject: 'Policy schedule issued with incorrect buyer country limit', customerId: 'CUS-0001', description: 'The policy schedule issued on the Highveld Steel Zambian shipment reflects a buyer country limit of USD 4m instead of the USD 12m confirmed in the underwriting letter. The exporter cannot draw down on their facility.', category: 'Policy Administration', sub: 'Incorrect policy schedule', severity: 'Critical', channel: 'Telephone', status: 'Escalated', logged: -4, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Underwriting', escalated: true, investigation: 'Underwriting confirmed the approved limit was USD 12m. The schedule generation drew the pre-approval value from a superseded record.', opp: 'OPP-0002' },
  { subject: 'Claim assessment exceeding agreed turnaround', customerId: 'CUS-0003', description: 'Rand Merchant Trade Finance lodged a claim 47 business days ago on a defaulted Ghanaian buyer. No assessment outcome has been communicated despite three follow-ups.', category: 'Claims Handling', sub: 'Claim assessment delay', severity: 'Critical', channel: 'Email', status: 'Escalated', logged: -9, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Claims & Recoveries', escalated: true, feedback: 'Dissatisfied', investigation: 'Claim file was queued behind two large recoveries. Assessor capacity constraint confirmed with Claims Manager.' },
  { subject: 'Premium invoice raised twice for the same quarter', customerId: 'CUS-0009', description: 'Gauteng Pharma received two invoices for Q3 premium on policy ECIC-PH-4471. Both were debited by their bank.', category: 'Premium & Billing', sub: 'Payment allocation error', severity: 'High', channel: 'Email', status: 'Resolved', logged: -12, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Finance', feedback: 'Satisfied', investigation: 'Finance confirmed a duplicate batch run on 14th. Both debits traced and verified against the bank statement.', outcome: 'Complaint upheld', resolution: 'Duplicate premium of R 428,500 refunded to the client bank account; confirmation of payment issued.', corrective: 'Duplicate-detection control added to the premium batch run; second-person review introduced for all batch releases.' },
  { subject: 'Customer portal will not accept supporting document upload', customerId: 'CUS-0006', description: 'Tembisa Rail cannot upload their signed application annexures via the customer portal. The upload reaches 100% then displays a generic error.', category: 'Digital Channels', sub: 'Document upload failure', severity: 'High', channel: 'Online Portal', status: 'In Progress', logged: -3, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Information Technology', app: 'APP-0004' },
  { subject: 'No response to cover enquiry for three weeks', customerId: 'CUS-0007', description: 'Namib Desert Logistics submitted an enquiry for short-term cover on a Namibian mining contract and has had no response from the Business Development Unit.', category: 'Service Delivery', sub: 'Delayed response', severity: 'Medium', channel: 'Email', status: 'Assigned', logged: -2, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Business Development Unit' },
  { subject: 'Dispute over declined cover for Nigerian buyer', customerId: 'CUS-0013', description: 'Lagos Renewable Energy disputes the decline of cover, stating the buyer risk assessment relied on outdated financial statements.', category: 'Underwriting Decision', sub: 'Cover declined', severity: 'High', channel: 'Email', status: 'Pending Information', logged: -7, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Underwriting' },
  { subject: 'Broker commission not paid on renewed policy', customerId: 'CUS-0017', description: 'Trade Assure Brokers has not received commission on the renewal of two policies placed in the previous quarter.', category: 'Broker & Intermediary', sub: 'Broker commission query', severity: 'Medium', channel: 'Telephone', status: 'In Progress', logged: -6, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Finance' },
  { subject: 'Request for access to personal information held by ECIC', customerId: 'CUS-0002', description: 'Data subject access request under POPIA section 23 from a director of Kalahari Agri Processing, requesting all personal information held and the purpose of processing.', category: 'Data & Privacy', sub: 'Personal information request', severity: 'High', channel: 'Email', status: 'In Progress', logged: -5, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Legal & Compliance' },
  { subject: 'Marketing emails received after consent withdrawal', customerId: 'CUS-0012', description: 'Durban Textile Exporters withdrew marketing consent but continued to receive exhibition invitations.', category: 'Data & Privacy', sub: 'Consent withdrawal', severity: 'Medium', channel: 'Social Media', status: 'Resolved', logged: -18, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Marketing & Communications', feedback: 'Satisfied', investigation: 'Consent flag was updated in CRM but the campaign audience had already been extracted to the sending platform.', outcome: 'Complaint upheld', resolution: 'Contact suppressed across all channels and written apology issued.', corrective: 'Audience extraction now re-validates consent at send time rather than at build time.' },
  { subject: 'Endorsement for increased cover not processed', customerId: 'CUS-0022', description: 'Vaal Chemical requested an endorsement to increase cover by R 180m six weeks ago. The endorsement has not been issued.', category: 'Policy Administration', sub: 'Endorsement not processed', severity: 'High', channel: 'Email', status: 'Closed', logged: -34, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Underwriting', feedback: 'Very Satisfied', investigation: 'Endorsement request was received but not registered on the workflow queue due to a mailbox rule.', outcome: 'Complaint upheld', resolution: 'Endorsement issued and backdated to the requested effective date at no additional cost.', corrective: 'Shared mailbox rules reviewed; automated acknowledgement now created for every endorsement request.' },
  { subject: 'Incorrect information provided on country cover availability', customerId: 'CUS-0018', description: 'Dar es Salaam Port Works was advised that Tanzania cover was unavailable; this was incorrect and delayed their tender submission.', category: 'Service Delivery', sub: 'Incorrect information provided', severity: 'High', channel: 'Telephone', status: 'Closed', logged: -41, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Business Development Unit', feedback: 'Neutral', investigation: 'Officer referenced a superseded country limit circular.', outcome: 'Complaint upheld', resolution: 'Corrected position confirmed in writing and a revised indicative quote provided.', corrective: 'Country limit circulars now published to a single controlled CRM knowledge article with version control.' },
  { subject: 'Settlement amount disputed on political risk claim', customerId: 'CUS-0011', description: 'Mozambique LNG Services disputes the settlement calculation, arguing the recovery deduction was applied twice.', category: 'Claims Handling', sub: 'Settlement amount dispute', severity: 'Critical', channel: 'Email', status: 'In Progress', logged: -8, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Claims & Recoveries' },
  { subject: 'Unreturned calls from account manager', customerId: 'CUS-0019', description: 'Limpopo Citrus Growers reports six unreturned calls over two weeks regarding their renewal.', category: 'Service Delivery', sub: 'Unreturned calls', severity: 'Low', channel: 'Chat', status: 'Assigned', logged: -1, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Business Development Unit' },
  { subject: 'Application form validation rejects valid registration number', customerId: 'CUS-0015', description: 'Kigali Digital Infrastructure cannot submit their application because the entity registration field rejects Rwandan company registration formats.', category: 'Digital Channels', sub: 'Application form error', severity: 'Medium', channel: 'Online Portal', status: 'Resolved', logged: -15, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Information Technology', feedback: 'Satisfied', investigation: 'Validation regex only accepted South African CIPC formats.', outcome: 'Complaint upheld', resolution: 'Validation rule extended to accept registration formats for all ECIC-supported jurisdictions.', corrective: 'Configuration item raised so that jurisdiction formats are maintained by business administrators without a code change.' },
  { subject: 'Renewal notice not received before policy expiry', customerId: 'CUS-0016', description: 'Port Elizabeth Automotive Components did not receive a renewal notice and their cover lapsed for four days.', category: 'Policy Administration', sub: 'Renewal not actioned', severity: 'Critical', channel: 'Telephone', status: 'Closed', logged: -55, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Underwriting', feedback: 'Dissatisfied', escalated: true, investigation: 'Renewal notice was generated but sent to a contact who had left the client organisation.', outcome: 'Complaint upheld', resolution: 'Cover reinstated retrospectively with no gap; written confirmation issued to the client board.', corrective: 'Annual contact verification introduced; renewal notices now sent to all active contacts plus the portal.' },
  { subject: 'Internal referral: repeated data quality errors in policy records', customerId: 'CUS-0026', description: 'Internal referral from the Finance Division regarding recurring data quality issues on policy master records affecting reconciliation.', category: 'Data & Privacy', sub: 'Data accuracy dispute', severity: 'Medium', channel: 'Internal Referral', status: 'In Progress', logged: -11, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Finance', kind: 'Internal' },
  { subject: 'Walk-in complaint regarding staff conduct at reception', customerId: 'CUS-0027', description: 'A representative of Pretoria Defence Systems attended the ECIC offices and reported discourteous treatment at reception.', category: 'Service Delivery', sub: 'Staff conduct', severity: 'Medium', channel: 'Walk-in', status: 'Resolved', logged: -22, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Client Services', feedback: 'Satisfied', investigation: 'CCTV and visitor log reviewed; incident confirmed.', outcome: 'Complaint upheld', resolution: 'Personal apology issued by the Client Services Manager.', corrective: 'Front-of-house customer service refresher training scheduled for all reception staff.' },
  { subject: 'Refund of overpaid premium still outstanding', customerId: 'CUS-0014', description: 'Free State Grain Handling overpaid premium by R 96,400 and the refund has not been processed after 30 days.', category: 'Premium & Billing', sub: 'Refund outstanding', severity: 'High', channel: 'Email', status: 'Pending Information', logged: -13, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Finance' },
  { subject: 'Country limit dispute for Zimbabwe exposure', customerId: 'CUS-0023', description: 'Harare Water Utilities disputes the aggregate country limit applied to their transaction.', category: 'Underwriting Decision', sub: 'Country limit dispute', severity: 'Medium', channel: 'Email', status: 'Assigned', logged: -2, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Underwriting' },
  { subject: 'Turnaround time on underwriting decision', customerId: 'CUS-0024', description: 'Eastern Cape Wind Farm Consortium reports the underwriting decision has taken 62 business days against an indicated 30.', category: 'Underwriting Decision', sub: 'Turnaround time', severity: 'High', channel: 'Email', status: 'Escalated', logged: -16, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Underwriting', escalated: true, feedback: 'Very Dissatisfied' },
  { subject: 'Portal access failure after password reset', customerId: 'CUS-0005', description: 'Cape Peninsula Marine Engineering users are locked out of the portal after a password reset; the MFA code is not being received.', category: 'Digital Channels', sub: 'Portal access failure', severity: 'High', channel: 'Chat', status: 'Resolved', logged: -20, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Information Technology', feedback: 'Very Satisfied', investigation: 'MFA SMS delivery failed for the registered international number format.', outcome: 'Complaint upheld', resolution: 'Number format corrected and access restored within four hours; user re-enrolled in MFA.', corrective: 'International number validation added to the portal registration screen.' },
  { subject: 'Claim repudiation dispute - non-disclosure finding', customerId: 'CUS-0010', description: 'Standard Trade Bank of Botswana disputes the repudiation of a claim on the grounds of alleged non-disclosure.', category: 'Claims Handling', sub: 'Claim repudiation dispute', severity: 'Critical', channel: 'Email', status: 'Escalated', logged: -25, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Claims & Recoveries', escalated: true },
  { subject: 'Invoice not received for annual premium', customerId: 'CUS-0021', description: 'Nairobi Agritech Solutions has not received their annual premium invoice and cannot process payment.', category: 'Premium & Billing', sub: 'Invoice not received', severity: 'Low', channel: 'Email', status: 'Closed', logged: -48, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Finance', feedback: 'Satisfied', investigation: 'Invoice was issued to a dormant email address on the account.', outcome: 'Complaint upheld', resolution: 'Invoice re-issued to the verified billing contact with extended payment terms.', corrective: 'Billing contact verification added to the annual account review checklist.' },
  { subject: 'Social media complaint regarding application complexity', customerId: 'CUS-0020', description: 'Windhoek Mining Equipment posted publicly that the ECIC application process is excessively complex and paper-based.', category: 'Service Delivery', sub: 'Delayed response', severity: 'Low', channel: 'Social Media', status: 'Closed', logged: -62, assignee: 'USR-001', team: 'Complaints Team A', bu: 'Client Services', feedback: 'Neutral', investigation: 'Feedback validated against the current application journey.', outcome: 'Complaint partially upheld', resolution: 'Client contacted directly and guided through the digital application; feedback logged as a product input.', corrective: 'Digital application simplification added to the CRM product roadmap.' },
  { subject: 'Mandate dispute between two intermediaries', customerId: 'CUS-0017', description: 'Two brokers claim mandate over the same exporter transaction; the client has escalated the resulting delay.', category: 'Broker & Intermediary', sub: 'Mandate dispute', severity: 'High', channel: 'Telephone', status: 'Logged', logged: 0, assignee: null, team: 'Complaints Team A', bu: 'Legal & Compliance' },
  { subject: 'Incorrect premium calculation on multi-year cover', customerId: 'CUS-0008', description: 'Accra Infrastructure Partners believes the premium on their five-year cover has been calculated on the gross rather than declining balance.', category: 'Premium & Billing', sub: 'Incorrect premium calculation', severity: 'High', channel: 'Email', status: 'Logged', logged: 0, assignee: null, team: 'Complaints Team B', bu: 'Finance' },
  { subject: 'Documentation dispute on claim submission requirements', customerId: 'CUS-0004', description: 'Zambezi Power Holdings disputes the volume of supporting documentation requested for their claim submission.', category: 'Claims Handling', sub: 'Documentation dispute', severity: 'Medium', channel: 'Online Portal', status: 'Assigned', logged: -1, assignee: 'USR-002', team: 'Complaints Team B', bu: 'Claims & Recoveries' },
];

function slaFor(severity: Severity): number {
  if (severity === 'Critical') return 2;
  if (severity === 'High') return 3;
  return 5;
}

function ev(id: string, n: number, at: number, actorId: string | null, type: string, title: string, detail: string, hour = 10): TimelineEvent {
  const u = userById(actorId ?? '');
  return {
    id: `${id}-T${n}`,
    at: iso(at, hour, (n * 17) % 60),
    actor: u?.name ?? 'System',
    actorRole: u?.jobTitle ?? 'CRM Workflow Engine',
    type, title, detail,
  };
}

export const COMPLAINTS: Complaint[] = specs.map((s, i) => {
  const id = `CMP-${String(i + 1).padStart(4, '0')}`;
  const reference = `ECIC-CMP-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`;
  const slaTargetDays = slaFor(s.severity);
  const loggedAt = daysFromNow(s.logged, 9, 20);
  const due = addBusinessDays(loggedAt, slaTargetDays);
  const closed = s.status === 'Closed';
  const resolved = closed || s.status === 'Resolved';
  const supervisor = 'USR-003';

  const timeline: TimelineEvent[] = [];
  let n = 1;
  timeline.push(ev(id, n++, s.logged, s.assignee ?? 'USR-001', 'Logged',
    `Complaint logged via ${s.channel}`,
    `Captured by ${userById(s.assignee ?? 'USR-001')?.name ?? 'Client Services'} on the ${s.channel} channel. Reference ${reference} generated automatically. Acknowledgement notification queued to the customer's preferred channel.`, 9));
  if (s.assignee) {
    timeline.push(ev(id, n++, s.logged, supervisor, 'Assigned',
      `Assigned to ${userById(s.assignee)?.name}`,
      `Routing rule "${s.bu} → ${s.team}" matched on category "${s.category}". SLA target of ${slaTargetDays} business days applied from the ${s.severity} severity rule.`, 11));
  }
  if (['In Progress', 'Pending Information', 'Escalated', 'Resolved', 'Closed'].includes(s.status)) {
    timeline.push(ev(id, n++, Math.min(s.logged + 1, 0), s.assignee, 'Investigation',
      'Investigation started',
      `Case owner opened the investigation, requested the transaction file from ${s.bu} and reviewed the related CRM records.`, 8));
  }
  if (s.status === 'Pending Information') {
    timeline.push(ev(id, n++, Math.min(s.logged + 2, 0), s.assignee, 'Information Requested',
      'Additional information requested from customer',
      'Template "Additional information requested" issued. SLA clock paused pending the customer response.', 14));
  }
  if (s.escalated) {
    timeline.push(ev(id, n++, Math.min(s.logged + 2, 0), s.assignee, 'Escalation',
      'Escalated to Complaints Supervisor',
      `Escalation triggered${s.feedback === 'Dissatisfied' || s.feedback === 'Very Dissatisfied' ? ' automatically by negative customer feedback' : ' by the case owner due to SLA risk and case complexity'}. ${userById(supervisor)?.name} notified and an escalation task created.`, 15));
  }
  if (resolved) {
    timeline.push(ev(id, n++, Math.min(s.logged + slaTargetDays, -1), s.assignee, 'Resolution',
      'Resolution recorded',
      `${s.outcome ?? 'Complaint upheld'} — ${s.resolution ?? 'Resolution captured against the case.'}`, 12));
    timeline.push(ev(id, n++, Math.min(s.logged + slaTargetDays, -1), s.assignee, 'Communication',
      'Resolution communicated to customer',
      'Template "Resolution communicated" sent on the customer\'s preferred communication channel and stored against the case.', 13));
  }
  if (s.feedback) {
    timeline.push(ev(id, n++, Math.min(s.logged + slaTargetDays + 1, 0), null, 'Feedback',
      `Customer feedback captured: ${s.feedback}`,
      s.feedback === 'Dissatisfied' || s.feedback === 'Very Dissatisfied'
        ? 'Negative feedback automatically flagged the case as dissatisfied and triggered the escalation workflow.'
        : 'Feedback recorded against the case and included in the customer satisfaction index.', 9));
  }
  if (closed) {
    timeline.push(ev(id, n++, Math.min(s.logged + slaTargetDays + 2, 0), supervisor, 'Closure',
      'Complaint closed by Complaints Supervisor',
      'Closure pre-conditions validated: mandatory fields complete, investigation recorded, resolution recorded, customer communication issued and supervisor authorisation obtained. Record locked against further edits.', 16));
  }

  const cf = s.feedback ?? null;
  return {
    id, reference,
    subject: s.subject,
    customerId: s.customerId,
    customerKind: s.kind ?? 'External',
    contactName: customerById(s.customerId)?.contactPerson ?? '',
    contactEmail: customerById(s.customerId)?.email ?? '',
    contactPhone: customerById(s.customerId)?.phone ?? '',
    description: s.description,
    loggedDate: isoDate(s.logged),
    loggedTime: `${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    businessUnit: s.bu,
    category: s.category,
    subCategory: s.sub || (COMPLAINT_SUB_CATEGORIES[s.category]?.[0] ?? ''),
    severity: s.severity,
    priority: (s.severity === 'Critical' ? 'P1' : s.severity === 'High' ? 'P2' : s.severity === 'Medium' ? 'P3' : 'P4'),
    channel: s.channel,
    preferredChannel: s.channel === 'Telephone' ? 'Telephone' : s.channel === 'Online Portal' ? 'Portal' : 'Email',
    assignedTeam: s.team,
    assignedToId: s.assignee,
    status: s.status,
    slaTargetDays,
    dueDate: due.toISOString(),
    resolvedDate: resolved ? daysFromNow(Math.min(s.logged + slaTargetDays, -1), 12).toISOString() : null,
    closedDate: closed ? daysFromNow(Math.min(s.logged + slaTargetDays + 2, 0), 16).toISOString() : null,
    closedById: closed ? supervisor : null,
    escalated: !!s.escalated,
    escalationReason: s.escalated
      ? (cf === 'Dissatisfied' || cf === 'Very Dissatisfied'
        ? 'Customer dissatisfaction recorded on the resolution outcome'
        : 'SLA breach risk and cross-divisional complexity')
      : null,
    escalatedToId: s.escalated ? supervisor : null,
    escalationDate: s.escalated ? daysFromNow(Math.min(s.logged + 2, 0), 15).toISOString() : null,
    investigationFindings: s.investigation ?? '',
    outcome: s.outcome ?? '',
    resolutionDetail: s.resolution ?? '',
    correctiveAction: s.corrective ?? '',
    customerFeedback: cf,
    feedbackComment: cf
      ? (cf === 'Very Dissatisfied' ? 'The delay has cost us a tender opportunity. This is unacceptable.'
        : cf === 'Dissatisfied' ? 'The outcome does not address the substance of our complaint.'
          : cf === 'Neutral' ? 'The matter was addressed but took longer than we expected.'
            : cf === 'Satisfied' ? 'Handled professionally and resolved as promised.'
              : 'Excellent handling — the team kept us informed throughout.')
      : '',
    communicationSent: resolved,
    approvalRequired: true,
    approvedById: closed ? supervisor : null,
    linkedOpportunityId: s.opp ?? null,
    linkedApplicationId: s.app ?? null,
    documentIds: [],
    timeline,
  };
});
