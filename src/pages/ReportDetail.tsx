import * as React from 'react';
import {
  Alert, Box, Button, Chip, Divider, MenuItem, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  DataTable, EmptyState, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import type { Column } from '../components';
import { AXIS_STYLE, CHART_COLOURS, TOOLTIP_STYLE } from '../components/charts';
import { toast } from '../hooks';
import { monthBuckets } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';
import { DATASET_FIELDS, REPORT_CATALOGUE } from './reports/catalogue';
import { buildRows, CURRENCY_FIELDS, NUMERIC_FIELDS, type Row } from './reports/rows';

export function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const [generatedAt] = React.useState(new Date());
  const [groupBy, setGroupBy] = React.useState('');
  const [filterField, setFilterField] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('all');

  const standard = REPORT_CATALOGUE.find((r) => r.id === id);
  const saved = store.savedReports.find((r) => r.id === id);

  const dataset = standard?.dataset ?? saved?.dataset ?? '';
  const fieldDefs = DATASET_FIELDS[dataset] ?? [];
  const selectedFields = saved?.fields ?? fieldDefs.slice(0, 9).map((f) => f.id);

  React.useEffect(() => {
    setGroupBy(saved?.groupBy ?? standard?.defaultGroupBy ?? '');
    setFilterField('');
    setFilterValue('all');
  }, [id, saved?.groupBy, standard?.defaultGroupBy]);

  const allRows = React.useMemo(() => buildRows(store, dataset), [store, dataset]);

  const rows = React.useMemo(() => {
    if (!filterField || filterValue === 'all') return allRows;
    return allRows.filter((r) => String(r[filterField]) === filterValue);
  }, [allRows, filterField, filterValue]);

  if (!standard && !saved) {
    return (
      <EmptyState
        title="Report not found"
        description="This report does not exist. It may have been removed by a demo reset."
        action={<Button variant="contained" onClick={() => navigate('/reports')}>Back to report centre</Button>}
      />
    );
  }

  const title = standard?.name ?? saved?.name ?? 'Report';
  const description = standard?.description
    ?? `User-defined report over the ${dataset} data set, created with the no-code report builder.`;

  /* Grouping ------------------------------------------------------- */
  const grouped = React.useMemo(() => {
    if (!groupBy) return [];
    const map = new Map<string, Row[]>();
    rows.forEach((r) => {
      const key = String(r[groupBy] ?? 'Unspecified');
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return Array.from(map, ([name, items]) => {
      const valueField = ['estimatedValue', 'revenue', 'budget', 'annualExportValue'].find((f) => selectedFields.includes(f) || NUMERIC_FIELDS.has(f) && rows[0]?.[f] != null);
      return {
        name,
        count: items.length,
        value: valueField ? items.reduce((s, r) => s + (Number(r[valueField]) || 0), 0) : 0,
      };
    }).sort((a, b) => b.count - a.count);
  }, [rows, groupBy, selectedFields]);

  /* KPIs ----------------------------------------------------------- */
  const kpis = React.useMemo(() => {
    const out: { label: string; value: string; sub?: string; colour: string }[] = [
      { label: 'Records', value: num(rows.length), sub: `of ${num(allRows.length)} total`, colour: '#0B2545' },
    ];
    if (dataset === 'complaints') {
      const open = rows.filter((r) => r.status !== 'Closed').length;
      const breached = rows.filter((r) => r.slaRisk === 'Breached').length;
      const met = rows.filter((r) => r.slaRisk === 'Met').length;
      const escalated = rows.filter((r) => r.escalated === 'Yes').length;
      const avgConsumed = rows.length ? rows.reduce((s, r) => s + Number(r.slaConsumed), 0) / rows.length : 0;
      out.push(
        { label: 'Open cases', value: num(open), colour: '#D97706' },
        { label: 'SLA met', value: num(met), sub: pct(rows.length ? (met / rows.length) * 100 : 0), colour: '#059669' },
        { label: 'SLA breached', value: num(breached), colour: '#DC2626' },
        { label: 'Escalated', value: num(escalated), colour: '#B91C1C' },
        { label: 'Avg SLA consumed', value: pct(avgConsumed), colour: '#7C3AED' },
      );
    } else if (dataset === 'leads') {
      const qualified = rows.filter((r) => ['Qualified', 'Converted'].includes(String(r.status))).length;
      const converted = rows.filter((r) => r.converted === 'Yes').length;
      const value = rows.reduce((s, r) => s + Number(r.estimatedValue), 0);
      out.push(
        { label: 'Qualified', value: num(qualified), sub: pct(rows.length ? (qualified / rows.length) * 100 : 0), colour: '#059669' },
        { label: 'Converted', value: num(converted), colour: '#0E7C7B' },
        { label: 'Pipeline value', value: zar(value, true), colour: '#2563EB' },
        { label: 'SLA breached', value: num(rows.filter((r) => r.slaRisk === 'Breached').length), colour: '#DC2626' },
        { label: 'Avg score', value: rows.length ? (rows.reduce((s, r) => s + Number(r.qualificationScore), 0) / rows.length).toFixed(0) : '0', colour: '#7C3AED' },
      );
    } else if (dataset === 'opportunities') {
      const open = rows.filter((r) => !String(r.stage).startsWith('Closed'));
      const won = rows.filter((r) => r.stage === 'Closed Won');
      const lost = rows.filter((r) => r.stage === 'Closed Lost');
      out.push(
        { label: 'Open pipeline', value: zar(open.reduce((s, r) => s + Number(r.estimatedValue), 0), true), colour: '#0E7C7B' },
        { label: 'Weighted', value: zar(open.reduce((s, r) => s + Number(r.weighted), 0), true), colour: '#7C3AED' },
        { label: 'Won', value: zar(won.reduce((s, r) => s + Number(r.estimatedValue), 0), true), sub: `${won.length} deals`, colour: '#059669' },
        { label: 'Lost', value: zar(lost.reduce((s, r) => s + Number(r.estimatedValue), 0), true), sub: `${lost.length} deals`, colour: '#DC2626' },
        { label: 'Win ratio', value: pct(won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0), colour: '#2563EB' },
      );
    } else if (dataset === 'campaigns' || dataset === 'events') {
      const spend = rows.reduce((s, r) => s + Number(r.actualSpend ?? r.spend ?? 0), 0);
      const revenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
      out.push(
        { label: 'Spend', value: zar(spend, true), colour: '#D97706' },
        { label: 'Revenue', value: zar(revenue, true), colour: '#059669' },
        { label: 'ROI', value: pct(spend ? ((revenue - spend) / spend) * 100 : 0), colour: '#0E7C7B' },
        { label: 'Leads', value: num(rows.reduce((s, r) => s + Number(r.leads), 0)), colour: '#2563EB' },
        { label: 'Prioritise', value: num(rows.filter((r) => r.recommendation === 'Prioritise').length), sub: 'recommended', colour: '#7C3AED' },
      );
    } else if (dataset === 'audit') {
      out.push(
        { label: 'Unique users', value: num(new Set(rows.map((r) => r.userName)).size), colour: '#2563EB' },
        { label: 'Entities affected', value: num(new Set(rows.map((r) => r.entity)).size), colour: '#7C3AED' },
        { label: 'Distinct actions', value: num(new Set(rows.map((r) => r.action)).size), colour: '#0E7C7B' },
      );
    } else if (dataset === 'customers') {
      out.push(
        { label: 'Active', value: num(rows.filter((r) => r.status === 'Active').length), colour: '#059669' },
        { label: 'Export value', value: zar(rows.reduce((s, r) => s + Number(r.annualExportValue), 0), true), colour: '#0E7C7B' },
        { label: 'Open cases', value: num(rows.reduce((s, r) => s + Number(r.complaints), 0)), colour: '#DC2626' },
      );
    } else if (dataset === 'applications') {
      out.push(
        { label: 'Approved', value: num(rows.filter((r) => r.status === 'Approved').length), colour: '#059669' },
        { label: 'In review', value: num(rows.filter((r) => ['Submitted', 'Under Review', 'Awaiting Approval'].includes(String(r.status))).length), colour: '#D97706' },
        { label: 'Signed', value: num(rows.filter((r) => r.signed === 'Yes').length), colour: '#0E7C7B' },
      );
    } else if (dataset === 'documents') {
      out.push(
        { label: 'Restricted', value: num(rows.filter((r) => r.classification === 'Restricted').length), colour: '#DC2626' },
        { label: 'Blocked', value: num(rows.filter((r) => r.status === 'Blocked').length), colour: '#B91C1C' },
        { label: 'Signed', value: num(rows.filter((r) => r.status === 'Signed').length), colour: '#0E7C7B' },
      );
    } else if (dataset === 'activities') {
      out.push(
        { label: 'Completed', value: num(rows.filter((r) => r.status === 'Completed').length), colour: '#059669' },
        { label: 'Planned', value: num(rows.filter((r) => r.status === 'Planned').length), colour: '#2563EB' },
        { label: 'Overdue', value: num(rows.filter((r) => r.status === 'Overdue').length), colour: '#DC2626' },
      );
    }
    return out;
  }, [rows, allRows.length, dataset]);

  /* Trend for line charts ------------------------------------------ */
  const trend = React.useMemo(() => {
    if (standard?.chart !== 'line') return [];
    const buckets = monthBuckets(9);
    if (dataset === 'opportunities') {
      return buckets.map((b) => {
        const items = store.opportunities.filter((o) => {
          const d = new Date(o.expectedCloseDate);
          return d >= b.start && d <= b.end && !o.closedDate;
        });
        return {
          month: b.key,
          weighted: Math.round(items.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0) / 1_000_000),
          best: Math.round(items.reduce((s, o) => s + o.estimatedValue, 0) / 1_000_000),
          commit: Math.round(items.filter((o) => o.forecastCategory === 'Commit').reduce((s, o) => s + o.estimatedValue, 0) / 1_000_000),
        };
      });
    }
    return [];
  }, [standard?.chart, dataset, store.opportunities]);

  const columns: Column<Row & { id: string }>[] = selectedFields
    .map((fieldId) => {
      const def = fieldDefs.find((f) => f.id === fieldId);
      if (!def) return null;
      return {
        id: fieldId,
        label: def.label,
        align: NUMERIC_FIELDS.has(fieldId) ? ('right' as const) : undefined,
        sortValue: (r: Row) => NUMERIC_FIELDS.has(fieldId) ? Number(r[fieldId]) || 0 : String(r[fieldId] ?? ''),
        render: (r: Row) => {
          const v = r[fieldId];
          if (v == null || v === '') return <Typography variant="body2" color="text.disabled">—</Typography>;
          if (CURRENCY_FIELDS.has(fieldId)) return <Typography variant="body2">{zar(Number(v), true)}</Typography>;
          if (['status', 'stage', 'severity', 'priority', 'slaRisk', 'classification', 'scanResult', 'recommendation'].includes(fieldId)) {
            return <StatusChip value={String(v)} />;
          }
          return <Typography variant="body2" sx={{ maxWidth: 280 }} noWrap>{String(v)}</Typography>;
        },
      };
    })
    .filter(Boolean) as Column<Row & { id: string }>[];

  const filterOptions = filterField
    ? Array.from(new Set(allRows.map((r) => String(r[filterField] ?? '')))).filter(Boolean).sort()
    : [];

  const exportRows = rows.map((r) =>
    Object.fromEntries(selectedFields.map((f) => [fieldDefs.find((d) => d.id === f)?.label ?? f, r[f]])));

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={description}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Reports', to: '/reports' },
          { label: title },
        ]}
        chips={
          <Chip size="small" label={`Generated ${generatedAt.toLocaleString('en-ZA')}`} sx={{ bgcolor: alpha('#0B2545', .07), fontWeight: 600 }} />
        }
        actions={
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reports')}>Report centre</Button>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => {
                downloadCsv(`ECIC_${title.replace(/[^A-Za-z0-9]+/g, '_')}`, exportRows);
                toast({ message: 'Report exported', severity: 'success', detail: `${rows.length} row(s) exported to an Excel-compatible file with a generation timestamp.` });
              }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained" startIcon={<PrintIcon />}
              onClick={() => { window.print(); }}
            >
              Export PDF (print view)
            </Button>
          </>
        }
      />

      <Box className="print-only" sx={{ mb: 2 }}>
        <Typography variant="h4">ECIC CRM Platform — {title}</Typography>
        <Typography variant="body2">
          Generated {generatedAt.toLocaleString('en-ZA')} · {rows.length} record(s)
          {filterField && filterValue !== 'all' ? ` · filtered by ${fieldDefs.find((f) => f.id === filterField)?.label} = ${filterValue}` : ''}
          {groupBy ? ` · grouped by ${fieldDefs.find((f) => f.id === groupBy)?.label}` : ''}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
      </Box>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        {kpis.map((k) => (
          <KpiCard key={k.label} dense label={k.label} value={k.value} sub={k.sub} colour={k.colour} />
        ))}
      </Grid>

      <Box sx={{
        display: 'flex', gap: 1.25, flexWrap: 'wrap', mb: 2.5, p: 1.5,
        borderRadius: 3, bgcolor: 'surface.subtle', border: '1px solid', borderColor: 'divider',
      }} className="no-print">
        <TextField select size="small" label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} sx={{ minWidth: 190, bgcolor: 'background.paper' }}>
          <MenuItem value="">No grouping</MenuItem>
          {fieldDefs.map((f) => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Filter field" value={filterField}
          onChange={(e) => { setFilterField(e.target.value); setFilterValue('all'); }}
          sx={{ minWidth: 190, bgcolor: 'background.paper' }}
        >
          <MenuItem value="">No filter</MenuItem>
          {fieldDefs.filter((f) => !NUMERIC_FIELDS.has(f.id)).map((f) => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
        </TextField>
        {filterField && (
          <TextField select size="small" label="Filter value" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} sx={{ minWidth: 210, bgcolor: 'background.paper' }}>
            <MenuItem value="all">All values</MenuItem>
            {filterOptions.slice(0, 60).map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
        )}
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={() => { setGroupBy(standard?.defaultGroupBy ?? ''); setFilterField(''); setFilterValue('all'); }}>
          Reset
        </Button>
      </Box>

      {groupBy && grouped.length > 0 && (
        <Grid cols={{ xs: 1, lg: trend.length ? 2 : 1 }} gap={2.5} sx={{ mb: 2.5 }}>
          <SectionCard
            title={`Grouped by ${fieldDefs.find((f) => f.id === groupBy)?.label ?? groupBy}`}
            subtitle={`${grouped.length} group(s) across ${rows.length} record(s)`}
          >
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                {standard?.chart === 'pie' ? (
                  <PieChart>
                    <Pie data={grouped} dataKey="count" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                      {grouped.map((_, i) => <Cell key={i} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />)}
                    </Pie>
                    <RTooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                ) : (
                  <BarChart data={grouped} layout="vertical" margin={{ left: 4, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" horizontal={false} />
                    <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ ...AXIS_STYLE, fontSize: 10 }} width={150} axisLine={false} tickLine={false} />
                    <RTooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Records" radius={[0, 6, 6, 0]}>
                      {grouped.map((_, i) => <Cell key={i} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />)}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack gap={0.75}>
              {grouped.slice(0, 10).map((g, i) => (
                <Stack key={g.name} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLOURS[i % CHART_COLOURS.length], flexShrink: 0 }} />
                    <Typography variant="body2" noWrap>{g.name}</Typography>
                  </Stack>
                  <Stack direction="row" gap={2}>
                    {g.value > 0 && <Typography variant="body2">{zar(g.value, true)}</Typography>}
                    <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 34, textAlign: 'right' }}>{g.count}</Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </SectionCard>

          {trend.length > 0 && (
            <SectionCard title="Forecast by expected close month" subtitle="ZAR millions">
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F7" vertical={false} />
                    <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={40} unit="m" />
                    <RTooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="best" name="Best case" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="commit" name="Commit" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="weighted" name="Weighted" stroke="#0E7C7B" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </SectionCard>
          )}
        </Grid>
      )}

      <SectionCard
        title="Report data"
        subtitle={`${rows.length} record(s)${filterField && filterValue !== 'all' ? ` · filtered by ${fieldDefs.find((f) => f.id === filterField)?.label} = ${filterValue}` : ''}`}
      >
        <DataTable
          rows={rows as (Row & { id: string })[]}
          columns={columns}
          searchable
          searchPlaceholder="Search within this report…"
          searchFields={(r) => selectedFields.map((f) => String(r[f] ?? '')).join(' ')}
          initialRowsPerPage={25}
          rowsPerPageOptions={[10, 25, 50, 100]}
          dense
        />
        <Divider sx={{ my: 2 }} />
        <Alert severity="info" icon={false}>
          <Typography variant="caption">
            Report generated {generatedAt.toLocaleString('en-ZA')} from the live demonstration dataset.
            Excel export produces a comma-separated file readable by Microsoft Excel, carrying the same
            generation timestamp. The PDF option opens the browser print view of this report, formatted
            for A4 landscape with navigation and controls removed.
          </Typography>
        </Alert>
      </SectionCard>
    </Box>
  );
}

export default ReportDetail;
