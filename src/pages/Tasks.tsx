import * as React from 'react';
import { Alert, Box, Button, Chip, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, SlaBar, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { useComplaintSla, leadSla, toast } from '../hooks';
import { fmtDate, relativeTime } from '../utils/dates';
import { downloadCsv, num, pct } from '../utils/format';
import type { Task } from '../types';

export function Tasks() {
  const navigate = useNavigate();
  const store = useStore();
  const slaOf = useComplaintSla();
  const [filters, setFilters] = React.useState({ category: 'all', owner: 'all', status: 'Open', priority: 'all' });
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const filtered = store.tasks.filter((t) =>
    (filters.category === 'all' || t.category === filters.category)
    && (filters.owner === 'all' || t.ownerId === filters.owner)
    && (filters.status === 'all' || t.status === filters.status)
    && (filters.priority === 'all' || t.priority === filters.priority));

  const complaintSlas = store.complaints
    .filter((c) => c.status !== 'Closed')
    .map((c) => ({ complaint: c, sla: slaOf(c) }));
  const breached = complaintSlas.filter((x) => x.sla.risk === 'Breached');
  const atRisk = complaintSlas.filter((x) => x.sla.risk === 'At Risk');
  const leadRisk = store.leads
    .filter((l) => !l.firstContactDate && l.status !== 'New')
    .map((l) => ({ lead: l, sla: leadSla(l) }))
    .filter((x) => x.sla.risk !== 'On Track');
  const closed = store.complaints.filter((c) => ['Resolved', 'Closed'].includes(c.status));
  const compliance = closed.length
    ? (closed.filter((c) => slaOf(c).risk === 'Met').length / closed.length) * 100 : 100;

  const routeFor = (t: Task) => {
    switch (t.relatedType) {
      case 'Complaint': return `/complaints/${t.relatedId}`;
      case 'Lead': return `/leads/${t.relatedId}`;
      case 'Opportunity': return `/opportunities/${t.relatedId}`;
      case 'Application': return `/applications/${t.relatedId}`;
      case 'Campaign': return `/campaigns/${t.relatedId}`;
      case 'CIM': return '/cim';
      default: return '/tasks';
    }
  };

  const columns: Column<Task>[] = [
    {
      id: 'title', label: 'Task', sortValue: (r) => r.title,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 400 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.title}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.description}</Typography>
        </Box>
      ),
    },
    { id: 'category', label: 'Category', width: 165, sortValue: (r) => r.category, render: (r) => <Chip size="small" label={r.category} sx={{ bgcolor: alpha('#0B2545', .07) }} /> },
    { id: 'priority', label: 'Priority', width: 95, sortValue: (r) => r.priority, render: (r) => <StatusChip value={r.priority} /> },
    { id: 'status', label: 'Status', width: 115, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    {
      id: 'owner', label: 'Owner', hideOn: 'sm', sortValue: (r) => r.ownerId,
      render: (r) => <Typography variant="body2" noWrap>{store.users.find((u) => u.id === r.ownerId)?.name ?? '—'}</Typography>,
    },
    {
      id: 'due', label: 'Due', width: 155, sortValue: (r) => r.dueDate,
      render: (r) => {
        const overdue = new Date(r.dueDate) < new Date() && r.status === 'Open';
        return (
          <Box>
            <Typography variant="body2" sx={{ color: overdue ? 'error.main' : undefined, fontWeight: overdue ? 700 : 400 }}>
              {fmtDate(r.dueDate)}
            </Typography>
            <Typography variant="caption">{relativeTime(r.dueDate)}</Typography>
          </Box>
        );
      },
    },
    { id: 'related', label: 'Related record', hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{r.relatedType} {r.relatedId}</Typography> },
    {
      id: 'actions', label: 'Actions', width: 210,
      render: (r) => (
        <Stack direction="row" gap={0.5}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); navigate(routeFor(r)); }}>Open</Button>
          {r.status !== 'Completed' && (
            <>
              <Button
                size="small"
                onClick={async (e) => {
                  e.stopPropagation();
                  await api.snoozeTask(r.id, 2);
                  toast({ message: 'Task snoozed', severity: 'info', detail: 'Due date moved out by two business days.' });
                }}
              >
                Snooze
              </Button>
              <Button
                size="small" variant="contained"
                onClick={async (e) => {
                  e.stopPropagation();
                  await api.completeTask(r.id);
                  toast({ message: 'Task completed', severity: 'success', detail: 'The task was closed and an audit event written.' });
                }}
              >
                Complete
              </Button>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Tasks & SLA Management"
        subtitle="The consolidated SLA workspace: every complaint and lead measured against its configured target, with automatic alerts, pending-action reminders and the tasks they generate."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Tasks & SLA' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Tasks_SLA', filtered.map((t) => ({
                Title: t.title, Description: t.description, Category: t.category,
                Priority: t.priority, Status: t.status,
                Owner: store.users.find((u) => u.id === t.ownerId)?.name ?? '',
                'Due date': fmtDate(t.dueDate), 'Related type': t.relatedType, 'Related record': t.relatedId,
                Created: fmtDate(t.createdAt),
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" onClick={() => navigate('/my-work')}>My work</Button>
          </>
        }
      />

      {breached.length > 0 && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          <strong>{breached.length} complaint(s) have breached their SLA target.</strong>{' '}
          SLA breach notifications were issued on the in-app and SMS channels to the case owners and the supervisor.
        </Alert>
      )}

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Open tasks" value={num(store.tasks.filter((t) => t.status === 'Open').length)} colour="#0B2545" />
        <KpiCard dense label="SLA breached" value={num(breached.length)} sub="Immediate action" colour="#DC2626" />
        <KpiCard dense label="SLA at risk" value={num(atRisk.length)} sub="Above warning threshold" colour="#D97706" />
        <KpiCard dense label="Lead SLA risk" value={num(leadRisk.length)} sub="First contact overdue" colour="#7C3AED" />
        <KpiCard dense label="Pending information" value={num(store.complaints.filter((c) => c.status === 'Pending Information').length)} sub="Clock paused" colour="#2563EB" />
        <KpiCard dense label="SLA compliance" value={pct(compliance)} sub={`${num(closed.length)} resolved cases`} colour="#059669" />
      </Grid>

      <Grid cols={{ xs: 1, lg: 2 }} gap={2.5} sx={{ mb: 2.5 }}>
        <SectionCard title={`Complaints at SLA risk (${breached.length + atRisk.length})`} subtitle="Ordered by SLA consumption, breached first">
          <Stack gap={1}>
            {[...breached, ...atRisk].slice(0, 8).map(({ complaint: c, sla }) => (
              <Box
                key={c.id} onClick={() => navigate(`/complaints/${c.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid', borderColor: alpha(sla.risk === 'Breached' ? '#DC2626' : '#D97706', .35),
                  '&:hover': { borderColor: sla.risk === 'Breached' ? '#DC2626' : '#D97706' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.subject}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {c.reference} · {store.users.find((u) => u.id === c.assignedToId)?.name ?? 'Unassigned'} ·
                      {' '}due {fmtDate(sla.dueDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}><SlaBar consumed={sla.consumed} risk={sla.risk} compact /></Box>
                </Stack>
              </Box>
            ))}
            {breached.length + atRisk.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Every open complaint is comfortably within its SLA target.
              </Typography>
            )}
          </Stack>
        </SectionCard>

        <SectionCard title={`Leads at SLA risk (${leadRisk.length})`} subtitle="First-contact SLA against the configured target">
          <Stack gap={1}>
            {leadRisk.slice(0, 8).map(({ lead: l, sla }) => (
              <Box
                key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  border: '1px solid', borderColor: alpha(sla.risk === 'Breached' ? '#DC2626' : '#D97706', .35),
                  '&:hover': { borderColor: sla.risk === 'Breached' ? '#DC2626' : '#D97706' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{l.company}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {l.reference} · {store.users.find((u) => u.id === l.ownerId)?.name ?? 'Unassigned'} ·
                      {' '}due {fmtDate(l.slaDueDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}><SlaBar consumed={sla.consumed} risk={sla.risk} compact /></Box>
                </Stack>
              </Box>
            ))}
            {leadRisk.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No leads are outside their first-contact SLA.
              </Typography>
            )}
          </Stack>
        </SectionCard>
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All' }, ...['Open', 'In Progress', 'Snoozed', 'Completed'].map((s) => ({ value: s, label: s }))], width: 155 },
          { id: 'category', label: 'Category', options: [{ value: 'all', label: 'All categories' }, ...['Follow-up', 'SLA', 'Approval', 'Escalation', 'Customer Communication', 'Investigation', 'Data'].map((c) => ({ value: c, label: c }))], width: 205 },
          { id: 'owner', label: 'Owner', options: [{ value: 'all', label: 'Everyone' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 180 },
          { id: 'priority', label: 'Priority', options: [{ value: 'all', label: 'All' }, ...['P1', 'P2', 'P3', 'P4'].map((p) => ({ value: p, label: p }))], width: 130 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ category: 'all', owner: 'all', status: 'Open', priority: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search task title, description or related record…"
        searchFields={(r) => `${r.title} ${r.description} ${r.relatedType} ${r.relatedId} ${r.category}`}
        defaultSort={{ id: 'due', dir: 'asc' }}
        initialRowsPerPage={15}
        emptyTitle="No tasks match these filters"
        emptyDescription="Clear the filters, or complete a workflow action elsewhere in the CRM to generate a new task."
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard title="SLA rules currently in force" subtitle="Maintained in the Configuration Centre — changing a target here changes every SLA calculation in the system"
          action={<Button size="small" onClick={() => navigate('/configuration?tab=sla')}>Configure SLA rules</Button>}>
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
            {store.configuration.slaRules.map((r) => (
              <Box key={r.id} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{r.label}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>{r.scope}</Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption">Target</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {r.targetDays < 1 ? `${Math.round(r.targetDays * 24)} hours` : `${r.targetDays} business days`}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption">Warning at</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{r.warningPercent}%</Typography>
                </Stack>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Tasks;
