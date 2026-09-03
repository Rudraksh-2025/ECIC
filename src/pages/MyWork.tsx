import * as React from 'react';
import { Alert, Avatar, Box, Button, Chip, Divider, Tab, Tabs, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import TaskIcon from '@mui/icons-material/FactCheck';
import SlaIcon from '@mui/icons-material/Timer';
import ApprovalIcon from '@mui/icons-material/HowToReg';
import FollowUpIcon from '@mui/icons-material/PhoneCallback';
import EscalationIcon from '@mui/icons-material/PriorityHigh';
import CommsIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import { useStore, useCurrentUser } from '../store';
import { api } from '../services/mockApi';
import { EmptyState, Grid, KpiCard, PageHeader, SectionCard, SlaBar, Stack, StatusChip } from '../components';
import { useComplaintSla, leadSla, toast } from '../hooks';
import { fmtDate, relativeTime } from '../utils/dates';
import { num } from '../utils/format';

export function MyWork() {
  const navigate = useNavigate();
  const store = useStore();
  const me = useCurrentUser();
  const slaOf = useComplaintSla();
  const [tab, setTab] = React.useState(0);

  const myTasks = store.tasks.filter((t) => t.ownerId === me.id && t.status !== 'Completed');
  const myComplaints = store.complaints
    .filter((c) => (c.assignedToId === me.id || c.escalatedToId === me.id) && c.status !== 'Closed')
    .map((c) => ({ complaint: c, sla: slaOf(c) }));
  const atRisk = myComplaints.filter((x) => x.sla.risk === 'At Risk' || x.sla.risk === 'Breached');
  const myLeads = store.leads.filter((l) => (l.ownerId === me.id || l.backupOwnerId === me.id) && !['Converted', 'Closed', 'Disqualified'].includes(l.status));
  const leadsDue = myLeads.filter((l) => !l.firstContactDate).map((l) => ({ lead: l, sla: leadSla(l) }));
  const approvals = myTasks.filter((t) => t.category === 'Approval');
  const followUps = myTasks.filter((t) => t.category === 'Follow-up');
  const escalations = myTasks.filter((t) => t.category === 'Escalation');
  const comms = myTasks.filter((t) => t.category === 'Customer Communication');
  const myOpportunities = store.opportunities.filter((o) => o.ownerId === me.id && !o.closedDate);
  const myApplications = store.applications.filter((a) => (a.ownerId === me.id || a.reviewerId === me.id || a.approverId === me.id) && !['Approved', 'Rejected'].includes(a.status));

  const routeFor = (type: string, id: string) => {
    switch (type) {
      case 'Complaint': return `/complaints/${id}`;
      case 'Lead': return `/leads/${id}`;
      case 'Opportunity': return `/opportunities/${id}`;
      case 'Application': return `/applications/${id}`;
      case 'Campaign': return `/campaigns/${id}`;
      case 'CIM': return '/cim';
      default: return '/tasks';
    }
  };

  const TaskList = ({ tasks, emptyTitle, emptyDescription }: { tasks: typeof myTasks; emptyTitle: string; emptyDescription: string }) => (
    tasks.length === 0
      ? <EmptyState title={emptyTitle} description={emptyDescription} />
      : (
        <Stack gap={1}>
          {tasks.map((t) => {
            const overdue = new Date(t.dueDate) < new Date();
            return (
              <Box
                key={t.id}
                sx={{
                  p: 1.75, borderRadius: 2.5, border: '1px solid',
                  borderColor: overdue ? alpha('#DC2626', .35) : 'divider',
                  bgcolor: overdue ? alpha('#DC2626', .02) : 'transparent',
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{t.title}</Typography>
                      <StatusChip value={t.priority} />
                      <Chip size="small" label={t.category} sx={{ height: 19, fontSize: '0.63rem' }} />
                      {overdue && <Chip size="small" label="Overdue" sx={{ height: 19, fontSize: '0.63rem', bgcolor: alpha('#DC2626', .12), color: '#DC2626', fontWeight: 700 }} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t.description}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      Due {fmtDate(t.dueDate)} ({relativeTime(t.dueDate)}) · {t.relatedType} {t.relatedId}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    <Button size="small" variant="outlined" onClick={() => navigate(routeFor(t.relatedType, t.relatedId))}>
                      Open record
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        await api.snoozeTask(t.id, 2);
                        toast({ message: 'Task snoozed', severity: 'info', detail: 'The due date moved out by two business days and the change was audited.' });
                      }}
                    >
                      Snooze
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        const other = store.users.find((u) => u.id !== me.id && u.status === 'Active' && u.role === me.role);
                        if (!other) return;
                        await api.reassignTask(t.id, other.id);
                        toast({ message: `Task reassigned to ${other.name}`, severity: 'success', detail: 'The new owner has been notified.' });
                      }}
                    >
                      Reassign
                    </Button>
                    <Button
                      size="small" variant="contained"
                      onClick={async () => {
                        await api.completeTask(t.id);
                        toast({ message: 'Task completed', severity: 'success', detail: 'The task was closed and an audit event written.' });
                      }}
                    >
                      Complete
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )
  );

  return (
    <Box>
      <PageHeader
        title="My Work"
        subtitle={`Everything requiring action from ${me.name} — tasks, SLA risk, approvals, follow-ups, escalations and customer communications, in one workspace.`}
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'My Work' }]}
        chips={
          <Stack direction="row" gap={1} alignItems="center">
            <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: me.avatarColor }}>{me.initials}</Avatar>
            <Chip size="small" label={me.jobTitle} />
          </Stack>
        }
        actions={<Button variant="contained" onClick={() => navigate('/tasks')}>Open SLA workspace</Button>}
      />

      {atRisk.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <strong>{atRisk.length} of your cases are at SLA risk or already breached.</strong>{' '}
          {atRisk.filter((x) => x.sla.risk === 'Breached').length} have passed their target date and require immediate action.
        </Alert>
      )}

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Open tasks" value={num(myTasks.length)} sub={`${num(myTasks.filter((t) => new Date(t.dueDate) < new Date()).length)} overdue`} colour="#0B2545" icon={<TaskIcon fontSize="small" />} onClick={() => setTab(0)} />
        <KpiCard dense label="SLA at risk" value={num(atRisk.length)} sub="Cases requiring action" colour="#DC2626" icon={<SlaIcon fontSize="small" />} onClick={() => setTab(1)} />
        <KpiCard dense label="Pending approvals" value={num(approvals.length)} colour="#D97706" icon={<ApprovalIcon fontSize="small" />} onClick={() => setTab(2)} />
        <KpiCard dense label="Follow-ups" value={num(followUps.length)} colour="#2563EB" icon={<FollowUpIcon fontSize="small" />} onClick={() => setTab(3)} />
        <KpiCard dense label="Escalations" value={num(escalations.length)} colour="#B91C1C" icon={<EscalationIcon fontSize="small" />} onClick={() => setTab(4)} />
        <KpiCard dense label="Customer comms" value={num(comms.length)} colour="#0E7C7B" icon={<CommsIcon fontSize="small" />} onClick={() => setTab(5)} />
      </Grid>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label={`All tasks (${myTasks.length})`} />
              <Tab label={`SLA at risk (${atRisk.length})`} />
              <Tab label={`Approvals (${approvals.length})`} />
              <Tab label={`Follow-ups (${followUps.length})`} />
              <Tab label={`Escalations (${escalations.length})`} />
              <Tab label={`Communications (${comms.length})`} />
            </Tabs>

            {tab === 0 && <TaskList tasks={myTasks} emptyTitle="Nothing outstanding" emptyDescription="You have no open tasks. Switch demonstration role to see another user's workload." />}
            {tab === 2 && <TaskList tasks={approvals} emptyTitle="No approvals pending" emptyDescription="Items awaiting your authorisation will appear here." />}
            {tab === 3 && <TaskList tasks={followUps} emptyTitle="No follow-ups" emptyDescription="Follow-up actions on leads and cases will appear here." />}
            {tab === 4 && <TaskList tasks={escalations} emptyTitle="No escalations" emptyDescription="Escalated cases assigned to you will appear here." />}
            {tab === 5 && <TaskList tasks={comms} emptyTitle="No outstanding communications" emptyDescription="Customer communications you need to issue will appear here." />}

            {tab === 1 && (
              atRisk.length === 0
                ? <EmptyState title="No cases at SLA risk" description="Every case assigned to you is comfortably within its SLA target." />
                : (
                  <Stack gap={1.25}>
                    {atRisk.map(({ complaint: c, sla }) => (
                      <Box
                        key={c.id}
                        onClick={() => navigate(`/complaints/${c.id}`)}
                        sx={{
                          p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                          border: '1px solid', borderColor: alpha(sla.risk === 'Breached' ? '#DC2626' : '#D97706', .4),
                          bgcolor: alpha(sla.risk === 'Breached' ? '#DC2626' : '#D97706', .03),
                          '&:hover': { borderColor: sla.risk === 'Breached' ? '#DC2626' : '#D97706' },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{c.subject}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {c.reference} · {store.customers.find((x) => x.id === c.customerId)?.organisation} · {c.category}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.4 }}>
                              SLA due {fmtDate(sla.dueDate)} · {sla.elapsedDays} of {sla.targetDays} business days used
                              {sla.paused && ' · clock paused pending customer information'}
                            </Typography>
                          </Box>
                          <Stack gap={0.75} alignItems="flex-end">
                            <Stack direction="row" gap={0.5}>
                              <StatusChip value={c.severity} />
                              <StatusChip value={c.status} />
                            </Stack>
                            <SlaBar consumed={sla.consumed} risk={sla.risk} />
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )
            )}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title={`My cases (${myComplaints.length})`} action={<Button size="small" onClick={() => navigate('/complaints')}>All cases</Button>}>
            <Stack gap={1}>
              {myComplaints.slice(0, 5).map(({ complaint: c, sla }) => (
                <Box key={c.id} onClick={() => navigate(`/complaints/${c.id}`)} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle', cursor: 'pointer', '&:hover': { bgcolor: alpha('#0B2545', .05) } }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.reference}</Typography>
                    <StatusChip value={sla.risk} />
                  </Stack>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }}>{c.subject}</Typography>
                </Box>
              ))}
              {myComplaints.length === 0 && <Typography variant="body2" color="text.secondary">No open cases assigned to you.</Typography>}
            </Stack>
          </SectionCard>

          <SectionCard title={`My leads (${myLeads.length})`} action={<Button size="small" onClick={() => navigate('/leads')}>All leads</Button>}>
            <Stack gap={1}>
              {leadsDue.slice(0, 5).map(({ lead: l, sla }) => (
                <Box key={l.id} onClick={() => navigate(`/leads/${l.id}`)} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle', cursor: 'pointer', '&:hover': { bgcolor: alpha('#0B2545', .05) } }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{l.company}</Typography>
                    <StatusChip value={sla.risk} />
                  </Stack>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                    {l.reference} · first contact due {fmtDate(l.slaDueDate)}
                    {l.backupOwnerId === me.id && ' · you are the backup owner'}
                  </Typography>
                </Box>
              ))}
              {leadsDue.length === 0 && <Typography variant="body2" color="text.secondary">No leads awaiting first contact.</Typography>}
            </Stack>
          </SectionCard>

          <SectionCard title="My portfolio">
            <Stack gap={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Open opportunities</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{myOpportunities.length}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Applications in flight</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{myApplications.length}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Open cases</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{myComplaints.length}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Active leads</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{myLeads.length}</Typography>
              </Stack>
              <Divider />
              <Typography variant="caption">
                Switch demonstration role in the header to see how another user&apos;s workspace differs — the
                queues, permitted actions and visible modules all change.
              </Typography>
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default MyWork;
