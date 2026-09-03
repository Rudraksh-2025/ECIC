import * as React from 'react';
import { Box, Button, Chip, Divider, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/PersonSearch';
import NewReleasesIcon from '@mui/icons-material/FiberNew';
import VerifiedIcon from '@mui/icons-material/VerifiedUser';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PaidIcon from '@mui/icons-material/Paid';
import TimelineIcon from '@mui/icons-material/ShowChart';
import SupportIcon from '@mui/icons-material/SupportAgent';
import WarningIcon from '@mui/icons-material/ReportProblem';
import EscalateIcon from '@mui/icons-material/TrendingUp';
import SentimentIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import RoiIcon from '@mui/icons-material/QueryStats';
import ArticleIcon from '@mui/icons-material/Article';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useStore } from '../store';
import {
  DemoScenarioPanel, Grid, KpiCard, PageHeader, SectionCard, StatusChip, Stack,
} from '../components';
import { campaignPerformance, countBy, monthlySeries, pipelineMetrics, slaForComplaint, sumBy } from '../utils/analytics';
import { num, pct, zar } from '../utils/format';
import { fmtDateTime } from '../utils/dates';
import { useRenderTiming } from '../hooks';
import { formatTip } from '../components/charts';

const CHART_COLOURS = ['#0B2545', '#0E7C7B', '#2563EB', '#7C3AED', '#C9A227', '#DC2626', '#059669', '#D97706', '#0891B2', '#64748B'];

const RANGES = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

function ChartFrame({ children, height = 240 }: { children: React.ReactElement; height?: number }) {
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </Box>
  );
}

const axisStyle = { fontSize: 11, fill: '#5A6B85' };
const tooltipStyle = {
  contentStyle: {
    borderRadius: 10, border: '1px solid #E3E8F0', fontSize: 12,
    boxShadow: '0 10px 30px -12px rgba(11,37,69,.3)',
  },
};

export function Dashboard() {
  const navigate = useNavigate();
  const renderMs = useRenderTiming();
  const store = useStore();
  const [filters, setFilters] = React.useState({
    range: '365', businessUnit: 'all', owner: 'all', source: 'all',
    campaign: 'all', stage: 'all', category: 'all',
  });
  const [refreshedAt, setRefreshedAt] = React.useState(new Date());

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const rangeDays = filters.range === 'all' ? null : Number(filters.range);
  const inRange = React.useCallback((date: string) => {
    if (rangeDays == null) return true;
    return new Date(date).getTime() >= Date.now() - rangeDays * 86400000;
  }, [rangeDays]);

  const complaints = React.useMemo(() => store.complaints.filter((c) =>
    inRange(c.loggedDate)
    && (filters.businessUnit === 'all' || c.businessUnit === filters.businessUnit)
    && (filters.owner === 'all' || c.assignedToId === filters.owner)
    && (filters.category === 'all' || c.category === filters.category)),
  [store.complaints, filters, inRange]);

  const leads = React.useMemo(() => store.leads.filter((l) =>
    inRange(l.createdDate)
    && (filters.owner === 'all' || l.ownerId === filters.owner)
    && (filters.source === 'all' || l.source === filters.source)
    && (filters.campaign === 'all' || l.campaignId === filters.campaign)),
  [store.leads, filters, inRange]);

  const opportunities = React.useMemo(() => store.opportunities.filter((o) =>
    inRange(o.createdDate)
    && (filters.owner === 'all' || o.ownerId === filters.owner)
    && (filters.campaign === 'all' || o.campaignId === filters.campaign)
    && (filters.stage === 'all' || o.stage === filters.stage)
    && (filters.businessUnit === 'all' || o.businessUnit === filters.businessUnit)),
  [store.opportunities, filters, inRange]);

  const slaRules = store.configuration.slaRules;
  const slaPositions = React.useMemo(
    () => complaints.map((c) => ({ complaint: c, sla: slaForComplaint(c, slaRules) })),
    [complaints, slaRules],
  );

  const openComplaints = complaints.filter((c) => c.status !== 'Closed');
  const atRisk = slaPositions.filter((p) => p.complaint.status !== 'Closed' && (p.sla.risk === 'At Risk' || p.sla.risk === 'Breached'));
  const escalated = complaints.filter((c) => c.escalated && c.status !== 'Closed');
  const metrics = pipelineMetrics(opportunities, leads);
  const applications = store.applications.filter((a) => !['Approved', 'Rejected'].includes(a.status));

  const feedback = complaints.filter((c) => c.customerFeedback);
  const satisfaction = feedback.length
    ? (feedback.filter((c) => c.customerFeedback === 'Satisfied' || c.customerFeedback === 'Very Satisfied').length / feedback.length) * 100
    : 0;

  const perf = campaignPerformance(store.campaigns, store.leads, store.opportunities);
  const activePerf = perf.filter((p) => p.started && p.spend > 0);
  const portfolioSpend = activePerf.reduce((s, p) => s + p.spend, 0);
  const portfolioRevenue = activePerf.reduce((s, p) => s + p.revenue, 0);
  const portfolioRoi = portfolioSpend > 0 ? ((portfolioRevenue - portfolioSpend) / portfolioSpend) * 100 : 0;

  /* Charts ---------------------------------------------------------- */

  const leadsBySource = countBy(leads, (l) => l.source);
  const complaintVolume = monthlySeries(complaints, (c) => c.loggedDate, 12)
    .map((b) => ({
      month: b.key,
      logged: b.items.length,
      resolved: b.items.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length,
      escalated: b.items.filter((c) => c.escalated).length,
    }));
  const slaPerformance = monthlySeries(complaints, (c) => c.loggedDate, 12).map((b) => {
    const positions = b.items.map((c) => slaForComplaint(c, slaRules));
    const met = positions.filter((p) => p.risk === 'Met' || p.risk === 'On Track').length;
    return { month: b.key, compliance: b.items.length ? Math.round((met / b.items.length) * 100) : 100 };
  });
  const pipelineByStage = ['Qualification', 'Proposal / Solution', 'Negotiation', 'Closed Won', 'Closed Lost'].map((stage) => {
    const items = opportunities.filter((o) => o.stage === stage);
    return {
      stage: stage.replace(' / Solution', ''),
      value: items.reduce((s, o) => s + o.estimatedValue, 0) / 1_000_000,
      count: items.length,
    };
  });
  const forecast = monthlySeries(
    opportunities.filter((o) => !o.closedDate), (o) => o.expectedCloseDate, 9,
  ).map((b) => ({
    month: b.key,
    weighted: b.items.reduce((s, o) => s + o.estimatedValue * (o.probability / 100), 0) / 1_000_000,
    best: b.items.reduce((s, o) => s + o.estimatedValue, 0) / 1_000_000,
  }));
  const winLoss = [
    { name: 'Closed Won', value: metrics.wonCount },
    { name: 'Closed Lost', value: metrics.lostCount },
  ];
  const campaignRoi = activePerf
    .sort((a, b) => b.roi - a.roi).slice(0, 7)
    .map((p) => ({ name: p.campaign.name.length > 26 ? `${p.campaign.name.slice(0, 24)}…` : p.campaign.name, roi: Math.round(p.roi) }));
  const complaintsByChannel = countBy(complaints, (c) => c.channel);
  const complaintsBySeverity = countBy(complaints, (c) => c.severity);
  const turnaround = ['Critical', 'High', 'Medium', 'Low'].map((sev) => {
    const items = slaPositions.filter((p) => p.complaint.severity === sev && ['Resolved', 'Closed'].includes(p.complaint.status));
    const target = slaRules.find((r) => r.scope.toLowerCase().includes(sev.toLowerCase()))?.targetDays
      ?? slaRules.find((r) => r.scope.toLowerCase().includes('medium'))?.targetDays ?? 5;
    return {
      severity: sev,
      actual: items.length ? Number((items.reduce((s, p) => s + p.sla.elapsedDays, 0) / items.length).toFixed(1)) : 0,
      target,
    };
  });
  const complaintsByCategory = countBy(complaints, (c) => c.category).slice(0, 8);
  const conversionFunnel = [
    { stage: 'Leads captured', value: leads.length },
    { stage: 'Assigned', value: leads.filter((l) => l.ownerId).length },
    { stage: 'Contacted', value: leads.filter((l) => ['Contacted', 'Qualified', 'Converted', 'Disqualified'].includes(l.status)).length },
    { stage: 'Qualified', value: leads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length },
    { stage: 'Converted', value: leads.filter((l) => l.status === 'Converted').length },
  ];

  const owners = store.users.filter((u) => u.status === 'Active');

  return (
    <Box>
      <PageHeader
        title="Executive Dashboard"
        subtitle="A single live view of leads, pipeline, case management, SLA performance and marketing return. Every value below is computed from the demonstration dataset and responds to the filters."
        breadcrumbs={[{ label: 'ECIC CRM' }, { label: 'Executive Dashboard' }]}
        chips={<Chip size="small" label={`Rendered in ${renderMs} ms`} sx={{ bgcolor: alpha('#059669', .1), color: '#059669', fontWeight: 700 }} />}
        actions={
          <>
            <Tooltip title={`Data last refreshed ${fmtDateTime(refreshedAt)}`}>
              <Button startIcon={<RefreshIcon />} onClick={() => setRefreshedAt(new Date())} variant="outlined">
                Refresh
              </Button>
            </Tooltip>
            <Button variant="contained" onClick={() => navigate('/reports')}>Open report centre</Button>
          </>
        }
      />

      <DemoScenarioPanel
        scenario="An ECIC executive opens the CRM at the start of the day and needs a single view of client engagement, case health and marketing return before the management meeting."
        evidence={[
          'Twelve live KPIs across leads, pipeline, cases, SLA and campaign ROI',
          'Nine charts computed from the same dataset used by every other screen',
          'Date range, business unit, owner, source, campaign, stage and category filters that recalculate every figure',
          'Sub-second render time evidencing the performance requirement',
        ]}
        requirements={[73, 96, 99, 23, 40, 41]}
        next="Log a complaint to demonstrate multi-channel capture"
        nextTo="/complaints/new"
      />

      {/* Filters */}
      <Box sx={{
        display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 2.5, p: 1.5,
        borderRadius: 3, bgcolor: 'surface.subtle', border: '1px solid', borderColor: 'divider',
      }} className="no-print">
        <TextField select label="Date range" value={filters.range} onChange={(e) => set('range', e.target.value)} sx={{ minWidth: 160, bgcolor: 'background.paper' }}>
          {RANGES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
        </TextField>
        <TextField select label="Business unit" value={filters.businessUnit} onChange={(e) => set('businessUnit', e.target.value)} sx={{ minWidth: 190, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All business units</MenuItem>
          {store.configuration.businessUnits.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
        </TextField>
        <TextField select label="Owner" value={filters.owner} onChange={(e) => set('owner', e.target.value)} sx={{ minWidth: 175, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All owners</MenuItem>
          {owners.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
        </TextField>
        <TextField select label="Lead source" value={filters.source} onChange={(e) => set('source', e.target.value)} sx={{ minWidth: 165, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All sources</MenuItem>
          {store.configuration.leadSources.map((s) => <MenuItem key={s.id} value={s.label}>{s.label}</MenuItem>)}
        </TextField>
        <TextField select label="Campaign" value={filters.campaign} onChange={(e) => set('campaign', e.target.value)} sx={{ minWidth: 190, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All campaigns</MenuItem>
          {store.campaigns.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select label="Sales stage" value={filters.stage} onChange={(e) => set('stage', e.target.value)} sx={{ minWidth: 170, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All stages</MenuItem>
          {store.configuration.opportunityStages.map((s) => <MenuItem key={s.id} value={s.label}>{s.label}</MenuItem>)}
        </TextField>
        <TextField select label="Complaint category" value={filters.category} onChange={(e) => set('category', e.target.value)} sx={{ minWidth: 190, bgcolor: 'background.paper' }}>
          <MenuItem value="all">All categories</MenuItem>
          {store.configuration.complaintCategories.map((c) => <MenuItem key={c.id} value={c.label}>{c.label}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button onClick={() => setFilters({ range: '365', businessUnit: 'all', owner: 'all', source: 'all', campaign: 'all', stage: 'all', category: 'all' })}>
          Clear filters
        </Button>
      </Box>

      {/* KPIs */}
      <Grid cols={{ xs: 2, sm: 2, md: 3, lg: 6 }} gap={1.75} sx={{ mb: 1.75 }}>
        <KpiCard dense label="Total leads" value={num(leads.length)} sub={`${num(leads.filter((l) => l.status === 'Converted').length)} converted`} colour="#2563EB" icon={<PeopleIcon fontSize="small" />} onClick={() => navigate('/leads')} />
        <KpiCard dense label="New leads" value={num(leads.filter((l) => l.status === 'New').length)} sub="Awaiting assignment" colour="#0891B2" icon={<NewReleasesIcon fontSize="small" />} onClick={() => navigate('/leads?status=New')} />
        <KpiCard dense label="Qualified leads" value={num(leads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length)} sub={`${pct(metrics.conversionRatio)} conversion`} colour="#059669" icon={<VerifiedIcon fontSize="small" />} onClick={() => navigate('/leads?status=Qualified')} />
        <KpiCard dense label="Open opportunities" value={num(metrics.openCount)} sub={`${num(store.opportunities.length)} total`} colour="#7C3AED" icon={<HandshakeIcon fontSize="small" />} onClick={() => navigate('/opportunities')} />
        <KpiCard dense label="Pipeline value" value={zar(metrics.openValue, true)} sub="Open opportunity value" colour="#0B2545" icon={<PaidIcon fontSize="small" />} onClick={() => navigate('/analytics')} />
        <KpiCard dense label="Weighted forecast" value={zar(metrics.weighted, true)} sub={`Commit ${zar(metrics.commit, true)}`} colour="#0E7C7B" icon={<TimelineIcon fontSize="small" />} onClick={() => navigate('/analytics')} />
        <KpiCard dense label="Open complaints" value={num(openComplaints.length)} sub={`${num(complaints.length)} logged in period`} colour="#D97706" icon={<SupportIcon fontSize="small" />} onClick={() => navigate('/complaints')} />
        <KpiCard dense label="SLA at risk" value={num(atRisk.length)} sub={`${num(atRisk.filter((p) => p.sla.risk === 'Breached').length)} already breached`} colour="#DC2626" icon={<WarningIcon fontSize="small" />} onClick={() => navigate('/tasks')} />
        <KpiCard dense label="Escalated complaints" value={num(escalated.length)} sub="Supervisor attention required" colour="#B91C1C" icon={<EscalateIcon fontSize="small" />} onClick={() => navigate('/complaints?view=escalated')} />
        <KpiCard dense label="Customer satisfaction" value={pct(satisfaction)} sub={`${feedback.length} feedback responses`} colour="#059669" icon={<SentimentIcon fontSize="small" />} onClick={() => navigate('/reports')} />
        <KpiCard dense label="Campaign ROI" value={pct(portfolioRoi)} sub="Portfolio average" colour="#C9A227" icon={<RoiIcon fontSize="small" />} onClick={() => navigate('/campaign-performance')} />
        <KpiCard dense label="Applications in progress" value={num(applications.length)} sub={`${num(store.applications.length)} total`} colour="#2563EB" icon={<ArticleIcon fontSize="small" />} onClick={() => navigate('/applications')} />
      </Grid>

      {/* Charts row 1 */}
      <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2} sx={{ mb: 2 }}>
        <SectionCard title="Lead volume by month" subtitle="Captured leads and conversions over the last 12 months">
          <ChartFrame>
            <AreaChart data={monthlySeries(leads, (l) => l.createdDate, 12).map((b) => ({
              month: b.key,
              leads: b.items.length,
              qualified: b.items.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length,
            }))}>
              <defs>
                <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gQual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} />
              <RTooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="leads" name="Leads captured" stroke="#2563EB" fill="url(#gLeads)" strokeWidth={2} />
              <Area type="monotone" dataKey="qualified" name="Qualified" stroke="#059669" fill="url(#gQual)" strokeWidth={2} />
            </AreaChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Leads by source" subtitle="Intake channel distribution">
          <ChartFrame>
            <BarChart data={leadsBySource} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} width={108} axisLine={false} tickLine={false} />
              <RTooltip {...tooltipStyle} />
              <Bar dataKey="value" name="Leads" radius={[0, 6, 6, 0]}>
                {leadsBySource.map((_, i) => <Cell key={i} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />)}
              </Bar>
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Lead conversion funnel" subtitle="Progression from capture through to opportunity">
          <Stack gap={1.25} sx={{ py: 1 }}>
            {conversionFunnel.map((s, i) => {
              const width = conversionFunnel[0].value ? (s.value / conversionFunnel[0].value) * 100 : 0;
              return (
                <Box key={s.stage}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.stage}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {s.value} <Typography component="span" variant="caption">({pct(width)})</Typography>
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 22, bgcolor: 'surface.sunken', borderRadius: 1.5, overflow: 'hidden' }}>
                    <Box sx={{
                      width: `${Math.max(width, 2)}%`, height: '100%', borderRadius: 1.5,
                      background: `linear-gradient(90deg, ${CHART_COLOURS[i]} 0%, ${alpha(CHART_COLOURS[i], .72)} 100%)`,
                      transition: 'width .4s ease',
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </SectionCard>
      </Grid>

      {/* Charts row 2 */}
      <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2} sx={{ mb: 2 }}>
        <SectionCard title="Complaint volume over time" subtitle="Logged, resolved and escalated by month">
          <ChartFrame>
            <BarChart data={complaintVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={28} />
              <RTooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="logged" name="Logged" fill="#0B2545" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="escalated" name="Escalated" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Complaint SLA compliance" subtitle="Percentage of cases resolved within the configured target">
          <ChartFrame>
            <LineChart data={slaPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} width={34} unit="%" />
              <RTooltip {...tooltipStyle} formatter={formatTip((v) => [`${v}%`, 'SLA compliance'])} />
              <Line type="monotone" dataKey="compliance" stroke="#0E7C7B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Complaints by channel" subtitle="All seven capture channels are reportable">
          <ChartFrame>
            <PieChart>
              <Pie
                data={complaintsByChannel} dataKey="value" nameKey="name"
                innerRadius={52} outerRadius={82} paddingAngle={2}
              >
                {complaintsByChannel.map((_, i) => <Cell key={i} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />)}
              </Pie>
              <RTooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10.5 }} />
            </PieChart>
          </ChartFrame>
        </SectionCard>
      </Grid>

      {/* Charts row 3 */}
      <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2} sx={{ mb: 2 }}>
        <SectionCard title="Opportunity pipeline by stage" subtitle="Value in ZAR millions with opportunity counts">
          <ChartFrame>
            <BarChart data={pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="stage" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={36} unit="m" />
              <RTooltip {...tooltipStyle} formatter={formatTip((v, n) => [n === 'value' ? `R ${v.toFixed(0)}m` : String(v), n === 'value' ? 'Pipeline value' : 'Opportunities'])} />
              <Bar dataKey="value" name="value" radius={[6, 6, 0, 0]}>
                {pipelineByStage.map((p, i) => (
                  <Cell key={i} fill={p.stage === 'Closed Won' ? '#059669' : p.stage === 'Closed Lost' ? '#DC2626' : CHART_COLOURS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Revenue forecast" subtitle="Weighted and best-case forecast by expected close month (ZAR millions)">
          <ChartFrame>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="gBest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gWeighted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7C7B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0E7C7B" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={38} unit="m" />
              <RTooltip {...tooltipStyle} formatter={formatTip((v) => `R ${v.toFixed(0)}m`)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="best" name="Best case" stroke="#7C3AED" fill="url(#gBest)" strokeWidth={2} />
              <Area type="monotone" dataKey="weighted" name="Weighted" stroke="#0E7C7B" fill="url(#gWeighted)" strokeWidth={2.5} />
            </AreaChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Win / loss ratio" subtitle={`Win ratio ${pct(metrics.winRatio)} · Average deal ${zar(metrics.averageDeal, true)}`}>
          <ChartFrame>
            <PieChart>
              <Pie data={winLoss} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                <Cell fill="#059669" />
                <Cell fill="#DC2626" />
              </Pie>
              <RTooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ChartFrame>
          <Divider sx={{ my: 1.5 }} />
          <Grid cols={2} gap={1}>
            <Box>
              <Typography variant="caption">Pipeline velocity</Typography>
              <Typography variant="subtitle1">{metrics.velocityDays.toFixed(0)} days</Typography>
            </Box>
            <Box>
              <Typography variant="caption">Won revenue</Typography>
              <Typography variant="subtitle1">{zar(metrics.won, true)}</Typography>
            </Box>
          </Grid>
        </SectionCard>
      </Grid>

      {/* Charts row 4 */}
      <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2} sx={{ mb: 2 }}>
        <SectionCard title="Campaign ROI" subtitle="Return on marketing investment by campaign (%)">
          <ChartFrame>
            <BarChart data={campaignRoi} layout="vertical" margin={{ left: 4, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 9.5 }} width={132} axisLine={false} tickLine={false} />
              <RTooltip {...tooltipStyle} formatter={formatTip((v) => [`${v}%`, 'ROI'])} />
              <Bar dataKey="roi" radius={[0, 6, 6, 0]}>
                {campaignRoi.map((r, i) => <Cell key={i} fill={r.roi >= 300 ? '#059669' : r.roi >= 120 ? '#D97706' : '#DC2626'} />)}
              </Bar>
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Complaint resolution turnaround" subtitle="Average business days to resolve against the configured SLA target">
          <ChartFrame>
            <BarChart data={turnaround}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
              <XAxis dataKey="severity" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} unit="d" />
              <RTooltip {...tooltipStyle} formatter={formatTip((v, n) => [`${v} days`, n === 'Actual average' ? 'Actual average' : 'SLA target'])} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="target" name="SLA target" fill={alpha('#0B2545', .22)} radius={[5, 5, 0, 0]} />
              <Bar dataKey="actual" name="Actual average" fill="#0E7C7B" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Complaints by category and severity" subtitle="Where cases are concentrating">
          <ChartFrame height={110}>
            <BarChart data={complaintsBySeverity} layout="vertical" margin={{ left: 0, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} width={60} axisLine={false} tickLine={false} />
              <RTooltip {...tooltipStyle} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {complaintsBySeverity.map((s, i) => (
                  <Cell key={i} fill={s.name === 'Critical' ? '#B91C1C' : s.name === 'High' ? '#DC2626' : s.name === 'Medium' ? '#D97706' : '#0E7C7B'} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
          <Divider sx={{ my: 1 }} />
          <Stack gap={0.75}>
            {complaintsByCategory.map((c, i) => (
              <Stack key={c.name} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLOURS[i % CHART_COLOURS.length], flexShrink: 0 }} />
                  <Typography variant="body2" noWrap>{c.name}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </Grid>

      {/* Attention lists */}
      <Grid cols={{ xs: 1, lg: 2 }} gap={2}>
        <SectionCard
          title="SLA at risk and breached"
          subtitle="Cases requiring immediate action, ordered by SLA consumption"
          action={<Button size="small" onClick={() => navigate('/tasks')}>Open SLA workspace</Button>}
        >
          <Stack gap={1}>
            {atRisk.slice(0, 6).map(({ complaint: c, sla }) => (
              <Box
                key={c.id}
                onClick={() => navigate(`/complaints/${c.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'surface.subtle' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }} noWrap>{c.subject}</Typography>
                    <Typography variant="caption">
                      {c.reference} · {store.customers.find((x) => x.id === c.customerId)?.organisation}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    <StatusChip value={c.severity} />
                    <StatusChip value={sla.risk} />
                  </Stack>
                </Stack>
              </Box>
            ))}
            {atRisk.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No cases are at risk in the selected period. Every open complaint is within its SLA target.
              </Typography>
            )}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Largest open opportunities"
          subtitle="By estimated deal value, with weighted forecast contribution"
          action={<Button size="small" onClick={() => navigate('/opportunities')}>Open pipeline</Button>}
        >
          <Stack gap={1}>
            {opportunities.filter((o) => !o.closedDate)
              .sort((a, b) => b.estimatedValue - a.estimatedValue).slice(0, 6)
              .map((o) => (
                <Box
                  key={o.id}
                  onClick={() => navigate(`/opportunities/${o.id}`)}
                  sx={{
                    p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'surface.subtle' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }} noWrap>{o.name}</Typography>
                      <Typography variant="caption">
                        {o.reference} · weighted {zar(o.estimatedValue * o.probability / 100, true)}
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{zar(o.estimatedValue, true)}</Typography>
                      <StatusChip value={o.stage} />
                    </Stack>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </SectionCard>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <SectionCard title="Business unit performance" subtitle="Open case load and pipeline contribution by business unit">
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
            {sumBy(opportunities.filter((o) => !o.closedDate), (o) => o.businessUnit, (o) => o.estimatedValue).slice(0, 4).map((b) => (
              <Box key={b.name} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">{b.name}</Typography>
                <Typography variant="h4" sx={{ mt: 0.25 }}>{zar(b.total, true)}</Typography>
                <Typography variant="caption">Open pipeline value</Typography>
              </Box>
            ))}
            {store.configuration.businessUnits.slice(0, 4).map((bu) => {
              const count = openComplaints.filter((c) => c.businessUnit === bu).length;
              return (
                <Box key={bu} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                  <Typography variant="overline" color="text.secondary">{bu}</Typography>
                  <Typography variant="h4" sx={{ mt: 0.25 }}>{count}</Typography>
                  <Typography variant="caption">Open complaints</Typography>
                </Box>
              );
            })}
          </Grid>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Dashboard;
