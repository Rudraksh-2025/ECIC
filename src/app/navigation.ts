import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import WorkIcon from '@mui/icons-material/AssignmentInd';
import LeadIcon from '@mui/icons-material/PersonSearch';
import OpportunityIcon from '@mui/icons-material/Handshake';
import ComplaintIcon from '@mui/icons-material/SupportAgent';
import CustomerIcon from '@mui/icons-material/Apartment';
import ApplicationIcon from '@mui/icons-material/Article';
import DocumentIcon from '@mui/icons-material/FolderShared';
import PipelineIcon from '@mui/icons-material/AccountTree';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Storefront';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import RoiIcon from '@mui/icons-material/QueryStats';
import CimIcon from '@mui/icons-material/Palette';
import ReportIcon from '@mui/icons-material/Assessment';
import AnalyticsIcon from '@mui/icons-material/Insights';
import PortalIcon from '@mui/icons-material/Language';
import ChatIcon from '@mui/icons-material/Forum';
import FaqIcon from '@mui/icons-material/HelpCenter';
import NotificationIcon from '@mui/icons-material/Notifications';
import TaskIcon from '@mui/icons-material/FactCheck';
import AuditIcon from '@mui/icons-material/History';
import UsersIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Shield';
import ConfigIcon from '@mui/icons-material/Tune';
import IntegrationIcon from '@mui/icons-material/Hub';
import ImplementationIcon from '@mui/icons-material/Engineering';
import DemoIcon from '@mui/icons-material/SlideshowRounded';
import MatrixIcon from '@mui/icons-material/ChecklistRtl';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: SvgIconComponent;
  /** Badge source: computed in the shell. */
  badge?: 'notifications' | 'tasks' | 'slaAtRisk' | 'approvals';
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Executive Dashboard', to: '/dashboard', icon: DashboardIcon },
      { key: 'my-work', label: 'My Work', to: '/my-work', icon: WorkIcon, badge: 'tasks' },
    ],
  },
  {
    label: 'Client Engagement',
    items: [
      { key: 'leads', label: 'Leads', to: '/leads', icon: LeadIcon },
      { key: 'opportunities', label: 'Opportunities', to: '/opportunities', icon: OpportunityIcon },
      { key: 'complaints', label: 'Complaints / Cases', to: '/complaints', icon: ComplaintIcon, badge: 'slaAtRisk' },
      { key: 'customers', label: 'Customers / Accounts', to: '/customers', icon: CustomerIcon },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { key: 'applications', label: 'Applications', to: '/applications', icon: ApplicationIcon },
      { key: 'documents', label: 'Documents', to: '/documents', icon: DocumentIcon },
      { key: 'pipeline', label: 'WIP & Underwriting', to: '/pipeline', icon: PipelineIcon },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { key: 'campaigns', label: 'Campaigns', to: '/campaigns', icon: CampaignIcon },
      { key: 'events', label: 'Events / Exhibitions', to: '/events', icon: EventIcon },
      { key: 'qr-capture', label: 'QR Lead Capture', to: '/qr-capture', icon: QrIcon },
      { key: 'campaign-performance', label: 'Campaign Performance', to: '/campaign-performance', icon: RoiIcon },
      { key: 'cim', label: 'Corporate Identity Manual', to: '/cim', icon: CimIcon },
    ],
  },
  {
    label: 'Insight',
    items: [
      { key: 'reports', label: 'Reports', to: '/reports', icon: ReportIcon },
      { key: 'analytics', label: 'Analytics & Forecast', to: '/analytics', icon: AnalyticsIcon },
    ],
  },
  {
    label: 'Service & Self-Service',
    items: [
      { key: 'tasks', label: 'Tasks & SLA', to: '/tasks', icon: TaskIcon, badge: 'slaAtRisk' },
      { key: 'notifications', label: 'Notifications', to: '/notifications', icon: NotificationIcon, badge: 'notifications' },
      { key: 'chat', label: 'Chatbot / Live Chat', to: '/chat', icon: ChatIcon },
      { key: 'faqs', label: 'FAQ Library', to: '/faqs', icon: FaqIcon },
      { key: 'portal', label: 'Customer Portal', to: '/portal', icon: PortalIcon, external: true },
    ],
  },
  {
    label: 'Governance',
    items: [
      { key: 'audit', label: 'Audit Log', to: '/audit', icon: AuditIcon },
      { key: 'security', label: 'Security Centre', to: '/security', icon: SecurityIcon },
      { key: 'users', label: 'Users & Roles', to: '/users', icon: UsersIcon },
      { key: 'configuration', label: 'Configuration', to: '/configuration', icon: ConfigIcon },
      { key: 'integrations', label: 'Integrations', to: '/integrations', icon: IntegrationIcon },
    ],
  },
  {
    label: 'Bid Presentation',
    items: [
      { key: 'implementation', label: 'Implementation & Support', to: '/implementation', icon: ImplementationIcon },
      { key: 'bid-demo', label: 'Bid Demo Mode', to: '/bid-demo', icon: DemoIcon },
      { key: 'coverage', label: 'Requirement Coverage', to: '/coverage', icon: MatrixIcon },
    ],
  },
];

/** Modules always available regardless of role, so the demo never dead-ends. */
export const ALWAYS_VISIBLE = ['portal'];
