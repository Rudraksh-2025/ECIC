export interface ReportDef {
  id: string;
  name: string;
  category: string;
  description: string;
  dataset: 'complaints' | 'leads' | 'opportunities' | 'campaigns' | 'events' | 'customers' | 'activities' | 'audit' | 'applications' | 'documents';
  defaultGroupBy: string;
  chart: 'bar' | 'line' | 'pie' | 'stacked' | 'none';
  featured?: boolean;
}

export const REPORT_CATALOGUE: ReportDef[] = [
  { id: 'RPT-C1', name: 'Complaint SLA Performance', category: 'Complaint reports', dataset: 'complaints', defaultGroupBy: 'severity', chart: 'bar', featured: true,
    description: 'SLA target, actual turnaround, compliance rate and breaches by severity, business unit and owner.' },
  { id: 'RPT-C2', name: 'Complaint Volume & Channel', category: 'Complaint reports', dataset: 'complaints', defaultGroupBy: 'channel', chart: 'pie', featured: true,
    description: 'Complaint volume across all seven capture channels, by month and business unit.' },
  { id: 'RPT-C3', name: 'Complaints by Category', category: 'Complaint reports', dataset: 'complaints', defaultGroupBy: 'category', chart: 'bar',
    description: 'Where complaints concentrate by category and sub-category, with severity mix.' },
  { id: 'RPT-C4', name: 'Escalation & Dissatisfaction Analysis', category: 'Complaint reports', dataset: 'complaints', defaultGroupBy: 'businessUnit', chart: 'bar',
    description: 'Escalated cases, escalation reasons, negative feedback and the business units they originate from.' },
  { id: 'RPT-L1', name: 'Lead Conversion', category: 'Lead reports', dataset: 'leads', defaultGroupBy: 'source', chart: 'bar', featured: true,
    description: 'Lead volume, qualification rate and conversion to opportunity by source, sector and owner.' },
  { id: 'RPT-L2', name: 'Lead SLA & First Contact', category: 'Lead reports', dataset: 'leads', defaultGroupBy: 'ownerId', chart: 'bar',
    description: 'First-contact SLA attainment and outstanding leads by owner and source.' },
  { id: 'RPT-L3', name: 'Desktop Analysis Outcomes', category: 'Lead reports', dataset: 'leads', defaultGroupBy: 'sector', chart: 'stacked',
    description: 'Proceed, refer and decline outcomes with risk ratings by sector and target market.' },
  { id: 'RPT-O1', name: 'Pipeline by Stage', category: 'Opportunity reports', dataset: 'opportunities', defaultGroupBy: 'stage', chart: 'bar', featured: true,
    description: 'Open pipeline value and count by stage, owner, campaign and expected close period.' },
  { id: 'RPT-O2', name: 'Revenue Forecast', category: 'Opportunity reports', dataset: 'opportunities', defaultGroupBy: 'forecastCategory', chart: 'line', featured: true,
    description: 'Best case, commit and weighted forecast by expected close month.' },
  { id: 'RPT-O3', name: 'Win / Loss Analysis', category: 'Opportunity reports', dataset: 'opportunities', defaultGroupBy: 'closedLostReason', chart: 'bar', featured: true,
    description: 'Win and loss ratios, loss reasons ranked by value, and average deal size by owner.' },
  { id: 'RPT-O4', name: 'Time in Stage', category: 'Opportunity reports', dataset: 'opportunities', defaultGroupBy: 'stage', chart: 'bar',
    description: 'Average and current time in each sales stage, highlighting stalled opportunities.' },
  { id: 'RPT-M1', name: 'Campaign ROI', category: 'Campaign reports', dataset: 'campaigns', defaultGroupBy: 'type', chart: 'bar', featured: true,
    description: 'Spend, leads, qualified leads, opportunities, revenue and ROI by campaign and campaign type.' },
  { id: 'RPT-M2', name: 'Event Conversion', category: 'Campaign reports', dataset: 'events', defaultGroupBy: 'country', chart: 'bar', featured: true,
    description: 'Leads captured against target, conversion rate and revenue by event, organiser and country.' },
  { id: 'RPT-S1', name: 'SLA Summary — All Entities', category: 'SLA reports', dataset: 'complaints', defaultGroupBy: 'status', chart: 'stacked',
    description: 'Consolidated SLA position across complaints and leads with at-risk and breached counts.' },
  { id: 'RPT-U1', name: 'Customer Portfolio', category: 'Customer reports', dataset: 'customers', defaultGroupBy: 'sector', chart: 'bar',
    description: 'Accounts by sector, country, type and status with annual export value and related record counts.' },
  { id: 'RPT-U2', name: 'Customer Engagement', category: 'Customer reports', dataset: 'customers', defaultGroupBy: 'accountOwnerId', chart: 'bar',
    description: 'Leads, opportunities, applications and cases per account, by account owner.' },
  { id: 'RPT-A1', name: 'Activity Report', category: 'Activity reports', dataset: 'activities', defaultGroupBy: 'type', chart: 'bar',
    description: 'Calls, meetings, emails, tasks and site visits by owner, type, status and related record.' },
  { id: 'RPT-AP1', name: 'Application Workflow', category: 'Activity reports', dataset: 'applications', defaultGroupBy: 'status', chart: 'bar',
    description: 'Applications by status, form type and underwriter, with signature and turnaround position.' },
  { id: 'RPT-D1', name: 'Document Register', category: 'Activity reports', dataset: 'documents', defaultGroupBy: 'classification', chart: 'pie',
    description: 'Documents by classification, type, status and scan result with retention dates.' },
  { id: 'RPT-AU1', name: 'Audit Report', category: 'Audit reports', dataset: 'audit', defaultGroupBy: 'entity', chart: 'bar', featured: true,
    description: 'Audit events by entity, action, user and role over a selected period.' },
];

export const REPORT_CATEGORIES = Array.from(new Set(REPORT_CATALOGUE.map((r) => r.category)));

/** Selectable fields per dataset for the no-code report builder. */
export const DATASET_FIELDS: Record<string, { id: string; label: string }[]> = {
  complaints: [
    { id: 'reference', label: 'Reference' }, { id: 'subject', label: 'Subject' },
    { id: 'customer', label: 'Customer' }, { id: 'status', label: 'Status' },
    { id: 'severity', label: 'Severity' }, { id: 'priority', label: 'Priority' },
    { id: 'channel', label: 'Channel' }, { id: 'category', label: 'Category' },
    { id: 'subCategory', label: 'Sub-category' }, { id: 'businessUnit', label: 'Business unit' },
    { id: 'assignedTo', label: 'Assigned to' }, { id: 'assignedTeam', label: 'Team' },
    { id: 'loggedDate', label: 'Date logged' }, { id: 'dueDate', label: 'SLA due date' },
    { id: 'slaRisk', label: 'SLA risk' }, { id: 'slaConsumed', label: 'SLA consumed %' },
    { id: 'escalated', label: 'Escalated' }, { id: 'customerFeedback', label: 'Customer feedback' },
    { id: 'closedDate', label: 'Closed date' },
  ],
  leads: [
    { id: 'reference', label: 'Reference' }, { id: 'company', label: 'Company' },
    { id: 'contactName', label: 'Contact' }, { id: 'source', label: 'Source' },
    { id: 'status', label: 'Status' }, { id: 'sector', label: 'Sector' },
    { id: 'productInterest', label: 'Product interest' }, { id: 'country', label: 'Target market' },
    { id: 'owner', label: 'Owner' }, { id: 'backupOwner', label: 'Backup owner' },
    { id: 'qualificationScore', label: 'Qualification score' },
    { id: 'estimatedValue', label: 'Estimated value' }, { id: 'campaign', label: 'Campaign' },
    { id: 'createdDate', label: 'Created' }, { id: 'slaRisk', label: 'SLA risk' },
    { id: 'analysisDecision', label: 'Analysis decision' },
  ],
  opportunities: [
    { id: 'reference', label: 'Reference' }, { id: 'name', label: 'Opportunity' },
    { id: 'customer', label: 'Customer' }, { id: 'stage', label: 'Stage' },
    { id: 'estimatedValue', label: 'Estimated value' }, { id: 'weighted', label: 'Weighted value' },
    { id: 'probability', label: 'Probability' }, { id: 'forecastCategory', label: 'Forecast category' },
    { id: 'owner', label: 'Owner' }, { id: 'campaign', label: 'Campaign' },
    { id: 'products', label: 'Products' }, { id: 'expectedCloseDate', label: 'Expected close' },
    { id: 'closedLostReason', label: 'Closed-lost reason' },
    { id: 'underwritingStatus', label: 'Underwriting status' },
    { id: 'currentStageDays', label: 'Days in stage' },
  ],
  campaigns: [
    { id: 'reference', label: 'Campaign ID' }, { id: 'name', label: 'Name' },
    { id: 'type', label: 'Type' }, { id: 'status', label: 'Status' },
    { id: 'budget', label: 'Budget' }, { id: 'actualSpend', label: 'Spend' },
    { id: 'leads', label: 'Leads' }, { id: 'qualified', label: 'Qualified leads' },
    { id: 'opportunities', label: 'Opportunities' }, { id: 'revenue', label: 'Revenue' },
    { id: 'roi', label: 'ROI %' }, { id: 'conversion', label: 'Conversion %' },
    { id: 'recommendation', label: 'Recommendation' },
  ],
  events: [
    { id: 'reference', label: 'Event ID' }, { id: 'name', label: 'Event' },
    { id: 'city', label: 'City' }, { id: 'country', label: 'Country' },
    { id: 'status', label: 'Status' }, { id: 'organizer', label: 'Organiser' },
    { id: 'budget', label: 'Budget' }, { id: 'spend', label: 'Spend' },
    { id: 'leads', label: 'Leads' }, { id: 'expectedLeads', label: 'Target leads' },
    { id: 'revenue', label: 'Revenue' }, { id: 'roi', label: 'ROI %' },
    { id: 'conversion', label: 'Conversion %' }, { id: 'recommendation', label: 'Recommendation' },
  ],
  customers: [
    { id: 'id', label: 'Customer ID' }, { id: 'organisation', label: 'Organisation' },
    { id: 'customerType', label: 'Type' }, { id: 'sector', label: 'Sector' },
    { id: 'country', label: 'Country' }, { id: 'status', label: 'Status' },
    { id: 'accountOwner', label: 'Account owner' },
    { id: 'annualExportValue', label: 'Annual export value' },
    { id: 'leads', label: 'Leads' }, { id: 'opportunities', label: 'Opportunities' },
    { id: 'complaints', label: 'Complaints' }, { id: 'applications', label: 'Applications' },
  ],
  activities: [
    { id: 'type', label: 'Type' }, { id: 'subject', label: 'Subject' },
    { id: 'owner', label: 'Owner' }, { id: 'date', label: 'Date' },
    { id: 'status', label: 'Status' }, { id: 'relatedType', label: 'Related to' },
    { id: 'relatedId', label: 'Related record' },
  ],
  applications: [
    { id: 'reference', label: 'Reference' }, { id: 'formType', label: 'Form type' },
    { id: 'customer', label: 'Customer' }, { id: 'status', label: 'Status' },
    { id: 'owner', label: 'Owner' }, { id: 'reviewer', label: 'Underwriter' },
    { id: 'signed', label: 'Signed' }, { id: 'createdDate', label: 'Created' },
    { id: 'submittedDate', label: 'Submitted' }, { id: 'decisionDate', label: 'Decision' },
  ],
  documents: [
    { id: 'id', label: 'Document ID' }, { id: 'name', label: 'Name' },
    { id: 'docType', label: 'Type' }, { id: 'classification', label: 'Classification' },
    { id: 'customer', label: 'Customer' }, { id: 'transactionRef', label: 'Transaction reference' },
    { id: 'status', label: 'Status' }, { id: 'scanResult', label: 'Scan result' },
    { id: 'version', label: 'Version' }, { id: 'uploadedAt', label: 'Upload date' },
    { id: 'retentionUntil', label: 'Retention until' },
  ],
  audit: [
    { id: 'at', label: 'Timestamp' }, { id: 'userName', label: 'User' },
    { id: 'role', label: 'Role' }, { id: 'action', label: 'Action' },
    { id: 'entity', label: 'Entity' }, { id: 'entityId', label: 'Entity ID' },
    { id: 'beforeValue', label: 'Before value' }, { id: 'afterValue', label: 'After value' },
    { id: 'ipAddress', label: 'IP address' }, { id: 'device', label: 'Device' },
  ],
};
