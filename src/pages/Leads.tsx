import * as React from 'react';
import {
  Avatar, Box, Button, Chip, Divider, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, SlaBar, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { leadSla } from '../hooks';
import { fmtDate, relativeTime } from '../utils/dates';
import { downloadCsv, maskEmail, num, pct, zar } from '../utils/format';
import type { Lead } from '../types';

export function Leads() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const masked = useMasking();
  const [filters, setFilters] = React.useState({
    status: params.get('status') ?? 'all',
    source: 'all', owner: 'all', sector: 'all', campaign: 'all', sync: 'all',
  });

  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const rows = React.useMemo(
    () => store.leads.map((l) => ({ ...l, _sla: leadSla(l) })),
    [store.leads],
  );

  const filtered = rows.filter((l) =>
    (filters.status === 'all' || l.status === filters.status)
    && (filters.source === 'all' || l.source === filters.source)
    && (filters.owner === 'all' || l.ownerId === filters.owner)
    && (filters.sector === 'all' || l.sector === filters.sector)
    && (filters.campaign === 'all' || l.campaignId === filters.campaign)
    && (filters.sync === 'all' || l.syncStatus === filters.sync));

  const userName = (id: string | null) => store.users.find((u) => u.id === id)?.name ?? 'Unassigned';
  const unassigned = rows.filter((l) => !l.ownerId);
  const qualified = rows.filter((l) => ['Qualified', 'Converted'].includes(l.status));
  const converted = rows.filter((l) => l.status === 'Converted');
  const atRisk = rows.filter((l) => !l.firstContactDate && (l._sla.risk === 'At Risk' || l._sla.risk === 'Breached'));
  const pendingSync = rows.filter((l) => l.syncStatus !== 'Synced');
  const worked = rows.filter((l) => l.status !== 'New');

  const columns: Column<Lead & { _sla: ReturnType<typeof leadSla> }>[] = [
    {
      id: 'reference', label: 'Reference', width: 160, sortValue: (r) => r.reference,
      render: (r) => (
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}>
            {r.reference}
          </Typography>
          {r.source === 'Exhibition / QR' && (
            <Tooltip title="Captured by QR scan at an exhibition"><QrIcon sx={{ fontSize: 14, color: 'secondary.main' }} /></Tooltip>
          )}
          {r.syncStatus !== 'Synced' && (
            <Tooltip title={`${r.syncStatus} — awaiting synchronisation to the CRM`}>
              <SyncProblemIcon sx={{ fontSize: 14, color: 'warning.main' }} />
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      id: 'company', label: 'Company & contact', sortValue: (r) => r.company,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 300 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.company}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {r.contactName} · {masked ? maskEmail(r.email) : r.email}
          </Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 118, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    { id: 'source', label: 'Source', sortValue: (r) => r.source, hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{r.source}</Typography> },
    { id: 'sector', label: 'Sector', sortValue: (r) => r.sector, hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{r.sector}</Typography> },
    {
      id: 'value', label: 'Est. value', align: 'right', sortValue: (r) => r.estimatedValue, width: 110,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.estimatedValue, true)}</Typography>,
    },
    {
      id: 'score', label: 'Score', align: 'center', width: 90, sortValue: (r) => r.qualificationScore,
      render: (r) => r.qualificationScore > 0 ? (
        <Tooltip title={`Qualification score ${r.qualificationScore}/100`}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '50%', fontSize: '0.72rem', fontWeight: 700,
            color: r.qualificationScore >= 75 ? '#059669' : r.qualificationScore >= 50 ? '#D97706' : '#DC2626',
            bgcolor: alpha(r.qualificationScore >= 75 ? '#059669' : r.qualificationScore >= 50 ? '#D97706' : '#DC2626', .12),
          }}>{r.qualificationScore}</Box>
        </Tooltip>
      ) : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      id: 'owner', label: 'Owner / backup', sortValue: (r) => userName(r.ownerId), hideOn: 'sm',
      render: (r) => {
        const owner = store.users.find((u) => u.id === r.ownerId);
        const backup = store.users.find((u) => u.id === r.backupOwnerId);
        return owner ? (
          <Box>
            <Stack direction="row" gap={0.75} alignItems="center">
              <Avatar sx={{ width: 21, height: 21, fontSize: '0.58rem', bgcolor: owner.avatarColor }}>{owner.initials}</Avatar>
              <Typography variant="body2" noWrap>{owner.name}</Typography>
            </Stack>
            <Typography variant="caption" noWrap sx={{ display: 'block', ml: 3.5 }}>
              Backup: {backup?.name ?? 'not set'}
            </Typography>
          </Box>
        ) : <Chip size="small" label="Unassigned" color="warning" variant="outlined" />;
      },
    },
    {
      id: 'sla', label: 'First-contact SLA', width: 150, sortValue: (r) => r._sla.consumed,
      render: (r) => (
        <Tooltip title={`Target ${r._sla.targetDays} business days · due ${fmtDate(r._sla.dueDate)}${r.firstContactDate ? ` · contacted ${fmtDate(r.firstContactDate)}` : ''}`}>
          <Box><SlaBar consumed={r._sla.consumed} risk={r._sla.risk} /></Box>
        </Tooltip>
      ),
    },
    {
      id: 'created', label: 'Created', hideOn: 'md', sortValue: (r) => r.createdDate,
      render: (r) => (
        <Box>
          <Typography variant="body2">{fmtDate(r.createdDate)}</Typography>
          <Typography variant="caption">{relativeTime(r.createdDate)}</Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Leads"
        subtitle="End-to-end lead management from multi-channel capture, through mandatory assignment with a visible backup resource and structured desktop analysis, to opportunity conversion."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Leads' }]}
        actions={
          <>
            <Button variant="outlined" startIcon={<QrIcon />} onClick={() => navigate('/qr-capture')}>QR capture</Button>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Leads', filtered.map((l) => ({
                Reference: l.reference, Company: l.company, Contact: l.contactName, Email: l.email,
                Telephone: l.phone, Source: l.source, 'Enquiry type': l.enquiryType, Sector: l.sector,
                'Product interest': l.productInterest, Country: l.country, Status: l.status,
                'Qualification score': l.qualificationScore, 'Estimated value (ZAR)': l.estimatedValue,
                Owner: userName(l.ownerId), 'Backup owner': userName(l.backupOwnerId),
                Campaign: store.campaigns.find((c) => c.id === l.campaignId)?.name ?? '',
                Created: fmtDate(l.createdDate), 'SLA due': fmtDate(l.slaDueDate), 'SLA risk': l._sla.risk,
                'Analysis decision': l.desktopAnalysis.decision ?? '', 'Risk rating': l.desktopAnalysis.riskRating ?? '',
                'Converted opportunity': l.convertedOpportunityId ?? '', 'Sync status': l.syncStatus,
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/new')}>New lead</Button>
          </>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total leads" value={num(rows.length)} sub={`${num(worked.length)} worked`} colour="#2563EB" />
        <KpiCard dense label="Unassigned" value={num(unassigned.length)} sub="Cannot progress" colour="#D97706" onClick={() => set('status', 'New')} />
        <KpiCard dense label="Qualified" value={num(qualified.length)} sub={`${pct(worked.length ? (qualified.length / worked.length) * 100 : 0)} of worked`} colour="#059669" onClick={() => set('status', 'Qualified')} />
        <KpiCard dense label="Converted" value={num(converted.length)} sub="To opportunities" colour="#0E7C7B" onClick={() => set('status', 'Converted')} />
        <KpiCard dense label="SLA at risk" value={num(atRisk.length)} sub="First contact overdue" colour="#DC2626" />
        <KpiCard dense label="Pending sync" value={num(pendingSync.length)} sub="Captured offline" colour="#7C3AED" onClick={() => set('sync', 'Pending Sync')} />
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...store.configuration.leadStatuses.map((s) => ({ value: s.label, label: s.label }))] },
          { id: 'source', label: 'Source', options: [{ value: 'all', label: 'All sources' }, ...store.configuration.leadSources.map((s) => ({ value: s.label, label: s.label }))], width: 180 },
          { id: 'owner', label: 'Owner', options: [{ value: 'all', label: 'All owners' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 175 },
          { id: 'sector', label: 'Sector', options: [{ value: 'all', label: 'All sectors' }, ...Array.from(new Set(store.leads.map((l) => l.sector))).sort().map((s) => ({ value: s, label: s }))], width: 195 },
          { id: 'campaign', label: 'Campaign', options: [{ value: 'all', label: 'All campaigns' }, ...store.campaigns.map((c) => ({ value: c.id, label: c.name }))], width: 200 },
          { id: 'sync', label: 'Sync status', options: [{ value: 'all', label: 'All' }, ...['Synced', 'Pending Sync', 'Stored Offline'].map((s) => ({ value: s, label: s }))], width: 150 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ status: 'all', source: 'all', owner: 'all', sector: 'all', campaign: 'all', sync: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search company, contact, reference or email…"
        searchFields={(r) => `${r.reference} ${r.company} ${r.contactName} ${r.email} ${r.phone} ${r.sector} ${r.productInterest}`}
        defaultSort={{ id: 'created', dir: 'desc' }}
        onRowClick={(r) => navigate(`/leads/${r.id}`)}
        initialRowsPerPage={15}
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Assignment rules and resource-pool visibility"
          subtitle="A lead cannot progress beyond New without an owner. Both the primary owner and a backup are recorded so client coverage survives absence."
        >
          <Grid cols={{ xs: 1, md: 3 }} gap={2}>
            {[
              ['Sector-based routing', 'Manufacturing, infrastructure and mining leads route to the corresponding BDU desk based on the captured sector.'],
              ['Territory-based routing', 'Leads for SADC and East Africa route to the officer holding that territory, with the alternate desk as backup.'],
              ['Mandatory backup owner', 'Every assignment records a backup resource who retains visibility of the lead, satisfying the resource-pool requirement.'],
            ].map(([title, body]) => (
              <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
              </Box>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Typography variant="caption">Duplicate detection rules currently active:</Typography>
            {store.configuration.duplicateRules.filter((r) => r.active).map((r) => (
              <Chip key={r.id} size="small" label={`${r.field} · ${r.weight}%`} sx={{ bgcolor: alpha('#0E7C7B', .1), color: '#0E7C7B' }} />
            ))}
            <Button size="small" onClick={() => navigate('/configuration?tab=leads')}>Configure</Button>
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Leads;
