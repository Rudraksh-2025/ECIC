import type { CrmState } from '../../store';
import { campaignPerformance, eventPerformance, slaForComplaint } from '../../utils/analytics';
import { leadSla } from '../../hooks';
import { fmtDate } from '../../utils/dates';

export type Row = Record<string, string | number>;

/** Flattens each dataset into report-ready rows using the field ids in the catalogue. */
export function buildRows(store: CrmState, dataset: string): Row[] {
  const userName = (id: string | null | undefined) => store.users.find((u) => u.id === id)?.name ?? '—';
  const customerName = (id: string | null | undefined) => store.customers.find((c) => c.id === id)?.organisation ?? '—';
  const campaignName = (id: string | null | undefined) => store.campaigns.find((c) => c.id === id)?.name ?? '—';

  switch (dataset) {
    case 'complaints':
      return store.complaints.map((c) => {
        const sla = slaForComplaint(c, store.configuration.slaRules);
        return {
          id: c.id, reference: c.reference, subject: c.subject, customer: customerName(c.customerId),
          status: c.status, severity: c.severity, priority: c.priority, channel: c.channel,
          category: c.category, subCategory: c.subCategory, businessUnit: c.businessUnit,
          assignedTo: userName(c.assignedToId), assignedTeam: c.assignedTeam,
          loggedDate: fmtDate(c.loggedDate), dueDate: fmtDate(c.dueDate),
          slaRisk: sla.risk, slaConsumed: Math.round(sla.consumed),
          slaTargetDays: c.slaTargetDays, slaElapsedDays: sla.elapsedDays,
          escalated: c.escalated ? 'Yes' : 'No',
          customerFeedback: c.customerFeedback ?? '—',
          closedDate: c.closedDate ? fmtDate(c.closedDate) : '—',
        };
      });

    case 'leads':
      return store.leads.map((l) => {
        const sla = leadSla(l);
        return {
          id: l.id, reference: l.reference, company: l.company, contactName: l.contactName,
          source: l.source, status: l.status, sector: l.sector, productInterest: l.productInterest,
          country: l.country, owner: userName(l.ownerId), backupOwner: userName(l.backupOwnerId),
          qualificationScore: l.qualificationScore, estimatedValue: l.estimatedValue,
          campaign: campaignName(l.campaignId), createdDate: fmtDate(l.createdDate),
          slaRisk: sla.risk, analysisDecision: l.desktopAnalysis.decision ?? 'Not completed',
          riskRating: l.desktopAnalysis.riskRating ?? '—',
          converted: l.convertedOpportunityId ? 'Yes' : 'No',
        };
      });

    case 'opportunities':
      return store.opportunities.map((o) => {
        const current = o.stageHistory[o.stageHistory.length - 1];
        const days = current && !current.exitedAt
          ? Math.max(1, Math.round((Date.now() - new Date(current.enteredAt).getTime()) / 86400000)) : 0;
        return {
          id: o.id, reference: o.reference, name: o.name, customer: customerName(o.customerId),
          stage: o.stage, estimatedValue: o.estimatedValue,
          weighted: Math.round(o.estimatedValue * o.probability / 100),
          probability: o.probability, forecastCategory: o.forecastCategory,
          owner: userName(o.ownerId), campaign: campaignName(o.campaignId),
          products: o.products.map((p) => p.product).join(' | '),
          expectedCloseDate: fmtDate(o.expectedCloseDate),
          closedLostReason: o.closedLostReason ?? '—',
          underwritingStatus: o.underwritingStatus ?? '—',
          underwritingUnit: o.underwritingUnit ?? '—',
          currentStageDays: days,
          originatingLead: store.leads.find((l) => l.id === o.originatingLeadId)?.reference ?? '—',
        };
      });

    case 'campaigns':
      return campaignPerformance(store.campaigns, store.leads, store.opportunities).map((p) => ({
        id: p.campaign.id, reference: p.campaign.reference, name: p.campaign.name,
        type: p.campaign.type, status: p.campaign.status,
        budget: p.campaign.budget, actualSpend: Math.round(p.spend),
        leads: p.leads, qualified: p.qualified, opportunities: p.opportunities,
        revenue: Math.round(p.revenue), roi: Math.round(p.roi),
        conversion: Math.round(p.conversion), recommendation: p.recommendation,
        owner: userName(p.campaign.ownerId),
      }));

    case 'events':
      return eventPerformance(store.events, store.leads, store.opportunities).map((p) => ({
        id: p.event.id, reference: p.event.reference, name: p.event.name,
        city: p.event.city, country: p.event.country, status: p.event.status,
        organizer: store.organizers.find((o) => o.id === p.event.organizerId)?.organisation ?? '—',
        budget: p.event.budget, spend: Math.round(p.spend),
        leads: p.leads, expectedLeads: p.event.expectedLeads,
        revenue: Math.round(p.revenue), roi: Math.round(p.roi),
        conversion: Math.round(p.conversion), recommendation: p.recommendation,
      }));

    case 'customers':
      return store.customers.map((c) => ({
        id: c.id, organisation: c.organisation, customerType: c.customerType,
        sector: c.sector, country: c.country, status: c.status,
        accountOwner: userName(c.accountOwnerId), annualExportValue: c.annualExportValue,
        leads: store.leads.filter((l) => l.customerId === c.id).length,
        opportunities: store.opportunities.filter((o) => o.customerId === c.id).length,
        complaints: store.complaints.filter((x) => x.customerId === c.id).length,
        applications: store.applications.filter((a) => a.customerId === c.id).length,
      }));

    case 'activities':
      return store.activities.map((a) => ({
        id: a.id, type: a.type, subject: a.subject, owner: userName(a.ownerId),
        date: fmtDate(a.date), status: a.status, relatedType: a.relatedType, relatedId: a.relatedId,
      }));

    case 'applications':
      return store.applications.map((a) => ({
        id: a.id, reference: a.reference, formType: a.formType,
        customer: customerName(a.customerId), status: a.status,
        owner: userName(a.ownerId), reviewer: userName(a.reviewerId),
        signed: a.signature.signed ? 'Yes' : 'No',
        createdDate: fmtDate(a.createdDate),
        submittedDate: a.submittedDate ? fmtDate(a.submittedDate) : '—',
        decisionDate: a.decisionDate ? fmtDate(a.decisionDate) : '—',
      }));

    case 'documents':
      return store.documents.map((d) => ({
        id: d.id, name: d.name, docType: d.docType, classification: d.classification,
        customer: customerName(d.customerId), transactionRef: d.transactionRef || '—',
        status: d.status, scanResult: d.scanResult, version: d.version,
        uploadedAt: fmtDate(d.uploadedAt), retentionUntil: fmtDate(d.retentionUntil),
      }));

    case 'audit':
      return store.auditEvents.map((a) => ({
        id: a.id, at: new Date(a.at).toLocaleString('en-ZA'), userName: a.userName, role: a.role,
        action: a.action, entity: a.entity, entityId: a.entityId,
        beforeValue: a.beforeValue, afterValue: a.afterValue,
        ipAddress: a.ipAddress, device: a.device,
      }));

    default:
      return [];
  }
}

export const NUMERIC_FIELDS = new Set([
  'estimatedValue', 'weighted', 'probability', 'qualificationScore', 'budget', 'actualSpend',
  'spend', 'leads', 'qualified', 'opportunities', 'revenue', 'roi', 'conversion',
  'annualExportValue', 'complaints', 'applications', 'slaConsumed', 'slaTargetDays',
  'slaElapsedDays', 'currentStageDays', 'expectedLeads',
]);

export const CURRENCY_FIELDS = new Set([
  'estimatedValue', 'weighted', 'budget', 'actualSpend', 'spend', 'revenue', 'annualExportValue',
]);
