import { Alert, AlertTitle, Box, Button, Chip, Divider, Rating, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  DemoScenarioPanel, EmptyState, Grid, KpiCard, LabelValue, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import { eventPerformance } from '../utils/analytics';
import { fmtDate } from '../utils/dates';
import { num, pct, zar } from '../utils/format';

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();

  const event = store.events.find((e) => e.id === id);
  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        description="This event does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/events')}>Back to events</Button>}
      />
    );
  }

  const perf = eventPerformance([event], store.leads, store.opportunities)[0];
  const organizer = store.organizers.find((o) => o.id === event.organizerId)!;
  const campaign = store.campaigns.find((c) => c.id === event.campaignId);
  const leads = store.leads.filter((l) => l.eventId === event.id);
  const series = store.events.filter((e) => e.recurringSeries && e.recurringSeries === event.recurringSeries);
  const seriesPerf = eventPerformance(series, store.leads, store.opportunities)
    .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime());
  const days = Math.max(1, Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 86400000) + 1);
  const offlineCaptures = store.offlineCaptures.filter((c) => c.eventId === event.id);

  return (
    <Box>
      <PageHeader
        title={event.name}
        subtitle={`${event.reference} · ${event.venue}, ${event.city}, ${event.country} · ${fmtDate(event.startDate)} to ${fmtDate(event.endDate)} (${days} day${days > 1 ? 's' : ''})`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Events / Exhibitions', to: '/events' },
          { label: event.name },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={event.status} />
            {event.qrCaptureEnabled && <Chip size="small" icon={<QrIcon />} label="QR capture enabled" sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />}
            {perf.declining && <Chip size="small" label="ROI declining year on year" sx={{ bgcolor: alpha('#DC2626', .12), color: '#DC2626', fontWeight: 700 }} />}
          </Stack>
        }
        actions={
          event.qrCaptureEnabled && (
            <Button variant="contained" startIcon={<QrIcon />} onClick={() => navigate(`/qr-capture?event=${event.id}`)}>
              Capture leads at this event
            </Button>
          )
        }
      />

      <DemoScenarioPanel
        scenario="An event has run. Marketing reviews how many leads it produced, how many qualified, what revenue followed, and whether the recurring series is still worth the investment."
        evidence={[
          'Leads captured per event and against the target',
          'Conversion rate, opportunities created and attributed revenue',
          'ROI against actual spend, and a Prioritise / Monitor / Reduce recommendation',
          'Recurring-series trend identifying declining performance',
          'Organiser vendor classification and performance history',
        ]}
        requirements={[60, 61, 65, 68]}
        next="Compare against the full event portfolio"
        nextTo="/campaign-performance"
      />

      {perf.declining && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Recurring event with declining return</AlertTitle>
          This event forms part of the “{event.recurringSeries}” series and its ROI is below the previous instance.
          The analytics recommendation is <strong>{perf.recommendation}</strong>.
        </Alert>
      )}

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Budget" value={zar(event.budget, true)} sub={`spent ${zar(event.actualSpend, true)}`} colour="#0B2545" />
        <KpiCard dense label="Leads captured" value={num(perf.leads)} sub={`target ${num(event.expectedLeads)}`} colour="#2563EB" />
        <KpiCard dense label="Qualified leads" value={num(perf.qualified)} sub={pct(perf.conversion)} colour="#059669" />
        <KpiCard dense label="Opportunities" value={num(perf.opportunities)} colour="#7C3AED" />
        <KpiCard dense label="Revenue" value={zar(perf.revenue, true)} sub={`expected ${zar(event.expectedRevenue, true)}`} colour="#0E7C7B" />
        <KpiCard dense label="ROI" value={event.status === 'Planned' ? '—' : pct(perf.roi)} sub={perf.recommendation} colour={perf.roi >= 300 ? '#059669' : perf.roi >= 100 ? '#D97706' : '#DC2626'} />
      </Grid>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard title="Event record" sx={{ mb: 2.5 }}>
            <Grid cols={{ xs: 2, sm: 3 }} gap={2}>
              <LabelValue label="Event reference" value={event.reference} mono />
              <LabelValue label="Venue" value={event.venue} />
              <LabelValue label="City / country" value={`${event.city}, ${event.country}`} />
              <LabelValue label="Start date" value={fmtDate(event.startDate)} />
              <LabelValue label="End date" value={fmtDate(event.endDate)} />
              <LabelValue label="Duration" value={`${days} day(s)`} />
              <LabelValue label="Status" value={<StatusChip value={event.status} />} />
              <LabelValue label="Campaign" value={campaign ? (
                <RouterLink to={`/campaigns/${campaign.id}`} style={{ color: '#0E7C7B' }}>{campaign.name}</RouterLink>
              ) : '—'} />
              <LabelValue label="Recurring series" value={event.recurringSeries ?? 'One-off event'} />
              <LabelValue label="Expected leads" value={num(event.expectedLeads)} />
              <LabelValue label="Expected revenue" value={zar(event.expectedRevenue)} />
              <LabelValue label="QR capture" value={event.qrCaptureEnabled ? 'Enabled' : 'Disabled'} />
              <LabelValue wide label="Target audience" value={event.targetAudience} />
              <LabelValue wide label="Products promoted" value={
                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.4 }}>
                  {event.productsPromoted.map((p) => <Chip key={p} size="small" label={p} />)}
                </Stack>
              } />
            </Grid>
          </SectionCard>

          <SectionCard
            title={`Leads captured at this event (${leads.length})`}
            subtitle="Every lead carries the event and campaign attribution that drives the ROI calculation"
            action={<Button size="small" onClick={() => navigate('/leads')}>Open leads</Button>}
          >
            <Stack gap={1}>
              {leads.length === 0 && (
                <EmptyState
                  title="No leads captured yet"
                  description={event.qrCaptureEnabled
                    ? 'Use QR lead capture at the stand to create leads directly against this event.'
                    : 'QR capture is not enabled for this event.'}
                  action={event.qrCaptureEnabled
                    ? <Button variant="contained" onClick={() => navigate(`/qr-capture?event=${event.id}`)}>Capture a lead</Button>
                    : undefined}
                />
              )}
              {leads.map((l) => (
                <Box
                  key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                  sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'secondary.main' } }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{l.company}</Typography>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                        {l.reference} · {l.contactName} · {l.sector}
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center">
                      <StatusChip value={l.syncStatus} />
                      <StatusChip value={l.status} />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
            {offlineCaptures.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {offlineCaptures.filter((c) => c.status === 'Stored Offline').length} capture(s) are still held offline
                for this event and will create CRM leads on the next synchronisation.
              </Alert>
            )}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Organiser profile">
            <Stack gap={1.5}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{organizer.organisation}</Typography>
                <Typography variant="caption">{organizer.name}</Typography>
              </Box>
              <Chip
                size="small" label={organizer.vendorClassification}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: alpha(organizer.vendorClassification === 'Preferred' ? '#059669' : organizer.vendorClassification === 'Approved' ? '#2563EB' : organizer.vendorClassification === 'Provisional' ? '#D97706' : '#DC2626', .12),
                  color: organizer.vendorClassification === 'Preferred' ? '#059669' : organizer.vendorClassification === 'Approved' ? '#2563EB' : organizer.vendorClassification === 'Provisional' ? '#D97706' : '#DC2626',
                  fontWeight: 700,
                }}
              />
              <Divider />
              <Grid cols={2} gap={1.5}>
                <LabelValue label="Previous events" value={String(organizer.previousEvents)} />
                <LabelValue label="Average ROI" value={pct(organizer.averageRoi)} />
              </Grid>
              <Box>
                <Typography variant="overline" color="text.secondary">Performance rating</Typography>
                <Rating value={organizer.performanceRating} precision={0.1} readOnly size="small" />
              </Box>
              <Divider />
              <Typography variant="caption">{organizer.notes}</Typography>
              <Typography variant="caption">{organizer.email} · {organizer.phone}</Typography>
            </Stack>
          </SectionCard>

          <SectionCard title="Investment recommendation">
            <Alert severity={perf.recommendation === 'Prioritise' ? 'success' : perf.recommendation === 'Monitor' ? 'info' : 'warning'}>
              <AlertTitle sx={{ fontSize: '0.9rem' }}>{perf.recommendation}</AlertTitle>
              <Typography variant="body2">
                {perf.recommendation === 'Prioritise'
                  ? 'Return and lead quality are well above the portfolio median. Increase investment in the next cycle.'
                  : perf.recommendation === 'Monitor'
                    ? 'Performance is acceptable. Retain the current investment and review at the next planning cycle.'
                    : 'Return is below the portfolio median. Consider reallocating this budget to higher-performing channels.'}
              </Typography>
            </Alert>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5 }}>
              Illustrative analytics derived from the demonstration dataset.
            </Typography>
          </SectionCard>

          {seriesPerf.length > 1 && (
            <SectionCard title={`Series trend — ${event.recurringSeries}`} subtitle="ROI across every instance of this recurring event">
              <Stack gap={1.25}>
                {seriesPerf.map((p) => (
                  <Box key={p.event.id}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 160 }}>{fmtDate(p.event.startDate)}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{pct(p.roi)}</Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: 'surface.sunken', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${Math.min(100, Math.max(3, p.roi / 6))}%`, height: '100%',
                        bgcolor: p.roi >= 300 ? '#059669' : p.roi >= 100 ? '#D97706' : '#DC2626',
                      }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          )}
        </Stack>
      </Grid>
    </Box>
  );
}

export default EventDetail;
