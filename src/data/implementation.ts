import type { ProjectPhase, RaidItem, SupportTier, TeamMember, TrainingCourse } from '../types';
import { isoDate } from '../utils/dates';

export const PROJECT_PHASES: ProjectPhase[] = [
  {
    id: 'PH-0', phase: 'Phase 0 — Mobilisation', ownerRole: 'Programme Manager',
    plannedStart: isoDate(-120), plannedEnd: isoDate(-100), status: 'Complete', progress: 100,
    deliverables: ['Project charter and governance model', 'Mobilised delivery team and RACI', 'Programme plan and baseline schedule', 'Communication and reporting cadence'],
    milestones: ['Contract signature', 'Kick-off workshop held', 'Governance forums established'],
    dependencies: ['ECIC project sponsor confirmed', 'Access to ECIC environments'],
  },
  {
    id: 'PH-1', phase: 'Phase 1 — Discovery & Solution Design', ownerRole: 'Solution Architect',
    plannedStart: isoDate(-100), plannedEnd: isoDate(-55), status: 'Complete', progress: 100,
    deliverables: ['As-is process assessment (complaints, leads, opportunities, marketing)', 'Functional requirements traceability matrix against Annexure C', 'Solution architecture and integration design', 'Data migration strategy', 'Security and privacy design (POPIA)'],
    milestones: ['Design authority sign-off', 'Integration design agreed with ECIC IT', 'Annexure C traceability baseline approved'],
    dependencies: ['Business SME availability', 'dtic IFW interface specification'],
  },
  {
    id: 'PH-2', phase: 'Phase 2 — Configuration & Build', ownerRole: 'Functional Lead',
    plannedStart: isoDate(-55), plannedEnd: isoDate(15), status: 'In Progress', progress: 72,
    deliverables: ['Case management configuration', 'Lead and opportunity configuration', 'Marketing, events and QR capture configuration', 'CIM governance workflow', 'Reports, dashboards and Power BI datasets', 'Integration build and unit test'],
    milestones: ['Sprint 4 demo accepted', 'Sprint 6 demo accepted', 'Configuration freeze'],
    dependencies: ['Phase 1 design sign-off', 'Non-production environments provisioned'],
  },
  {
    id: 'PH-3', phase: 'Phase 3 — Data Migration', ownerRole: 'Data Migration Lead',
    plannedStart: isoDate(-20), plannedEnd: isoDate(35), status: 'In Progress', progress: 41,
    deliverables: ['Data quality assessment and cleansing plan', 'Migration mapping specification', 'Three migration dry runs with reconciliation', 'Migration reconciliation sign-off'],
    milestones: ['Dry run 1 complete', 'Dry run 2 complete', 'Dry run 3 / dress rehearsal', 'Reconciliation sign-off'],
    dependencies: ['Legacy data extracts from ECIC', 'Business rules for record de-duplication'],
  },
  {
    id: 'PH-4', phase: 'Phase 4 — Testing & UAT', ownerRole: 'QA Lead',
    plannedStart: isoDate(10), plannedEnd: isoDate(60), status: 'Not Started', progress: 8,
    deliverables: ['Test strategy and test scripts', 'System and integration test execution', 'Performance test against the <3 second response target', 'Security and penetration test', 'User acceptance test with ECIC business users', 'Defect triage and closure report'],
    milestones: ['SIT exit', 'Performance test sign-off', 'UAT entry', 'UAT exit'],
    dependencies: ['Configuration freeze', 'Migrated data in the UAT environment'],
  },
  {
    id: 'PH-5', phase: 'Phase 5 — Training & Change Management', ownerRole: 'Change Manager',
    plannedStart: isoDate(25), plannedEnd: isoDate(75), status: 'Not Started', progress: 5,
    deliverables: ['Role-based training curriculum and materials', 'Train-the-trainer programme', 'Quick reference guides and in-app guidance', 'Change impact assessment and adoption plan', 'Business readiness assessment'],
    milestones: ['Training material sign-off', 'Train-the-trainer complete', 'End-user training complete', 'Readiness gate passed'],
    dependencies: ['Stable UAT build', 'ECIC training venue and scheduling'],
  },
  {
    id: 'PH-6', phase: 'Phase 6 — Go-Live', ownerRole: 'Programme Manager',
    plannedStart: isoDate(75), plannedEnd: isoDate(82), status: 'Not Started', progress: 0,
    deliverables: ['Cutover plan and runbook', 'Production migration execution', 'Go/no-go decision pack', 'Production verification testing'],
    milestones: ['Go/no-go decision', 'Production cutover', 'Service commencement'],
    dependencies: ['UAT exit sign-off', 'Business readiness gate passed'],
  },
  {
    id: 'PH-7', phase: 'Phase 7 — Hypercare', ownerRole: 'Support Lead',
    plannedStart: isoDate(82), plannedEnd: isoDate(112), status: 'Not Started', progress: 0,
    deliverables: ['On-site and remote hypercare support (30 days)', 'Daily service review with ECIC', 'Defect and enhancement triage', 'Transition to managed support report'],
    milestones: ['Hypercare commencement', 'Week 2 service review', 'Hypercare exit and transition'],
    dependencies: ['Successful go-live', 'Support team onboarding complete'],
  },
  {
    id: 'PH-8', phase: 'Phase 8 — Managed Support & Maintenance (3 years)', ownerRole: 'Support Lead',
    plannedStart: isoDate(112), plannedEnd: isoDate(1207), status: 'Not Started', progress: 0,
    deliverables: ['Service desk and incident management against agreed SLAs', 'Preventative and proactive maintenance', 'Quarterly release and enhancement cycle', 'Monthly service reporting and governance', 'Annual DR test and continuity review'],
    milestones: ['Service commencement', 'Quarterly service reviews', 'Annual DR test', 'Annual service improvement plan'],
    dependencies: ['Hypercare exit', 'Signed service management plan'],
  },
];

export const TRAINING_COURSES: TrainingCourse[] = [
  { id: 'TR-01', role: 'System Administrator', course: 'CRM Administration, Configuration & Security', method: 'Instructor-led (classroom) + lab', durationHours: 24, audience: 4, completion: 100, status: 'Complete' },
  { id: 'TR-02', role: 'Complaints Specialist', course: 'Case Management End-to-End', method: 'Instructor-led (virtual) + scenario workshop', durationHours: 12, audience: 18, completion: 78, status: 'In Progress' },
  { id: 'TR-03', role: 'Complaints Supervisor', course: 'Case Oversight, Escalation & Closure Authorisation', method: 'Instructor-led (virtual)', durationHours: 8, audience: 6, completion: 83, status: 'In Progress' },
  { id: 'TR-04', role: 'BDU Officer', course: 'Lead Capture, Desktop Analysis & Handover', method: 'Instructor-led (classroom)', durationHours: 12, audience: 14, completion: 64, status: 'In Progress' },
  { id: 'TR-05', role: 'Sales User', course: 'Opportunity, Pipeline & Digital Applications', method: 'Instructor-led (classroom) + e-learning', durationHours: 12, audience: 22, completion: 55, status: 'In Progress' },
  { id: 'TR-06', role: 'Marketing User', course: 'Campaigns, Events, QR Capture & CIM Governance', method: 'Instructor-led (virtual) + hands-on lab', durationHours: 10, audience: 9, completion: 44, status: 'In Progress' },
  { id: 'TR-07', role: 'Underwriting User', course: 'WIP Pipeline & Underwriting Handover', method: 'Instructor-led (virtual)', durationHours: 6, audience: 16, completion: 31, status: 'In Progress' },
  { id: 'TR-08', role: 'Manager / Executive', course: 'Dashboards, Reporting & Power BI', method: 'Executive briefing + guided walkthrough', durationHours: 4, audience: 11, completion: 27, status: 'In Progress' },
  { id: 'TR-09', role: 'Customer Portal User', course: 'Self-Service Portal Orientation', method: 'E-learning + guided video', durationHours: 1, audience: 340, completion: 12, status: 'Scheduled' },
  { id: 'TR-10', role: 'All Users', course: 'POPIA, Information Security & Acceptable Use', method: 'E-learning (mandatory, annual)', durationHours: 2, audience: 420, completion: 68, status: 'In Progress' },
  { id: 'TR-11', role: 'Train-the-Trainer', course: 'ECIC Super-User Enablement', method: 'Workshop + certification', durationHours: 16, audience: 12, completion: 92, status: 'In Progress' },
  { id: 'TR-12', role: 'Service Desk', course: 'CRM Support & Triage Procedures', method: 'Instructor-led (virtual)', durationHours: 8, audience: 7, completion: 0, status: 'Scheduled' },
];

export const RAID_ITEMS: RaidItem[] = [
  { id: 'R-01', type: 'Risk', description: 'Legacy complaint data quality is materially below expectation, extending the cleansing effort and threatening the migration window.', impact: 'High', likelihood: 'Medium', mitigation: 'Three migration dry runs with reconciliation reports; a jointly staffed data cleansing workstream; agreed minimum data standard for migration into scope.', owner: 'Data Migration Lead', status: 'Monitoring' },
  { id: 'R-02', type: 'Risk', description: 'Business SME availability during peak underwriting cycles constrains UAT throughput.', impact: 'High', likelihood: 'High', mitigation: 'UAT scheduled outside the quarter-end underwriting peak; named backup testers per process area; test scripts pre-recorded to shorten SME time on task.', owner: 'Programme Manager', status: 'Open' },
  { id: 'R-03', type: 'Risk', description: 'dtic IFW interface specification changes after design freeze.', impact: 'Medium', likelihood: 'Medium', mitigation: 'Integration abstracted behind an adapter layer so specification changes are contained; change control agreed with the dtic technical contact.', owner: 'Technical Lead', status: 'Monitoring' },
  { id: 'R-04', type: 'Risk', description: 'User adoption of the customer self-service portal is slower than the business case assumes.', impact: 'Medium', likelihood: 'Medium', mitigation: 'Staged customer onboarding with the top 50 accounts first; in-portal guidance; adoption tracked weekly on the change dashboard.', owner: 'Change Manager', status: 'Open' },
  { id: 'A-01', type: 'Assumption', description: 'ECIC provides non-production environments and network access within 10 business days of mobilisation.', impact: 'High', likelihood: 'Low', mitigation: 'Environment request submitted during mobilisation; escalation path to the ECIC IT Manager agreed.', owner: 'Technical Lead', status: 'Closed' },
  { id: 'A-02', type: 'Assumption', description: 'Corporate email, SSO and SharePoint are available for integration on standard Microsoft 365 licensing.', impact: 'Medium', likelihood: 'Low', mitigation: 'Licensing confirmed during discovery; fallback SMTP relay design documented.', owner: 'Solution Architect', status: 'Closed' },
  { id: 'I-01', type: 'Issue', description: 'Two complaint categories in the legacy system have no owning business unit, blocking routing rule configuration.', impact: 'Medium', likelihood: 'High', mitigation: 'Escalated to the Client Services Manager; interim routing to Complaints Oversight agreed pending a decision.', owner: 'Functional Lead', status: 'Open' },
  { id: 'I-02', type: 'Issue', description: 'Performance test environment sizing is below the agreed production specification.', impact: 'Medium', likelihood: 'High', mitigation: 'Test results to be extrapolated with a documented sizing factor; production verification test added to the cutover runbook.', owner: 'QA Lead', status: 'Monitoring' },
  { id: 'D-01', type: 'Dependency', description: 'Legacy data extracts must be delivered by ECIC before each migration dry run.', impact: 'High', likelihood: 'Medium', mitigation: 'Extract dates baselined in the schedule with a 5 business day buffer before each dry run.', owner: 'Data Migration Lead', status: 'Open' },
  { id: 'D-02', type: 'Dependency', description: 'Corporate Identity Manual v4.3 approval is required before CIM-aligned templates can be finalised.', impact: 'Low', likelihood: 'Medium', mitigation: 'Templates built against the current published v4.2 with a configuration path to adopt v4.3 without a code change.', owner: 'Functional Lead', status: 'Monitoring' },
];

export const TEAM_STRUCTURE: TeamMember[] = [
  { id: 'TM-01', role: 'Programme Manager', name: 'DEMO — A. Programme Manager', allocation: '100% through go-live, 40% in managed support', backup: 'Delivery Director', responsibilities: ['Overall delivery accountability', 'Governance, reporting and escalation', 'Scope, schedule and RAID management', 'Commercial and change control'] },
  { id: 'TM-02', role: 'Solution Architect', name: 'DEMO — B. Solution Architect', allocation: '100% to end of Phase 2, 30% thereafter', backup: 'Principal Architect (practice pool)', responsibilities: ['Solution and integration architecture', 'Non-functional design (performance, availability, scalability)', 'Design authority representation', 'Technical assurance of the build'] },
  { id: 'TM-03', role: 'Functional Lead', name: 'DEMO — C. Functional Lead', allocation: '100% through UAT', backup: 'Senior Business Analyst', responsibilities: ['Requirements traceability to Annexure C', 'Configuration design for case, lead, opportunity and marketing processes', 'Business process workshops', 'Functional acceptance of each sprint'] },
  { id: 'TM-04', role: 'Technical Lead', name: 'DEMO — D. Technical Lead', allocation: '100% through go-live', backup: 'Senior Integration Engineer', responsibilities: ['Integration build and technical delivery', 'Environment and release management', 'Technical defect resolution', 'Handover to managed support'] },
  { id: 'TM-05', role: 'QA Lead', name: 'DEMO — E. QA Lead', allocation: '60% Phase 2, 100% Phase 4', backup: 'Test Manager (practice pool)', responsibilities: ['Test strategy and test management', 'System, integration, performance and regression testing', 'UAT facilitation and defect triage', 'Quality gate reporting'] },
  { id: 'TM-06', role: 'Data Migration Lead', name: 'DEMO — F. Data Migration Lead', allocation: '100% Phase 3, 50% Phase 4', backup: 'Data Engineer', responsibilities: ['Migration strategy and mapping', 'Extract, transform and load execution', 'Reconciliation and sign-off packs', 'Data quality remediation with ECIC'] },
  { id: 'TM-07', role: 'Change Manager', name: 'DEMO — G. Change Manager', allocation: '50% from Phase 1, 100% Phase 5', backup: 'Change Analyst', responsibilities: ['Change impact assessment', 'Stakeholder engagement and communications', 'Champion network', 'Business readiness and adoption tracking'] },
  { id: 'TM-08', role: 'Training Lead', name: 'DEMO — H. Training Lead', allocation: '100% Phase 5, 30% hypercare', backup: 'Training Consultant', responsibilities: ['Role-based curriculum design', 'Training material and quick reference guides', 'Train-the-trainer delivery', 'Competency assessment and reporting'] },
  { id: 'TM-09', role: 'Support Lead', name: 'DEMO — J. Support Lead', allocation: '30% from Phase 4, 100% from hypercare', backup: 'Service Delivery Manager', responsibilities: ['Hypercare and managed support model', 'SLA management and service reporting', 'Incident, problem and change management', 'Continuous service improvement'] },
];

export const SUPPORT_TIERS: SupportTier[] = [
  { severity: 'P1', label: 'Critical', definition: 'CRM unavailable, or a core process (complaint logging, lead capture, application submission) is unusable for all users with no workaround.', responseTarget: '30 minutes', resolutionTarget: '4 business hours', escalation: 'Immediate: Support Lead → Service Delivery Manager (30 min) → Delivery Director (2 hrs) → ECIC CIO', availability: '24 x 7' },
  { severity: 'P2', label: 'High', definition: 'A core process is severely degraded or unavailable to a business unit, or a workaround exists but is not sustainable.', responseTarget: '1 business hour', resolutionTarget: '8 business hours', escalation: 'Support Lead → Service Delivery Manager (4 hrs) → Delivery Director (next business day)', availability: 'Business hours + on-call' },
  { severity: 'P3', label: 'Medium', definition: 'A non-core function is impaired, or a core function is impaired for a single user with an available workaround.', responseTarget: '4 business hours', resolutionTarget: '3 business days', escalation: 'Support Lead → Service Delivery Manager (2 business days)', availability: 'Business hours' },
  { severity: 'P4', label: 'Low', definition: 'Cosmetic defect, guidance request, or a change that can be scheduled into the next release cycle.', responseTarget: '1 business day', resolutionTarget: '10 business days or next scheduled release', escalation: 'Managed through the monthly service review', availability: 'Business hours' },
];

export const CHANGE_ACTIVITIES = [
  { id: 'CA-01', stakeholder: 'Client Services (Complaints)', impact: 'High', description: 'Move from a shared mailbox and spreadsheet tracker to structured, SLA-driven case management.', activities: ['Process walkthroughs', 'Champion network (2 per team)', 'Floor-walking during the first two weeks', 'Daily stand-up during hypercare'], readiness: 78 },
  { id: 'CA-02', stakeholder: 'Business Development Unit', impact: 'High', description: 'Structured lead capture, mandatory assignment with backup owner and formalised desktop analysis.', activities: ['Sector workshops', 'Desktop analysis pilot with 5 officers', 'One-to-one coaching', 'Leaderboard on lead SLA compliance'], readiness: 64 },
  { id: 'CA-03', stakeholder: 'Underwriting', impact: 'Medium', description: 'Receive handovers and update work-in-progress status in the CRM rather than by email.', activities: ['Handover process design workshop', 'Queue management training', 'Joint BDU/Underwriting dry run'], readiness: 59 },
  { id: 'CA-04', stakeholder: 'Marketing & Communications', impact: 'High', description: 'Campaign templates, QR lead capture and enforced CIM compliance review on all assets.', activities: ['Template co-design sessions', 'QR capture field trial at the Manufacturing Indaba', 'CIM reviewer role definition'], readiness: 71 },
  { id: 'CA-05', stakeholder: 'Executive & Management', impact: 'Medium', description: 'Shift from manually compiled monthly packs to live dashboards and self-service reporting.', activities: ['Executive dashboard design review', 'Power BI orientation', 'Monthly report decommissioning plan'], readiness: 82 },
  { id: 'CA-06', stakeholder: 'Customers & Brokers', impact: 'Medium', description: 'Introduction of the self-service portal, chatbot and digital applications.', activities: ['Top 50 account onboarding programme', 'Portal launch communication pack', 'Broker channel webinar', 'In-portal guidance and FAQ library'], readiness: 46 },
  { id: 'CA-07', stakeholder: 'Information Technology', impact: 'Medium', description: 'New integrations, identity model and support process to operate alongside existing systems.', activities: ['Technical knowledge transfer', 'Runbook handover', 'Joint incident simulation'], readiness: 74 },
];

export const CONTINUITY = {
  rto: '4 hours',
  rpo: '15 minutes',
  backupSchedule: 'Continuous transaction log shipping with full daily backup at 22:00 SAST; 35-day retention; monthly archival copy retained for 7 years.',
  drTest: 'Full disaster recovery invocation test performed annually with ECIC participation; partial failover test performed semi-annually.',
  resourceContinuity: [
    { role: 'Programme Manager', primary: 'DEMO — A. Programme Manager', backup: 'Delivery Director', knowledgeTransfer: 'Weekly delivery review; all governance artefacts in the shared programme repository.' },
    { role: 'Solution Architect', primary: 'DEMO — B. Solution Architect', backup: 'Principal Architect (practice pool)', knowledgeTransfer: 'Architecture decision records maintained; design authority attended by both.' },
    { role: 'Functional Lead', primary: 'DEMO — C. Functional Lead', backup: 'Senior Business Analyst', knowledgeTransfer: 'Configuration workbook and requirements traceability matrix kept current; paired on all workshops.' },
    { role: 'Technical Lead', primary: 'DEMO — D. Technical Lead', backup: 'Senior Integration Engineer', knowledgeTransfer: 'Infrastructure and integration as code; runbooks peer-reviewed each release.' },
    { role: 'Support Lead', primary: 'DEMO — J. Support Lead', backup: 'Service Delivery Manager', knowledgeTransfer: 'Shared service desk queue; documented triage playbooks; monthly shadow rotation.' },
  ],
  escalationChain: [
    'Level 1 — Service Desk (logged, triaged and acknowledged against the SLA)',
    'Level 2 — CRM Support Analyst (functional and configuration resolution)',
    'Level 3 — Technical Lead / Solution Architect (defect and integration resolution)',
    'Level 4 — Service Delivery Manager (service-level breach and commercial escalation)',
    'Level 5 — Delivery Director ↔ ECIC CIO (executive escalation)',
  ],
};
