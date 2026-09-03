import * as React from 'react';
import { Box, Button, Chip, Divider, MenuItem, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Grid, KpiCard, PageHeader, SectionCard, Stack } from '../components';
import { AXIS_STYLE, CHART_COLOURS, TOOLTIP_STYLE, formatTip } from '../components/charts';
import { averageStageDurations, pipelineMetrics, sumBy } from '../utils/analytics';
import { monthBuckets } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';

export function Analytics() {
  const navigate = useNavigate();
  const store = useStore();
  const [filters, setFilters] = React.useState({ owner: 'all', stage: 'all', campaign: 'all', period: '9' });
  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const opportunities = store.opportunities.filter((o) =>
    (filters.owner === 'all' || o.ownerId === filters.owner)
    && (filters.stage === 'all' || o.stage === filters.stage)
    && (filters.campaign === 'all' || o.campaignId === filters.campaign));

  const metrics = pipelineMetrics(opportunities, store.leads);
  const avgStage = averageStageDurations(store.opportunities);

  const forecast = monthBuckets(Number(filters.period)).map((b) => {
    const open = opportunities.filter((o) => {
      const d = new Date(o.expectedCloseDate);
      return d >= b.start && d <= b.end && !o.closedDate;
    });
    const won = opportunities.filter((o) => {
      if (!o.closedDate || o.stage !== 'Closed Won') return false;
      const d = new Date(o.closedDate);
      return d >= b.start && d <= b.end;
    });
    const m = (n: number) => Number((n / 1_000_000).toFixed(1));
    return {
      month: b.key,
      pipeline: m(open.reduce((s, o) => s + o.estimatedValue, 0)),
      bestCase: m(open.filter((o) => ['Best Case', 'Commit'].includes(o.forecastCategory)).reduce((s, o) => s + o.estimatedValue, 0)),
      commit: m(open.filter((o) => o.forecastCategory === 'Commit').reduce((s, o) => s + o.estimatedValue, 0)),
      weighted: m(open.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0)),
      won: m(won.reduce((s, o) => s + o.estimatedValue, 0)),
    };
  });

  const byOwner = sumBy(opportunities.filter((o) => !o.closedDate),
    (o) => store.users.find((u) => u.id === o.ownerId)?.name ?? '—', (o) => o.estimatedValue);

  const byStage = ['Qualification', 'Proposal / Solution', 'Negotiation'].map((stage) => {
    const items = opportunities.filter((o) => o.stage === stage);
    return {
      stage: stage.replace(' / Solution', ''),
      value: Number((items.reduce((s, o) => s + o.estimatedValue, 0) / 1_000_000).toFixed(1)),
      weighted: Number((items.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0) / 1_000_000).toFixed(1)),
      count: items.length,
      avgDays: Math.round(avgStage[stage] ?? 0),
    };
  });

  const lossReasons = React.useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    opportunities.filter((o) => o.stage === 'Closed Lost' && o.closedLostReason).forEach((o) => {
      const key = o.closedLostReason as string;
      const prev = map.get(key) ?? { count: 0, value: 0 };
      map.set(key, { count: prev.count + 1, value: prev.value + o.estimatedValue });
    });
    return Array.from(map, ([name, v]) => ({ name, count: v.count, value: Number((v.value / 1_000_000).toFixed(1)) }))
      .sort((a, b) => b.value - a.value);
  }, [opportunities]);

  const bySector = sumBy(
    opportunities.filter((o) => !o.closedDate),
    (o) => store.customers.find((c) => c.id === o.customerId)?.sector ?? 'Unspecified',
    (o) => o.estimatedValue,
  ).slice(0, 8);

  return (
    <Box>
      <PageHeader
        title="Analytics & Revenue Forecast"
        subtitle="Opportunity-based forecasting with best case, commit, weighted and won views, pipeline analysis by stage, owner and sector, and win/loss analysis."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Analytics & Forecast' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Revenue_Forecast', forecast.map((f) => ({
                Month: f.month, 'Open pipeline (ZAR m)': f.pipeline, 'Best case (ZAR m)': f.bestCase,
                'Commit (ZAR m)': f.commit, 'Weighted forecast (ZAR m)': f.weighted, 'Won revenue (ZAR m)': f.won,
              })))}
            >
              Export forecast
            </Button>
            <Button variant="contained" onClick={() => navigate('/reports/RPT-O2')}>Open forecast report</Button>
          </>
        }
      />

      <Box className="no-print" sx={{
        display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 2.5, p: 1.5,
        borderRadius: 3, bgcolor: 'surface.subtle', border: '1px solid', borderColor: 'divider',
      }}>
        <TextField select size="small" label="Owner" value={filters.owner} onChange={(e) => set('owner', e.target.value)} sx={{ minWidth: 190, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All owners</MenuItem>
          {store.users.filter((u) => ['bdu_officer', 'sales_user'].includes(u.role)).map((u) => (
            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Stage" value={filters.stage} onChange={(e) => set('stage', e.target.value)} sx={{ minWidth: 180, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All stages</MenuItem>
          {store.configuration.opportunityStages.map((s) => <MenuItem key={s.id} value={s.label}>{s.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Campaign" value={filters.campaign} onChange={(e) => set('campaign', e.target.value)} sx={{ minWidth: 210, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All campaigns</MenuItem>
          {store.campaigns.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Forecast period" value={filters.period} onChange={(e) => set('period', e.target.value)} sx={{ minWidth: 170, bgcolor: 'background.paper' }}>
          <MenuItem value="6">6 months</MenuItem>
          <MenuItem value="9">9 months</MenuItem>
          <MenuItem value="12">12 months</MenuItem>
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={() => setFilters({ owner: 'all', stage: 'all', campaign: 'all', period: '9' })}>Reset</Button>
      </Box>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Open pipeline" value={zar(metrics.openValue, true)} sub={`${num(metrics.openCount)} opportunities`} colour="#0B2545" />
        <KpiCard dense label="Best case" value={zar(metrics.bestCase, true)} sub="Proposal + negotiation" colour="#7C3AED" />
        <KpiCard dense label="Commit" value={zar(metrics.commit, true)} sub="Negotiation stage" colour="#D97706" />
        <KpiCard dense label="Weighted forecast" value={zar(metrics.weighted, true)} sub="Probability adjusted" colour="#0E7C7B" />
        <KpiCard dense label="Won revenue" value={zar(metrics.won, true)} sub={`${num(metrics.wonCount)} deals`} colour="#059669" />
        <KpiCard dense label="Pipeline velocity" value={`${metrics.velocityDays.toFixed(0)} days`} sub={`avg deal ${zar(metrics.averageDeal, true)}`} colour="#2563EB" />
      </Grid>

      <SectionCard title="Revenue forecast by month" subtitle="ZAR millions — open pipeline, best case, commit, weighted forecast and won revenue" sx={{ mb: 2.5 }}>
        <Box sx={{ width: '100%', height: 340 }}>
          <ResponsiveContainer>
            <ComposedChart data={forecast}>
              <defs>
                <linearGradient id="aPipeline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={44} unit="m" />
              <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v) => `R ${v}m`)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="pipeline" name="Open pipeline" stroke="#2563EB" fill="url(#aPipeline)" strokeWidth={1.5} />
              <Bar dataKey="won" name="Won revenue" fill="#059669" radius={[5, 5, 0, 0]} barSize={22} />
              <Line type="monotone" dataKey="bestCase" name="Best case" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="commit" name="Commit" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="weighted" name="Weighted forecast" stroke="#0E7C7B" strokeWidth={2.75} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </SectionCard>

      <Grid cols={{ xs: 1, lg: 2 }} gap={2.5} sx={{ mb: 2.5 }}>
        <SectionCard title="Pipeline by stage" subtitle="Value and weighted value in ZAR millions, with average time in stage">
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={byStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
                <XAxis dataKey="stage" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} unit="m" />
                <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v) => `R ${v}m`)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="value" name="Pipeline value" fill="#0B2545" radius={[5, 5, 0, 0]} />
                <Bar dataKey="weighted" name="Weighted" fill="#0E7C7B" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Stack gap={0.75}>
            {byStage.map((s) => (
              <Stack key={s.stage} direction="row" justifyContent="space-between">
                <Typography variant="body2">{s.stage}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.count} opportunities · average {s.avgDays} days in stage
                </Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Pipeline by owner" subtitle="Open opportunity value per Business Development Officer">
          <Box sx={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={byOwner.map((o) => ({ name: o.name, value: Number((o.total / 1_000_000).toFixed(1)) }))} layout="vertical" margin={{ left: 4, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="m" />
                <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 10 }} width={128} axisLine={false} tickLine={false} />
                <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v) => [`R ${v}m`, 'Open pipeline'])} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byOwner.map((_, i) => <Cell key={i} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
      </Grid>

      <Grid cols={{ xs: 1, lg: 2 }} gap={2.5}>
        <SectionCard title="Win / loss analysis" subtitle="Loss reasons ranked by value lost (ZAR millions)">
          {lossReasons.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No closed-lost opportunities in the current selection.
            </Typography>
          ) : (
            <>
              <Box sx={{ width: '100%', height: 230 }}>
                <ResponsiveContainer>
                  <BarChart data={lossReasons} layout="vertical" margin={{ left: 4, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
                    <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} unit="m" />
                    <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 10 }} width={128} axisLine={false} tickLine={false} />
                    <RTooltip {...TOOLTIP_STYLE} formatter={formatTip((v) => [`R ${v}m`, 'Value lost'])} />
                    <Bar dataKey="value" fill="#DC2626" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Divider sx={{ my: 1.5 }} />
            </>
          )}
          <Grid cols={{ xs: 2, sm: 4 }} gap={2}>
            <Box>
              <Typography variant="caption">Win ratio</Typography>
              <Typography variant="h4">{pct(metrics.winRatio)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Loss ratio</Typography>
              <Typography variant="h4">{pct(metrics.lossRatio)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Lead conversion</Typography>
              <Typography variant="h4">{pct(metrics.conversionRatio)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Average deal</Typography>
              <Typography variant="h4">{zar(metrics.averageDeal, true)}</Typography>
            </Box>
          </Grid>
        </SectionCard>

        <SectionCard title="Pipeline by sector" subtitle="Open opportunity value by customer sector">
          <Stack gap={1.25}>
            {bySector.map((s, i) => {
              const max = bySector[0]?.total || 1;
              return (
                <Box key={s.name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>{s.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{zar(s.total, true)}</Typography>
                  </Stack>
                  <Box sx={{ height: 10, bgcolor: 'surface.sunken', borderRadius: 5, overflow: 'hidden' }}>
                    <Box sx={{
                      width: `${Math.max(3, (s.total / max) * 100)}%`, height: '100%',
                      background: `linear-gradient(90deg, ${CHART_COLOURS[i % CHART_COLOURS.length]} 0%, ${alpha(CHART_COLOURS[i % CHART_COLOURS.length], .65)} 100%)`,
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip size="small" label={`${num(opportunities.length)} opportunities in selection`} />
            <Chip size="small" label={`${num(store.leads.filter((l) => l.status === 'Converted').length)} converted leads`} />
          </Stack>
        </SectionCard>
      </Grid>
    </Box>
  );
}

export default Analytics;
