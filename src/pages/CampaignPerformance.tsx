import * as React from 'react';
import { Alert, AlertTitle, Box, Button, Chip, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip as RTooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { DataTable, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { AXIS_STYLE, TOOLTIP_STYLE, formatTip } from '../components/charts';
import { campaignPerformance, eventPerformance } from '../utils/analytics';
import type { CampaignPerformance as CampaignPerf, EventPerformance as EventPerf } from '../utils/analytics';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';

const recColour = (r: string) => r === 'Prioritise' ? '#059669' : r === 'Monitor' ? '#D97706' : '#DC2626';

export function CampaignPerformance() {
  const navigate = useNavigate();
  const store = useStore();

  const all = campaignPerformance(store.campaigns, store.leads, store.opportunities);
  const perf = all.filter((p) => p.started && p.spend > 0).sort((a, b) => b.roi - a.roi);
  const planned = all.filter((p) => !p.started);
  const events = eventPerformance(store.events, store.leads, store.opportunities)
    .filter((p) => p.event.status !== 'Planned')
    .sort((a, b) => b.roi - a.roi);

  const totalSpend = perf.reduce((s, p) => s + p.spend, 0);
  const totalRevenue = perf.reduce((s, p) => s + p.revenue, 0);
  const totalLeads = perf.reduce((s, p) => s + p.leads, 0);
  const totalQualified = perf.reduce((s, p) => s + p.qualified, 0);
  const portfolioRoi = totalSpend ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  const declining = events.filter((e) => e.declining);
  const top = perf.slice(0, 3);
  const bottom = [...perf].reverse().slice(0, 3);

  const seriesGroups = React.useMemo(() => {
    const map = new Map<string, EventPerf[]>();
    events.forEach((e) => {
      if (!e.event.recurringSeries) return;
      const list = map.get(e.event.recurringSeries) ?? [];
      list.push(e);
      map.set(e.event.recurringSeries, list);
    });
    return Array.from(map.entries())
      .filter(([, list]) => list.length > 1)
      .map(([name, list]) => ({
        name,
        points: [...list]
          .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime())
          .map((e) => ({ date: fmtDate(e.event.startDate), roi: Math.round(e.roi), leads: e.leads })),
      }));
  }, [events]);

  const campaignColumns: Column<CampaignPerf & { id: string }>[] = [
    {
      id: 'name', label: 'Campaign', sortValue: (r) => r.campaign.name,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 300 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.campaign.name}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {r.campaign.type} · {fmtDate(r.campaign.startDate)} – {fmtDate(r.campaign.endDate)}
          </Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 110, sortValue: (r) => r.campaign.status, render: (r) => <StatusChip value={r.campaign.status} /> },
    { id: 'spend', label: 'Spend', align: 'right', width: 110, sortValue: (r) => r.spend, render: (r) => <Typography variant="body2">{zar(r.spend, true)}</Typography> },
    { id: 'leads', label: 'Leads', align: 'right', width: 90, sortValue: (r) => r.leads, render: (r) => <Typography variant="body2">{num(r.leads)}</Typography> },
    { id: 'qualified', label: 'Qualified', align: 'right', width: 100, hideOn: 'md', sortValue: (r) => r.qualified, render: (r) => <Typography variant="body2">{num(r.qualified)}</Typography> },
    { id: 'opps', label: 'Opportunities', align: 'right', width: 120, hideOn: 'md', sortValue: (r) => r.opportunities, render: (r) => <Typography variant="body2">{num(r.opportunities)}</Typography> },
    { id: 'revenue', label: 'Revenue', align: 'right', width: 120, sortValue: (r) => r.revenue, render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.revenue, true)}</Typography> },
    {
      id: 'conversion', label: 'Conversion', align: 'right', width: 110, hideOn: 'md', sortValue: (r) => r.conversion,
      render: (r) => <Typography variant="body2">{pct(r.conversion)}</Typography>,
    },
    {
      id: 'cpl', label: 'Cost / lead', align: 'right', width: 110, hideOn: 'md', sortValue: (r) => r.costPerLead,
      render: (r) => <Typography variant="body2">{zar(r.costPerLead)}</Typography>,
    },
    {
      id: 'roi', label: 'ROI', align: 'right', width: 100, sortValue: (r) => r.roi,
      render: (r) => r.started
        ? <Chip size="small" label={pct(r.roi)} sx={{ bgcolor: alpha(recColour(r.recommendation), .12), color: recColour(r.recommendation), fontWeight: 700 }} />
        : <Typography variant="caption" color="text.disabled">Not started</Typography>,
    },
    {
      id: 'recommendation', label: 'Recommendation', width: 210, sortValue: (r) => r.recommendation,
      render: (r) => (
        <Chip size="small" label={r.recommendation} sx={{ bgcolor: alpha(recColour(r.recommendation), .1), color: recColour(r.recommendation), fontWeight: 600 }} />
      ),
    },
  ];

  const eventColumns: Column<EventPerf & { id: string }>[] = [
    {
      id: 'name', label: 'Event', sortValue: (r) => r.event.name,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 290 }}>
          <Stack direction="row" gap={0.75} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.event.name}</Typography>
            {r.declining && <TrendingDownIcon sx={{ fontSize: 15, color: 'error.main', flexShrink: 0 }} />}
          </Stack>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {r.event.city}, {r.event.country} · {fmtDate(r.event.startDate)}
          </Typography>
        </Box>
      ),
    },
    { id: 'organizer', label: 'Organiser', hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{store.organizers.find((o) => o.id === r.event.organizerId)?.organisation}</Typography> },
    { id: 'spend', label: 'Spend', align: 'right', width: 110, sortValue: (r) => r.spend, render: (r) => <Typography variant="body2">{zar(r.spend, true)}</Typography> },
    {
      id: 'leads', label: 'Leads (target)', align: 'right', width: 130, sortValue: (r) => r.leads,
      render: (r) => (
        <Box>
          <Typography variant="body2">{num(r.leads)}</Typography>
          <Typography variant="caption">{pct(r.leadTargetAttainment)} of target</Typography>
        </Box>
      ),
    },
    { id: 'qualified', label: 'Qualified', align: 'right', width: 100, hideOn: 'md', sortValue: (r) => r.qualified, render: (r) => <Typography variant="body2">{num(r.qualified)}</Typography> },
    { id: 'revenue', label: 'Revenue', align: 'right', width: 120, sortValue: (r) => r.revenue, render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.revenue, true)}</Typography> },
    { id: 'conversion', label: 'Conversion', align: 'right', width: 110, hideOn: 'md', sortValue: (r) => r.conversion, render: (r) => <Typography variant="body2">{pct(r.conversion)}</Typography> },
    {
      id: 'roi', label: 'ROI', align: 'right', width: 100, sortValue: (r) => r.roi,
      render: (r) => <Chip size="small" label={pct(r.roi)} sx={{ bgcolor: alpha(recColour(r.recommendation), .12), color: recColour(r.recommendation), fontWeight: 700 }} />,
    },
    {
      id: 'recommendation', label: 'Recommendation', width: 210, sortValue: (r) => r.recommendation,
      render: (r) => <Chip size="small" label={r.recommendation} sx={{ bgcolor: alpha(recColour(r.recommendation), .1), color: recColour(r.recommendation), fontWeight: 600 }} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Campaign & Event Performance"
        subtitle="Spend, leads, qualified leads, opportunities, revenue, ROI and conversion for every campaign and exhibition, with investment recommendations and recurring-series trend analysis."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Campaign Performance' }]}
        actions={
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => downloadCsv('ECIC_Campaign_Performance', perf.map((p) => ({
              Campaign: p.campaign.name, Type: p.campaign.type, Status: p.campaign.status,
              'Spend (ZAR)': Math.round(p.spend), Leads: p.leads, 'Qualified leads': p.qualified,
              Opportunities: p.opportunities, 'Revenue (ZAR)': Math.round(p.revenue),
              'ROI %': Math.round(p.roi), 'Conversion %': Math.round(p.conversion),
              'Cost per lead (ZAR)': Math.round(p.costPerLead),
              Recommendation: p.recommendation, Rationale: p.rationale,
            })))}
          >
            Export Excel
          </Button>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Marketing spend" value={zar(totalSpend, true)} sub={`${perf.length} campaigns`} colour="#0B2545" />
        <KpiCard dense label="Attributed revenue" value={zar(totalRevenue, true)} colour="#059669" />
        <KpiCard dense label="Portfolio ROI" value={pct(portfolioRoi)} sub="Revenue over spend" colour="#0E7C7B" />
        <KpiCard dense label="Leads generated" value={num(totalLeads)} sub={`${num(totalQualified)} qualified`} colour="#2563EB" />
        <KpiCard dense label="Cost per lead" value={totalLeads ? zar(totalSpend / totalLeads) : '—'} colour="#D97706" />
        <KpiCard dense label="Declining series" value={num(declining.length)} sub={`${num(planned.length)} campaign(s) not yet started`} colour="#DC2626" />
      </Grid>

      {declining.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }} icon={<TrendingDownIcon />}>
          <AlertTitle>Recurring events with declining return</AlertTitle>
          {declining.map((e) => `${e.event.name} (ROI ${pct(e.roi)})`).join(', ')} —
          each of these performed below the previous instance of the same series. The analytics recommendation is to
          review or reduce the investment.
        </Alert>
      )}

      <Grid cols={{ xs: 1, lg: 2 }} gap={2.5} sx={{ mb: 2.5 }}>
        <SectionCard title="Campaign ROI ranking" subtitle="Return on investment by campaign (%)">
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={perf.map((p) => ({ name: p.campaign.name.length > 24 ? `${p.campaign.name.slice(0, 22)}…` : p.campaign.name, roi: Math.round(p.roi) }))} layout="vertical" margin={{ left: 4, right: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 9.5 }} width={140} axisLine={false} tickLine={false} />
                <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v) => [`${v}%`, 'ROI'])} />
                <Bar dataKey="roi" radius={[0, 6, 6, 0]}>
                  {perf.map((p, i) => <Cell key={i} fill={recColour(p.recommendation)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>

        <SectionCard title="Spend versus revenue by event" subtitle="Bubble size represents leads captured">
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 8, right: 16, top: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" />
                <XAxis
                  type="number" dataKey="spend" name="Spend" unit="k"
                  tick={AXIS_STYLE} axisLine={false} tickLine={false}
                />
                <YAxis
                  type="number" dataKey="revenue" name="Revenue" unit="m"
                  tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40}
                />
                <ZAxis type="number" dataKey="leads" range={[60, 420]} name="Leads" />
                <RTooltip {...TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Scatter
                  name="Events"
                  data={events.map((e) => ({
                    spend: Math.round(e.spend / 1000),
                    revenue: Number((e.revenue / 1_000_000).toFixed(1)),
                    leads: e.leads,
                    name: e.event.name,
                    rec: e.recommendation,
                  }))}
                >
                  {events.map((e, i) => <Cell key={i} fill={recColour(e.recommendation)} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
      </Grid>

      {seriesGroups.length > 0 && (
        <SectionCard title="Recurring event series trend" subtitle="ROI across successive instances of the same event series" sx={{ mb: 2.5 }}>
          <Grid cols={{ xs: 1, md: seriesGroups.length > 1 ? 2 : 1 }} gap={2}>
            {seriesGroups.map((g) => (
              <Box key={g.name}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{g.name}</Typography>
                <Box sx={{ width: '100%', height: 190 }}>
                  <ResponsiveContainer>
                    <LineChart data={g.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
                      <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={42} unit="%" />
                      <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v, n) => [n === 'roi' ? `${v}%` : String(v), n === 'roi' ? 'ROI' : 'Leads'])} />
                      <Line type="monotone" dataKey="roi" stroke="#0B2545" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      )}

      <Grid cols={{ xs: 1, md: 2 }} gap={2.5} sx={{ mb: 2.5 }}>
        <SectionCard title="High-performing campaigns" subtitle="Prioritise investment in the next cycle">
          <Stack gap={1.25}>
            {top.map((p) => (
              <Box
                key={p.campaign.id} onClick={() => navigate(`/campaigns/${p.campaign.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid', borderColor: alpha('#059669', .3), bgcolor: alpha('#059669', .03),
                  '&:hover': { borderColor: '#059669' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.campaign.name}</Typography>
                    <Typography variant="caption">
                      {zar(p.spend, true)} spend · {num(p.leads)} leads · {zar(p.revenue, true)} revenue
                    </Typography>
                  </Box>
                  <Chip size="small" label={pct(p.roi)} sx={{ bgcolor: alpha('#059669', .14), color: '#059669', fontWeight: 700 }} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Low-performing campaigns" subtitle="Consider reducing or reallocating this investment">
          <Stack gap={1.25}>
            {bottom.map((p) => (
              <Box
                key={p.campaign.id} onClick={() => navigate(`/campaigns/${p.campaign.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid', borderColor: alpha('#DC2626', .3), bgcolor: alpha('#DC2626', .03),
                  '&:hover': { borderColor: '#DC2626' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{p.campaign.name}</Typography>
                    <Typography variant="caption">{p.rationale}</Typography>
                  </Box>
                  <Chip size="small" label={pct(p.roi)} sx={{ bgcolor: alpha('#DC2626', .12), color: '#DC2626', fontWeight: 700 }} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      </Grid>

      <SectionCard title="Campaign performance detail" sx={{ mb: 2.5 }}>
        <DataTable
          rows={perf.map((p) => ({ ...p, id: p.campaign.id }))}
          columns={campaignColumns}
          searchable
          searchPlaceholder="Search campaign…"
          searchFields={(r) => `${r.campaign.name} ${r.campaign.type} ${r.recommendation}`}
          defaultSort={{ id: 'roi', dir: 'desc' }}
          onRowClick={(r) => navigate(`/campaigns/${r.campaign.id}`)}
          initialRowsPerPage={10}
        />
      </SectionCard>

      <SectionCard title="Event performance detail" subtitle="Historical exhibitions with lead attainment against target">
        <DataTable
          rows={events.map((e) => ({ ...e, id: e.event.id }))}
          columns={eventColumns}
          searchable
          searchPlaceholder="Search event…"
          searchFields={(r) => `${r.event.name} ${r.event.city} ${r.event.country} ${r.recommendation}`}
          defaultSort={{ id: 'roi', dir: 'desc' }}
          onRowClick={(r) => navigate(`/events/${r.event.id}`)}
          initialRowsPerPage={10}
        />
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption">
          Recommendations are illustrative analytics computed from the demonstration dataset — they are a worked
          example of the decision support the CRM provides, not investment advice.
        </Typography>
      </SectionCard>
    </Box>
  );
}

export default CampaignPerformance;
