import * as React from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Divider, Tab, Tabs, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import LeadIcon from '@mui/icons-material/PersonSearch';
import OppIcon from '@mui/icons-material/Handshake';
import CaseIcon from '@mui/icons-material/SupportAgent';
import AppIcon from '@mui/icons-material/Article';
import DocIcon from '@mui/icons-material/FolderShared';
import CampaignIcon from '@mui/icons-material/Campaign';
import ActivityIcon from '@mui/icons-material/EventNote';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { ActivityTimeline, EmptyState, Grid, LabelValue, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import { fmtDate, fmtDateTime } from '../utils/dates';
import { maskEmail, maskPhone, zar } from '../utils/format';

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const masked = useMasking();
  const [tab, setTab] = React.useState(0);

  const customer = store.customers.find((c) => c.id === id);
  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This account does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/customers')}>Back to customers</Button>}
      />
    );
  }

  const contacts = store.contacts.filter((c) => c.customerId === customer.id);
  const leads = store.leads.filter((l) => l.customerId === customer.id);
  const opportunities = store.opportunities.filter((o) => o.customerId === customer.id);
  const complaints = store.complaints.filter((c) => c.customerId === customer.id);
  const applications = store.applications.filter((a) => a.customerId === customer.id);
  const documents = store.documents.filter((d) => d.customerId === customer.id);
  const activities = store.activities.filter((a) =>
    (a.relatedType === 'Customer' && a.relatedId === customer.id)
    || (a.relatedType === 'Lead' && leads.some((l) => l.id === a.relatedId))
    || (a.relatedType === 'Opportunity' && opportunities.some((o) => o.id === a.relatedId))
    || (a.relatedType === 'Complaint' && complaints.some((c) => c.id === a.relatedId)));
  const campaigns = store.campaigns.filter((c) => leads.some((l) => l.campaignId === c.id) || opportunities.some((o) => o.campaignId === c.id));
  const notifications = store.notifications.filter((n) =>
    (n.relatedType === 'Complaint' && complaints.some((c) => c.id === n.relatedId))
    || (n.relatedType === 'Lead' && leads.some((l) => l.id === n.relatedId))
    || (n.relatedType === 'Application' && applications.some((a) => a.id === n.relatedId)));
  const audits = store.auditEvents.filter((a) =>
    a.entityId === customer.id
    || complaints.some((c) => c.reference === a.entityId)
    || leads.some((l) => l.reference === a.entityId)
    || opportunities.some((o) => o.reference === a.entityId)
    || applications.some((x) => x.reference === a.entityId));
  const owner = store.users.find((u) => u.id === customer.accountOwnerId);

  const wonValue = opportunities.filter((o) => o.stage === 'Closed Won').reduce((s, o) => s + o.estimatedValue, 0);
  const openValue = opportunities.filter((o) => !o.closedDate).reduce((s, o) => s + o.estimatedValue, 0);

  const relationshipNodes = [
    { key: 'contacts', label: 'Contacts', count: contacts.length, icon: <PersonIcon />, colour: '#0B2545', to: null, tab: 1 },
    { key: 'leads', label: 'Leads', count: leads.length, icon: <LeadIcon />, colour: '#2563EB', to: null, tab: 2 },
    { key: 'opportunities', label: 'Opportunities', count: opportunities.length, icon: <OppIcon />, colour: '#0E7C7B', to: null, tab: 3 },
    { key: 'complaints', label: 'Complaints', count: complaints.length, icon: <CaseIcon />, colour: '#DC2626', to: null, tab: 4 },
    { key: 'applications', label: 'Applications', count: applications.length, icon: <AppIcon />, colour: '#7C3AED', to: null, tab: 5 },
    { key: 'documents', label: 'Documents', count: documents.length, icon: <DocIcon />, colour: '#C9A227', to: null, tab: 6 },
    { key: 'campaigns', label: 'Campaigns', count: campaigns.length, icon: <CampaignIcon />, colour: '#D97706', to: null, tab: 8 },
    { key: 'activities', label: 'Activities', count: activities.length, icon: <ActivityIcon />, colour: '#0891B2', to: null, tab: 7 },
  ];

  const RecordRow = ({ title, subtitle, status, value, to }: { title: string; subtitle: string; status?: string; value?: string; to: string }) => (
    <Box
      onClick={() => navigate(to)}
      sx={{
        p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
        '&:hover': { borderColor: 'secondary.main', bgcolor: 'surface.subtle' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{title}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{subtitle}</Typography>
        </Box>
        <Stack direction="row" gap={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
          {value && <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>}
          {status && <StatusChip value={status} />}
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title={customer.organisation}
        subtitle={`${customer.id} · ${customer.customerType} · ${customer.sector} · ${customer.city}, ${customer.country}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Customers / Accounts', to: '/customers' },
          { label: customer.organisation },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={customer.status} />
            <Chip size="small" label={customer.customerType} />
            {!customer.consentMarketing && (
              <Chip size="small" label="Marketing consent withdrawn" sx={{ bgcolor: alpha('#DC2626', .1), color: '#DC2626' }} />
            )}
          </Stack>
        }
        actions={
          <>
            <Button variant="outlined" onClick={() => navigate('/leads/new')}>Capture lead</Button>
            <Button variant="contained" onClick={() => navigate('/complaints/new')}>Log complaint</Button>
          </>
        }
      />

      <Grid cols={{ xs: 2, sm: 4, md: 8 }} gap={1.5} sx={{ mb: 2.5 }}>
        {relationshipNodes.map((n) => (
          <Box
            key={n.key}
            onClick={() => setTab(n.tab)}
            sx={{
              p: 1.5, borderRadius: 2.5, cursor: 'pointer', textAlign: 'center',
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              transition: 'all .15s',
              '&:hover': { borderColor: n.colour, transform: 'translateY(-2px)' },
            }}
          >
            <Box sx={{ color: n.colour, display: 'flex', justifyContent: 'center', mb: 0.5 }}>{n.icon}</Box>
            <Typography variant="h4" sx={{ lineHeight: 1.1 }}>{n.count}</Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }}>{n.label}</Typography>
          </Box>
        ))}
      </Grid>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label={`Contacts (${contacts.length})`} />
              <Tab label={`Leads (${leads.length})`} />
              <Tab label={`Opportunities (${opportunities.length})`} />
              <Tab label={`Complaints (${complaints.length})`} />
              <Tab label={`Applications (${applications.length})`} />
              <Tab label={`Documents (${documents.length})`} />
              <Tab label={`Activities (${activities.length})`} />
              <Tab label={`Campaigns (${campaigns.length})`} />
              <Tab label={`Communications (${notifications.length})`} />
              <Tab label={`Audit (${audits.length})`} />
            </Tabs>

            {tab === 0 && (
              <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={2}>
                <LabelValue label="Customer ID" value={customer.id} mono />
                <LabelValue label="Organisation" value={customer.organisation} />
                <LabelValue label="Contact person" value={customer.contactPerson} />
                <LabelValue label="Customer type" value={customer.customerType} />
                <LabelValue label="Email" value={masked ? maskEmail(customer.email) : customer.email} />
                <LabelValue label="Telephone" value={masked ? maskPhone(customer.phone) : customer.phone} />
                <LabelValue label="Country" value={customer.country} />
                <LabelValue label="City" value={customer.city} />
                <LabelValue label="Sector" value={customer.sector} />
                <LabelValue label="Preferred channel" value={customer.preferredChannel} />
                <LabelValue label="Status" value={<StatusChip value={customer.status} />} />
                <LabelValue label="Date created" value={fmtDate(customer.createdDate)} />
                <LabelValue label="Account owner" value={owner?.name} />
                <LabelValue label="Registration number" value={customer.registrationNo} mono />
                <LabelValue label="Annual export value" value={customer.annualExportValue ? zar(customer.annualExportValue) : '—'} />
                <LabelValue label="Retention until" value={fmtDate(customer.retentionUntil)} />
              </Grid>
            )}

            {tab === 1 && (
              <Stack gap={1}>
                {contacts.map((c) => (
                  <Box key={c.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: alpha('#0B2545', .1), color: '#0B2545' }}>
                          {c.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.name}</Typography>
                          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{c.jobTitle}</Typography>
                        </Box>
                      </Stack>
                      {c.primary && <Chip size="small" label="Primary" sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B' }} />}
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                      {masked ? maskEmail(c.email) : c.email} · {masked ? maskPhone(c.phone) : c.phone}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 2 && (
              <Stack gap={1}>
                {leads.length === 0 && <EmptyState title="No leads" description="Leads captured for this customer will appear here." />}
                {leads.map((l) => (
                  <RecordRow key={l.id} title={`${l.reference} — ${l.productInterest}`}
                    subtitle={`${l.source} · created ${fmtDate(l.createdDate)} · score ${l.qualificationScore}/100`}
                    status={l.status} value={zar(l.estimatedValue, true)} to={`/leads/${l.id}`} />
                ))}
              </Stack>
            )}

            {tab === 3 && (
              <Stack gap={1}>
                {opportunities.length === 0 && <EmptyState title="No opportunities" description="Opportunities for this customer will appear here." />}
                {opportunities.map((o) => (
                  <RecordRow key={o.id} title={o.name}
                    subtitle={`${o.reference} · expected close ${fmtDate(o.expectedCloseDate)} · ${o.products.length} product line(s)`}
                    status={o.stage} value={zar(o.estimatedValue, true)} to={`/opportunities/${o.id}`} />
                ))}
              </Stack>
            )}

            {tab === 4 && (
              <Stack gap={1}>
                {complaints.length === 0 && <EmptyState title="No complaints" description="This customer has not raised a complaint." />}
                {complaints.map((c) => (
                  <RecordRow key={c.id} title={c.subject}
                    subtitle={`${c.reference} · ${c.category} · logged ${fmtDate(c.loggedDate)} via ${c.channel}`}
                    status={c.status} to={`/complaints/${c.id}`} />
                ))}
              </Stack>
            )}

            {tab === 5 && (
              <Stack gap={1}>
                {applications.length === 0 && <EmptyState title="No applications" description="Digital applications for this customer will appear here." />}
                {applications.map((a) => (
                  <RecordRow key={a.id} title={a.formType}
                    subtitle={`${a.reference} · created ${fmtDate(a.createdDate)}${a.signature.signed ? ' · digitally signed' : ''}`}
                    status={a.status} to={`/applications/${a.id}`} />
                ))}
              </Stack>
            )}

            {tab === 6 && (
              <Stack gap={1}>
                {documents.length === 0 && <EmptyState title="No documents" description="Documents linked to this customer will appear here." />}
                {documents.map((d) => (
                  <RecordRow key={d.id} title={d.name}
                    subtitle={`${d.docType} · ${d.classification} · ${d.version} · linked to ${d.transactionRef || 'customer'}`}
                    status={d.status} to={`/documents?doc=${d.id}`} />
                ))}
              </Stack>
            )}

            {tab === 7 && (
              <ActivityTimeline
                events={activities.map((a) => ({
                  id: a.id, at: a.date, actor: store.users.find((u) => u.id === a.ownerId)?.name ?? '—',
                  actorRole: store.users.find((u) => u.id === a.ownerId)?.jobTitle ?? '—',
                  type: a.type, title: a.subject,
                  detail: `${a.notes} (${a.relatedType} ${a.relatedId})`,
                }))}
              />
            )}

            {tab === 8 && (
              <Stack gap={1}>
                {campaigns.length === 0 && <EmptyState title="No campaign attribution" description="Campaigns that generated leads or opportunities for this customer will appear here." />}
                {campaigns.map((c) => (
                  <RecordRow key={c.id} title={c.name}
                    subtitle={`${c.reference} · ${c.type} · ${fmtDate(c.startDate)} to ${fmtDate(c.endDate)}`}
                    status={c.status} to={`/campaigns/${c.id}`} />
                ))}
              </Stack>
            )}

            {tab === 9 && (
              <Stack gap={1.25}>
                {notifications.length === 0 && <EmptyState title="No communications" description="Communications issued to this customer will appear here." />}
                {notifications.map((n) => (
                  <Box key={n.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{n.title}</Typography>
                      <Chip size="small" label={n.channel} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{fmtDateTime(n.createdAt)}</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 10 && (
              <Stack gap={1}>
                <Alert severity="info" sx={{ mb: 0.5 }}>
                  Every access to and change of this customer’s records is logged. Audit records are read-only.
                </Alert>
                {audits.slice(0, 40).map((a) => (
                  <Box key={a.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.action}</Typography>
                      <Typography variant="caption">{fmtDateTime(a.at)}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {a.entity} {a.entityId} · {a.userName} ({a.role})
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Commercial position">
            <Grid cols={2} gap={1.5}>
              <LabelValue label="Open pipeline" value={zar(openValue, true)} />
              <LabelValue label="Won revenue" value={zar(wonValue, true)} />
              <LabelValue label="Open cases" value={String(complaints.filter((c) => c.status !== 'Closed').length)} />
              <LabelValue label="Total cases" value={String(complaints.length)} />
              <LabelValue label="Applications" value={String(applications.length)} />
              <LabelValue label="Documents" value={String(documents.length)} />
            </Grid>
          </SectionCard>

          <SectionCard title="Privacy & consent" subtitle="POPIA / GDPR controls on this record">
            <Stack gap={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Data processing consent</Typography>
                <Chip size="small" label={customer.consentDataProcessing ? 'Granted' : 'Withheld'}
                  sx={{ bgcolor: alpha(customer.consentDataProcessing ? '#059669' : '#DC2626', .12), color: customer.consentDataProcessing ? '#059669' : '#DC2626', fontWeight: 700 }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Marketing consent</Typography>
                <Chip size="small" label={customer.consentMarketing ? 'Granted' : 'Withdrawn'}
                  sx={{ bgcolor: alpha(customer.consentMarketing ? '#059669' : '#DC2626', .12), color: customer.consentMarketing ? '#059669' : '#DC2626', fontWeight: 700 }} />
              </Stack>
              <Divider />
              <LabelValue label="Retention until" value={fmtDate(customer.retentionUntil)} />
              <LabelValue label="Personal information" value={masked ? 'Masked for your role' : 'Visible — access logged'} />
              <Typography variant="caption">
                Consent is re-validated at the point of sending any marketing communication, not only when the
                audience is built.
              </Typography>
            </Stack>
          </SectionCard>

          <SectionCard title="Account owner">
            {owner && (
              <Stack direction="row" gap={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: owner.avatarColor }}>{owner.initials}</Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{owner.name}</Typography>
                  <Typography variant="caption">{owner.jobTitle} · {owner.team}</Typography>
                </Box>
              </Stack>
            )}
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default CustomerDetail;
