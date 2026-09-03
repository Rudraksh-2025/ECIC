import * as React from 'react';
import {
  Avatar, Badge, Box, Button, Chip, Divider, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/ReportProblem';
import EscalateIcon from '@mui/icons-material/PriorityHigh';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, SlaBar, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { useComplaintSla } from '../hooks';
import { fmtDate, relativeTime } from '../utils/dates';
import { downloadCsv, maskEmail, num, pct } from '../utils/format';
import type { Complaint } from '../types';

export function Complaints() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const store = useStore();
  const masked = useMasking();
  const slaOf = useComplaintSla();
  const [view, setView] = React.useState<'list' | 'board'>('list');
  const [filters, setFilters] = React.useState({
    status: params.get('view') === 'escalated' ? 'Escalated' : 'all',
    severity: 'all', channel: 'all', category: 'all', assignee: 'all', businessUnit: 'all', sla: 'all',
  });

  const set = (id: string, value: string) => {
    setFilters((f) => ({ ...f, [id]: value }));
    if (id === 'status') setParams({});
  };

  const withSla = React.useMemo(
    () => store.complaints.map((c) => ({ ...c, _sla: slaOf(c) })),
    [store.complaints, slaOf],
  );

  const filtered = withSla.filter((c) =>
    (filters.status === 'all' || c.status === filters.status)
    && (filters.severity === 'all' || c.severity === filters.severity)
    && (filters.channel === 'all' || c.channel === filters.channel)
    && (filters.category === 'all' || c.category === filters.category)
    && (filters.assignee === 'all' || c.assignedToId === filters.assignee)
    && (filters.businessUnit === 'all' || c.businessUnit === filters.businessUnit)
    && (filters.sla === 'all' || c._sla.risk === filters.sla));

  const open = withSla.filter((c) => c.status !== 'Closed');
  const atRisk = open.filter((c) => c._sla.risk === 'At Risk' || c._sla.risk === 'Breached');
  const escalated = open.filter((c) => c.escalated);
  const unassigned = withSla.filter((c) => !c.assignedToId);
  const closedThisPeriod = withSla.filter((c) => c.status === 'Closed');
  const metRate = closedThisPeriod.length
    ? (closedThisPeriod.filter((c) => c._sla.risk === 'Met').length / closedThisPeriod.length) * 100 : 100;

  const customerName = (id: string) => store.customers.find((c) => c.id === id)?.organisation ?? '—';
  const userName = (id: string | null) => store.users.find((u) => u.id === id)?.name ?? 'Unassigned';

  const columns: Column<Complaint & { _sla: ReturnType<typeof slaOf> }>[] = [
    {
      id: 'reference', label: 'Reference', sortValue: (r) => r.reference, width: 168,
      render: (r) => (
        <Stack direction="row" gap={0.75} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
            {r.reference}
          </Typography>
          {r.escalated && (
            <Tooltip title={r.escalationReason ?? 'Escalated'}>
              <EscalateIcon sx={{ fontSize: 15, color: 'error.main' }} />
            </Tooltip>
          )}
          {r.status === 'Closed' && (
            <Tooltip title="Closed record — locked against amendment">
              <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      id: 'subject', label: 'Subject & customer', sortValue: (r) => r.subject,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 380 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.subject}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {customerName(r.customerId)} · {masked ? maskEmail(r.contactEmail) : r.contactEmail}
          </Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} />, width: 130 },
    { id: 'severity', label: 'Severity', sortValue: (r) => r.severity, render: (r) => <StatusChip value={r.severity} />, width: 96, hideOn: 'md' },
    { id: 'channel', label: 'Channel', sortValue: (r) => r.channel, render: (r) => <Typography variant="body2">{r.channel}</Typography>, hideOn: 'md' },
    { id: 'category', label: 'Category', sortValue: (r) => r.category, render: (r) => <Typography variant="body2" noWrap>{r.category}</Typography>, hideOn: 'md' },
    {
      id: 'assignee', label: 'Assigned to', sortValue: (r) => userName(r.assignedToId), hideOn: 'sm',
      render: (r) => {
        const u = store.users.find((x) => x.id === r.assignedToId);
        return u ? (
          <Stack direction="row" gap={0.75} alignItems="center">
            <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: u.avatarColor }}>{u.initials}</Avatar>
            <Typography variant="body2" noWrap>{u.name}</Typography>
          </Stack>
        ) : <Chip size="small" label="Unassigned" color="warning" variant="outlined" />;
      },
    },
    {
      id: 'sla', label: 'SLA position', sortValue: (r) => r._sla.consumed, width: 160,
      render: (r) => (
        <Tooltip title={`Target ${r._sla.targetDays} business days · elapsed ${r._sla.elapsedDays} · due ${fmtDate(r._sla.dueDate)}${r._sla.paused ? ' · clock paused pending customer information' : ''}`}>
          <Box><SlaBar consumed={r._sla.consumed} risk={r._sla.risk} /></Box>
        </Tooltip>
      ),
    },
    {
      id: 'logged', label: 'Logged', sortValue: (r) => r.loggedDate, hideOn: 'md',
      render: (r) => (
        <Box>
          <Typography variant="body2">{fmtDate(r.loggedDate)}</Typography>
          <Typography variant="caption">{relativeTime(r.loggedDate)}</Typography>
        </Box>
      ),
    },
  ];

  const boardStatuses = store.configuration.complaintStatuses.filter((s) => s.active);

  return (
    <Box>
      <PageHeader
        title="Complaints / Case Management"
        subtitle="Multi-channel complaint capture, investigation, escalation and controlled closure with live SLA management against configured targets."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Complaints / Cases' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Complaints', filtered.map((c) => ({
                Reference: c.reference, Subject: c.subject, Customer: customerName(c.customerId),
                Status: c.status, Severity: c.severity, Priority: c.priority, Channel: c.channel,
                Category: c.category, 'Sub-category': c.subCategory, 'Business unit': c.businessUnit,
                'Assigned to': userName(c.assignedToId), Team: c.assignedTeam,
                Logged: c.loggedDate, 'SLA target (days)': c.slaTargetDays,
                'SLA due': fmtDate(c.dueDate), 'SLA risk': c._sla.risk,
                'SLA consumed %': Math.round(c._sla.consumed),
                Escalated: c.escalated ? 'Yes' : 'No', Feedback: c.customerFeedback ?? '',
                Closed: c.closedDate ? fmtDate(c.closedDate) : '',
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/complaints/new')}>
              New complaint
            </Button>
          </>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Open cases" value={num(open.length)} sub={`${num(store.complaints.length)} total`} colour="#0B2545" />
        <KpiCard dense label="SLA at risk" value={num(atRisk.length)} sub={`${num(atRisk.filter((c) => c._sla.risk === 'Breached').length)} breached`} colour="#DC2626" onClick={() => set('sla', 'At Risk')} />
        <KpiCard dense label="Escalated" value={num(escalated.length)} sub="Supervisor action" colour="#B91C1C" onClick={() => set('status', 'Escalated')} />
        <KpiCard dense label="Unassigned" value={num(unassigned.length)} sub="Awaiting routing" colour="#D97706" onClick={() => set('status', 'Logged')} />
        <KpiCard dense label="SLA met rate" value={pct(metRate)} sub={`${num(closedThisPeriod.length)} closed cases`} colour="#059669" />
        <KpiCard dense label="Pending information" value={num(open.filter((c) => c.status === 'Pending Information').length)} sub="Clock paused" colour="#7C3AED" onClick={() => set('status', 'Pending Information')} />
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...boardStatuses.map((s) => ({ value: s.label, label: s.label }))] },
          { id: 'severity', label: 'Severity', options: [{ value: 'all', label: 'All severities' }, ...['Critical', 'High', 'Medium', 'Low'].map((s) => ({ value: s, label: s }))], width: 145 },
          { id: 'channel', label: 'Channel', options: [{ value: 'all', label: 'All channels' }, ...['Email', 'Telephone', 'Walk-in', 'Internal Referral', 'Online Portal', 'Chat', 'Social Media'].map((s) => ({ value: s, label: s }))] },
          { id: 'category', label: 'Category', options: [{ value: 'all', label: 'All categories' }, ...store.configuration.complaintCategories.map((c) => ({ value: c.label, label: c.label }))], width: 185 },
          { id: 'businessUnit', label: 'Business unit', options: [{ value: 'all', label: 'All units' }, ...store.configuration.businessUnits.map((b) => ({ value: b, label: b }))], width: 185 },
          { id: 'assignee', label: 'Assigned to', options: [{ value: 'all', label: 'Everyone' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 175 },
          { id: 'sla', label: 'SLA risk', options: [{ value: 'all', label: 'All' }, ...['On Track', 'At Risk', 'Breached', 'Met'].map((s) => ({ value: s, label: s }))], width: 140 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ status: 'all', severity: 'all', channel: 'all', category: 'all', assignee: 'all', businessUnit: 'all', sla: 'all' })}
        extra={
          <ToggleButtonGroup
            size="small" exclusive value={view}
            onChange={(_, v) => v && setView(v)}
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="list" aria-label="List view"><ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} /> List</ToggleButton>
            <ToggleButton value="board" aria-label="Board view"><ViewKanbanIcon sx={{ fontSize: 18, mr: 0.5 }} /> Board</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {view === 'list' ? (
        <DataTable
          rows={filtered}
          columns={columns}
          searchable
          searchPlaceholder="Search reference, subject, customer or description…"
          searchFields={(r) => `${r.reference} ${r.subject} ${r.description} ${customerName(r.customerId)} ${r.category} ${r.subCategory}`}
          defaultSort={{ id: 'sla', dir: 'desc' }}
          onRowClick={(r) => navigate(`/complaints/${r.id}`)}
          initialRowsPerPage={15}
          emptyTitle="No complaints match these filters"
          emptyDescription="Clear the filters, or log a new complaint to see the full lifecycle in action."
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 1.75, overflowX: 'auto', pb: 2 }}>
          {boardStatuses.map((status) => {
            const items = filtered.filter((c) => c.status === status.label);
            return (
              <Box key={status.id} sx={{ minWidth: 288, width: 288, flexShrink: 0 }}>
                <Stack
                  direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ px: 1.5, py: 1.25, borderRadius: 2, bgcolor: alpha(status.colour, 0.08), mb: 1.25 }}
                >
                  <Stack direction="row" gap={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: status.colour }} />
                    <Typography variant="subtitle2" sx={{ color: status.colour, fontWeight: 700 }}>{status.label}</Typography>
                  </Stack>
                  <Chip size="small" label={items.length} sx={{ height: 20, bgcolor: alpha(status.colour, .16), color: status.colour, fontWeight: 700 }} />
                </Stack>
                <Stack gap={1.25}>
                  {items.map((c) => (
                    <Box
                      key={c.id}
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      sx={{
                        p: 1.5, borderRadius: 2.5, bgcolor: 'background.paper',
                        border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                        borderLeft: `3px solid ${status.colour}`,
                        transition: 'box-shadow .15s, transform .15s',
                        '&:hover': { boxShadow: '0 8px 22px -14px rgba(11,37,69,.4)', transform: 'translateY(-1px)' },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                          {c.reference}
                        </Typography>
                        <StatusChip value={c.severity} />
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.subject}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }} noWrap>
                        {customerName(c.customerId)}
                      </Typography>
                      <SlaBar consumed={c._sla.consumed} risk={c._sla.risk} compact />
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                        <Stack direction="row" gap={0.5} alignItems="center">
                          {c.assignedToId ? (
                            <Tooltip title={userName(c.assignedToId)}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.55rem', bgcolor: store.users.find((u) => u.id === c.assignedToId)?.avatarColor }}>
                                {store.users.find((u) => u.id === c.assignedToId)?.initials}
                              </Avatar>
                            </Tooltip>
                          ) : (
                            <Chip size="small" label="Unassigned" sx={{ height: 18, fontSize: '0.6rem' }} color="warning" variant="outlined" />
                          )}
                          {c.escalated && (
                            <Tooltip title="Escalated"><EscalateIcon sx={{ fontSize: 15, color: 'error.main' }} /></Tooltip>
                          )}
                          {c._sla.paused && (
                            <Tooltip title="SLA clock paused pending customer information">
                              <Badge variant="dot" color="warning"><WarningIcon sx={{ fontSize: 14, color: 'warning.main' }} /></Badge>
                            </Tooltip>
                          )}
                        </Stack>
                        <Typography variant="caption">{relativeTime(c.loggedDate)}</Typography>
                      </Stack>
                    </Box>
                  ))}
                  {items.length === 0 && (
                    <Box sx={{
                      p: 2.5, borderRadius: 2.5, border: '1px dashed', borderColor: 'divider',
                      textAlign: 'center',
                    }}>
                      <Typography variant="caption">No cases in this status</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Complaint statuses are configuration, not code"
          subtitle="The board columns above are generated from the complaint status list maintained in the Configuration Centre. Adding, renaming or deactivating a status changes this board immediately, with no development involved."
        >
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            {boardStatuses.map((s) => (
              <Chip key={s.id} label={s.label} size="small" sx={{ bgcolor: alpha(s.colour, .12), color: s.colour, fontWeight: 700 }} />
            ))}
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button size="small" variant="outlined" onClick={() => navigate('/configuration?tab=complaints')}>
              Open configuration
            </Button>
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Complaints;
