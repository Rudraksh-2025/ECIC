import type { Integration } from '../types';
import { iso } from '../utils/dates';

export const INTEGRATIONS: Integration[] = [
  {
    id: 'INT-01', name: 'Corporate Email (Microsoft Exchange Online)', category: 'Communication',
    description: 'Bi-directional mailbox integration. Inbound complaint and enquiry mailboxes are polled and converted into CRM records; outbound customer communications are sent from the corporate domain and stored against the transaction.',
    status: 'Connected', direction: 'Bi-directional', endpoint: 'https://graph.microsoft.com/v1.0/users/{mailbox}/messages',
    lastSync: iso(0, 8, 42), recordsSynced: 18_442, errorCount: 0, protocol: 'Microsoft Graph REST / OAuth 2.0',
  },
  {
    id: 'INT-02', name: 'dtic Integrated Financial Workflow (IFW)', category: 'Government',
    description: 'Inbound feed of export support enquiries and trade mission registrations from the Department of Trade, Industry and Competition IFW platform, created in the CRM as leads with full source attribution.',
    status: 'Connected', direction: 'Inbound', endpoint: 'https://ifw.dtic.demo.gov.za/api/v2/enquiries',
    lastSync: iso(0, 6, 15), recordsSynced: 1_284, errorCount: 2, protocol: 'REST / mutual TLS',
  },
  {
    id: 'INT-03', name: 'SMS Gateway', category: 'Communication',
    description: 'Outbound transactional SMS for SLA alerts, one-time verification codes and case status notifications.',
    status: 'Connected', direction: 'Outbound', endpoint: 'https://api.smsgateway.demo.co.za/v3/messages',
    lastSync: iso(0, 9, 5), recordsSynced: 6_910, errorCount: 11, protocol: 'REST / API key',
  },
  {
    id: 'INT-04', name: 'Social Media Listening (LinkedIn & X)', category: 'Marketing',
    description: 'Inbound capture of enquiries and complaints raised on ECIC social channels, routed into the CRM with the originating handle and post reference.',
    status: 'Degraded', direction: 'Inbound', endpoint: 'https://social-listening.demo.co.za/api/mentions',
    lastSync: iso(-1, 22, 10), recordsSynced: 742, errorCount: 34, protocol: 'REST / OAuth 2.0',
  },
  {
    id: 'INT-05', name: 'Corporate Calendar (Exchange)', category: 'Productivity',
    description: 'Bi-directional synchronisation of CRM activities — meetings, site visits and follow-up calls — with user Outlook calendars.',
    status: 'Connected', direction: 'Bi-directional', endpoint: 'https://graph.microsoft.com/v1.0/users/{user}/events',
    lastSync: iso(0, 8, 40), recordsSynced: 3_118, errorCount: 0, protocol: 'Microsoft Graph REST / OAuth 2.0',
  },
  {
    id: 'INT-06', name: 'Microsoft Power BI', category: 'Analytics',
    description: 'Outbound dataset publication to the ECIC Power BI workspace, enabling enterprise reporting over CRM data alongside finance and underwriting datasets.',
    status: 'Connected', direction: 'Outbound', endpoint: 'https://api.powerbi.com/v1.0/myorg/datasets/{dataset}/rows',
    lastSync: iso(0, 5, 0), recordsSynced: 214_880, errorCount: 0, protocol: 'Power BI REST / service principal',
  },
  {
    id: 'INT-07', name: 'SharePoint Online Document Store', category: 'Content',
    description: 'Document repository integration. CRM document metadata is retained in the CRM while the binary content is stored in the governed SharePoint library with retention labels applied.',
    status: 'Connected', direction: 'Bi-directional', endpoint: 'https://ecicdemo.sharepoint.com/sites/CRM/_api/web/lists',
    lastSync: iso(0, 8, 55), recordsSynced: 9_662, errorCount: 1, protocol: 'SharePoint REST / OAuth 2.0',
  },
  {
    id: 'INT-08', name: 'Active Directory / Entra ID (SSO)', category: 'Identity',
    description: 'Single sign-on and user provisioning. Internal users authenticate against the corporate directory; group membership drives CRM role assignment and de-provisioning on termination.',
    status: 'Connected', direction: 'Inbound', endpoint: 'https://login.microsoftonline.com/{tenant}/saml2',
    lastSync: iso(0, 7, 0), recordsSynced: 318, errorCount: 0, protocol: 'SAML 2.0 / SCIM 2.0',
  },
  {
    id: 'INT-09', name: 'Policy Administration System', category: 'Core Business',
    description: 'Inbound synchronisation of issued policies, endorsements and premium transactions so that CRM users see the full customer position without leaving the CRM.',
    status: 'Connected', direction: 'Inbound', endpoint: 'https://pas.internal.demo/api/v1/policies',
    lastSync: iso(0, 4, 30), recordsSynced: 44_210, errorCount: 3, protocol: 'REST / mutual TLS',
  },
  {
    id: 'INT-10', name: 'Credit Bureau & Sanctions Screening', category: 'Risk',
    description: 'Outbound buyer credit and sanctions screening requests raised from desktop analysis, with results written back to the lead or application.',
    status: 'Not Configured', direction: 'Bi-directional', endpoint: 'Not configured for this demonstration environment',
    lastSync: '', recordsSynced: 0, errorCount: 0, protocol: 'REST / API key',
  },
];
