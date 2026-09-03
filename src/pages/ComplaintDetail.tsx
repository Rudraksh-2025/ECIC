import * as React from 'react';
import {
  Alert, AlertTitle, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, LinearProgress, MenuItem, Rating, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import EscalateIcon from '@mui/icons-material/PriorityHigh';
import AssignIcon from '@mui/icons-material/PersonAddAlt';
import GavelIcon from '@mui/icons-material/Gavel';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import UploadIcon from '@mui/icons-material/UploadFile';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { ROLES } from '../data/roles';
import { api, renderTemplate } from '../services/mockApi';
import {
  ActivityTimeline, ConfirmDialog, DemoScenarioPanel, EmptyState, Grid, LabelValue,
  PageHeader, SectionCard, SlaBar, Stack, StatusChip,
} from '../components';
import { useComplaintSla, toast } from '../hooks';
import { fmtDate, fmtDateTime } from '../utils/dates';
import { maskEmail, maskPhone } from '../utils/format';
import type { FeedbackRating } from '../types';
import { DocumentUploadDialog, RelatedDocuments } from './documents/DocumentPanels';

const FEEDBACK_OPTIONS: FeedbackRating[] = [
  'Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied',
];

export function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const masked = useMasking();
  const slaOf = useComplaintSla();
  const [tab, setTab] = React.useState(0);
  const [dialog, setDialog] = React.useState<null | 'assign' | 'escalate' | 'resolve' | 'communicate' | 'feedback' | 'info' | 'upload'>(null);
  const [closeOpen, setCloseOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const complaint = store.complaints.find((c) => c.id === id);
  const role = ROLES[store.session.role];
  const canClose = role.permissions.includes('complaint.close');
  const canEscalate = role.permissions.includes('complaint.escalate');
  const canUpdate = role.permissions.includes('complaint.update');

  const [assignForm, setAssignForm] = React.useState({ userId: '', team: '' });
  const [escalateForm, setEscalateForm] = React.useState({ reason: '', to: 'USR-003' });
  const [resolveForm, setResolveForm] = React.useState({
    investigationFindings: '', outcome: '', resolutionDetail: '', correctiveAction: '',
  });
  const [commsForm, setCommsForm] = React.useState({ template: 'complaint_updated', body: '' });
  const [feedbackForm, setFeedbackForm] = React.useState<{ rating: FeedbackRating; comment: string }>({
    rating: 'Satisfied', comment: '',
  });
  const [infoForm] = React.useState({ request: '' });

  React.useEffect(() => {
    if (!complaint) return;
    setAssignForm({ userId: complaint.assignedToId ?? '', team: complaint.assignedTeam });
    setResolveForm({
      investigationFindings: complaint.investigationFindings,
      outcome: complaint.outcome,
      resolutionDetail: complaint.resolutionDetail,
      correctiveAction: complaint.correctiveAction,
    });
  }, [complaint?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!complaint) {
    return (
      <EmptyState
        title="Complaint not found"
        description="This case does not exist in the demonstration dataset. It may have been removed by a demo reset."
        action={<Button variant="contained" onClick={() => navigate('/complaints')}>Back to complaints</Button>}
      />
    );
  }

  const sla = slaOf(complaint);
  const customer = store.customers.find((c) => c.id === complaint.customerId);
  const assignee = store.users.find((u) => u.id === complaint.assignedToId);
  const escalatedTo = store.users.find((u) => u.id === complaint.escalatedToId);
  const closedBy = store.users.find((u) => u.id === complaint.closedById);
  const documents = store.documents.filter((d) => d.complaintId === complaint.id);
  const tasks = store.tasks.filter((t) => t.relatedType === 'Complaint' && t.relatedId === complaint.id);
  const notifications = store.notifications.filter((n) => n.relatedType === 'Complaint' && n.relatedId === complaint.id);
  const audits = store.auditEvents.filter((a) => a.entityId === complaint.reference);
  const locked = complaint.status === 'Closed';
  const preconditions = api.closurePreconditions(complaint);
  const unmet = preconditions.filter((p) => !p.met);

  const run = async (fn: () => Promise<unknown>, message: string, detail: string) => {
    setBusy(true);
    await fn();
    setBusy(false);
    setDialog(null);
    toast({ message, severity: 'success', detail });
  };

  return (
    <Box>
      <PageHeader
        title={complaint.subject}
        subtitle={`${complaint.reference} · ${customer?.organisation ?? '—'} · logged ${fmtDate(complaint.loggedDate)} at ${complaint.loggedTime} via ${complaint.channel}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Complaints / Cases', to: '/complaints' },
          { label: complaint.reference },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={complaint.status} />
            <StatusChip value={complaint.severity} />
            <StatusChip value={complaint.priority} />
            <StatusChip value={sla.risk} />
            {locked && <Chip size="small" icon={<LockIcon />} label="Locked" sx={{ bgcolor: alpha('#334155', .12) }} />}
          </Stack>
        }
        actions={
          !locked && (
            <>
              <Button variant="outlined" startIcon={<AssignIcon />} disabled={!canUpdate} onClick={() => setDialog('assign')}>
                Assign
              </Button>
              <Button variant="outlined" startIcon={<SendIcon />} disabled={!canUpdate} onClick={() => setDialog('communicate')}>
                Communicate
              </Button>
              <Button
                variant="outlined" color="error" startIcon={<EscalateIcon />}
                disabled={!canEscalate || complaint.escalated} onClick={() => setDialog('escalate')}
              >
                Escalate
              </Button>
              <Button
                variant="contained" startIcon={<GavelIcon />} disabled={!canUpdate}
                onClick={() => setDialog('resolve')}
              >
                Record resolution
              </Button>
              <Tooltip title={
                !canClose
                  ? `Segregation of duties: the ${role.name} role may investigate but may not authorise closure. Switch to Complaints Supervisor to close this case.`
                  : unmet.length ? `${unmet.length} closure pre-condition(s) outstanding` : 'Close this complaint'
              }>
                <span>
                  <Button
                    variant="contained" color="secondary" startIcon={<DoneAllIcon />}
                    disabled={!canClose || unmet.length > 0}
                    onClick={() => setCloseOpen(true)}
                  >
                    Close complaint
                  </Button>
                </span>
              </Tooltip>
            </>
          )
        }
      />

      {locked && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Closed record — protected from amendment</AlertTitle>
          Closed on {fmtDateTime(complaint.closedDate)} by {closedBy?.name} ({closedBy?.jobTitle}).
          Standard users cannot amend a closed case; the record is retained in full for audit purposes.
        </Alert>
      )}

      {complaint.escalated && !locked && (
        <Alert severity="error" icon={<EscalateIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Escalated case — supervisor attention required</AlertTitle>
          {complaint.escalationReason}. Escalated to {escalatedTo?.name} on {fmtDateTime(complaint.escalationDate)}.
          {(complaint.customerFeedback === 'Dissatisfied' || complaint.customerFeedback === 'Very Dissatisfied') &&
            ' This escalation was raised automatically by the dissatisfaction rule when the customer recorded negative feedback.'}
        </Alert>
      )}

      {sla.risk === 'Breached' && !locked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>SLA breached</AlertTitle>
          This case has consumed {Math.round(sla.consumed)}% of its {sla.targetDays} business day target
          (due {fmtDate(sla.dueDate)}). An SLA breach notification has been issued on the SMS and in-app channels.
        </Alert>
      )}
      {sla.risk === 'At Risk' && !locked && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>SLA at risk</AlertTitle>
          {Math.round(sla.consumed)}% of the SLA allowance has been consumed with {Math.max(0, sla.remainingDays)} business
          day(s) remaining before the target on {fmtDate(sla.dueDate)}.
        </Alert>
      )}
      {sla.paused && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The SLA clock is <strong>paused</strong> while this case is Pending Information from the customer.
        </Alert>
      )}

      <DemoScenarioPanel
        scenario="A complaint is investigated, the outcome is communicated to the customer, feedback is captured and the case is closed — but only by a role authorised to do so."
        evidence={[
          'Live SLA target, elapsed, remaining and percentage consumed',
          'Investigation findings, outcome, resolution and corrective action recorded on the case',
          'Communication issued on the customer’s preferred channel from a configurable template',
          'Negative feedback automatically escalates the case and creates a supervisor task',
          'Closure pre-condition checklist and role-restricted authorisation',
          'Full timeline and audit trail of every action',
        ]}
        requirements={[6, 11, 13, 14, 16, 19, 20, 21, 22]}
        next="Show the audit trail for this case"
        nextTo="/audit"
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard sx={{ mb: 2.5 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label="Investigation & resolution" />
              <Tab label={`Timeline (${complaint.timeline.length})`} />
              <Tab label={`Communications (${notifications.length})`} />
              <Tab label={`Documents (${documents.length})`} />
              <Tab label={`Audit (${audits.length})`} />
            </Tabs>

            {tab === 0 && (
              <Stack gap={2.5}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Complaint description</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                    {complaint.description}
                  </Typography>
                </Box>
                <Divider />
                <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={2}>
                  <LabelValue label="Customer type" value={complaint.customerKind} />
                  <LabelValue label="Customer" value={
                    <RouterLink to={`/customers/${complaint.customerId}`} style={{ color: '#0E7C7B' }}>
                      {customer?.organisation}
                    </RouterLink>
                  } />
                  <LabelValue label="Contact person" value={complaint.contactName} />
                  <LabelValue label="Contact email" value={masked ? maskEmail(complaint.contactEmail) : complaint.contactEmail} />
                  <LabelValue label="Contact telephone" value={masked ? maskPhone(complaint.contactPhone) : complaint.contactPhone} />
                  <LabelValue label="Preferred channel" value={complaint.preferredChannel} />
                  <LabelValue label="Source / channel" value={complaint.channel} />
                  <LabelValue label="Business unit" value={complaint.businessUnit} />
                  <LabelValue label="Category" value={complaint.category} />
                  <LabelValue label="Sub-category" value={complaint.subCategory} />
                  <LabelValue label="Date received" value={`${fmtDate(complaint.loggedDate)} ${complaint.loggedTime}`} />
                  <LabelValue label="Assigned team" value={complaint.assignedTeam} />
                  <LabelValue label="Assigned specialist" value={assignee?.name ?? 'Unassigned'} />
                  <LabelValue label="Reference" value={complaint.reference} mono />
                </Grid>
                {(complaint.linkedOpportunityId || complaint.linkedApplicationId) && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="overline" color="text.secondary">Related transactions</Typography>
                      <Stack direction="row" gap={1} sx={{ mt: 0.75 }} flexWrap="wrap">
                        {complaint.linkedOpportunityId && (
                          <Chip
                            label={`Opportunity ${store.opportunities.find((o) => o.id === complaint.linkedOpportunityId)?.reference ?? complaint.linkedOpportunityId}`}
                            component={RouterLink} to={`/opportunities/${complaint.linkedOpportunityId}`} clickable size="small"
                          />
                        )}
                        {complaint.linkedApplicationId && (
                          <Chip
                            label={`Application ${store.applications.find((a) => a.id === complaint.linkedApplicationId)?.reference ?? complaint.linkedApplicationId}`}
                            component={RouterLink} to={`/applications/${complaint.linkedApplicationId}`} clickable size="small"
                          />
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Stack gap={2.5}>
                {[
                  ['Investigation findings', complaint.investigationFindings, 'The evidence gathered and the conclusion reached.'],
                  ['Outcome', complaint.outcome, 'Whether the complaint was upheld, partially upheld or not upheld.'],
                  ['Resolution detail', complaint.resolutionDetail, 'What was done to put the matter right.'],
                  ['Corrective action', complaint.correctiveAction, 'The systemic change made to prevent recurrence.'],
                ].map(([label, value, helper]) => (
                  <Box key={label}>
                    <Typography variant="overline" color="text.secondary">{label}</Typography>
                    {value ? (
                      <Typography variant="body2" sx={{ mt: 0.4, lineHeight: 1.65 }}>{value}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled" sx={{ mt: 0.4, fontStyle: 'italic' }}>
                        Not yet recorded — {helper}
                      </Typography>
                    )}
                  </Box>
                ))}
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary">Customer feedback</Typography>
                  {complaint.customerFeedback ? (
                    <Box sx={{ mt: 0.75 }}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <StatusChip value={
                          complaint.customerFeedback.includes('Dissatisfied') ? 'Escalated' : 'Resolved'
                        } />
                        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{complaint.customerFeedback}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        “{complaint.feedbackComment}”
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mb: 1 }}>
                        No feedback captured yet.
                      </Typography>
                      {!locked && (
                        <Button size="small" variant="outlined" onClick={() => setDialog('feedback')}>
                          Capture customer feedback
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
                {complaint.escalated && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="overline" color="text.secondary">Escalation</Typography>
                      <Grid cols={{ xs: 1, sm: 3 }} gap={2} sx={{ mt: 0.5 }}>
                        <LabelValue label="Reason" value={complaint.escalationReason} />
                        <LabelValue label="Escalated to" value={escalatedTo?.name} />
                        <LabelValue label="Escalated on" value={fmtDateTime(complaint.escalationDate)} />
                      </Grid>
                    </Box>
                  </>
                )}
                {locked && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="overline" color="text.secondary">Closure information</Typography>
                      <Grid cols={{ xs: 1, sm: 3 }} gap={2} sx={{ mt: 0.5 }}>
                        <LabelValue label="Closure date" value={fmtDateTime(complaint.closedDate)} />
                        <LabelValue label="Closed by" value={`${closedBy?.name} (${closedBy?.jobTitle})`} />
                        <LabelValue label="Final status" value={<StatusChip value="Closed" />} />
                      </Grid>
                    </Box>
                  </>
                )}
              </Stack>
            )}

            {tab === 2 && <ActivityTimeline events={complaint.timeline} />}

            {tab === 3 && (
              <Stack gap={1.5}>
                {notifications.length === 0 ? (
                  <EmptyState title="No communications yet" description="Communications issued on this case will be recorded here with their full content." />
                ) : notifications.map((n) => (
                  <Box key={n.id} sx={{ p: 1.75, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{n.title}</Typography>
                      <Stack direction="row" gap={0.5}>
                        <Chip size="small" label={n.channel} />
                        <Chip size="small" label={n.type} sx={{ bgcolor: alpha('#2563EB', .1), color: '#2563EB' }} />
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>{fmtDateTime(n.createdAt)}</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 4 && (
              <Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                  <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => setDialog('upload')}>
                    Upload document
                  </Button>
                </Stack>
                <RelatedDocuments documents={documents} />
              </Box>
            )}

            {tab === 5 && (
              <Stack gap={1.25}>
                <Alert severity="info" sx={{ mb: 0.5 }}>
                  Audit records are read-only. There is no edit or delete action anywhere in this interface.
                </Alert>
                {audits.map((a) => (
                  <Box key={a.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'surface.subtle', border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{a.action}</Typography>
                      <Typography variant="caption">{fmtDateTime(a.at)}</Typography>
                    </Stack>
                    <Grid cols={{ xs: 1, sm: 2 }} gap={1} sx={{ mt: 0.75 }}>
                      <LabelValue label="Before" value={a.beforeValue} />
                      <LabelValue label="After" value={a.afterValue} />
                    </Grid>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>
                      {a.userName} · {a.role} · {a.ipAddress} · {a.device} · hash {a.hash}
                    </Typography>
                  </Box>
                ))}
                {audits.length === 0 && <EmptyState title="No audit events" description="Actions on this case will appear here." />}
              </Stack>
            )}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="SLA position" subtitle={`Rule: ${sla.targetDays} business days from receipt`}>
            <SlaBar consumed={sla.consumed} risk={sla.risk} />
            <Grid cols={2} gap={1.5} sx={{ mt: 2 }}>
              <LabelValue label="SLA target" value={`${sla.targetDays} business days`} />
              <LabelValue label="Elapsed" value={`${sla.elapsedDays} business days`} />
              <LabelValue label="Remaining" value={sla.remainingDays >= 0 ? `${sla.remainingDays} business days` : `${Math.abs(sla.remainingDays)} days over`} />
              <LabelValue label="Consumed" value={`${Math.round(sla.consumed)}%`} />
              <LabelValue label="Due date" value={fmtDate(sla.dueDate)} />
              <LabelValue label="Risk status" value={<StatusChip value={sla.risk} />} />
            </Grid>
            {sla.paused && (
              <Alert severity="info" sx={{ mt: 1.5 }} icon={false}>
                <Typography variant="caption">Clock paused pending customer information.</Typography>
              </Alert>
            )}
          </SectionCard>

          <SectionCard title="Closure pre-conditions" subtitle="All conditions must be met before this case can be closed">
            <Stack gap={1.25}>
              {preconditions.map((p) => (
                <Stack key={p.label} direction="row" gap={1.25} alignItems="flex-start">
                  {p.met
                    ? <CheckCircleIcon sx={{ fontSize: 17, color: 'success.main', mt: '2px' }} />
                    : <CancelIcon sx={{ fontSize: 17, color: 'error.main', mt: '2px' }} />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: p.met ? 'text.primary' : 'error.main' }}>
                      {p.label}
                    </Typography>
                    <Typography variant="caption">{p.detail}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ my: 1.75 }} />
            <Alert severity={canClose ? 'success' : 'warning'} icon={false}>
              <Typography variant="caption">
                <strong>Segregation of duties:</strong>{' '}
                {canClose
                  ? `The ${ROLES[store.session.role].name} role is authorised to approve and close complaints.`
                  : `The ${ROLES[store.session.role].name} role may investigate and update this case but may not authorise its closure. Closure is reserved to the Complaints Supervisor.`}
              </Typography>
            </Alert>
          </SectionCard>

          <SectionCard title="Case ownership">
            <Stack gap={1.5}>
              {assignee ? (
                <Stack direction="row" gap={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: assignee.avatarColor }}>{assignee.initials}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{assignee.name}</Typography>
                    <Typography variant="caption">{assignee.jobTitle} · {assignee.team}</Typography>
                  </Box>
                </Stack>
              ) : (
                <Alert severity="warning" icon={false}>
                  <Typography variant="body2">This case is unassigned and sitting in the {complaint.assignedTeam} queue.</Typography>
                </Alert>
              )}
              <Divider />
              <LabelValue label="Assigned team" value={complaint.assignedTeam} />
              {escalatedTo && <LabelValue label="Escalated to" value={`${escalatedTo.name} (${escalatedTo.jobTitle})`} />}
            </Stack>
          </SectionCard>

          <SectionCard title={`Tasks (${tasks.filter((t) => t.status === 'Open').length} open)`}>
            <Stack gap={1}>
              {tasks.length === 0 && <Typography variant="body2" color="text.secondary">No tasks on this case.</Typography>}
              {tasks.map((t) => (
                <Box key={t.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.title}</Typography>
                    <StatusChip value={t.status} />
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                    {t.category} · due {fmtDate(t.dueDate)} · {store.users.find((u) => u.id === t.ownerId)?.name}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      {/* --------------------------- Dialogs --------------------------- */}

      <Dialog open={dialog === 'assign'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Assign complaint</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Assigned team" value={assignForm.team} onChange={(e) => setAssignForm((f) => ({ ...f, team: e.target.value }))} fullWidth>
              {['Complaints Team A', 'Complaints Team B', 'Complaints Oversight'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Assigned specialist" value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))} fullWidth>
              {store.users.filter((u) => u.status === 'Active' && ['complaints_specialist', 'complaints_supervisor'].includes(u.role))
                .map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.jobTitle}</MenuItem>)}
            </TextField>
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                Assignment sets the case status to Assigned, notifies the specialist and writes an audit event.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!assignForm.userId || busy}
            onClick={() => run(
              () => api.assignComplaint(complaint.id, assignForm.userId, assignForm.team),
              'Complaint assigned',
              `${store.users.find((u) => u.id === assignForm.userId)?.name} has been notified and the audit trail updated.`,
            )}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'escalate'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Escalate complaint</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              select label="Escalation reason" value={escalateForm.reason}
              onChange={(e) => setEscalateForm((f) => ({ ...f, reason: e.target.value }))} fullWidth required
            >
              {[
                'Customer dissatisfaction recorded on the resolution outcome',
                'SLA breach risk and cross-divisional complexity',
                'Regulatory or ombud referral threatened',
                'Repeat complaint on the same underlying issue',
                'Material financial exposure to ECIC',
                'Customer has requested escalation to management',
              ].map((r) => <MenuItem key={r} value={r} sx={{ whiteSpace: 'normal' }}>{r}</MenuItem>)}
            </TextField>
            <TextField
              select label="Escalate to" value={escalateForm.to}
              onChange={(e) => setEscalateForm((f) => ({ ...f, to: e.target.value }))} fullWidth
            >
              {store.users.filter((u) => ['complaints_supervisor', 'executive'].includes(u.role) && u.status === 'Active')
                .map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.jobTitle}</MenuItem>)}
            </TextField>
            <Alert severity="warning" icon={false}>
              <Typography variant="caption">
                Escalation sets the case status to Escalated, raises an escalation banner, creates a supervisor task,
                issues a notification and recalculates the SLA risk.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" color="error" disabled={!escalateForm.reason || busy}
            onClick={() => run(
              () => api.escalateComplaint(complaint.id, escalateForm.reason, escalateForm.to),
              'Complaint escalated',
              'The supervisor has been notified and an escalation task created.',
            )}
          >
            Escalate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'resolve'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>Record investigation and resolution</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              required multiline minRows={3} label="Investigation findings" value={resolveForm.investigationFindings}
              onChange={(e) => setResolveForm((f) => ({ ...f, investigationFindings: e.target.value }))}
              helperText="Mandatory before closure — the evidence gathered and the conclusion reached."
              fullWidth
            />
            <TextField
              required select label="Outcome" value={resolveForm.outcome}
              onChange={(e) => setResolveForm((f) => ({ ...f, outcome: e.target.value }))} fullWidth
            >
              {['Complaint upheld', 'Complaint partially upheld', 'Complaint not upheld', 'Complaint withdrawn by customer'].map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </TextField>
            <TextField
              required multiline minRows={3} label="Resolution detail" value={resolveForm.resolutionDetail}
              onChange={(e) => setResolveForm((f) => ({ ...f, resolutionDetail: e.target.value }))}
              helperText="Mandatory before closure — what was done to put the matter right."
              fullWidth
            />
            <TextField
              multiline minRows={2} label="Corrective action" value={resolveForm.correctiveAction}
              onChange={(e) => setResolveForm((f) => ({ ...f, correctiveAction: e.target.value }))}
              helperText="The systemic change made to prevent recurrence."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={busy || !resolveForm.investigationFindings.trim() || !resolveForm.outcome || !resolveForm.resolutionDetail.trim()}
            onClick={() => run(
              () => api.resolveComplaint(complaint.id, resolveForm),
              'Resolution recorded',
              'The case moved to Resolved and a supervisor closure-authorisation task was created.',
            )}
          >
            Save resolution
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'communicate'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>Communicate with the customer</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                This message will be issued on <strong>{complaint.preferredChannel}</strong>, the customer&apos;s
                preferred communication channel recorded on the account.
              </Typography>
            </Alert>
            <TextField
              select label="Communication template" value={commsForm.template}
              onChange={(e) => {
                const key = e.target.value;
                const rendered = renderTemplate(key, {
                  reference: complaint.reference, contactName: complaint.contactName,
                  loggedDate: fmtDate(complaint.loggedDate), channel: complaint.channel,
                  subject: complaint.subject, assignedTeam: complaint.assignedTeam,
                  slaTargetDays: String(complaint.slaTargetDays), dueDate: fmtDate(complaint.dueDate),
                  status: complaint.status, updateNote: 'We are continuing to investigate and will revert shortly.',
                  outcome: complaint.outcome || '[outcome]',
                  resolutionDetail: complaint.resolutionDetail || '[resolution]',
                  correctiveAction: complaint.correctiveAction || '[corrective action]',
                  informationRequested: infoForm.request || '[information requested]',
                  closedDate: fmtDate(complaint.closedDate), closedBy: closedBy?.name ?? '',
                });
                setCommsForm({ template: key, body: rendered?.body ?? '' });
              }}
              fullWidth
            >
              {store.configuration.notificationTemplates
                .filter((t) => t.key.startsWith('complaint') || ['info_requested', 'resolution_communicated'].includes(t.key))
                .map((t) => <MenuItem key={t.key} value={t.key}>{t.name} ({t.channel})</MenuItem>)}
            </TextField>
            <TextField
              multiline minRows={8} label="Message" value={commsForm.body}
              onChange={(e) => setCommsForm((f) => ({ ...f, body: e.target.value }))}
              helperText="Templates and merge fields are maintained in Configuration → Communication Templates."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" startIcon={<SendIcon />} disabled={busy || !commsForm.body.trim()}
            onClick={() => run(
              () => api.sendComplaintCommunication(complaint.id, commsForm.template, commsForm.body),
              'Communication issued',
              `Sent on the ${complaint.preferredChannel} channel and stored against the case.`,
            )}
          >
            Send communication
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'feedback'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Capture customer feedback</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>How satisfied is the customer with the outcome?</Typography>
              <Rating
                value={5 - FEEDBACK_OPTIONS.indexOf(feedbackForm.rating)}
                max={5}
                onChange={(_, v) => setFeedbackForm((f) => ({ ...f, rating: FEEDBACK_OPTIONS[5 - (v ?? 3)] ?? 'Neutral' }))}
              />
              <Typography variant="subtitle2" sx={{ mt: 0.5, color: 'text.primary' }}>{feedbackForm.rating}</Typography>
            </Box>
            <TextField
              select label="Feedback rating" value={feedbackForm.rating}
              onChange={(e) => setFeedbackForm((f) => ({ ...f, rating: e.target.value as FeedbackRating }))} fullWidth
            >
              {FEEDBACK_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
            <TextField
              multiline minRows={3} label="Customer comment" value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))} fullWidth
            />
            {feedbackForm.rating.includes('Dissatisfied') && (
              <Alert severity="warning">
                <AlertTitle sx={{ fontSize: '0.85rem' }}>Dissatisfaction rule will trigger</AlertTitle>
                <Typography variant="body2">
                  Recording this rating automatically flags the case as dissatisfied, sets it to Escalated,
                  raises the escalation banner, creates a supervisor escalation task, issues a notification
                  and recalculates the SLA risk.
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => run(
              () => api.recordComplaintFeedback(complaint.id, feedbackForm.rating, feedbackForm.comment),
              'Customer feedback captured',
              feedbackForm.rating.includes('Dissatisfied')
                ? 'Negative feedback triggered automatic escalation to the Complaints Supervisor.'
                : 'Feedback recorded and included in the customer satisfaction index.',
            )}
          >
            Record feedback
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={closeOpen}
        title={`Close complaint ${complaint.reference}?`}
        message="Closure records the closure date, the closing user and the final status, completes all open tasks on the case, issues a closure confirmation to the customer and locks the record against further amendment."
        confirmLabel="Authorise and close"
        confirmColor="success"
        onCancel={() => setCloseOpen(false)}
        onConfirm={async () => {
          setCloseOpen(false);
          await api.closeComplaint(complaint.id);
          toast({
            message: `Complaint ${complaint.reference} closed`,
            severity: 'success',
            detail: 'Closure date, closing user and final status recorded. The record is now locked.',
          });
        }}
      >
        <Stack gap={1} sx={{ mt: 1.5 }}>
          {preconditions.map((p) => (
            <Stack key={p.label} direction="row" gap={1} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{p.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </ConfirmDialog>

      <DocumentUploadDialog
        open={dialog === 'upload'}
        onClose={() => setDialog(null)}
        links={{
          customerId: complaint.customerId, complaintId: complaint.id,
          transactionRef: complaint.reference,
        }}
      />

      {busy && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }} />}
    </Box>
  );
}

export default ComplaintDetail;
