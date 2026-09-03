/**
 * Mock service layer.
 *
 * Every write in the application goes through this module. It is deliberately
 * shaped like a remote API — asynchronous, promise-returning, one method per
 * business operation — so that a production backend can replace the internals
 * of this file without any change to the modules that consume it.
 */

import type {
  Activity, AppNotification, Application, AuditEvent, Campaign, ChatSession, Complaint,
  ComplaintStatus, CrmDocument, FeedbackRating, Lead, LeadStatus, MarketingAsset,
  Opportunity, OpportunityStage, Task, TimelineEvent, UnderwritingStatus, User,
} from '../../types';
import { useStore } from '../../store';
import type { CrmState, OfflineCapture, SavedReport } from '../../store';
import { addBusinessDays, iso } from '../../utils/dates';
import { pseudoHash } from '../../utils/format';

const LATENCY = 180;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const state = () => useStore.getState();
const patch = (fn: (draft: CrmState) => void) => useStore.getState().apply(fn);

let counter = 0;
function nextRef(prefix: string, existing: { reference: string }[]): { id: string; reference: string } {
  counter += 1;
  const year = new Date().getFullYear();
  const nums = existing
    .map((e) => Number(e.reference.split('-').pop()))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  const padded = String(next).padStart(4, '0');
  return {
    id: `${prefix}-${padded}-${counter}`,
    reference: `ECIC-${prefix}-${year}-${padded}`,
  };
}

function actor(): User {
  const s = state();
  return s.users.find((u) => u.id === s.session.userId) ?? s.users[0];
}

function timelineEvent(type: string, title: string, detail: string): TimelineEvent {
  const u = actor();
  return {
    id: `TL-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`,
    at: new Date().toISOString(),
    actor: u.name,
    actorRole: u.jobTitle,
    type, title, detail,
  };
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export function writeAudit(
  action: string, entity: string, entityId: string, before: string, after: string,
): AuditEvent {
  const u = actor();
  const at = new Date().toISOString();
  const prev = state().auditEvents[0]?.hash ?? 'GENESIS';
  const id = `AUD-LIVE-${Date.now().toString(36).toUpperCase()}`;
  const event: AuditEvent = {
    id, at, userId: u.id, userName: u.name, role: u.jobTitle,
    action, entity, entityId, beforeValue: before, afterValue: after,
    ipAddress: '10.24.11.87',
    device: `${navigator.userAgent.includes('Mac') ? 'Safari 19 on macOS 16' : 'Chrome 141 on Windows 11'} (this session)`,
    hash: pseudoHash(`${prev}|${id}|${at}|${u.id}|${action}|${entityId}|${after}`),
  };
  patch((d) => { d.auditEvents = [event, ...d.auditEvents]; });
  return event;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
  const notification: AppNotification = {
    id: `NTF-LIVE-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...n,
  };
  patch((d) => { d.notifications = [notification, ...d.notifications]; });
  return notification;
}

export function renderTemplate(key: string, values: Record<string, string>): { subject: string; body: string; channel: string } | null {
  const tpl = state().configuration.notificationTemplates.find((t) => t.key === key);
  if (!tpl || !tpl.active) return null;
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);
  return { subject: fill(tpl.subject), body: fill(tpl.body), channel: tpl.channel };
}

function createTask(t: Omit<Task, 'id' | 'createdAt'>): Task {
  const task: Task = { id: `TSK-LIVE-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), ...t };
  patch((d) => { d.tasks = [task, ...d.tasks]; });
  return task;
}

export const api = {
  /* ---------------------------------------------------------------- */
  /* Reads                                                             */
  /* ---------------------------------------------------------------- */
  getComplaints: () => delay(state().complaints),
  getLeads: () => delay(state().leads),
  getOpportunities: () => delay(state().opportunities),
  getCampaigns: () => delay(state().campaigns),
  getUsers: () => delay(state().users),
  getAuditLogs: () => delay(state().auditEvents),
  getReports: () => delay(state().savedReports),

  /* ---------------------------------------------------------------- */
  /* SLA                                                               */
  /* ---------------------------------------------------------------- */

  /** Resolve the configured SLA target (business days) for a complaint severity. */
  slaTargetFor(severity: string): number {
    const rules = state().configuration.slaRules.filter((r) => r.entity === 'Complaint');
    const exact = rules.find((r) => r.scope.toLowerCase().includes(severity.toLowerCase()));
    if (exact) return exact.targetDays;
    const std = rules.find((r) => r.scope.toLowerCase().includes('medium'));
    return std?.targetDays ?? 5;
  },

  slaWarningPercent(): number {
    const rules = state().configuration.slaRules.filter((r) => r.entity === 'Complaint');
    return rules[2]?.warningPercent ?? 80;
  },

  /* ---------------------------------------------------------------- */
  /* Complaints                                                        */
  /* ---------------------------------------------------------------- */

  async createComplaint(input: Partial<Complaint>): Promise<Complaint> {
    const s = state();
    const { reference } = nextRef('CMP', s.complaints);
    const id = `CMP-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const severity = input.severity ?? 'Medium';
    const slaTargetDays = this.slaTargetFor(severity);
    const now = new Date();
    const complaint: Complaint = {
      id, reference,
      subject: input.subject ?? '',
      customerId: input.customerId ?? '',
      customerKind: input.customerKind ?? 'External',
      contactName: input.contactName ?? '',
      contactEmail: input.contactEmail ?? '',
      contactPhone: input.contactPhone ?? '',
      description: input.description ?? '',
      loggedDate: input.loggedDate ?? now.toISOString().slice(0, 10),
      loggedTime: input.loggedTime ?? now.toTimeString().slice(0, 5),
      businessUnit: input.businessUnit ?? 'Client Services',
      category: input.category ?? '',
      subCategory: input.subCategory ?? '',
      severity,
      priority: severity === 'Critical' ? 'P1' : severity === 'High' ? 'P2' : severity === 'Medium' ? 'P3' : 'P4',
      channel: input.channel ?? 'Email',
      preferredChannel: input.preferredChannel ?? 'Email',
      assignedTeam: input.assignedTeam ?? 'Complaints Team A',
      assignedToId: input.assignedToId ?? null,
      status: input.assignedToId ? 'Assigned' : 'Logged',
      slaTargetDays,
      dueDate: addBusinessDays(now, slaTargetDays).toISOString(),
      resolvedDate: null, closedDate: null, closedById: null,
      escalated: false, escalationReason: null, escalatedToId: null, escalationDate: null,
      investigationFindings: '', outcome: '', resolutionDetail: '', correctiveAction: '',
      customerFeedback: null, feedbackComment: '', communicationSent: false,
      approvalRequired: true, approvedById: null,
      linkedOpportunityId: null, linkedApplicationId: null,
      documentIds: [],
      timeline: [
        timelineEvent('Logged', `Complaint logged via ${input.channel ?? 'Email'}`,
          `Reference ${reference} generated automatically. SLA target of ${slaTargetDays} business days applied from the configured ${severity} severity rule. Acknowledgement queued to the customer's preferred channel.`),
      ],
    };
    if (input.assignedToId) {
      complaint.timeline.push(timelineEvent('Assigned',
        `Assigned to ${state().users.find((u) => u.id === input.assignedToId)?.name}`,
        `Routing applied on capture. SLA due ${new Date(complaint.dueDate).toLocaleDateString('en-ZA')}.`));
    }

    patch((d) => { d.complaints = [complaint, ...d.complaints]; });
    writeAudit('Complaint created', 'Complaint', reference, '—',
      `Status: ${complaint.status}; Reference: ${reference}; Channel: ${complaint.channel}; Severity: ${severity}`);

    const tpl = renderTemplate('complaint_logged', {
      reference, contactName: complaint.contactName, loggedDate: complaint.loggedDate,
      channel: complaint.channel, subject: complaint.subject,
      assignedTeam: complaint.assignedTeam, slaTargetDays: String(slaTargetDays),
      dueDate: new Date(complaint.dueDate).toLocaleDateString('en-ZA'),
    });
    pushNotification({
      type: 'Communication Sent', title: `Acknowledgement issued: ${reference}`,
      body: tpl?.body ?? `Complaint ${reference} acknowledged.`,
      recipientId: complaint.assignedToId, severity: 'success',
      relatedType: 'Complaint', relatedId: id,
      channel: complaint.preferredChannel === 'SMS' ? 'SMS' : 'Email',
    });
    if (complaint.assignedToId) {
      pushNotification({
        type: 'Assignment', title: `Complaint assigned: ${reference}`,
        body: `${complaint.subject} (${severity}) has been assigned to you. SLA due ${new Date(complaint.dueDate).toLocaleDateString('en-ZA')}.`,
        recipientId: complaint.assignedToId, severity: 'info',
        relatedType: 'Complaint', relatedId: id, channel: 'In-App',
      });
    } else {
      pushNotification({
        type: 'System Alert', title: `Unassigned complaint: ${reference}`,
        body: 'A new complaint has been logged and requires assignment to a specialist.',
        recipientId: 'USR-003', severity: 'warning',
        relatedType: 'Complaint', relatedId: id, channel: 'In-App',
      });
    }
    createTask({
      title: `Action complaint ${reference}`,
      description: complaint.subject,
      category: 'SLA', ownerId: complaint.assignedToId ?? 'USR-003',
      dueDate: complaint.dueDate, priority: complaint.priority, status: 'Open',
      relatedType: 'Complaint', relatedId: id,
    });
    return delay(complaint);
  },

  async updateComplaint(id: string, changes: Partial<Complaint>, note?: string): Promise<Complaint> {
    let updated!: Complaint;
    const before = state().complaints.find((c) => c.id === id);
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = { ...c, ...changes };
        if (note) updated.timeline = [...updated.timeline, timelineEvent('Update', 'Complaint updated', note)];
        return updated;
      });
    });
    writeAudit('Complaint updated', 'Complaint', before?.reference ?? id,
      Object.keys(changes).map((k) => `${k}: ${String((before as never as Record<string, unknown>)?.[k] ?? '—')}`).join('; ').slice(0, 300),
      Object.entries(changes).map(([k, v]) => `${k}: ${String(v)}`).join('; ').slice(0, 300));
    return delay(updated);
  },

  async assignComplaint(id: string, userId: string, team: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    const user = state().users.find((u) => u.id === userId);
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, assignedToId: userId, assignedTeam: team,
          status: c.status === 'Logged' ? 'Assigned' : c.status,
          timeline: [...c.timeline, timelineEvent('Assigned', `Assigned to ${user?.name}`,
            `Case allocated to ${user?.name} (${team}). SLA due ${new Date(c.dueDate).toLocaleDateString('en-ZA')}.`)],
        };
        return updated;
      });
    });
    writeAudit('Complaint assigned', 'Complaint', before?.reference ?? id,
      `Assigned to: ${state().users.find((u) => u.id === before?.assignedToId)?.name ?? '—'}`,
      `Assigned to: ${user?.name}; Team: ${team}; Status: Assigned`);
    pushNotification({
      type: 'Assignment', title: `Complaint assigned: ${before?.reference}`,
      body: `${before?.subject} has been assigned to you.`,
      recipientId: userId, severity: 'info',
      relatedType: 'Complaint', relatedId: id, channel: 'In-App',
    });
    return delay(updated);
  },

  async setComplaintStatus(id: string, status: ComplaintStatus, note: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, status,
          timeline: [...c.timeline, timelineEvent('Status Change', `Status changed to ${status}`, note)],
        };
        return updated;
      });
    });
    writeAudit('Complaint status changed', 'Complaint', before?.reference ?? id,
      `Status: ${before?.status}`, `Status: ${status}`);
    return delay(updated);
  },

  async escalateComplaint(id: string, reason: string, toUserId: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, escalated: true, status: 'Escalated', escalationReason: reason,
          escalatedToId: toUserId, escalationDate: new Date().toISOString(),
          timeline: [...c.timeline, timelineEvent('Escalation', 'Complaint escalated',
            `Escalated to ${d.users.find((u) => u.id === toUserId)?.name}. Reason: ${reason}. An escalation task has been created and the supervisor notified.`)],
        };
        return updated;
      });
    });
    writeAudit('Complaint escalated', 'Complaint', before?.reference ?? id,
      'Escalated: false', `Escalated: true; Status: Escalated; Reason: ${reason}`);
    pushNotification({
      type: 'Escalation', title: `ESCALATION: ${before?.reference}`,
      body: `${before?.subject} has been escalated. Reason: ${reason}.`,
      recipientId: toUserId, severity: 'error',
      relatedType: 'Complaint', relatedId: id, channel: 'In-App',
    });
    createTask({
      title: `Escalation review: ${before?.reference}`,
      description: reason, category: 'Escalation', ownerId: toUserId,
      dueDate: iso(1, 12), priority: before?.priority ?? 'P2', status: 'Open',
      relatedType: 'Complaint', relatedId: id,
    });
    return delay(updated);
  },

  async resolveComplaint(
    id: string,
    payload: { investigationFindings: string; outcome: string; resolutionDetail: string; correctiveAction: string },
  ): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, ...payload, status: 'Resolved', resolvedDate: new Date().toISOString(),
          timeline: [...c.timeline, timelineEvent('Resolution', 'Resolution recorded',
            `${payload.outcome} — ${payload.resolutionDetail}`)],
        };
        return updated;
      });
    });
    writeAudit('Resolution recorded', 'Complaint', before?.reference ?? id,
      `Status: ${before?.status}`, `Status: Resolved; Outcome: ${payload.outcome}`);
    createTask({
      title: `Authorise closure: ${before?.reference}`,
      description: 'Resolution recorded. Supervisor authorisation required before the case can be closed.',
      category: 'Approval', ownerId: 'USR-003', dueDate: iso(2, 12),
      priority: before?.priority ?? 'P3', status: 'Open',
      relatedType: 'Complaint', relatedId: id,
    });
    return delay(updated);
  },

  async sendComplaintCommunication(id: string, templateKey: string, body: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, communicationSent: true,
          timeline: [...c.timeline, timelineEvent('Communication', 'Customer communication issued',
            `Template "${templateKey}" sent on the ${c.preferredChannel} channel and stored against the case.`)],
        };
        return updated;
      });
    });
    writeAudit('Customer communication issued', 'Complaint', before?.reference ?? id,
      'Communication sent: false', `Communication sent: true; Template: ${templateKey}; Channel: ${before?.preferredChannel}`);
    pushNotification({
      type: 'Communication Sent', title: `Communication issued: ${before?.reference}`,
      body, recipientId: before?.assignedToId ?? null, severity: 'success',
      relatedType: 'Complaint', relatedId: id,
      channel: before?.preferredChannel === 'SMS' ? 'SMS' : 'Email',
    });
    return delay(updated);
  },

  async recordComplaintFeedback(id: string, rating: FeedbackRating, comment: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    const negative = rating === 'Dissatisfied' || rating === 'Very Dissatisfied';
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        const timeline = [...c.timeline, timelineEvent('Feedback', `Customer feedback captured: ${rating}`,
          negative
            ? 'Negative feedback automatically flagged the case as dissatisfied and triggered the escalation workflow.'
            : 'Feedback recorded against the case and included in the customer satisfaction index.')];
        updated = {
          ...c, customerFeedback: rating, feedbackComment: comment,
          ...(negative
            ? {
              escalated: true, status: 'Escalated' as ComplaintStatus,
              escalationReason: 'Customer dissatisfaction recorded on the resolution outcome',
              escalatedToId: 'USR-003', escalationDate: new Date().toISOString(),
              timeline: [...timeline, timelineEvent('Escalation', 'Automatic escalation on dissatisfaction',
                'The dissatisfaction rule escalated this case to the Complaints Supervisor, created an escalation task and recalculated the SLA risk.')],
            }
            : { timeline }),
        };
        return updated;
      });
    });
    writeAudit('Customer feedback captured', 'Complaint', before?.reference ?? id,
      'Feedback: —', `Feedback: ${rating}${negative ? '; Auto-escalated: true' : ''}`);
    if (negative) {
      pushNotification({
        type: 'Escalation', title: `Dissatisfaction escalation: ${before?.reference}`,
        body: `The customer recorded "${rating}" on case ${before?.reference}. The case has been escalated automatically and requires supervisor attention.`,
        recipientId: 'USR-003', severity: 'error',
        relatedType: 'Complaint', relatedId: id, channel: 'In-App',
      });
      createTask({
        title: `Dissatisfaction review: ${before?.reference}`,
        description: `Customer recorded ${rating}. ${comment}`,
        category: 'Escalation', ownerId: 'USR-003', dueDate: iso(1, 12),
        priority: 'P2', status: 'Open', relatedType: 'Complaint', relatedId: id,
      });
    }
    return delay(updated);
  },

  /** Closure pre-conditions, evaluated live so the UI can render the checklist. */
  closurePreconditions(c: Complaint): { label: string; met: boolean; detail: string }[] {
    const required = state().configuration.requiredFields.filter(
      (r) => r.entity === 'Complaint' && r.appliesTo === 'Closure' && r.required,
    );
    const record = c as unknown as Record<string, string>;
    return [
      {
        label: 'Mandatory fields complete',
        met: ['description', 'category', 'severity', 'channel'].every((f) => !!record[f]),
        detail: 'Description, category, severity and channel must all be captured.',
      },
      {
        label: 'Investigation recorded',
        met: required.every((r) => r.field !== 'investigationFindings') || c.investigationFindings.trim().length > 0,
        detail: 'Investigation findings must be recorded against the case.',
      },
      {
        label: 'Resolution recorded',
        met: c.resolutionDetail.trim().length > 0 && c.outcome.trim().length > 0,
        detail: 'An outcome and resolution detail must be recorded.',
      },
      {
        label: 'Customer communication issued',
        met: c.communicationSent,
        detail: 'The resolution must have been communicated to the customer on their preferred channel.',
      },
      {
        label: 'Supervisor authorisation obtained',
        met: c.status === 'Resolved' || c.status === 'Escalated' || c.status === 'Closed',
        detail: 'The case must have reached Resolved before closure can be authorised.',
      },
    ];
  },

  async closeComplaint(id: string): Promise<Complaint> {
    const before = state().complaints.find((c) => c.id === id);
    const u = actor();
    let updated!: Complaint;
    patch((d) => {
      d.complaints = d.complaints.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, status: 'Closed', closedDate: new Date().toISOString(),
          closedById: u.id, approvedById: u.id,
          timeline: [...c.timeline, timelineEvent('Closure', 'Complaint closed',
            `Closure pre-conditions validated and authorisation provided by ${u.name} (${u.jobTitle}). The record is now locked against further amendment.`)],
        };
        return updated;
      });
      d.tasks = d.tasks.map((t) =>
        t.relatedType === 'Complaint' && t.relatedId === id && t.status === 'Open'
          ? { ...t, status: 'Completed' as const } : t);
    });
    writeAudit('Complaint closed', 'Complaint', before?.reference ?? id,
      `Status: ${before?.status}`, `Status: Closed; Closed by: ${u.name}; Closed at: ${new Date().toLocaleString('en-ZA')}`);
    pushNotification({
      type: 'Communication Sent', title: `Complaint closed: ${before?.reference}`,
      body: `Complaint ${before?.reference} was closed by ${u.name}. A closure confirmation was issued to the customer.`,
      recipientId: before?.assignedToId ?? null, severity: 'success',
      relatedType: 'Complaint', relatedId: id, channel: 'Email',
    });
    return delay(updated);
  },

  /* ---------------------------------------------------------------- */
  /* Leads                                                             */
  /* ---------------------------------------------------------------- */

  findDuplicateLeads(input: { email?: string; phone?: string; company?: string; contactName?: string }) {
    const rules = state().configuration.duplicateRules.filter((r) => r.active);
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const results: { lead: Lead; matches: { field: string; rule: string; weight: number }[]; confidence: number }[] = [];
    state().leads.forEach((lead) => {
      const matches: { field: string; rule: string; weight: number }[] = [];
      rules.forEach((r) => {
        const candidate = (input as Record<string, string | undefined>)[r.field];
        const existing = (lead as unknown as Record<string, string>)[r.field];
        if (!candidate || !existing || candidate.trim().length < 3) return;
        const a = norm(candidate);
        const b = norm(existing);
        if (!a || !b) return;
        const hit = r.field === 'phone'
          ? a.slice(-9) === b.slice(-9)
          : r.field === 'email'
            ? a === b
            : a === b || b.includes(a) || a.includes(b);
        if (hit) matches.push({ field: r.field, rule: r.matchType, weight: r.weight });
      });
      if (matches.length) {
        results.push({ lead, matches, confidence: Math.min(100, matches.reduce((s, m) => s + m.weight, 0)) });
      }
    });
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  },

  async createLead(input: Partial<Lead>): Promise<Lead> {
    const s = state();
    const { reference } = nextRef('LED', s.leads);
    const id = `LED-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const slaRule = s.configuration.slaRules.find((r) => r.entity === 'Lead');
    const lead: Lead = {
      id, reference,
      contactName: input.contactName ?? '',
      company: input.company ?? '',
      customerId: input.customerId ?? null,
      email: input.email ?? '',
      phone: input.phone ?? '',
      source: input.source ?? 'Manual Capture',
      enquiryType: input.enquiryType ?? 'New cover enquiry',
      sector: input.sector ?? '',
      productInterest: input.productInterest ?? '',
      campaignId: input.campaignId ?? null,
      eventId: input.eventId ?? null,
      ownerId: input.ownerId ?? null,
      backupOwnerId: input.backupOwnerId ?? null,
      status: input.ownerId ? 'Assigned' : 'New',
      qualificationScore: 0,
      estimatedValue: input.estimatedValue ?? 0,
      createdDate: now.toISOString(),
      slaDueDate: addBusinessDays(now, slaRule?.targetDays ?? 2).toISOString(),
      firstContactDate: null,
      disqualifiedReason: null,
      convertedOpportunityId: null,
      desktopAnalysis: { completed: false, completedBy: null, completedAt: null, values: {}, decision: null, notes: '', riskRating: null },
      syncStatus: input.syncStatus ?? 'Synced',
      country: input.country ?? 'South Africa',
      notes: input.notes ?? '',
      documentIds: [],
      timeline: [timelineEvent('Created', `Lead captured via ${input.source ?? 'Manual Capture'}`,
        `Reference ${reference} generated. Duplicate detection executed against the configured matching rules. First-contact SLA of ${slaRule?.targetDays ?? 2} business days applied.`)],
    };
    if (input.ownerId) {
      lead.timeline.push(timelineEvent('Assigned',
        `Assigned to ${s.users.find((u) => u.id === input.ownerId)?.name}`,
        `Primary owner recorded with ${s.users.find((u) => u.id === input.backupOwnerId)?.name ?? 'no'} backup owner for continuity of client coverage.`));
    }
    patch((d) => { d.leads = [lead, ...d.leads]; });
    writeAudit('Lead created', 'Lead', reference, '—',
      `Reference: ${reference}; Source: ${lead.source}; Status: ${lead.status}; Company: ${lead.company}`);
    pushNotification({
      type: 'New Lead', title: `New lead: ${lead.company}`,
      body: `${lead.contactName} at ${lead.company} was captured via ${lead.source}. ${lead.ownerId ? `Assigned to ${s.users.find((u) => u.id === lead.ownerId)?.name}.` : 'The lead is unassigned.'}`,
      recipientId: lead.ownerId ?? 'USR-004', severity: 'info',
      relatedType: 'Lead', relatedId: id, channel: 'In-App',
    });
    return delay(lead);
  },

  async assignLead(id: string, ownerId: string, backupOwnerId: string): Promise<Lead> {
    const s = state();
    const before = s.leads.find((l) => l.id === id);
    let updated!: Lead;
    patch((d) => {
      d.leads = d.leads.map((l) => {
        if (l.id !== id) return l;
        updated = {
          ...l, ownerId, backupOwnerId,
          status: l.status === 'New' ? 'Assigned' : l.status,
          timeline: [...l.timeline, timelineEvent('Assigned',
            `Assigned to ${d.users.find((u) => u.id === ownerId)?.name}`,
            `Backup owner ${d.users.find((u) => u.id === backupOwnerId)?.name ?? 'not set'} recorded so the resource pool retains visibility of this lead.`)],
        };
        return updated;
      });
    });
    writeAudit('Lead assigned', 'Lead', before?.reference ?? id,
      `Owner: ${s.users.find((u) => u.id === before?.ownerId)?.name ?? '—'}`,
      `Owner: ${s.users.find((u) => u.id === ownerId)?.name}; Backup: ${s.users.find((u) => u.id === backupOwnerId)?.name ?? '—'}`);
    pushNotification({
      type: 'Assignment', title: `Lead assigned: ${before?.reference}`,
      body: `${before?.company} has been assigned to you. First contact due ${new Date(before?.slaDueDate ?? '').toLocaleDateString('en-ZA')}.`,
      recipientId: ownerId, severity: 'info', relatedType: 'Lead', relatedId: id, channel: 'In-App',
    });
    return delay(updated);
  },

  async updateLead(id: string, changes: Partial<Lead>, note?: string): Promise<Lead> {
    const before = state().leads.find((l) => l.id === id);
    let updated!: Lead;
    patch((d) => {
      d.leads = d.leads.map((l) => {
        if (l.id !== id) return l;
        updated = { ...l, ...changes };
        if (note) updated.timeline = [...updated.timeline, timelineEvent('Update', 'Lead updated', note)];
        return updated;
      });
    });
    writeAudit('Lead updated', 'Lead', before?.reference ?? id,
      Object.keys(changes).join(', '),
      Object.entries(changes).map(([k, v]) => `${k}: ${typeof v === 'object' ? '[updated]' : String(v)}`).join('; ').slice(0, 300));
    return delay(updated);
  },

  async setLeadStatus(id: string, status: LeadStatus, note: string): Promise<Lead> {
    const before = state().leads.find((l) => l.id === id);
    let updated!: Lead;
    patch((d) => {
      d.leads = d.leads.map((l) => {
        if (l.id !== id) return l;
        updated = {
          ...l, status,
          firstContactDate: status === 'Contacted' && !l.firstContactDate ? new Date().toISOString() : l.firstContactDate,
          timeline: [...l.timeline, timelineEvent('Status Change', `Status changed to ${status}`, note)],
        };
        return updated;
      });
    });
    writeAudit('Lead status changed', 'Lead', before?.reference ?? id, `Status: ${before?.status}`, `Status: ${status}`);
    return delay(updated);
  },

  async convertLead(leadId: string, input: {
    name: string; ownerId: string; estimatedValue: number; expectedCloseDate: string;
    products: { product: string; cover: string; value: number; tenor: string }[];
  }): Promise<Opportunity> {
    const s = state();
    const lead = s.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');
    const { reference } = nextRef('OPP', s.opportunities);
    const id = `OPP-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const opportunity: Opportunity = {
      id, reference, name: input.name,
      customerId: lead.customerId ?? '',
      ownerId: input.ownerId,
      estimatedValue: input.estimatedValue,
      expectedCloseDate: input.expectedCloseDate,
      stage: 'Qualification',
      products: input.products.map((p, i) => ({ id: `${id}-P${i + 1}`, ...p })),
      campaignId: lead.campaignId,
      originatingLeadId: lead.id,
      probability: 20,
      forecastCategory: 'Pipeline',
      createdDate: new Date().toISOString(),
      closedDate: null, closedLostReason: null, closedLostDetail: '',
      businessUnit: 'Business Development Unit',
      underwritingStatus: 'Not Handed Over',
      underwritingUnit: null, underwritingOwnerId: null, handoverDate: null,
      stageHistory: [{ stage: 'Qualification', enteredAt: new Date().toISOString(), exitedAt: null, days: 0 }],
      documentIds: [...lead.documentIds],
      timeline: [timelineEvent('Created', `Opportunity created from lead ${lead.reference}`,
        `Converted from ${lead.reference}. Account, contacts, interaction history, ${lead.documentIds.length} supporting document(s), campaign attribution and the desktop analysis outcome (${lead.desktopAnalysis.decision ?? 'not completed'}) were carried across automatically. The originating lead relationship is retained permanently.`)],
    };
    patch((d) => {
      d.opportunities = [opportunity, ...d.opportunities];
      d.leads = d.leads.map((l) => l.id !== leadId ? l : {
        ...l, status: 'Converted', convertedOpportunityId: id,
        timeline: [...l.timeline, timelineEvent('Converted', `Converted to opportunity ${reference}`,
          'Conversion wizard completed. The lead is retained as the permanent origin record for traceability.')],
      });
      d.documents = d.documents.map((doc) =>
        lead.documentIds.includes(doc.id) ? { ...doc, opportunityId: id } : doc);
    });
    writeAudit('Lead converted to opportunity', 'Lead', lead.reference,
      `Status: ${lead.status}`, `Status: Converted; Opportunity: ${reference}`);
    writeAudit('Opportunity created', 'Opportunity', reference, '—',
      `Reference: ${reference}; Value: R ${input.estimatedValue.toLocaleString('en-ZA')}; Originating lead: ${lead.reference}; Campaign: ${lead.campaignId ?? '—'}`);
    pushNotification({
      type: 'Assignment', title: `Opportunity created: ${reference}`,
      body: `${input.name} was created from lead ${lead.reference} and assigned to you.`,
      recipientId: input.ownerId, severity: 'success',
      relatedType: 'Opportunity', relatedId: id, channel: 'In-App',
    });
    return delay(opportunity);
  },

  /* ---------------------------------------------------------------- */
  /* Opportunities                                                     */
  /* ---------------------------------------------------------------- */

  async createOpportunity(input: Partial<Opportunity>): Promise<Opportunity> {
    const s = state();
    const { reference } = nextRef('OPP', s.opportunities);
    const id = `OPP-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const opportunity: Opportunity = {
      id, reference,
      name: input.name ?? '',
      customerId: input.customerId ?? '',
      ownerId: input.ownerId ?? s.session.userId,
      estimatedValue: input.estimatedValue ?? 0,
      expectedCloseDate: input.expectedCloseDate ?? new Date().toISOString().slice(0, 10),
      stage: 'Qualification',
      products: input.products ?? [],
      campaignId: input.campaignId ?? null,
      originatingLeadId: null,
      probability: 20, forecastCategory: 'Pipeline',
      createdDate: new Date().toISOString(),
      closedDate: null, closedLostReason: null, closedLostDetail: '',
      businessUnit: 'Business Development Unit',
      underwritingStatus: 'Not Handed Over',
      underwritingUnit: null, underwritingOwnerId: null, handoverDate: null,
      stageHistory: [{ stage: 'Qualification', enteredAt: new Date().toISOString(), exitedAt: null, days: 0 }],
      documentIds: [],
      timeline: [timelineEvent('Created', 'Opportunity created', 'Opportunity created directly against an existing account relationship.')],
    };
    patch((d) => { d.opportunities = [opportunity, ...d.opportunities]; });
    writeAudit('Opportunity created', 'Opportunity', reference, '—',
      `Reference: ${reference}; Value: R ${opportunity.estimatedValue.toLocaleString('en-ZA')}`);
    return delay(opportunity);
  },

  async updateOpportunity(id: string, changes: Partial<Opportunity>, note?: string): Promise<Opportunity> {
    const before = state().opportunities.find((o) => o.id === id);
    let updated!: Opportunity;
    patch((d) => {
      d.opportunities = d.opportunities.map((o) => {
        if (o.id !== id) return o;
        updated = { ...o, ...changes };
        if (note) updated.timeline = [...updated.timeline, timelineEvent('Update', 'Opportunity updated', note)];
        return updated;
      });
    });
    writeAudit('Opportunity updated', 'Opportunity', before?.reference ?? id,
      Object.keys(changes).join(', '),
      Object.entries(changes).map(([k, v]) => `${k}: ${typeof v === 'object' ? '[updated]' : String(v)}`).join('; ').slice(0, 300));
    return delay(updated);
  },

  async moveOpportunityStage(
    id: string, stage: OpportunityStage,
    lost?: { reason: Opportunity['closedLostReason']; detail: string },
  ): Promise<Opportunity> {
    const before = state().opportunities.find((o) => o.id === id);
    const PROB: Record<OpportunityStage, number> = {
      Qualification: 20, 'Proposal / Solution': 45, Negotiation: 70, 'Closed Won': 100, 'Closed Lost': 0,
    };
    const now = new Date().toISOString();
    let updated!: Opportunity;
    patch((d) => {
      d.opportunities = d.opportunities.map((o) => {
        if (o.id !== id) return o;
        const history = o.stageHistory.map((h, i) =>
          i === o.stageHistory.length - 1 && !h.exitedAt
            ? { ...h, exitedAt: now, days: Math.max(1, Math.round((Date.now() - new Date(h.enteredAt).getTime()) / 86400000)) }
            : h);
        history.push({ stage, enteredAt: now, exitedAt: null, days: 0 });
        const closed = stage === 'Closed Won' || stage === 'Closed Lost';
        updated = {
          ...o, stage, probability: PROB[stage],
          forecastCategory: closed ? 'Closed' : stage === 'Negotiation' ? 'Commit' : stage === 'Proposal / Solution' ? 'Best Case' : 'Pipeline',
          closedDate: closed ? now : null,
          closedLostReason: stage === 'Closed Lost' ? (lost?.reason ?? null) : null,
          closedLostDetail: stage === 'Closed Lost' ? (lost?.detail ?? '') : '',
          stageHistory: history,
          timeline: [...o.timeline, timelineEvent(
            stage === 'Closed Won' ? 'Closed Won' : stage === 'Closed Lost' ? 'Closed Lost' : 'Stage Change',
            stage === 'Closed Lost' ? `Opportunity closed lost - ${lost?.reason}` : `Stage advanced to ${stage}`,
            stage === 'Closed Lost'
              ? `${lost?.detail} The record is now read-only for standard users.`
              : `Previous stage "${o.stage}" completed. Weighted forecast recalculated at ${PROB[stage]}% probability.`)],
        };
        return updated;
      });
    });
    writeAudit(
      stage === 'Closed Won' ? 'Opportunity closed won' : stage === 'Closed Lost' ? 'Opportunity closed lost' : 'Opportunity stage changed',
      'Opportunity', before?.reference ?? id,
      `Stage: ${before?.stage}`,
      `Stage: ${stage}${lost?.reason ? `; Reason: ${lost.reason}` : ''}`);
    return delay(updated);
  },

  async handoverToUnderwriting(
    id: string, unit: 'STI' | 'Medium/Long-Term Insurance', underwriterId: string,
  ): Promise<Opportunity> {
    const before = state().opportunities.find((o) => o.id === id);
    let updated!: Opportunity;
    patch((d) => {
      d.opportunities = d.opportunities.map((o) => {
        if (o.id !== id) return o;
        updated = {
          ...o, underwritingStatus: 'In Underwriting Queue', underwritingUnit: unit,
          underwritingOwnerId: underwriterId, handoverDate: new Date().toISOString(),
          timeline: [...o.timeline, timelineEvent('Handover', `Handed over to ${unit} underwriting`,
            `Work-in-progress record transferred to ${d.users.find((u) => u.id === underwriterId)?.name} in the ${unit} queue. The Business Development Unit retains full lifecycle visibility after handover.`)],
        };
        return updated;
      });
    });
    writeAudit('Handover to underwriting', 'Opportunity', before?.reference ?? id,
      `Underwriting status: ${before?.underwritingStatus}`, `Underwriting status: In Underwriting Queue; Unit: ${unit}`);
    pushNotification({
      type: 'Assignment', title: `Underwriting handover: ${before?.reference}`,
      body: `${before?.name} has been handed over to the ${unit} underwriting queue and assigned to you.`,
      recipientId: underwriterId, severity: 'info',
      relatedType: 'Opportunity', relatedId: id, channel: 'In-App',
    });
    return delay(updated);
  },

  async setUnderwritingStatus(id: string, status: UnderwritingStatus, note: string): Promise<Opportunity> {
    const before = state().opportunities.find((o) => o.id === id);
    let updated!: Opportunity;
    patch((d) => {
      d.opportunities = d.opportunities.map((o) => {
        if (o.id !== id) return o;
        updated = {
          ...o, underwritingStatus: status,
          timeline: [...o.timeline, timelineEvent('Underwriting', `Underwriting status: ${status}`, note)],
        };
        return updated;
      });
    });
    writeAudit('Underwriting status updated', 'Opportunity', before?.reference ?? id,
      `Underwriting status: ${before?.underwritingStatus}`, `Underwriting status: ${status}`);
    if (before?.ownerId) {
      pushNotification({
        type: 'System Alert', title: `Underwriting update: ${before.reference}`,
        body: `The underwriting status of ${before.name} changed to ${status}. ${note}`,
        recipientId: before.ownerId, severity: status === 'Declined' ? 'error' : 'info',
        relatedType: 'Opportunity', relatedId: id, channel: 'In-App',
      });
    }
    return delay(updated);
  },

  async logActivity(a: Omit<Activity, 'id'>): Promise<Activity> {
    const activity: Activity = { id: `ACT-LIVE-${Date.now().toString(36).toUpperCase()}`, ...a };
    patch((d) => { d.activities = [activity, ...d.activities]; });
    writeAudit('Activity logged', a.relatedType, a.relatedId, '—', `${a.type}: ${a.subject}; Status: ${a.status}`);
    return delay(activity);
  },

  /* ---------------------------------------------------------------- */
  /* Applications                                                      */
  /* ---------------------------------------------------------------- */

  async createApplication(input: Partial<Application>): Promise<Application> {
    const s = state();
    const { reference } = nextRef('APP', s.applications);
    const id = `APP-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const application: Application = {
      id, reference,
      formType: input.formType ?? '',
      customerId: input.customerId ?? '',
      opportunityId: input.opportunityId ?? null,
      ownerId: input.ownerId ?? s.session.userId,
      status: 'Draft',
      createdDate: new Date().toISOString(),
      submittedDate: null, decisionDate: null,
      values: input.values ?? {},
      signature: {
        signed: false, signerName: '', signerEmail: '', signedAt: null,
        method: 'DEMO / SIMULATED advanced electronic signature',
        ipAddress: '', device: '', consent: false, certificateRef: '',
      },
      locked: false, reviewerId: null, approverId: null, rejectionReason: null,
      documentIds: [],
      timeline: [timelineEvent('Created', 'Application draft created',
        `Digital application form "${input.formType}" opened against the customer${input.opportunityId ? ' and linked opportunity' : ''}. Draft auto-saved to the CRM.`)],
    };
    patch((d) => { d.applications = [application, ...d.applications]; });
    writeAudit('Application draft created', 'Application', reference, '—',
      `Reference: ${reference}; Form: ${application.formType}; Status: Draft`);
    return delay(application);
  },

  async updateApplication(id: string, values: Record<string, string | number | boolean>): Promise<Application> {
    let updated!: Application;
    patch((d) => {
      d.applications = d.applications.map((a) => {
        if (a.id !== id) return a;
        updated = { ...a, values: { ...a.values, ...values } };
        return updated;
      });
    });
    return delay(updated, 60);
  },

  async signApplication(id: string, signerName: string, signerEmail: string): Promise<Application> {
    const before = state().applications.find((a) => a.id === id);
    const now = new Date().toISOString();
    let updated!: Application;
    patch((d) => {
      d.applications = d.applications.map((a) => {
        if (a.id !== id) return a;
        updated = {
          ...a, locked: true,
          signature: {
            signed: true, signerName, signerEmail, signedAt: now,
            method: 'DEMO / SIMULATED advanced electronic signature',
            ipAddress: '10.24.11.87',
            device: navigator.userAgent.includes('Mac') ? 'Safari 19 on macOS 16' : 'Chrome 141 on Windows 11',
            consent: true,
            certificateRef: `DEMO-CERT-${a.reference}-${Date.now().toString(16).toUpperCase().slice(-6)}`,
          },
          timeline: [...a.timeline, timelineEvent('Signature', 'Application digitally signed',
            `DEMO / SIMULATED digital signature applied by ${signerName}. Signer identity, consent, timestamp and device fingerprint recorded; the document is now locked against further amendment.`)],
        };
        return updated;
      });
      d.documents = d.documents.map((doc) =>
        doc.applicationId === id && doc.docType === 'Signed Application'
          ? { ...doc, status: 'Signed' as const } : doc);
    });
    writeAudit('Document digitally signed', 'Application', before?.reference ?? id,
      'Signed: false', `Signed: true; Signer: ${signerName}; Locked: true; Certificate: ${updated.signature.certificateRef}`);
    return delay(updated);
  },

  async submitApplication(id: string): Promise<Application> {
    const before = state().applications.find((a) => a.id === id);
    const now = new Date().toISOString();
    let updated!: Application;
    patch((d) => {
      d.applications = d.applications.map((a) => {
        if (a.id !== id) return a;
        updated = {
          ...a, status: 'Submitted', submittedDate: now,
          reviewerId: a.formType.includes('Short-Term') ? 'USR-010' : 'USR-011',
          timeline: [...a.timeline, timelineEvent('Submitted', 'Application submitted',
            'Mandatory field validation passed and the application was submitted to Underwriting. Acknowledgement notification issued to the customer.')],
        };
        return updated;
      });
    });
    writeAudit('Application submitted', 'Application', before?.reference ?? id, 'Status: Draft', 'Status: Submitted');
    pushNotification({
      type: 'Approval Request', title: `Application submitted: ${before?.reference}`,
      body: `${before?.formType} has been submitted and requires underwriting review.`,
      recipientId: updated.reviewerId, severity: 'warning',
      relatedType: 'Application', relatedId: id, channel: 'In-App',
    });
    return delay(updated);
  },

  async decideApplication(id: string, approved: boolean, reason: string): Promise<Application> {
    const before = state().applications.find((a) => a.id === id);
    const u = actor();
    let updated!: Application;
    patch((d) => {
      d.applications = d.applications.map((a) => {
        if (a.id !== id) return a;
        updated = {
          ...a, status: approved ? 'Approved' : 'Rejected',
          decisionDate: new Date().toISOString(), approverId: u.id,
          rejectionReason: approved ? null : reason,
          timeline: [...a.timeline, timelineEvent(approved ? 'Approved' : 'Rejected',
            approved ? 'Application approved' : 'Application rejected',
            approved
              ? 'Cover approved by Underwriting. Policy documentation generation triggered and the customer notified.'
              : reason)],
        };
        return updated;
      });
    });
    writeAudit(approved ? 'Application approved' : 'Application rejected', 'Application',
      before?.reference ?? id, `Status: ${before?.status}`,
      `Status: ${approved ? 'Approved' : 'Rejected'}${approved ? '' : `; Reason: ${reason}`}`);
    pushNotification({
      type: 'Communication Sent', title: `Application ${approved ? 'approved' : 'rejected'}: ${before?.reference}`,
      body: approved ? 'Cover has been approved and the client notified.' : reason,
      recipientId: before?.ownerId ?? null, severity: approved ? 'success' : 'error',
      relatedType: 'Application', relatedId: id, channel: 'Email',
    });
    return delay(updated);
  },

  async setApplicationStatus(id: string, status: Application['status']): Promise<Application> {
    const before = state().applications.find((a) => a.id === id);
    let updated!: Application;
    patch((d) => {
      d.applications = d.applications.map((a) => {
        if (a.id !== id) return a;
        updated = {
          ...a, status,
          timeline: [...a.timeline, timelineEvent('Review', `Status changed to ${status}`,
            `Workflow status updated to ${status}.`)],
        };
        return updated;
      });
    });
    writeAudit('Application status changed', 'Application', before?.reference ?? id,
      `Status: ${before?.status}`, `Status: ${status}`);
    return delay(updated);
  },

  /* ---------------------------------------------------------------- */
  /* Documents                                                         */
  /* ---------------------------------------------------------------- */

  validateUpload(fileName: string, sizeKb: number): { ok: boolean; reason: string } {
    const cfg = state().configuration.security;
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const doubleExtension = /\.(pdf|docx|xlsx|png|jpg|csv)\.(exe|bat|js|scr|cmd)$/i.test(fileName);
    if (doubleExtension) {
      return { ok: false, reason: `Blocked: the file uses a disguised double extension (.${ext}). This pattern is characteristic of malware and is rejected before storage.` };
    }
    if (!cfg.allowedFileTypes.includes(ext)) {
      return { ok: false, reason: `Blocked: ".${ext}" is not a permitted file type. Permitted types are configured as: ${cfg.allowedFileTypes.join(', ')}.` };
    }
    if (sizeKb > cfg.maxFileSizeMb * 1024) {
      return { ok: false, reason: `Blocked: the file exceeds the configured maximum size of ${cfg.maxFileSizeMb} MB.` };
    }
    return { ok: true, reason: '' };
  },

  async uploadDocument(input: Partial<CrmDocument> & { name: string }): Promise<CrmDocument> {
    const s = state();
    const id = `DOC-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const blocked = input.status === 'Blocked';
    const doc: CrmDocument = {
      id,
      name: input.name,
      docType: input.docType ?? 'Supporting Document',
      classification: input.classification ?? 'Internal',
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      opportunityId: input.opportunityId ?? null,
      applicationId: input.applicationId ?? null,
      complaintId: input.complaintId ?? null,
      campaignId: input.campaignId ?? null,
      uploadedById: s.session.userId,
      uploadedAt: new Date().toISOString(),
      version: 'v1.0',
      status: blocked ? 'Blocked' : 'Saved',
      sizeKb: input.sizeKb ?? 512,
      mimeType: input.mimeType ?? 'application/pdf',
      scanResult: blocked ? 'Threat Detected' : 'Clean',
      transactionRef: input.transactionRef ?? '',
      versions: [{
        version: 'v1.0', uploadedById: s.session.userId,
        uploadedAt: new Date().toISOString(),
        note: blocked ? 'Upload rejected by security scan' : 'Initial upload',
        sizeKb: input.sizeKb ?? 512,
      }],
      retentionUntil: new Date(Date.now() + 2555 * 86400000).toISOString().slice(0, 10),
    };
    patch((d) => {
      d.documents = [doc, ...d.documents];
      if (!blocked) {
        if (doc.complaintId) d.complaints = d.complaints.map((c) => c.id === doc.complaintId ? { ...c, documentIds: [...c.documentIds, id] } : c);
        if (doc.leadId) d.leads = d.leads.map((l) => l.id === doc.leadId ? { ...l, documentIds: [...l.documentIds, id] } : l);
        if (doc.opportunityId) d.opportunities = d.opportunities.map((o) => o.id === doc.opportunityId ? { ...o, documentIds: [...o.documentIds, id] } : o);
        if (doc.applicationId) d.applications = d.applications.map((a) => a.id === doc.applicationId ? { ...a, documentIds: [...a.documentIds, id] } : a);
      }
    });
    writeAudit(blocked ? 'Document upload blocked by security scan' : 'Document uploaded',
      'Document', id, '—',
      `Name: ${doc.name}; Classification: ${doc.classification}; Scan: ${doc.scanResult}; Linked to: ${doc.transactionRef || '—'}`);
    if (blocked) {
      pushNotification({
        type: 'System Alert', title: 'Blocked file upload quarantined',
        body: `"${doc.name}" was blocked by the security scan and quarantined. The upload was not stored.`,
        recipientId: 'USR-015', severity: 'error',
        relatedType: 'Document', relatedId: id, channel: 'In-App',
      });
    }
    return delay(doc, 60);
  },

  /* ---------------------------------------------------------------- */
  /* Campaigns, events, CIM                                            */
  /* ---------------------------------------------------------------- */

  async createCampaign(input: Partial<Campaign>): Promise<Campaign> {
    const s = state();
    const num = s.campaigns.length + 1;
    const id = `CMP-LIVE-${Date.now().toString(36).toUpperCase()}`;
    const template = s.configuration.campaignTemplates.find((t) => t.id === input.templateId);
    const campaign: Campaign = {
      id, reference: `ECIC-CAM-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`,
      name: input.name ?? '', type: input.type ?? 'Digital',
      objective: input.objective ?? '', kpi: input.kpi ?? '',
      targetAudience: input.targetAudience ?? '', segmentation: input.segmentation ?? '',
      budget: input.budget ?? 0, actualSpend: 0,
      startDate: input.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: input.endDate ?? new Date().toISOString().slice(0, 10),
      expectedRevenue: input.expectedRevenue ?? 0,
      forecastRevenue: input.forecastRevenue ?? input.expectedRevenue ?? 0,
      actualRevenue: 0,
      status: 'Planned', ownerId: input.ownerId ?? s.session.userId,
      templateId: input.templateId ?? null, eventId: input.eventId ?? null,
      approvalStatus: template?.requiresApproval ? 'Pending Approval' : 'Draft',
      approverId: null, cimVersion: s.cimVersions.find((c) => c.current)?.version ?? 'v4.2',
      leadsGenerated: 0, qualifiedLeads: 0, opportunitiesCreated: 0,
      extraFields: input.extraFields ?? {},
    };
    patch((d) => { d.campaigns = [campaign, ...d.campaigns]; });
    writeAudit('Campaign created', 'Campaign', campaign.reference, '—',
      `Name: ${campaign.name}; Template: ${template?.name ?? 'none'}; Budget: R ${campaign.budget.toLocaleString('en-ZA')}; Approval: ${campaign.approvalStatus}`);
    if (campaign.approvalStatus === 'Pending Approval') {
      pushNotification({
        type: 'Approval Request', title: `Campaign approval required: ${campaign.reference}`,
        body: `${campaign.name} requires Marketing Communications Specialist sign-off before activation.`,
        recipientId: 'USR-009', severity: 'warning',
        relatedType: 'Campaign', relatedId: id, channel: 'In-App',
      });
    }
    return delay(campaign);
  },

  async approveCampaign(id: string, approved: boolean, comment: string): Promise<Campaign> {
    const u = actor();
    const before = state().campaigns.find((c) => c.id === id);
    let updated!: Campaign;
    patch((d) => {
      d.campaigns = d.campaigns.map((c) => {
        if (c.id !== id) return c;
        updated = {
          ...c, approvalStatus: approved ? 'Approved' : 'Rejected',
          approverId: u.id, status: approved ? 'Planned' : 'Cancelled',
        };
        return updated;
      });
    });
    writeAudit(approved ? 'Campaign approved' : 'Campaign rejected', 'Campaign',
      before?.reference ?? id, `Approval status: ${before?.approvalStatus}`,
      `Approval status: ${approved ? 'Approved' : 'Rejected'}; Approver: ${u.name}; Comment: ${comment}`);
    return delay(updated);
  },

  async advanceCimStep(versionId: string, stepIndex: number, approve: boolean, comment: string) {
    const u = actor();
    const before = state().cimVersions.find((c) => c.id === versionId);
    patch((d) => {
      d.cimVersions = d.cimVersions.map((c) => {
        if (c.id !== versionId) return c;
        const steps = c.approvalSteps.map((s, i) => {
          if (i === stepIndex) {
            return { ...s, status: (approve ? 'Approved' : 'Rejected') as typeof s.status, actorId: u.id, date: new Date().toISOString(), comment };
          }
          if (i === stepIndex + 1 && approve) return { ...s, status: 'In Progress' as typeof s.status };
          return s;
        });
        const allApproved = steps.every((s) => s.status === 'Approved');
        const nextStatus = !approve ? 'Draft'
          : allApproved ? 'Published'
            : stepIndex === 0 ? 'Marketing Review'
              : stepIndex === 1 ? 'Communications Review' : 'Approval';
        return {
          ...c, approvalSteps: steps, status: nextStatus as typeof c.status,
          current: allApproved ? true : c.current,
        };
      });
      const published = d.cimVersions.find((c) => c.id === versionId && c.status === 'Published');
      if (published) {
        d.cimVersions = d.cimVersions.map((c) =>
          c.id === versionId ? c
            : c.current ? { ...c, current: false, status: 'Obsolete' as const, restricted: true } : c);
      }
    });
    const step = before?.approvalSteps[stepIndex];
    writeAudit(`CIM ${step?.step.toLowerCase() ?? 'step'}`, 'Corporate Identity Manual',
      before?.version ?? versionId, `Status: ${before?.status}`,
      `Step: ${step?.step}; Result: ${approve ? 'Approved' : 'Rejected'}; Actor: ${u.name}; Comment: ${comment}`);
    pushNotification({
      type: 'Approval Request', title: `CIM ${before?.version} ${approve ? 'advanced' : 'returned to draft'}`,
      body: `${step?.step} was ${approve ? 'approved' : 'rejected'} by ${u.name}. ${comment}`,
      recipientId: 'USR-008', severity: approve ? 'success' : 'warning',
      relatedType: 'CIM', relatedId: versionId, channel: 'In-App',
    });
    return delay(state().cimVersions.find((c) => c.id === versionId) as never);
  },

  async submitMarketingAsset(asset: Omit<MarketingAsset, 'id'>): Promise<MarketingAsset> {
    const created: MarketingAsset = { id: `AST-LIVE-${Date.now().toString(36).toUpperCase()}`, ...asset };
    patch((d) => { d.marketingAssets = [created, ...d.marketingAssets]; });
    const failed = created.checks.filter((c) => !c.passed).length;
    writeAudit('Marketing asset submitted for CIM compliance', 'Marketing Asset', created.id, '—',
      `Name: ${created.name}; CIM: ${created.cimVersion}; Checks failed: ${failed}`);
    if (failed) {
      pushNotification({
        type: 'System Alert', title: `CIM compliance failure: ${created.name}`,
        body: `${failed} compliance check(s) failed against Corporate Identity Manual ${created.cimVersion}.`,
        recipientId: 'USR-009', severity: 'error',
        relatedType: 'Campaign', relatedId: created.campaignId, channel: 'In-App',
      });
    }
    return delay(created);
  },

  /* ---------------------------------------------------------------- */
  /* QR capture                                                        */
  /* ---------------------------------------------------------------- */

  async captureQrLead(input: {
    eventId: string; name: string; company: string; email: string; phone: string;
    sector: string; product: string; offline: boolean;
  }): Promise<{ lead: Lead | null; capture: OfflineCapture | null }> {
    const s = state();
    const event = s.events.find((e) => e.id === input.eventId);
    if (input.offline) {
      const capture: OfflineCapture = {
        id: `OFF-${Date.now().toString(36).toUpperCase()}`,
        eventId: input.eventId, name: input.name, company: input.company,
        email: input.email, phone: input.phone, sector: input.sector, product: input.product,
        capturedAt: new Date().toISOString(), status: 'Stored Offline', leadId: null,
      };
      patch((d) => { d.offlineCaptures = [capture, ...d.offlineCaptures]; });
      writeAudit('Lead captured offline', 'Lead', capture.id, '—',
        `Stored offline at event ${event?.name}; awaiting synchronisation`);
      return delay({ lead: null, capture }, 120);
    }
    const owner = s.users.find((u) => u.role === 'bdu_officer' && u.status === 'Active');
    const backup = s.users.filter((u) => u.role === 'bdu_officer' && u.id !== owner?.id)[0];
    const lead = await this.createLead({
      contactName: input.name, company: input.company, email: input.email, phone: input.phone,
      source: 'Exhibition / QR', sector: input.sector, productInterest: input.product,
      eventId: input.eventId, campaignId: event?.campaignId ?? null,
      ownerId: owner?.id ?? null, backupOwnerId: backup?.id ?? null,
      enquiryType: 'New cover enquiry', syncStatus: 'Synced',
      notes: `Captured by QR scan at ${event?.name}, ${event?.venue}.`,
    });
    return { lead, capture: null };
  },

  async syncOfflineCaptures(): Promise<Lead[]> {
    const pending = state().offlineCaptures.filter((c) => c.status === 'Stored Offline');
    const created: Lead[] = [];
    for (const c of pending) {
      const { lead } = await this.captureQrLead({ ...c, offline: false });
      if (lead) {
        created.push(lead);
        patch((d) => {
          d.offlineCaptures = d.offlineCaptures.map((o) =>
            o.id === c.id ? { ...o, status: 'Synced' as const, leadId: lead.id } : o);
        });
      }
    }
    if (created.length) {
      writeAudit('Offline captures synchronised', 'Lead', 'BATCH', `Pending: ${pending.length}`,
        `Synchronised: ${created.length}; References: ${created.map((l) => l.reference).join(', ')}`);
    }
    return delay(created);
  },

  /* ---------------------------------------------------------------- */
  /* Tasks and notifications                                           */
  /* ---------------------------------------------------------------- */

  async completeTask(id: string): Promise<void> {
    const t = state().tasks.find((x) => x.id === id);
    patch((d) => { d.tasks = d.tasks.map((x) => x.id === id ? { ...x, status: 'Completed' } : x); });
    writeAudit('Task completed', 'Task', id, 'Status: Open', `Status: Completed; Title: ${t?.title}`);
    return delay(undefined, 60);
  },

  async reassignTask(id: string, ownerId: string): Promise<void> {
    const t = state().tasks.find((x) => x.id === id);
    patch((d) => { d.tasks = d.tasks.map((x) => x.id === id ? { ...x, ownerId } : x); });
    writeAudit('Task reassigned', 'Task', id, `Owner: ${t?.ownerId}`, `Owner: ${ownerId}`);
    pushNotification({
      type: 'Assignment', title: 'Task reassigned to you',
      body: t?.title ?? '', recipientId: ownerId, severity: 'info',
      relatedType: t?.relatedType ?? null, relatedId: t?.relatedId ?? null, channel: 'In-App',
    });
    return delay(undefined, 60);
  },

  async snoozeTask(id: string, days: number): Promise<void> {
    patch((d) => {
      d.tasks = d.tasks.map((x) => x.id === id
        ? { ...x, status: 'Snoozed' as const, dueDate: iso(days, 12) } : x);
    });
    writeAudit('Task snoozed', 'Task', id, 'Status: Open', `Status: Snoozed; New due date: ${iso(days, 12).slice(0, 10)}`);
    return delay(undefined, 60);
  },

  markNotificationRead(id: string) {
    patch((d) => { d.notifications = d.notifications.map((n) => n.id === id ? { ...n, read: true } : n); });
  },

  markAllNotificationsRead() {
    patch((d) => { d.notifications = d.notifications.map((n) => ({ ...n, read: true })); });
  },

  /* ---------------------------------------------------------------- */
  /* Chat                                                              */
  /* ---------------------------------------------------------------- */

  saveChatSession(session: ChatSession) {
    patch((d) => {
      const exists = d.chatSessions.some((c) => c.id === session.id);
      d.chatSessions = exists
        ? d.chatSessions.map((c) => c.id === session.id ? session : c)
        : [session, ...d.chatSessions];
    });
  },

  async createCaseFromChat(session: ChatSession, customerId: string, subject: string, description: string): Promise<Complaint> {
    const complaint = await this.createComplaint({
      subject, description, customerId, channel: 'Chat',
      category: 'Service Delivery', subCategory: 'Delayed response',
      severity: 'High', businessUnit: 'Client Services',
      assignedTeam: 'Complaints Team A', assignedToId: session.agentId ?? 'USR-001',
      preferredChannel: 'Email',
    });
    this.saveChatSession({ ...session, createdCaseId: complaint.id });
    return complaint;
  },

  /* ---------------------------------------------------------------- */
  /* Configuration and reports                                         */
  /* ---------------------------------------------------------------- */

  updateConfiguration(fn: (config: CrmState['configuration']) => void, description: string) {
    const before = JSON.stringify(state().configuration).length;
    patch((d) => {
      const next = JSON.parse(JSON.stringify(d.configuration)) as CrmState['configuration'];
      fn(next);
      d.configuration = next;
    });
    writeAudit('Configuration changed', 'Configuration', 'CRM Configuration',
      `Configuration size: ${before} bytes`, description);
  },

  saveReport(report: Omit<SavedReport, 'id' | 'createdAt' | 'createdBy'>): SavedReport {
    const saved: SavedReport = {
      id: `RPT-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      createdBy: actor().name,
      ...report,
    };
    patch((d) => { d.savedReports = [saved, ...d.savedReports]; });
    writeAudit('Report configuration saved', 'Report', saved.id, '—',
      `Name: ${saved.name}; Dataset: ${saved.dataset}; Fields: ${saved.fields.length}; Grouping: ${saved.groupBy || 'none'}`);
    return saved;
  },

  deleteReport(id: string) {
    patch((d) => { d.savedReports = d.savedReports.filter((r) => r.id !== id); });
    writeAudit('Report configuration deleted', 'Report', id, 'Existing configuration', 'Deleted');
  },

  async runIntegrationSync(id: string): Promise<void> {
    const before = state().integrations.find((i) => i.id === id);
    const added = Math.round(Math.random() * 60) + 5;
    patch((d) => {
      d.integrations = d.integrations.map((i) => i.id === id ? {
        ...i, lastSync: new Date().toISOString(),
        recordsSynced: i.recordsSynced + added,
        status: i.status === 'Not Configured' ? 'Not Configured' : 'Connected',
      } : i);
    });
    writeAudit('Integration synchronisation executed', 'Integration', before?.name ?? id,
      `Records synchronised: ${before?.recordsSynced}`,
      `Records synchronised: ${(before?.recordsSynced ?? 0) + added}; Batch: ${added}; Errors: 0`);
    return delay(undefined, 900);
  },
};

export type MockApi = typeof api;
