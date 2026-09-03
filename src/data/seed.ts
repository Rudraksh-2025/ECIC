import type {
  Activity, AppNotification, AuditEvent, Configuration, Task,
} from '../types';
import { iso } from '../utils/dates';
import { makeRng, pick, intBetween, pseudoHash } from '../utils/format';
import { APPLICATIONS } from './applications';
import { CAMPAIGNS, CIM_VERSIONS, EVENTS, MARKETING_ASSETS, ORGANIZERS } from './marketing';
import { COMPLAINTS } from './complaints';
import { CONTACTS, CUSTOMERS } from './customers';
import { DOCUMENTS } from './documents';
import { LEADS } from './leads';
import { OPPORTUNITIES } from './opportunities';
import { USERS, userById } from './users';
import { cloneConfig } from './configuration';
import { INTEGRATIONS } from './integrations';
import { CHAT_HISTORY, FAQS } from './knowledge';

const rng = makeRng(20260315);

/* ------------------------------------------------------------------ */
/* Activities                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_SUBJECTS: Record<Activity['type'], string[]> = {
  Call: [
    'Introductory call with the finance director',
    'Follow-up call on outstanding documentation',
    'Premium indication discussion',
    'Call to confirm buyer details',
    'Courtesy call on policy renewal',
    'Call to explain the underwriting decision',
  ],
  Meeting: [
    'On-site meeting to scope the export programme',
    'Solution presentation to the executive committee',
    'Joint session with the arranging bank',
    'Quarterly account review',
    'Underwriting handover meeting',
    'Broker mandate clarification meeting',
  ],
  Email: [
    'Emailed indicative quotation',
    'Emailed application pack and document checklist',
    'Emailed revised cover terms',
    'Emailed country limit confirmation',
    'Emailed resolution letter',
    'Emailed campaign follow-up',
  ],
  Task: [
    'Obtain audited financial statements',
    'Complete buyer credit assessment',
    'Prepare underwriting handover memorandum',
    'Verify local content declaration',
    'Update the CRM with the revised contract value',
    'Chase outstanding sanctions screening result',
  ],
  'Site Visit': [
    'Site visit to the manufacturing facility',
    'Site visit to the port terminal',
    'Project site inspection with the technical adviser',
  ],
};

const ACTIVITY_TYPES: Activity['type'][] = ['Call', 'Meeting', 'Email', 'Task', 'Site Visit'];

function buildActivities(): Activity[] {
  const out: Activity[] = [];
  let n = 0;
  const add = (
    relatedType: Activity['relatedType'], relatedId: string, ownerId: string, offset: number,
  ) => {
    n += 1;
    const type = pick(rng, ACTIVITY_TYPES);
    const future = offset > 0;
    out.push({
      id: `ACT-${String(n).padStart(4, '0')}`,
      type,
      subject: pick(rng, ACTIVITY_SUBJECTS[type]),
      ownerId,
      date: iso(offset, intBetween(rng, 8, 16), intBetween(rng, 0, 55)),
      status: future ? (rng() > 0.85 ? 'Cancelled' : 'Planned') : (rng() > 0.12 ? 'Completed' : 'Overdue'),
      notes: future
        ? 'Scheduled as part of the agreed engagement plan for this transaction.'
        : 'Outcome captured against the record; next steps agreed with the client.',
      relatedType,
      relatedId,
    });
  };

  OPPORTUNITIES.forEach((o) => {
    const created = Math.round((new Date(o.createdDate).getTime() - Date.now()) / 86400000);
    const count = o.stage === 'Qualification' ? 2 : 3;
    for (let i = 0; i < count; i += 1) add('Opportunity', o.id, o.ownerId, Math.min(created + (i + 1) * 6, -1));
    if (!o.closedDate) add('Opportunity', o.id, o.ownerId, intBetween(rng, 2, 20));
  });

  LEADS.filter((l) => l.ownerId).forEach((l) => {
    const created = Math.round((new Date(l.createdDate).getTime() - Date.now()) / 86400000);
    add('Lead', l.id, l.ownerId as string, Math.min(created + 1, -1));
    if (['Qualified', 'Converted'].includes(l.status)) {
      add('Lead', l.id, l.ownerId as string, Math.min(created + 4, -1));
    }
  });

  COMPLAINTS.filter((c) => c.assignedToId).forEach((c) => {
    const created = Math.round((new Date(c.loggedDate).getTime() - Date.now()) / 86400000);
    add('Complaint', c.id, c.assignedToId as string, Math.min(created + 1, 0));
  });

  CAMPAIGNS.slice(0, 6).forEach((c) => add('Campaign', c.id, c.ownerId, intBetween(rng, -30, -2)));

  return out;
}

export const ACTIVITIES: Activity[] = buildActivities();

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

function buildTasks(): Task[] {
  const out: Task[] = [];
  let n = 0;
  const add = (t: Omit<Task, 'id'>) => {
    n += 1;
    out.push({ id: `TSK-${String(n).padStart(4, '0')}`, ...t });
  };

  COMPLAINTS.forEach((c) => {
    if (c.status === 'Closed') return;
    const dueOffset = Math.round((new Date(c.dueDate).getTime() - Date.now()) / 86400000);
    if (c.escalated) {
      add({
        title: `Escalation review: ${c.reference}`,
        description: `Supervisor review required. ${c.escalationReason ?? ''}`,
        category: 'Escalation', ownerId: c.escalatedToId ?? 'USR-003',
        dueDate: iso(Math.min(dueOffset, 1), 12), priority: c.priority, status: 'Open',
        relatedType: 'Complaint', relatedId: c.id, createdAt: c.escalationDate ?? iso(-2, 15),
      });
    }
    if (c.status === 'Pending Information') {
      add({
        title: `Follow up outstanding information: ${c.reference}`,
        description: 'Customer has not responded to the information request. Follow up on the preferred channel.',
        category: 'Follow-up', ownerId: c.assignedToId ?? 'USR-001',
        dueDate: iso(1, 10), priority: c.priority, status: 'Open',
        relatedType: 'Complaint', relatedId: c.id, createdAt: iso(-3, 14),
      });
    }
    if (dueOffset <= 2 && c.status !== 'Resolved') {
      add({
        title: `SLA action required: ${c.reference}`,
        description: `Case is approaching or past its ${c.slaTargetDays} business day resolution target.`,
        category: 'SLA', ownerId: c.assignedToId ?? 'USR-001',
        dueDate: c.dueDate, priority: c.priority, status: 'Open',
        relatedType: 'Complaint', relatedId: c.id, createdAt: iso(-1, 9),
      });
    }
    if (c.status === 'Resolved' && !c.closedDate) {
      add({
        title: `Authorise closure: ${c.reference}`,
        description: 'Resolution recorded and communicated. Supervisor authorisation required before closure.',
        category: 'Approval', ownerId: 'USR-003',
        dueDate: iso(2, 12), priority: c.priority, status: 'Open',
        relatedType: 'Complaint', relatedId: c.id, createdAt: c.resolvedDate ?? iso(-2, 12),
      });
    }
  });

  LEADS.forEach((l) => {
    const dueOffset = Math.round((new Date(l.slaDueDate).getTime() - Date.now()) / 86400000);
    if (l.status === 'New') {
      add({
        title: `Assign lead ${l.reference}`,
        description: `Unassigned lead from ${l.source}. A primary and backup owner must be recorded before the lead can progress.`,
        category: 'SLA', ownerId: 'USR-004',
        dueDate: l.slaDueDate, priority: 'P2', status: 'Open',
        relatedType: 'Lead', relatedId: l.id, createdAt: l.createdDate,
      });
    } else if (l.status === 'Assigned' && l.ownerId) {
      add({
        title: `First contact due: ${l.reference}`,
        description: `${l.company} — first contact SLA ${dueOffset <= 0 ? 'has passed' : `expires in ${dueOffset} day(s)`}.`,
        category: 'Follow-up', ownerId: l.ownerId,
        dueDate: l.slaDueDate, priority: dueOffset <= 0 ? 'P2' : 'P3', status: 'Open',
        relatedType: 'Lead', relatedId: l.id, createdAt: l.createdDate,
      });
    } else if (l.status === 'Contacted' && l.ownerId) {
      add({
        title: `Complete desktop analysis: ${l.reference}`,
        description: `${l.company} — structured desktop analysis outstanding before a qualification decision can be made.`,
        category: 'Investigation', ownerId: l.ownerId,
        dueDate: iso(intBetween(rng, 1, 5), 12), priority: 'P3', status: 'Open',
        relatedType: 'Lead', relatedId: l.id, createdAt: l.createdDate,
      });
    }
  });

  APPLICATIONS.forEach((a) => {
    if (a.status === 'Awaiting Approval' && a.approverId) {
      add({
        title: `Approve application ${a.reference}`,
        description: `${a.formType} awaiting underwriting approval.`,
        category: 'Approval', ownerId: a.approverId,
        dueDate: iso(2, 12), priority: 'P2', status: 'Open',
        relatedType: 'Application', relatedId: a.id, createdAt: a.submittedDate ?? iso(-5, 10),
      });
    }
    if (a.status === 'Submitted' && a.reviewerId) {
      add({
        title: `Commence underwriting review: ${a.reference}`,
        description: 'Application submitted and awaiting acceptance into the underwriting queue.',
        category: 'Investigation', ownerId: a.reviewerId,
        dueDate: iso(3, 12), priority: 'P3', status: 'Open',
        relatedType: 'Application', relatedId: a.id, createdAt: a.submittedDate ?? iso(-4, 10),
      });
    }
    if (a.status === 'Draft') {
      add({
        title: `Complete draft application ${a.reference}`,
        description: 'Draft application has not been submitted. Confirm whether the client intends to proceed.',
        category: 'Follow-up', ownerId: a.ownerId,
        dueDate: iso(intBetween(rng, 1, 6), 12), priority: 'P4', status: 'Open',
        relatedType: 'Application', relatedId: a.id, createdAt: a.createdDate,
      });
    }
  });

  CAMPAIGNS.filter((c) => c.approvalStatus === 'Pending Approval').forEach((c) => {
    add({
      title: `Approve campaign ${c.reference}`,
      description: `${c.name} awaiting Marketing Communications Specialist sign-off.`,
      category: 'Approval', ownerId: 'USR-009',
      dueDate: iso(3, 12), priority: 'P3', status: 'Open',
      relatedType: 'Campaign', relatedId: c.id, createdAt: iso(-2, 11),
    });
  });

  CIM_VERSIONS.filter((c) => c.status !== 'Published' && c.status !== 'Obsolete').forEach((c) => {
    add({
      title: `CIM review: ${c.version}`,
      description: `${c.title} is awaiting the Marketing Communications Specialist review step.`,
      category: 'Approval', ownerId: 'USR-009',
      dueDate: iso(5, 12), priority: 'P3', status: 'Open',
      relatedType: 'CIM', relatedId: c.id, createdAt: iso(-12, 14),
    });
  });

  MARKETING_ASSETS.filter((a) => a.status === 'Submitted' || a.status === 'Compliance Review').forEach((a) => {
    add({
      title: `CIM compliance review: ${a.name}`,
      description: `${a.checks.filter((c) => !c.passed).length} compliance check(s) currently failing.`,
      category: 'Approval', ownerId: a.reviewerId ?? 'USR-009',
      dueDate: iso(2, 12), priority: 'P3', status: 'Open',
      relatedType: 'Campaign', relatedId: a.campaignId, createdAt: a.submittedAt,
    });
  });

  OPPORTUNITIES.filter((o) => o.underwritingStatus === 'Information Requested').forEach((o) => {
    add({
      title: `Provide information to underwriting: ${o.reference}`,
      description: `${o.name} — underwriting has requested further information before it can conclude its review.`,
      category: 'Data', ownerId: o.ownerId,
      dueDate: iso(2, 12), priority: 'P2', status: 'Open',
      relatedType: 'Opportunity', relatedId: o.id, createdAt: iso(-3, 10),
    });
  });

  COMPLAINTS.filter((c) => c.status === 'Resolved' && !c.customerFeedback).forEach((c) => {
    add({
      title: `Obtain customer feedback: ${c.reference}`,
      description: 'Resolution communicated. Customer satisfaction feedback outstanding.',
      category: 'Customer Communication', ownerId: c.assignedToId ?? 'USR-001',
      dueDate: iso(3, 12), priority: 'P4', status: 'Open',
      relatedType: 'Complaint', relatedId: c.id, createdAt: c.resolvedDate ?? iso(-3, 12),
    });
  });

  return out;
}

export const TASKS: Task[] = buildTasks();

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function buildNotifications(): AppNotification[] {
  const out: AppNotification[] = [];
  let n = 0;
  const add = (t: Omit<AppNotification, 'id'>) => {
    n += 1;
    out.push({ id: `NTF-${String(n).padStart(4, '0')}`, ...t });
  };

  COMPLAINTS.forEach((c) => {
    const dueOffset = Math.round((new Date(c.dueDate).getTime() - Date.now()) / 86400000);
    if (c.escalated && c.status !== 'Closed') {
      add({
        type: 'Escalation', title: `Escalation: ${c.reference}`,
        body: `Complaint ${c.reference} for ${c.contactName} has been escalated. Reason: ${c.escalationReason}. Supervisor notified and an escalation task created.`,
        createdAt: c.escalationDate ?? iso(-2, 15), read: false,
        recipientId: 'USR-003', severity: 'error',
        relatedType: 'Complaint', relatedId: c.id, channel: 'In-App',
      });
    }
    if (dueOffset <= 0 && !['Resolved', 'Closed'].includes(c.status)) {
      add({
        type: 'SLA Breach', title: `SLA breached: ${c.reference}`,
        body: `Complaint ${c.reference} breached its ${c.slaTargetDays} business day resolution target. Immediate action is required.`,
        createdAt: c.dueDate, read: false,
        recipientId: c.assignedToId, severity: 'error',
        relatedType: 'Complaint', relatedId: c.id, channel: 'SMS',
      });
    } else if (dueOffset <= 1 && !['Resolved', 'Closed'].includes(c.status)) {
      add({
        type: 'SLA Warning', title: `SLA warning: ${c.reference}`,
        body: `Complaint ${c.reference} has consumed most of its SLA allowance. Due ${new Date(c.dueDate).toLocaleDateString('en-ZA')}.`,
        createdAt: iso(-1, 8), read: false,
        recipientId: c.assignedToId, severity: 'warning',
        relatedType: 'Complaint', relatedId: c.id, channel: 'In-App',
      });
    }
    if (c.status === 'Logged') {
      add({
        type: 'System Alert', title: `Unassigned complaint: ${c.reference}`,
        body: `Complaint ${c.reference} was logged via ${c.channel} and has not yet been assigned to a specialist.`,
        createdAt: iso(0, 8), read: false, recipientId: 'USR-003', severity: 'warning',
        relatedType: 'Complaint', relatedId: c.id, channel: 'In-App',
      });
    }
    if (c.status === 'Resolved') {
      add({
        type: 'Communication Sent', title: `Resolution communicated: ${c.reference}`,
        body: `The resolution communication for ${c.reference} was issued to ${c.contactName} on the ${c.preferredChannel} channel.`,
        createdAt: c.resolvedDate ?? iso(-3, 13), read: true,
        recipientId: c.assignedToId, severity: 'success',
        relatedType: 'Complaint', relatedId: c.id, channel: 'Email',
      });
    }
  });

  LEADS.forEach((l) => {
    if (l.status === 'New') {
      add({
        type: 'New Lead', title: `New lead: ${l.company}`,
        body: `${l.contactName} at ${l.company} submitted an enquiry via ${l.source}. The lead is unassigned and the first-contact SLA has started.`,
        createdAt: l.createdDate, read: false, recipientId: 'USR-004', severity: 'info',
        relatedType: 'Lead', relatedId: l.id, channel: 'In-App',
      });
    }
    if (l.status === 'Assigned' && l.ownerId) {
      add({
        type: 'Assignment', title: `Lead assigned: ${l.reference}`,
        body: `${l.company} has been assigned to you with ${userById(l.backupOwnerId)?.name ?? 'no backup'} as backup owner. First contact due ${new Date(l.slaDueDate).toLocaleDateString('en-ZA')}.`,
        createdAt: l.createdDate, read: false, recipientId: l.ownerId, severity: 'info',
        relatedType: 'Lead', relatedId: l.id, channel: 'In-App',
      });
    }
  });

  APPLICATIONS.forEach((a) => {
    if (a.status === 'Submitted' || a.status === 'Awaiting Approval') {
      add({
        type: 'Approval Request', title: `Application awaiting action: ${a.reference}`,
        body: `${a.formType} for ${CUSTOMERS.find((c) => c.id === a.customerId)?.organisation} requires underwriting action.`,
        createdAt: a.submittedDate ?? iso(-4, 12), read: false,
        recipientId: a.reviewerId ?? a.approverId, severity: 'warning',
        relatedType: 'Application', relatedId: a.id, channel: 'In-App',
      });
    }
    if (a.status === 'Approved') {
      add({
        type: 'Communication Sent', title: `Application approved: ${a.reference}`,
        body: `Cover was approved and the approval communication was issued to the client.`,
        createdAt: a.decisionDate ?? iso(-14, 14), read: true, recipientId: a.ownerId, severity: 'success',
        relatedType: 'Application', relatedId: a.id, channel: 'Email',
      });
    }
  });

  CAMPAIGNS.filter((c) => c.approvalStatus === 'Pending Approval').forEach((c) => {
    add({
      type: 'Approval Request', title: `Campaign approval required: ${c.reference}`,
      body: `${c.name} requires Marketing Communications Specialist sign-off before it can be activated.`,
      createdAt: iso(-2, 11), read: false, recipientId: 'USR-009', severity: 'warning',
      relatedType: 'Campaign', relatedId: c.id, channel: 'In-App',
    });
  });

  MARKETING_ASSETS.filter((a) => a.checks.some((c) => !c.passed)).forEach((a) => {
    add({
      type: 'System Alert', title: `CIM compliance failure: ${a.name}`,
      body: `${a.checks.filter((c) => !c.passed).length} compliance check(s) failed against Corporate Identity Manual ${a.cimVersion}.`,
      createdAt: a.submittedAt, read: false, recipientId: 'USR-009', severity: 'error',
      relatedType: 'Campaign', relatedId: a.campaignId, channel: 'In-App',
    });
  });

  add({
    type: 'Customer Reply', title: 'Customer replied on case ECIC-CMP-2026-0006',
    body: 'Lagos Renewable Energy has responded to the information request with the updated financial statements.',
    createdAt: iso(0, 7, 40), read: false, recipientId: 'USR-002', severity: 'info',
    relatedType: 'Complaint', relatedId: 'CMP-0006', channel: 'Email',
  });
  add({
    type: 'System Alert', title: 'Social media listening integration degraded',
    body: 'The social media listening integration has recorded 34 errors since the last successful synchronisation. IT has been notified.',
    createdAt: iso(-1, 22, 15), read: false, recipientId: 'USR-014', severity: 'warning',
    relatedType: 'Integration', relatedId: 'INT-04', channel: 'In-App',
  });
  add({
    type: 'System Alert', title: 'Blocked file upload quarantined',
    body: 'An upload against OPP-0014 was blocked by the security scan (Threat Detected) and quarantined. The uploading user has been notified.',
    createdAt: iso(-2, 14, 10), read: false, recipientId: 'USR-015', severity: 'error',
    relatedType: 'Document', relatedId: 'DOC-0001', channel: 'In-App',
  });

  return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const NOTIFICATIONS: AppNotification[] = buildNotifications();

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

const DEVICES = [
  'Chrome 141 on Windows 11', 'Edge 141 on Windows 11', 'Safari 19 on macOS 16',
  'Safari 19 on iPadOS 19', 'Chrome 141 on Android 16',
];

function buildAudit(): AuditEvent[] {
  const out: AuditEvent[] = [];
  let n = 0;
  let chain = 'GENESIS';

  const add = (
    at: string, userId: string | null, action: string, entity: string, entityId: string,
    before: string, after: string,
  ) => {
    n += 1;
    const u = userById(userId ?? '') ?? USERS[13];
    const id = `AUD-${String(n).padStart(5, '0')}`;
    const hash = pseudoHash(`${chain}|${id}|${at}|${u.id}|${action}|${entityId}|${after}`);
    chain = hash;
    out.push({
      id, at, userId: u.id, userName: u.name, role: u.jobTitle,
      action, entity, entityId, beforeValue: before, afterValue: after,
      ipAddress: `10.${intBetween(rng, 20, 60)}.${intBetween(rng, 1, 250)}.${intBetween(rng, 2, 250)}`,
      device: pick(rng, DEVICES),
      hash,
    });
  };

  // Sign-ins
  USERS.filter((u) => u.status === 'Active').forEach((u) => {
    add(u.lastLogin, u.id, 'User signed in', 'Authentication', u.id,
      '—', `SSO assertion accepted; MFA ${u.mfaEnrolled ? 'satisfied' : 'not enrolled'}`);
  });

  // Complaint lifecycle events from every timeline entry
  COMPLAINTS.forEach((c) => {
    c.timeline.forEach((t) => {
      const actor = USERS.find((u) => u.name === t.actor)?.id ?? 'USR-014';
      const map: Record<string, [string, string, string]> = {
        Logged: ['Complaint created', '—', `Status: Logged; Reference: ${c.reference}; Channel: ${c.channel}`],
        Assigned: ['Complaint assigned', 'Assigned to: —', `Assigned to: ${userById(c.assignedToId)?.name}; Status: Assigned`],
        Investigation: ['Investigation started', 'Status: Assigned', 'Status: In Progress'],
        'Information Requested': ['Information requested from customer', 'Status: In Progress', 'Status: Pending Information'],
        Escalation: ['Complaint escalated', `Escalated: false`, `Escalated: true; Status: Escalated; Escalated to: ${userById(c.escalatedToId)?.name ?? '—'}`],
        Resolution: ['Resolution recorded', 'Status: In Progress', 'Status: Resolved'],
        Communication: ['Customer communication issued', 'Communication sent: false', `Communication sent: true; Channel: ${c.preferredChannel}`],
        Feedback: ['Customer feedback captured', 'Feedback: —', `Feedback: ${c.customerFeedback}`],
        Closure: ['Complaint closed', 'Status: Resolved', `Status: Closed; Closed by: ${userById(c.closedById)?.name}`],
      };
      const m = map[t.type];
      if (m) add(t.at, actor, m[0], 'Complaint', c.reference, m[1], m[2]);
    });
  });

  // Lead lifecycle
  LEADS.forEach((l) => {
    l.timeline.forEach((t) => {
      const actor = USERS.find((u) => u.name === t.actor)?.id ?? 'USR-014';
      const map: Record<string, [string, string, string]> = {
        Created: ['Lead created', '—', `Reference: ${l.reference}; Source: ${l.source}; Status: New`],
        Assigned: ['Lead assigned', 'Owner: —', `Owner: ${userById(l.ownerId)?.name}; Backup: ${userById(l.backupOwnerId)?.name ?? '—'}`],
        Contact: ['First contact recorded', 'Status: Assigned', 'Status: Contacted'],
        Analysis: ['Desktop analysis completed', 'Analysis: incomplete', `Decision: ${l.desktopAnalysis.decision}; Risk: ${l.desktopAnalysis.riskRating}; Score: ${l.qualificationScore}`],
        Disqualified: ['Lead disqualified', 'Status: Contacted', `Status: Disqualified; Reason: ${l.disqualifiedReason}`],
        Converted: ['Lead converted to opportunity', 'Status: Qualified', `Status: Converted; Opportunity: ${l.convertedOpportunityId}`],
      };
      const m = map[t.type];
      if (m) add(t.at, actor, m[0], 'Lead', l.reference, m[1], m[2]);
    });
  });

  // Opportunity lifecycle
  OPPORTUNITIES.forEach((o) => {
    o.timeline.forEach((t) => {
      const actor = USERS.find((u) => u.name === t.actor)?.id ?? 'USR-014';
      if (t.type === 'Created') {
        add(t.at, actor, 'Opportunity created', 'Opportunity', o.reference, '—',
          `Reference: ${o.reference}; Value: R ${o.estimatedValue.toLocaleString('en-ZA')}; Originating lead: ${o.originatingLeadId ?? '—'}`);
      } else if (t.type === 'Stage Change') {
        add(t.at, actor, 'Opportunity stage changed', 'Opportunity', o.reference,
          'Stage: previous', `Stage: ${t.title.replace('Stage advanced to ', '')}`);
      } else if (t.type === 'Handover') {
        add(t.at, actor, 'Handover to underwriting', 'Opportunity', o.reference,
          'Underwriting status: Awaiting Handover', `Underwriting status: In Underwriting Queue; Unit: ${o.underwritingUnit}`);
      } else if (t.type === 'Underwriting') {
        add(t.at, actor, 'Underwriting status updated', 'Opportunity', o.reference,
          'Underwriting status: In Underwriting Queue', `Underwriting status: ${o.underwritingStatus}`);
      } else if (t.type === 'Closed Won') {
        add(t.at, actor, 'Opportunity closed won', 'Opportunity', o.reference, 'Stage: Negotiation', 'Stage: Closed Won');
      } else if (t.type === 'Closed Lost') {
        add(t.at, actor, 'Opportunity closed lost', 'Opportunity', o.reference, 'Stage: previous',
          `Stage: Closed Lost; Reason: ${o.closedLostReason}`);
      }
    });
  });

  // Applications and signatures
  APPLICATIONS.forEach((a) => {
    a.timeline.forEach((t) => {
      const actor = USERS.find((u) => u.name === t.actor)?.id ?? 'USR-014';
      const map: Record<string, [string, string, string]> = {
        Created: ['Application draft created', '—', `Reference: ${a.reference}; Form: ${a.formType}; Status: Draft`],
        Signature: ['Document digitally signed', 'Signed: false', `Signed: true; Certificate: ${a.signature.certificateRef}; Locked: true`],
        Submitted: ['Application submitted', 'Status: Draft', 'Status: Submitted'],
        Review: ['Application review commenced', 'Status: Submitted', 'Status: Under Review'],
        Approved: ['Application approved', 'Status: Under Review', 'Status: Approved'],
        Rejected: ['Application rejected', 'Status: Under Review', `Status: Rejected; Reason: ${a.rejectionReason}`],
      };
      const m = map[t.type];
      if (m) add(t.at, actor, m[0], 'Application', a.reference, m[1], m[2]);
    });
  });

  // Documents
  DOCUMENTS.slice(0, 60).forEach((d) => {
    add(d.uploadedAt, d.uploadedById,
      d.status === 'Blocked' ? 'Document upload blocked by security scan' : 'Document uploaded',
      'Document', d.id, '—',
      `Name: ${d.name}; Classification: ${d.classification}; Scan: ${d.scanResult}; Linked to: ${d.transactionRef}`);
  });

  // CIM approvals
  CIM_VERSIONS.forEach((c) => {
    c.approvalSteps.filter((s) => s.date).forEach((s) => {
      add(s.date as string, s.actorId, `CIM ${s.step.toLowerCase()}`, 'Corporate Identity Manual', c.version,
        `Status: previous`, `Step: ${s.step}; Result: ${s.status}`);
    });
  });

  // Campaign approvals
  CAMPAIGNS.filter((c) => c.approvalStatus === 'Approved').forEach((c) => {
    add(iso(-40, 11), c.approverId, 'Campaign approved', 'Campaign', c.reference,
      'Approval status: Pending Approval', 'Approval status: Approved');
  });

  // Administrative and security events
  add(iso(-46, 15, 40), 'USR-014', 'User account suspended', 'User', 'USR-016',
    'Status: Active', 'Status: Suspended; Reason: Extended leave of absence');
  add(iso(-30, 9, 15), 'USR-014', 'Role assignment changed', 'User', 'USR-017',
    'Role: Sales User', 'Role: BDU Officer');
  add(iso(-25, 10, 5), 'USR-015', 'Security configuration changed', 'Configuration', 'security.sessionTimeoutMinutes',
    '30', '20');
  add(iso(-18, 11, 22), 'USR-014', 'SLA rule amended', 'Configuration', 'SLA-C3',
    'targetDays: 7', 'targetDays: 5');
  add(iso(-12, 14, 8), 'USR-015', 'Sensitive data unmasked', 'Customer', 'CUS-0003',
    'PII masked', 'PII revealed; justification: claim assessment');
  add(iso(-8, 9, 30), 'USR-014', 'Communication template amended', 'Configuration', 'NT-05',
    'Subject: Complaint resolution', 'Subject: Resolution of complaint {{reference}}');
  add(iso(-5, 16, 45), 'USR-015', 'Failed authentication attempt', 'Authentication', 'USR-016',
    '—', 'Result: Denied; Reason: Account suspended; Attempts: 3');
  add(iso(-3, 8, 12), 'USR-014', 'Integration synchronisation executed', 'Integration', 'INT-02',
    'Last sync: previous', 'Records synchronised: 41; Errors: 0');
  add(iso(-2, 14, 12), 'USR-015', 'Malicious file quarantined', 'Document', 'buyer_statement_final.pdf.exe',
    'Scan: Pending', 'Scan: Threat Detected; Action: Quarantined; Upload rejected');
  add(iso(-1, 10, 0), 'USR-014', 'Report configuration saved', 'Report', 'RPT-CUSTOM-001',
    '—', 'Name: Complaints by Business Unit (Q4); Fields: 8; Grouping: Business Unit');
  add(iso(0, 7, 5), 'USR-015', 'Backup completed', 'System', 'BACKUP-DAILY',
    '—', 'DEMO: Full backup completed successfully; Duration: 42 min; Size: 184 GB');

  return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export const AUDIT_EVENTS: AuditEvent[] = buildAudit();

/* ------------------------------------------------------------------ */
/* Seed bundle                                                         */
/* ------------------------------------------------------------------ */

export interface SeedData {
  customers: typeof CUSTOMERS;
  contacts: typeof CONTACTS;
  users: typeof USERS;
  complaints: typeof COMPLAINTS;
  leads: typeof LEADS;
  opportunities: typeof OPPORTUNITIES;
  applications: typeof APPLICATIONS;
  documents: typeof DOCUMENTS;
  campaigns: typeof CAMPAIGNS;
  events: typeof EVENTS;
  organizers: typeof ORGANIZERS;
  cimVersions: typeof CIM_VERSIONS;
  marketingAssets: typeof MARKETING_ASSETS;
  activities: Activity[];
  tasks: Task[];
  notifications: AppNotification[];
  auditEvents: AuditEvent[];
  faqs: typeof FAQS;
  chatSessions: typeof CHAT_HISTORY;
  integrations: typeof INTEGRATIONS;
  configuration: Configuration;
}

export function buildSeed(): SeedData {
  return JSON.parse(JSON.stringify({
    customers: CUSTOMERS,
    contacts: CONTACTS,
    users: USERS,
    complaints: COMPLAINTS,
    leads: LEADS,
    opportunities: OPPORTUNITIES,
    applications: APPLICATIONS,
    documents: DOCUMENTS,
    campaigns: CAMPAIGNS,
    events: EVENTS,
    organizers: ORGANIZERS,
    cimVersions: CIM_VERSIONS,
    marketingAssets: MARKETING_ASSETS,
    activities: ACTIVITIES,
    tasks: TASKS,
    notifications: NOTIFICATIONS,
    auditEvents: AUDIT_EVENTS,
    faqs: FAQS,
    chatSessions: CHAT_HISTORY,
    integrations: INTEGRATIONS,
    configuration: cloneConfig(),
  })) as SeedData;
}
