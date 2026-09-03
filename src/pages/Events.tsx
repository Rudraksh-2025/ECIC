import * as React from 'react';
import { Box, Button, Chip, Divider, Rating, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { eventPerformance } from '../utils/analytics';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';
import type { CrmEvent } from '../types';

export function Events() {
  const navigate = useNavigate();
  const store = useStore();
  const [filters, setFilters] = React.useState({ status: 'all', organizer: 'all', country: 'all' });
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const perf = eventPerformance(store.events, store.leads, store.opportunities);
  const filtered = store.events.filter((e) =>
    (filters.status === 'all' || e.status === filters.status)
    && (filters.organizer === 'all' || e.organizerId === filters.organizer)
    && (filters.country === 'all' || e.country === filters.country));

  const duration = (e: CrmEvent) =>
    Math.max(1, Math.round((new Date(e.endDate).getTime() - new Date(e.startDate).getTime()) / 86400000) + 1);

  const columns: Column<CrmEvent>[] = [
    {
      id: 'name', label: 'Event', sortValue: (r) => r.name,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 330 }}>
          <Stack direction="row" gap={0.75} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
            {r.qrCaptureEnabled && <QrIcon sx={{ fontSize: 14, color: 'secondary.main', flexShrink: 0 }} />}
          </Stack>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {r.venue}, {r.city}, {r.country}
          </Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 115, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    {
      id: 'dates', label: 'Dates / duration', hideOn: 'md', sortValue: (r) => r.startDate,
      render: (r) => (
        <Box>
          <Typography variant="body2" noWrap>{fmtDate(r.startDate)} – {fmtDate(r.endDate)}</Typography>
          <Typography variant="caption">{duration(r)} day(s)</Typography>
        </Box>
      ),
    },
    {
      id: 'organizer', label: 'Organiser', hideOn: 'md', sortValue: (r) => r.organizerId,
      render: (r) => {
        const o = store.organizers.find((x) => x.id === r.organizerId);
        return (
          <Box>
            <Typography variant="body2" noWrap>{o?.organisation}</Typography>
            <Typography variant="caption">{o?.vendorClassification}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'budget', label: 'Budget / spend', align: 'right', width: 140, sortValue: (r) => r.budget,
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.budget, true)}</Typography>
          <Typography variant="caption">spent {zar(r.actualSpend, true)}</Typography>
        </Box>
      ),
    },
    {
      id: 'leads', label: 'Leads (target)', align: 'center', width: 140,
      sortValue: (r) => perf.find((p) => p.event.id === r.id)?.leads ?? 0,
      render: (r) => {
        const p = perf.find((x) => x.event.id === r.id)!;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{num(p.leads)}</Typography>
            <Typography variant="caption">target {num(r.expectedLeads)} · {pct(p.leadTargetAttainment)}</Typography>
          </Box>
        );
      },
    },
    {
      id: 'roi', label: 'ROI', align: 'right', width: 130,
      sortValue: (r) => perf.find((p) => p.event.id === r.id)?.roi ?? 0,
      render: (r) => {
        const p = perf.find((x) => x.event.id === r.id)!;
        if (r.status === 'Planned') return <Typography variant="caption" color="text.disabled">Not started</Typography>;
        return (
          <Stack direction="row" gap={0.5} alignItems="center" justifyContent="flex-end">
            {p.declining && <Chip size="small" label="declining" sx={{ height: 18, fontSize: '0.58rem', bgcolor: alpha('#DC2626', .12), color: '#DC2626' }} />}
            <Chip
              size="small" label={pct(p.roi)}
              sx={{ bgcolor: alpha(p.roi >= 300 ? '#059669' : p.roi >= 100 ? '#D97706' : '#DC2626', .12), color: p.roi >= 300 ? '#059669' : p.roi >= 100 ? '#D97706' : '#DC2626', fontWeight: 700 }}
            />
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Events & Exhibitions"
        subtitle="Event set-up and lifecycle management with centralised organiser profiles, QR lead capture configuration and per-event performance metrics."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Events / Exhibitions' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Events', filtered.map((e) => {
                const p = perf.find((x) => x.event.id === e.id)!;
                return {
                  'Event ID': e.reference, Name: e.name, Venue: e.venue, City: e.city, Country: e.country,
                  'Start date': e.startDate, 'End date': e.endDate, 'Duration (days)': duration(e),
                  'Target audience': e.targetAudience, 'Products promoted': e.productsPromoted.join(' | '),
                  Campaign: store.campaigns.find((c) => c.id === e.campaignId)?.name ?? '',
                  'Budget (ZAR)': e.budget, 'Actual spend (ZAR)': e.actualSpend,
                  'Expected leads': e.expectedLeads, 'Actual leads': p.leads,
                  'Expected revenue (ZAR)': e.expectedRevenue, 'Actual revenue (ZAR)': p.revenue,
                  Organiser: store.organizers.find((o) => o.id === e.organizerId)?.organisation ?? '',
                  Status: e.status, 'ROI %': Math.round(p.roi),
                  'Conversion %': Math.round(p.conversion), Recommendation: p.recommendation,
                };
              }))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<QrIcon />} onClick={() => navigate('/qr-capture')}>
              Open QR lead capture
            </Button>
          </>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Events" value={num(store.events.length)} colour="#0B2545" />
        <KpiCard dense label="Active" value={num(store.events.filter((e) => e.status === 'Active').length)} colour="#059669" onClick={() => set('status', 'Active')} />
        <KpiCard dense label="Planned" value={num(store.events.filter((e) => e.status === 'Planned').length)} colour="#2563EB" onClick={() => set('status', 'Planned')} />
        <KpiCard dense label="Total event spend" value={zar(store.events.reduce((s, e) => s + e.actualSpend, 0), true)} colour="#D97706" />
        <KpiCard dense label="Event revenue" value={zar(store.events.reduce((s, e) => s + e.actualRevenue, 0), true)} colour="#0E7C7B" />
        <KpiCard dense label="Declining series" value={num(perf.filter((p) => p.declining).length)} sub="ROI down year on year" colour="#DC2626" onClick={() => navigate('/campaign-performance')} />
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...['Planned', 'Active', 'Completed', 'Cancelled'].map((s) => ({ value: s, label: s }))] },
          { id: 'organizer', label: 'Organiser', options: [{ value: 'all', label: 'All organisers' }, ...store.organizers.map((o) => ({ value: o.id, label: o.organisation }))], width: 240 },
          { id: 'country', label: 'Country', options: [{ value: 'all', label: 'All countries' }, ...Array.from(new Set(store.events.map((e) => e.country))).map((c) => ({ value: c, label: c }))], width: 165 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ status: 'all', organizer: 'all', country: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search event, venue, city or organiser…"
        searchFields={(r) => `${r.name} ${r.venue} ${r.city} ${r.country} ${r.targetAudience} ${r.productsPromoted.join(' ')}`}
        defaultSort={{ id: 'dates', dir: 'desc' }}
        onRowClick={(r) => navigate(`/events/${r.id}`)}
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Organiser profiles"
          subtitle="Centralised vendor records with classification, event history and performance, supporting investment decisions on repeat events"
        >
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
            {store.organizers.map((o) => {
              const events = store.events.filter((e) => e.organizerId === o.id);
              return (
                <Box key={o.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }} noWrap>{o.organisation}</Typography>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>{o.name}</Typography>
                    </Box>
                    <Chip
                      size="small" label={o.vendorClassification}
                      sx={{
                        bgcolor: alpha(o.vendorClassification === 'Preferred' ? '#059669' : o.vendorClassification === 'Approved' ? '#2563EB' : o.vendorClassification === 'Provisional' ? '#D97706' : '#DC2626', .12),
                        color: o.vendorClassification === 'Preferred' ? '#059669' : o.vendorClassification === 'Approved' ? '#2563EB' : o.vendorClassification === 'Provisional' ? '#D97706' : '#DC2626',
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                  <Divider sx={{ my: 1.25 }} />
                  <Stack gap={0.6}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">Previous events</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{o.previousEvents}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">Average ROI</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{pct(o.averageRoi)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption">Performance rating</Typography>
                      <Rating value={o.performanceRating} precision={0.1} readOnly size="small" />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption">Events in CRM</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{events.length}</Typography>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1.25 }} />
                  <Typography variant="caption">{o.notes}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                    {o.email} · {o.phone}
                  </Typography>
                </Box>
              );
            })}
          </Grid>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Events;
