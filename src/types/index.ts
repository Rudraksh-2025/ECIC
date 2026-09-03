/**
 * ECIC CRM Platform - Domain model
 * Frontend-only bid demonstration system. All records are DEMO data.
 */

/* ------------------------------------------------------------------ */
/* Roles, users and permissions                                        */
/* ------------------------------------------------------------------ */

export type RoleId =
  | 'complaints_specialist'
  | 'complaints_supervisor'
  | 'bdu_officer'
  | 'sales_user'
  | 'marketing_user'
  | 'underwriting_user'
  | 'executive'
  | 'system_administrator'
  | 'portal_customer';

export type Permission =
  | 'complaint.create'
  | 'complaint.update'
  | 'complaint.investigate'
  | 'complaint.escalate'
  | 'complaint.approve'
  | 'complaint.close'
  | 'lead.create'
  | 'lead.update'
  | 'lead.assign'
  | 'lead.convert'
  | 'opportunity.create'
  | 'opportunity.update'
  | 'opportunity.close'
  | 'application.create'
  | 'application.submit'
  | 'application.approve'
  | 'application.sign'
  | 'document.upload'
  | 'document.delete'
  | 'campaign.create'
  | 'campaign.approve'
  | 'cim.review'
  | 'cim.approve'
  | 'underwriting.update'
  | 'report.view'
  | 'report.customise'
  | 'audit.view'
  | 'config.manage'
  | 'users.manage'
  | 'security.manage'
  | 'integration.manage'
  | 'pii.unmask'
  | 'portal.self_service';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  segregationNote: string;
  permissions: Permission[];
  /** Navigation module keys visible to this role */
  modules: string[];
}

export type UserStatus = 'Active' | 'Suspended' | 'Locked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  jobTitle: string;
  businessUnit: string;
  team: string;
  phone: string;
  status: UserStatus;
  mfaEnrolled: boolean;
  ssoLinked: boolean;
  lastLogin: string;
  avatarColor: string;
  initials: string;
}

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export type CustomerType = 'Exporter' | 'Financial Institution' | 'Broker' | 'Project Sponsor' | 'Internal';
export type CustomerStatus = 'Active' | 'Prospect' | 'Dormant' | 'Onboarding';
export type CommunicationChannel = 'Email' | 'Telephone' | 'SMS' | 'Portal' | 'Post';

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  primary: boolean;
}

export interface Customer {
  id: string;
  organisation: string;
  contactPerson: string;
  customerType: CustomerType;
  email: string;
  phone: string;
  country: string;
  sector: string;
  preferredChannel: CommunicationChannel;
  status: CustomerStatus;
  createdDate: string;
  accountOwnerId: string;
  registrationNo: string;
  annualExportValue: number;
  city: string;
  consentMarketing: boolean;
  consentDataProcessing: boolean;
  retentionUntil: string;
}

/* ------------------------------------------------------------------ */
/* Complaints / Case management                                        */
/* ------------------------------------------------------------------ */

export type ComplaintChannel =
  | 'Email'
  | 'Telephone'
  | 'Walk-in'
  | 'Internal Referral'
  | 'Online Portal'
  | 'Chat'
  | 'Social Media';

export type ComplaintStatus =
  | 'Logged'
  | 'Assigned'
  | 'In Progress'
  | 'Pending Information'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type SlaRisk = 'On Track' | 'At Risk' | 'Breached' | 'Met';
export type FeedbackRating = 'Very Satisfied' | 'Satisfied' | 'Neutral' | 'Dissatisfied' | 'Very Dissatisfied';

export interface TimelineEvent {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  type: string;
  title: string;
  detail: string;
}

export interface Complaint {
  id: string;
  reference: string;
  subject: string;
  customerId: string;
  customerKind: 'Internal' | 'External';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  loggedDate: string;
  loggedTime: string;
  businessUnit: string;
  category: string;
  subCategory: string;
  severity: Severity;
  priority: Priority;
  channel: ComplaintChannel;
  preferredChannel: CommunicationChannel;
  assignedTeam: string;
  assignedToId: string | null;
  status: ComplaintStatus;
  slaTargetDays: number;
  dueDate: string;
  resolvedDate: string | null;
  closedDate: string | null;
  closedById: string | null;
  escalated: boolean;
  escalationReason: string | null;
  escalatedToId: string | null;
  escalationDate: string | null;
  investigationFindings: string;
  outcome: string;
  resolutionDetail: string;
  correctiveAction: string;
  customerFeedback: FeedbackRating | null;
  feedbackComment: string;
  communicationSent: boolean;
  approvalRequired: boolean;
  approvedById: string | null;
  linkedOpportunityId: string | null;
  linkedApplicationId: string | null;
  documentIds: string[];
  timeline: TimelineEvent[];
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export type LeadSource =
  | 'Manual Capture'
  | 'Web Form'
  | 'Email'
  | 'API Integration'
  | 'Social Media'
  | 'Exhibition / QR'
  | 'Customer Portal'
  | 'Referral';

export type LeadStatus =
  | 'New'
  | 'Assigned'
  | 'Contacted'
  | 'Qualified'
  | 'Disqualified'
  | 'Converted'
  | 'Closed';

export type SyncStatus = 'Synced' | 'Stored Offline' | 'Pending Sync' | 'Sync Failed';

export interface DesktopAnalysis {
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
  /** keyed by configurable field id */
  values: Record<string, string | boolean>;
  decision: 'Proceed' | 'Decline' | 'Refer' | null;
  notes: string;
  riskRating: 'Low' | 'Moderate' | 'Elevated' | 'High' | null;
}

export interface Lead {
  id: string;
  reference: string;
  contactName: string;
  company: string;
  customerId: string | null;
  email: string;
  phone: string;
  source: LeadSource;
  enquiryType: string;
  sector: string;
  productInterest: string;
  campaignId: string | null;
  eventId: string | null;
  ownerId: string | null;
  backupOwnerId: string | null;
  status: LeadStatus;
  qualificationScore: number;
  estimatedValue: number;
  createdDate: string;
  slaDueDate: string;
  firstContactDate: string | null;
  disqualifiedReason: string | null;
  convertedOpportunityId: string | null;
  desktopAnalysis: DesktopAnalysis;
  syncStatus: SyncStatus;
  country: string;
  notes: string;
  documentIds: string[];
  timeline: TimelineEvent[];
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export type OpportunityStage =
  | 'Qualification'
  | 'Proposal / Solution'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export type ClosedLostReason =
  | 'Pricing'
  | 'Competitor'
  | 'Timing'
  | 'Customer decision'
  | 'Risk appetite'
  | 'Product mismatch'
  | 'Other';

export interface OpportunityProduct {
  id: string;
  product: string;
  cover: string;
  value: number;
  tenor: string;
}

export interface StageHistoryEntry {
  stage: OpportunityStage;
  enteredAt: string;
  exitedAt: string | null;
  days: number;
}

export type ActivityType = 'Call' | 'Meeting' | 'Email' | 'Task' | 'Site Visit';
export type ActivityStatus = 'Planned' | 'Completed' | 'Overdue' | 'Cancelled';

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  ownerId: string;
  date: string;
  status: ActivityStatus;
  notes: string;
  relatedType: 'Opportunity' | 'Lead' | 'Complaint' | 'Customer' | 'Campaign';
  relatedId: string;
}

export interface Opportunity {
  id: string;
  reference: string;
  name: string;
  customerId: string;
  ownerId: string;
  estimatedValue: number;
  expectedCloseDate: string;
  stage: OpportunityStage;
  products: OpportunityProduct[];
  campaignId: string | null;
  originatingLeadId: string | null;
  probability: number;
  forecastCategory: 'Pipeline' | 'Best Case' | 'Commit' | 'Closed';
  createdDate: string;
  closedDate: string | null;
  closedLostReason: ClosedLostReason | null;
  closedLostDetail: string;
  businessUnit: string;
  underwritingStatus: UnderwritingStatus | null;
  underwritingUnit: 'STI' | 'Medium/Long-Term Insurance' | null;
  underwritingOwnerId: string | null;
  handoverDate: string | null;
  stageHistory: StageHistoryEntry[];
  documentIds: string[];
  timeline: TimelineEvent[];
}

export type UnderwritingStatus =
  | 'Not Handed Over'
  | 'Awaiting Handover'
  | 'In Underwriting Queue'
  | 'Under Review'
  | 'Information Requested'
  | 'Approved'
  | 'Declined';

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Awaiting Approval'
  | 'Approved'
  | 'Rejected';

export interface SignatureRecord {
  signed: boolean;
  signerName: string;
  signerEmail: string;
  signedAt: string | null;
  method: string;
  ipAddress: string;
  device: string;
  consent: boolean;
  certificateRef: string;
}

export interface ApplicationField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  helper?: string;
  section: string;
}

export interface Application {
  id: string;
  reference: string;
  formType: string;
  customerId: string;
  opportunityId: string | null;
  ownerId: string;
  status: ApplicationStatus;
  createdDate: string;
  submittedDate: string | null;
  decisionDate: string | null;
  values: Record<string, string | number | boolean>;
  signature: SignatureRecord;
  locked: boolean;
  reviewerId: string | null;
  approverId: string | null;
  rejectionReason: string | null;
  documentIds: string[];
  timeline: TimelineEvent[];
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export type DocumentStatus = 'Scanning' | 'Safe' | 'Blocked' | 'Saved' | 'Signed' | 'Archived';
export type DocumentClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export interface DocumentVersion {
  version: string;
  uploadedById: string;
  uploadedAt: string;
  note: string;
  sizeKb: number;
}

export interface CrmDocument {
  id: string;
  name: string;
  docType: string;
  classification: DocumentClassification;
  customerId: string | null;
  leadId: string | null;
  opportunityId: string | null;
  applicationId: string | null;
  complaintId: string | null;
  campaignId: string | null;
  uploadedById: string;
  uploadedAt: string;
  version: string;
  status: DocumentStatus;
  sizeKb: number;
  mimeType: string;
  scanResult: 'Clean' | 'Threat Detected' | 'Pending';
  transactionRef: string;
  versions: DocumentVersion[];
  retentionUntil: string;
}

/* ------------------------------------------------------------------ */
/* Marketing, events, campaigns                                        */
/* ------------------------------------------------------------------ */

export type CampaignStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';
export type CampaignType = 'Exhibition' | 'Digital' | 'Product Launch' | 'Roadshow' | 'Webinar' | 'Trade Mission';

export interface CampaignTemplateField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  type: CampaignType;
  description: string;
  fields: CampaignTemplateField[];
  defaults: Record<string, string | number>;
  requiresApproval: boolean;
  cimVersionRequired: string;
}

export interface Campaign {
  id: string;
  reference: string;
  name: string;
  type: CampaignType;
  objective: string;
  kpi: string;
  targetAudience: string;
  segmentation: string;
  budget: number;
  actualSpend: number;
  startDate: string;
  endDate: string;
  expectedRevenue: number;
  forecastRevenue: number;
  actualRevenue: number;
  status: CampaignStatus;
  ownerId: string;
  templateId: string | null;
  eventId: string | null;
  approvalStatus: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  approverId: string | null;
  cimVersion: string;
  leadsGenerated: number;
  qualifiedLeads: number;
  opportunitiesCreated: number;
  extraFields: Record<string, string | number>;
}

export type EventStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';

export interface Organizer {
  id: string;
  name: string;
  organisation: string;
  email: string;
  phone: string;
  vendorClassification: 'Preferred' | 'Approved' | 'Provisional' | 'Under Review';
  previousEvents: number;
  averageRoi: number;
  performanceRating: number;
  notes: string;
}

export interface CrmEvent {
  id: string;
  reference: string;
  name: string;
  venue: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  productsPromoted: string[];
  campaignId: string | null;
  budget: number;
  actualSpend: number;
  expectedLeads: number;
  expectedRevenue: number;
  actualRevenue: number;
  organizerId: string;
  status: EventStatus;
  recurringSeries: string | null;
  qrCaptureEnabled: boolean;
}

/* ------------------------------------------------------------------ */
/* Corporate Identity Manual                                           */
/* ------------------------------------------------------------------ */

export type CimStatus = 'Draft' | 'Marketing Review' | 'Communications Review' | 'Approval' | 'Published' | 'Obsolete';

export interface CimApprovalStep {
  step: string;
  actorId: string | null;
  role: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected' | 'Not Started';
  date: string | null;
  comment: string;
}

export interface CimVersion {
  id: string;
  version: string;
  title: string;
  status: CimStatus;
  effectiveDate: string;
  ownerId: string;
  current: boolean;
  restricted: boolean;
  summary: string;
  approvalSteps: CimApprovalStep[];
  changeLog: string[];
}

export interface ComplianceCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MarketingAsset {
  id: string;
  name: string;
  campaignId: string;
  assetType: string;
  templateUsed: string;
  cimVersion: string;
  submittedById: string;
  submittedAt: string;
  status: 'Draft' | 'Submitted' | 'Compliance Review' | 'Approved' | 'Rejected';
  checks: ComplianceCheck[];
  reviewerId: string | null;
}

/* ------------------------------------------------------------------ */
/* Tasks, notifications, audit                                         */
/* ------------------------------------------------------------------ */

export type TaskCategory =
  | 'Follow-up'
  | 'SLA'
  | 'Approval'
  | 'Escalation'
  | 'Customer Communication'
  | 'Investigation'
  | 'Data';

export type TaskStatus = 'Open' | 'In Progress' | 'Completed' | 'Snoozed';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  ownerId: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  relatedType: 'Complaint' | 'Lead' | 'Opportunity' | 'Application' | 'Campaign' | 'Document' | 'CIM';
  relatedId: string;
  createdAt: string;
}

export type NotificationType =
  | 'SLA Warning'
  | 'SLA Breach'
  | 'Assignment'
  | 'Approval Request'
  | 'Escalation'
  | 'New Lead'
  | 'Customer Reply'
  | 'System Alert'
  | 'Communication Sent';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  recipientId: string | null;
  severity: 'info' | 'warning' | 'error' | 'success';
  relatedType: string | null;
  relatedId: string | null;
  channel: 'In-App' | 'Email' | 'SMS';
}

export interface AuditEvent {
  id: string;
  at: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  beforeValue: string;
  afterValue: string;
  ipAddress: string;
  device: string;
  hash: string;
}

/* ------------------------------------------------------------------ */
/* Self service                                                        */
/* ------------------------------------------------------------------ */

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  views: number;
  helpful: number;
  notHelpful: number;
  relatedIds: string[];
  popular: boolean;
}

export interface ChatMessage {
  id: string;
  author: 'customer' | 'bot' | 'agent' | 'system';
  authorName: string;
  text: string;
  at: string;
  suggestions?: string[];
}

export interface ChatSession {
  id: string;
  customerId: string | null;
  stage: 'Bot' | 'Triage' | 'Human Agent' | 'Closed';
  agentId: string | null;
  startedAt: string;
  messages: ChatMessage[];
  createdCaseId: string | null;
  urgent: boolean;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export interface PicklistItem {
  id: string;
  label: string;
  colour: string;
  active: boolean;
  system?: boolean;
}

export interface SlaRule {
  id: string;
  label: string;
  entity: 'Complaint' | 'Lead' | 'Application' | 'Support';
  scope: string;
  targetDays: number;
  warningPercent: number;
  businessHoursOnly: boolean;
}

export interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  channel: 'Email' | 'SMS' | 'In-App';
  subject: string;
  body: string;
  active: boolean;
  trigger: string;
}

export interface RequiredFieldRule {
  id: string;
  entity: string;
  field: string;
  required: boolean;
  appliesTo: string;
}

export interface ApprovalStepConfig {
  id: string;
  process: string;
  order: number;
  stepName: string;
  approverRole: RoleId;
  mandatory: boolean;
}

export interface AnalysisFieldConfig {
  id: string;
  label: string;
  type: 'checkbox' | 'text' | 'select' | 'textarea';
  options?: string[];
  required: boolean;
  active: boolean;
  section: string;
}

export interface Configuration {
  complaintStatuses: PicklistItem[];
  complaintCategories: PicklistItem[];
  complaintSubCategories: Record<string, string[]>;
  leadSources: PicklistItem[];
  leadStatuses: PicklistItem[];
  opportunityStages: PicklistItem[];
  slaRules: SlaRule[];
  notificationTemplates: NotificationTemplate[];
  campaignTemplates: CampaignTemplate[];
  requiredFields: RequiredFieldRule[];
  approvalSteps: ApprovalStepConfig[];
  analysisFields: AnalysisFieldConfig[];
  businessUnits: string[];
  teams: string[];
  duplicateRules: { id: string; field: string; matchType: string; weight: number; active: boolean }[];
  security: {
    mfaRequiredInternal: boolean;
    mfaRequiredPortal: boolean;
    ssoEnabled: boolean;
    captchaOnPublicForms: boolean;
    maskPiiByDefault: boolean;
    sessionTimeoutMinutes: number;
    allowedFileTypes: string[];
    maxFileSizeMb: number;
    passwordPolicy: string;
  };
}

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'Connected' | 'Degraded' | 'Disconnected' | 'Not Configured';
  direction: 'Inbound' | 'Outbound' | 'Bi-directional';
  endpoint: string;
  lastSync: string;
  recordsSynced: number;
  errorCount: number;
  protocol: string;
}

/* ------------------------------------------------------------------ */
/* Implementation & bid demo                                           */
/* ------------------------------------------------------------------ */

export interface ProjectPhase {
  id: string;
  phase: string;
  deliverables: string[];
  ownerRole: string;
  plannedStart: string;
  plannedEnd: string;
  status: 'Not Started' | 'In Progress' | 'Complete' | 'At Risk';
  progress: number;
  milestones: string[];
  dependencies: string[];
}

export interface TrainingCourse {
  id: string;
  role: string;
  course: string;
  method: string;
  durationHours: number;
  audience: number;
  completion: number;
  status: 'Scheduled' | 'In Progress' | 'Complete';
}

export interface RaidItem {
  id: string;
  type: 'Risk' | 'Assumption' | 'Issue' | 'Dependency';
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  likelihood: 'High' | 'Medium' | 'Low';
  mitigation: string;
  owner: string;
  status: 'Open' | 'Monitoring' | 'Closed';
}

export interface TeamMember {
  id: string;
  role: string;
  name: string;
  allocation: string;
  responsibilities: string[];
  backup: string;
}

export interface SupportTier {
  severity: Priority;
  label: string;
  definition: string;
  responseTarget: string;
  resolutionTarget: string;
  escalation: string;
  availability: string;
}

export type RequirementStatus = 'Demonstrated' | 'Partially Demonstrated' | 'Simulated' | 'Configuration Demo';

export interface RequirementRow {
  id: number;
  area: string;
  requirement: string;
  module: string;
  demoScreen: string;
  route: string;
  evidence: string;
  status: RequirementStatus;
  notes: string;
}

export interface DemoStep {
  id: number;
  title: string;
  objective: string;
  route: string;
  requirements: number[];
  talkingPoints: string[];
  expectedOutcome: string;
  phaseFourArea: 'Implementation Approach' | 'Ease of Use' | 'Reporting' | 'Security';
  durationMinutes: number;
}
