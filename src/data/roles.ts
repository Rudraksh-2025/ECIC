import type { Permission, Role, RoleId } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  'complaint.create', 'complaint.update', 'complaint.investigate', 'complaint.escalate',
  'complaint.approve', 'complaint.close',
  'lead.create', 'lead.update', 'lead.assign', 'lead.convert',
  'opportunity.create', 'opportunity.update', 'opportunity.close',
  'application.create', 'application.submit', 'application.approve', 'application.sign',
  'document.upload', 'document.delete',
  'campaign.create', 'campaign.approve', 'cim.review', 'cim.approve',
  'underwriting.update',
  'report.view', 'report.customise', 'audit.view',
  'config.manage', 'users.manage', 'security.manage', 'integration.manage',
  'pii.unmask', 'portal.self_service',
];

/** Module keys used by the navigation model. */
export const ALL_MODULES = [
  'dashboard', 'my-work', 'leads', 'opportunities', 'complaints', 'customers',
  'applications', 'documents', 'pipeline', 'campaigns', 'events', 'qr-capture',
  'campaign-performance', 'cim', 'reports', 'analytics', 'chat', 'faqs',
  'notifications', 'tasks', 'audit', 'users', 'security', 'configuration',
  'integrations', 'implementation', 'bid-demo', 'coverage',
];

export const ROLES: Record<RoleId, Role> = {
  complaints_specialist: {
    id: 'complaints_specialist',
    name: 'Complaints Specialist',
    description:
      'Front-line case handler. Logs, investigates and resolves complaints but cannot approve closure or administer the system.',
    segregationNote:
      'SoD: the specialist who investigates a complaint may not authorise its closure — closure sits with the Complaints Supervisor.',
    permissions: [
      'complaint.create', 'complaint.update', 'complaint.investigate', 'complaint.escalate',
      'document.upload', 'report.view',
    ],
    modules: [
      'dashboard', 'my-work', 'complaints', 'customers', 'documents', 'reports',
      'notifications', 'tasks', 'faqs', 'chat', 'bid-demo', 'coverage',
    ],
  },
  complaints_supervisor: {
    id: 'complaints_supervisor',
    name: 'Complaints Supervisor',
    description:
      'Reviews, approves, escalates and closes complaints. Oversees SLA performance across the complaints team.',
    segregationNote:
      'SoD: may approve and close cases they did not investigate; may not create or amend user accounts or system configuration.',
    permissions: [
      'complaint.create', 'complaint.update', 'complaint.investigate', 'complaint.escalate',
      'complaint.approve', 'complaint.close', 'document.upload', 'report.view',
      'report.customise', 'audit.view', 'pii.unmask',
    ],
    modules: [
      'dashboard', 'my-work', 'complaints', 'customers', 'documents', 'reports',
      'analytics', 'notifications', 'tasks', 'audit', 'faqs', 'chat', 'bid-demo', 'coverage',
    ],
  },
  bdu_officer: {
    id: 'bdu_officer',
    name: 'BDU Officer',
    description:
      'Business Development Unit officer. Captures and qualifies leads, performs desktop analysis and hands over to underwriting.',
    segregationNote:
      'SoD: performs qualification and handover but cannot make the underwriting decision.',
    permissions: [
      'lead.create', 'lead.update', 'lead.assign', 'lead.convert',
      'opportunity.create', 'opportunity.update',
      'application.create', 'application.submit',
      'document.upload', 'report.view', 'complaint.create',
    ],
    modules: [
      'dashboard', 'my-work', 'leads', 'opportunities', 'customers', 'applications',
      'documents', 'pipeline', 'qr-capture', 'events', 'reports', 'notifications',
      'tasks', 'complaints', 'faqs', 'bid-demo', 'coverage',
    ],
  },
  sales_user: {
    id: 'sales_user',
    name: 'Sales User',
    description: 'Manages opportunities, digital applications and the sales pipeline through to close.',
    segregationNote:
      'SoD: may progress opportunities but closed opportunities become read-only and application approval sits with underwriting.',
    permissions: [
      'lead.update', 'lead.convert', 'opportunity.create', 'opportunity.update', 'opportunity.close',
      'application.create', 'application.submit', 'application.sign',
      'document.upload', 'report.view', 'report.customise',
    ],
    modules: [
      'dashboard', 'my-work', 'leads', 'opportunities', 'customers', 'applications',
      'documents', 'pipeline', 'reports', 'analytics', 'notifications', 'tasks',
      'faqs', 'bid-demo', 'coverage',
    ],
  },
  marketing_user: {
    id: 'marketing_user',
    name: 'Marketing User',
    description:
      'Runs campaigns, exhibitions and QR lead capture. Submits marketing assets for Corporate Identity Manual compliance review.',
    segregationNote:
      'SoD: may create campaigns and assets but the Marketing Communications Specialist approval step is a separate role.',
    permissions: [
      'campaign.create', 'cim.review', 'lead.create', 'lead.update',
      'document.upload', 'report.view', 'report.customise',
    ],
    modules: [
      'dashboard', 'my-work', 'campaigns', 'events', 'qr-capture', 'campaign-performance',
      'cim', 'leads', 'customers', 'documents', 'reports', 'analytics',
      'notifications', 'tasks', 'faqs', 'bid-demo', 'coverage',
    ],
  },
  underwriting_user: {
    id: 'underwriting_user',
    name: 'Underwriting User',
    description:
      'Receives handovers from BDU, reviews applications and updates the underwriting status of the work-in-progress pipeline.',
    segregationNote:
      'SoD: makes the underwriting decision on work originated by others; has no ability to create or amend the originating lead.',
    permissions: [
      'underwriting.update', 'application.approve', 'opportunity.update',
      'document.upload', 'report.view', 'pii.unmask',
    ],
    modules: [
      'dashboard', 'my-work', 'pipeline', 'applications', 'opportunities', 'customers',
      'documents', 'reports', 'notifications', 'tasks', 'faqs', 'bid-demo', 'coverage',
    ],
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description:
      'Read-mostly oversight of dashboards, pipeline, campaign ROI and SLA performance across all business units.',
    segregationNote:
      'SoD: full visibility, no transactional edit rights — prevents management override of operational records.',
    permissions: ['report.view', 'report.customise', 'audit.view', 'pii.unmask'],
    modules: [
      'dashboard', 'analytics', 'reports', 'pipeline', 'campaign-performance',
      'opportunities', 'complaints', 'leads', 'customers', 'audit',
      'implementation', 'bid-demo', 'coverage', 'notifications',
    ],
  },
  system_administrator: {
    id: 'system_administrator',
    name: 'System Administrator',
    description:
      'Administers users, roles, configuration, integrations and security controls. No transactional case or deal rights.',
    segregationNote:
      'SoD: administers the platform but cannot close complaints, convert leads or approve deals — administration is separated from transaction processing.',
    permissions: [
      'config.manage', 'users.manage', 'security.manage', 'integration.manage',
      'audit.view', 'report.view', 'report.customise', 'document.upload', 'document.delete',
    ],
    modules: [
      'dashboard', 'users', 'security', 'configuration', 'integrations', 'audit',
      'documents', 'reports', 'analytics', 'notifications', 'implementation',
      'bid-demo', 'coverage', 'my-work',
    ],
  },
  portal_customer: {
    id: 'portal_customer',
    name: 'Customer (Portal User)',
    description:
      'External self-service user. Sees only their own profile, cases, leads and applications through the customer portal.',
    segregationNote:
      'SoD: record-level isolation — a portal user can never see another organisation’s data or any internal CRM screen.',
    permissions: ['portal.self_service', 'complaint.create', 'lead.create', 'document.upload'],
    modules: [],
  },
};

export const ROLE_LIST: Role[] = Object.values(ROLES);

export function hasPermission(role: RoleId, permission: Permission): boolean {
  return ROLES[role]?.permissions.includes(permission) ?? false;
}
