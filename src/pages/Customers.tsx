import * as React from 'react';
import { Avatar, Box, Button, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { downloadCsv, maskEmail, maskPhone, num, zar } from '../utils/format';
import { COUNTRIES, SECTORS } from '../data/customers';
import type { Customer } from '../types';

export function Customers() {
  const navigate = useNavigate();
  const store = useStore();
  const masked = useMasking();
  const [filters, setFilters] = React.useState({ type: 'all', status: 'all', sector: 'all', country: 'all', owner: 'all' });

  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const filtered = store.customers.filter((c) =>
    (filters.type === 'all' || c.customerType === filters.type)
    && (filters.status === 'all' || c.status === filters.status)
    && (filters.sector === 'all' || c.sector === filters.sector)
    && (filters.country === 'all' || c.country === filters.country)
    && (filters.owner === 'all' || c.accountOwnerId === filters.owner));

  const columns: Column<Customer>[] = [
    {
      id: 'organisation', label: 'Organisation', sortValue: (r) => r.organisation,
      render: (r) => (
        <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{
            width: 32, height: 32, fontSize: '0.7rem', bgcolor: alpha('#0B2545', .1), color: '#0B2545',
          }}>
            {r.organisation.split(' ').slice(0, 2).map((w) => w[0]).join('')}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.organisation}</Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.id} · {r.registrationNo}</Typography>
          </Box>
        </Stack>
      ),
    },
    { id: 'type', label: 'Type', width: 150, sortValue: (r) => r.customerType, render: (r) => <Chip size="small" label={r.customerType} /> },
    { id: 'sector', label: 'Sector', sortValue: (r) => r.sector, hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{r.sector}</Typography> },
    {
      id: 'contact', label: 'Primary contact', sortValue: (r) => r.contactPerson, hideOn: 'sm',
      render: (r) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>{r.contactPerson}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {masked ? maskEmail(r.email) : r.email}
          </Typography>
        </Box>
      ),
    },
    { id: 'country', label: 'Country', width: 130, sortValue: (r) => r.country, hideOn: 'md', render: (r) => <Typography variant="body2">{r.country}</Typography> },
    {
      id: 'value', label: 'Annual export value', align: 'right', width: 150, sortValue: (r) => r.annualExportValue,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.annualExportValue ? zar(r.annualExportValue, true) : '—'}</Typography>,
    },
    { id: 'status', label: 'Status', width: 118, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    {
      id: 'owner', label: 'Account owner', hideOn: 'md', sortValue: (r) => r.accountOwnerId,
      render: (r) => {
        const u = store.users.find((x) => x.id === r.accountOwnerId);
        return (
          <Stack direction="row" gap={0.75} alignItems="center">
            <Avatar sx={{ width: 21, height: 21, fontSize: '0.58rem', bgcolor: u?.avatarColor }}>{u?.initials}</Avatar>
            <Typography variant="body2" noWrap>{u?.name}</Typography>
          </Stack>
        );
      },
    },
    {
      id: 'records', label: 'Related records', width: 190, hideOn: 'md',
      render: (r) => {
        const leads = store.leads.filter((l) => l.customerId === r.id).length;
        const opps = store.opportunities.filter((o) => o.customerId === r.id).length;
        const cases = store.complaints.filter((c) => c.customerId === r.id).length;
        const apps = store.applications.filter((a) => a.customerId === r.id).length;
        return (
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {leads > 0 && <Chip size="small" label={`${leads} lead`} sx={{ height: 19, fontSize: '0.6rem', bgcolor: alpha('#2563EB', .1), color: '#2563EB' }} />}
            {opps > 0 && <Chip size="small" label={`${opps} opp`} sx={{ height: 19, fontSize: '0.6rem', bgcolor: alpha('#0E7C7B', .1), color: '#0E7C7B' }} />}
            {cases > 0 && <Chip size="small" label={`${cases} case`} sx={{ height: 19, fontSize: '0.6rem', bgcolor: alpha('#DC2626', .1), color: '#DC2626' }} />}
            {apps > 0 && <Chip size="small" label={`${apps} app`} sx={{ height: 19, fontSize: '0.6rem', bgcolor: alpha('#7C3AED', .1), color: '#7C3AED' }} />}
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Customers / Accounts"
        subtitle="A single customer record linking every lead, opportunity, application, document, case and activity — the basis of the 360 view and full transaction traceability."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Customers / Accounts' }]}
        actions={
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => downloadCsv('ECIC_Customers', filtered.map((c) => ({
              'Customer ID': c.id, Organisation: c.organisation, 'Contact person': c.contactPerson,
              Type: c.customerType, Email: c.email, Telephone: c.phone, Country: c.country,
              City: c.city, Sector: c.sector, 'Preferred channel': c.preferredChannel,
              Status: c.status, 'Date created': c.createdDate,
              'Account owner': store.users.find((u) => u.id === c.accountOwnerId)?.name ?? '',
              'Registration number': c.registrationNo,
              'Annual export value (ZAR)': c.annualExportValue,
              'Marketing consent': c.consentMarketing ? 'Yes' : 'No',
              'Retention until': c.retentionUntil,
            })))}
          >
            Export Excel
          </Button>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total accounts" value={num(store.customers.length)} colour="#0B2545" />
        <KpiCard dense label="Active" value={num(store.customers.filter((c) => c.status === 'Active').length)} colour="#059669" onClick={() => set('status', 'Active')} />
        <KpiCard dense label="Prospects" value={num(store.customers.filter((c) => c.status === 'Prospect').length)} colour="#2563EB" onClick={() => set('status', 'Prospect')} />
        <KpiCard dense label="Onboarding" value={num(store.customers.filter((c) => c.status === 'Onboarding').length)} colour="#7C3AED" onClick={() => set('status', 'Onboarding')} />
        <KpiCard dense label="Exporters" value={num(store.customers.filter((c) => c.customerType === 'Exporter').length)} colour="#0E7C7B" onClick={() => set('type', 'Exporter')} />
        <KpiCard dense label="Combined export value" value={zar(store.customers.reduce((s, c) => s + c.annualExportValue, 0), true)} colour="#C9A227" />
      </Grid>

      <FilterBar
        filters={[
          { id: 'type', label: 'Customer type', options: [{ value: 'all', label: 'All types' }, ...['Exporter', 'Financial Institution', 'Broker', 'Project Sponsor', 'Internal'].map((t) => ({ value: t, label: t }))], width: 180 },
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...['Active', 'Prospect', 'Dormant', 'Onboarding'].map((s) => ({ value: s, label: s }))] },
          { id: 'sector', label: 'Sector', options: [{ value: 'all', label: 'All sectors' }, ...SECTORS.map((s) => ({ value: s, label: s }))], width: 205 },
          { id: 'country', label: 'Country', options: [{ value: 'all', label: 'All countries' }, ...COUNTRIES.map((c) => ({ value: c, label: c }))], width: 165 },
          { id: 'owner', label: 'Account owner', options: [{ value: 'all', label: 'All owners' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 180 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ type: 'all', status: 'all', sector: 'all', country: 'all', owner: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search organisation, contact, sector or registration number…"
        searchFields={(r) => `${r.organisation} ${r.contactPerson} ${r.sector} ${r.country} ${r.registrationNo} ${r.id}`}
        defaultSort={{ id: 'organisation', dir: 'asc' }}
        onRowClick={(r) => navigate(`/customers/${r.id}`)}
        initialRowsPerPage={15}
      />
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption">
          {masked
            ? 'Personal information is currently masked for your role. Use the eye icon in the header to unmask if your role permits it — every unmasking is written to the audit log.'
            : 'Personal information is currently visible. This action was recorded in the audit log.'}
          {' '}Records shown: {filtered.length} of {store.customers.length}. Contact telephone example: {masked ? maskPhone('+27 12 471 3000') : '+27 12 471 3000'}.
        </Typography>
      </Box>
    </Box>
  );
}

export default Customers;
