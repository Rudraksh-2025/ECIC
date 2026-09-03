import * as React from 'react';
import {
  Alert, AlertTitle, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, LinearProgress, MenuItem, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/UploadFile';
import HandoverIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArticleIcon from '@mui/icons-material/Article';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import { ActivityTimeline, ConfirmDialog, EmptyState, Grid, LabelValue, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import { toast } from '../hooks';
import { averageStageDurations } from '../utils/analytics';
import { fmtDate, fmtDateTime } from '../utils/dates';
import { zar } from '../utils/format';
import type { ClosedLostReason, OpportunityStage, UnderwritingStatus } from '../types';
import { ClosedLostDialog } from './opportunities/ClosedLostDialog';
import { DocumentUploadDialog, RelatedDocuments } from './documents/DocumentPanels';

const STAGES: OpportunityStage[] = ['Qualification', 'Proposal / Solution', 'Negotiation', 'Closed Won'];

export function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = React.useState(0);
  const [dialog, setDialog] = React.useState<null | 'activity' | 'upload' | 'handover' | 'underwriting'>(null);
  const [lostOpen, setLostOpen] = React.useState(false);
  const [moveTo, setMoveTo] = React.useState<OpportunityStage | null>(null);

  const opp = store.opportunities.find((o) => o.id === id);
  const role = ROLES[store.session.role];
  const canUpdate = role.permissions.includes('opportunity.update');
  const canUnderwrite = role.permissions.includes('underwriting.update');

  const [activityForm, setActivityForm] = React.useState({ type: 'Call', subject: '', notes: '', date: new Date().toISOString().slice(0, 10), status: 'Completed' });
  const [handoverForm, setHandoverForm] = React.useState({ unit: 'STI', underwriterId: 'USR-010' });
  const [uwForm, setUwForm] = React.useState({ status: 'Under Review', note: '' });

  if (!opp) {
    return (
      <EmptyState
        title="Opportunity not found"
        description="This opportunity does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/opportunities')}>Back to opportunities</Button>}
      />
    );
  }

  const closed = !!opp.closedDate;
  const readOnly = closed && !role.permissions.includes('security.manage');
  const customer = store.customers.find((c) => c.id === opp.customerId);
  const owner = store.users.find((u) => u.id === opp.ownerId);
  const lead = store.leads.find((l) => l.id === opp.originatingLeadId);
  const campaign = store.campaigns.find((c) => c.id === opp.campaignId);
  const applications = store.applications.filter((a) => a.opportunityId === opp.id);
  const documents = store.documents.filter((d) => d.opportunityId === opp.id);
  const activities = store.activities.filter((a) => a.relatedType === 'Opportunity' && a.relatedId === opp.id);
  const avgStage = averageStageDurations(store.opportunities);
  const underwriter = store.users.find((u) => u.id === opp.underwritingOwnerId);

  const currentStage = opp.stageHistory[opp.stageHistory.length - 1];
  const currentDays = currentStage && !currentStage.exitedAt
    ? Math.max(1, Math.round((Date.now() - new Date(currentStage.enteredAt).getTime()) / 86400000)) : 0;
  const stageIndex = STAGES.indexOf(opp.stage);
  const nextStage = stageIndex >= 0 && stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;

  return (
    <Box>
      <PageHeader
        title={opp.name}
        subtitle={`${opp.reference} · ${customer?.organisation ?? '—'} · created ${fmtDate(opp.createdDate)}${lead ? ` from lead ${lead.reference}` : ''}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Opportunities', to: '/opportunities' },
          { label: opp.reference },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={opp.stage} />
            <Chip size="small" label={opp.forecastCategory} sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />
            <Chip size="small" label={`${opp.probability}% probability`} />
            {closed && <Chip size="small" icon={<LockIcon />} label="Closed — read-only" sx={{ bgcolor: alpha('#334155', .12) }} />}
          </Stack>
        }
        actions={
          !readOnly && (
            <>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog('activity')}>Log activity</Button>
              {opp.underwritingStatus === 'Not Handed Over' || opp.underwritingStatus === 'Awaiting Handover' ? (
                <Button variant="outlined" startIcon={<HandoverIcon />} disabled={!canUpdate} onClick={() => setDialog('handover')}>
                  Hand over to underwriting
                </Button>
              ) : (
                <Tooltip title={!canUnderwrite ? 'Only an Underwriting User may update the underwriting status. Switch role to demonstrate.' : ''}>
                  <span>
                    <Button variant="outlined" disabled={!canUnderwrite} onClick={() => setDialog('underwriting')}>
                      Update underwriting status
                    </Button>
                  </span>
                </Tooltip>
              )}
              <Button variant="outlined" color="error" disabled={!canUpdate} onClick={() => setLostOpen(true)}>
                Close lost
              </Button>
              {nextStage && (
                <Button
                  variant="contained" endIcon={<ArrowForwardIcon />} disabled={!canUpdate}
                  onClick={() => setMoveTo(nextStage)}
                >
                  Move to {nextStage}
                </Button>
              )}
            </>
          )
        }
      />

      {readOnly && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Closed opportunity — protected from amendment</AlertTitle>
          {opp.stage === 'Closed Won'
            ? `Closed won on ${fmtDate(opp.closedDate)}. Revenue is recognised against ${campaign ? `campaign "${campaign.name}"` : 'no campaign'}.`
            : `Closed lost on ${fmtDate(opp.closedDate)} — reason: ${opp.closedLostReason}. ${opp.closedLostDetail}`}
          {' '}Standard users cannot amend a closed opportunity.
        </Alert>
      )}

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label={`Products (${opp.products.length})`} />
              <Tab label="Stage timing" />
              <Tab label={`Activities (${activities.length})`} />
              <Tab label={`Documents (${documents.length})`} />
              <Tab label="Traceability" />
              <Tab label={`Timeline (${opp.timeline.length})`} />
            </Tabs>

            {tab === 0 && (
              <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={2}>
                <LabelValue label="Reference" value={opp.reference} mono />
                <LabelValue label="Account" value={
                  <RouterLink to={`/customers/${opp.customerId}`} style={{ color: '#0E7C7B' }}>{customer?.organisation}</RouterLink>
                } />
                <LabelValue label="Owner" value={owner?.name} />
                <LabelValue label="Business unit" value={opp.businessUnit} />
                <LabelValue label="Estimated value" value={zar(opp.estimatedValue)} />
                <LabelValue label="Weighted value" value={zar(opp.estimatedValue * opp.probability / 100)} />
                <LabelValue label="Sales stage" value={<StatusChip value={opp.stage} />} />
                <LabelValue label="Forecast category" value={opp.forecastCategory} />
                <LabelValue label="Expected close date" value={fmtDate(opp.expectedCloseDate)} />
                <LabelValue label="Created" value={fmtDate(opp.createdDate)} />
                <LabelValue label="Campaign" value={campaign ? (
                  <RouterLink to={`/campaigns/${campaign.id}`} style={{ color: '#0E7C7B' }}>{campaign.name}</RouterLink>
                ) : 'No attribution'} />
                <LabelValue label="Originating lead" value={lead ? (
                  <RouterLink to={`/leads/${lead.id}`} style={{ color: '#0E7C7B' }}>{lead.reference}</RouterLink>
                ) : 'Created directly'} />
                <LabelValue label="Underwriting unit" value={opp.underwritingUnit ?? '—'} />
                <LabelValue label="Underwriting status" value={opp.underwritingStatus ?? '—'} />
                <LabelValue label="Handover date" value={opp.handoverDate ? fmtDate(opp.handoverDate) : '—'} />
                <LabelValue label="Underwriter" value={underwriter?.name ?? '—'} />
                {closed && <LabelValue label="Closed date" value={fmtDate(opp.closedDate)} />}
                {opp.closedLostReason && <LabelValue label="Closed-lost reason" value={opp.closedLostReason} />}
                {opp.closedLostDetail && <LabelValue wide label="Loss detail" value={opp.closedLostDetail} />}
              </Grid>
            )}

            {tab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }} icon={false}>
                  <Typography variant="caption">
                    ECIC opportunities may carry a single product or multiple products. Line values roll up to the
                    opportunity value shown on the pipeline.
                  </Typography>
                </Alert>
                <Stack gap={1.25}>
                  {opp.products.map((p) => (
                    <Box key={p.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{p.product}</Typography>
                          <Typography variant="caption">{p.cover} · tenor {p.tenor}</Typography>
                        </Box>
                        <Typography variant="subtitle1">{zar(p.value)}</Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Total product value</Typography>
                  <Typography variant="h5">{zar(opp.products.reduce((s, p) => s + p.value, 0))}</Typography>
                </Stack>
              </Box>
            )}

            {tab === 2 && (
              <Stack gap={2.5}>
                <Alert severity="info" icon={false}>
                  <Typography variant="caption">
                    Time in stage is compared against the portfolio average so that stalled opportunities are visible
                    without running a report.
                  </Typography>
                </Alert>
                {opp.stageHistory.map((h, i) => {
                  const avg = avgStage[h.stage] ?? 0;
                  const days = h.exitedAt ? h.days : currentDays;
                  const ratio = avg > 0 ? (days / avg) * 100 : 60;
                  const active = !h.exitedAt;
                  return (
                    <Box key={`${h.stage}-${i}`}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                        <Stack direction="row" gap={1} alignItems="center">
                          <StatusChip value={h.stage} />
                          {active && <Chip size="small" label="Current stage" sx={{ height: 19, bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B' }} />}
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {days} day{days === 1 ? '' : 's'}{avg > 0 && ` · average ${avg.toFixed(0)}`}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate" value={Math.min(100, ratio)}
                        sx={{
                          height: 8, bgcolor: alpha('#0B2545', .07),
                          '& .MuiLinearProgress-bar': { bgcolor: ratio > 130 ? '#DC2626' : ratio > 90 ? '#D97706' : '#059669' },
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.4 }}>
                        Entered {fmtDateTime(h.enteredAt)}{h.exitedAt ? ` · exited ${fmtDateTime(h.exitedAt)}` : ' · still in this stage'}
                        {ratio > 130 && ' · exceeding the portfolio average'}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}

            {tab === 3 && (
              <Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} disabled={readOnly} onClick={() => setDialog('activity')}>
                    Log activity
                  </Button>
                </Stack>
                {activities.length === 0 ? (
                  <EmptyState title="No activities logged" description="Calls, meetings, emails, tasks and site visits logged against this opportunity appear here." />
                ) : (
                  <Stack gap={1}>
                    {[...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((a) => (
                      <Box key={a.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                          <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <Chip size="small" label={a.type} sx={{ bgcolor: alpha('#2563EB', .1), color: '#2563EB' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{a.subject}</Typography>
                          </Stack>
                          <StatusChip value={a.status} />
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          {store.users.find((u) => u.id === a.ownerId)?.name} · {fmtDateTime(a.date)}
                        </Typography>
                        {a.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{a.notes}</Typography>}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {tab === 4 && (
              <Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                  <Button size="small" variant="outlined" startIcon={<UploadIcon />} disabled={readOnly} onClick={() => setDialog('upload')}>
                    Upload document
                  </Button>
                </Stack>
                <RelatedDocuments documents={documents} />
              </Box>
            )}

            {tab === 5 && (
              <Stack gap={2}>
                <Alert severity="info" icon={false}>
                  <Typography variant="caption">
                    The full traceability chain for this transaction. Every node is clickable.
                  </Typography>
                </Alert>
                {[
                  { label: 'Customer', value: customer?.organisation, to: `/customers/${opp.customerId}`, sub: `${customer?.customerType} · ${customer?.sector}` },
                  ...(lead ? [{ label: 'Originating lead', value: lead.reference, to: `/leads/${lead.id}`, sub: `${lead.source} · ${lead.status} · score ${lead.qualificationScore}` }] : []),
                  { label: 'Opportunity', value: opp.reference, to: `/opportunities/${opp.id}`, sub: `${opp.stage} · ${zar(opp.estimatedValue, true)}` },
                  ...applications.map((a) => ({ label: 'Application', value: a.reference, to: `/applications/${a.id}`, sub: `${a.formType} · ${a.status}` })),
                  ...(applications.some((a) => a.signature.signed)
                    ? [{ label: 'Signed form', value: applications.find((a) => a.signature.signed)!.signature.certificateRef, to: `/applications/${applications.find((a) => a.signature.signed)!.id}`, sub: `Signed ${fmtDate(applications.find((a) => a.signature.signed)!.signature.signedAt)}` }]
                    : []),
                  { label: 'Supporting documents', value: `${documents.length} document(s)`, to: `/documents?opportunity=${opp.id}`, sub: documents.map((d) => d.docType).slice(0, 3).join(', ') },
                  ...(campaign ? [{ label: 'Campaign', value: campaign.name, to: `/campaigns/${campaign.id}`, sub: `${campaign.type} · ${campaign.status}` }] : []),
                ].map((node, i, arr) => (
                  <Box key={`${node.label}-${i}`}>
                    <Box
                      onClick={() => navigate(node.to)}
                      sx={{
                        p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                        '&:hover': { borderColor: 'secondary.main', bgcolor: 'surface.subtle' },
                      }}
                    >
                      <Typography variant="overline" color="text.secondary">{node.label}</Typography>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{node.value}</Typography>
                      <Typography variant="caption">{node.sub}</Typography>
                    </Box>
                    {i < arr.length - 1 && (
                      <Box sx={{ height: 16, width: 2, bgcolor: 'divider', ml: 3, my: 0.25 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 6 && <ActivityTimeline events={opp.timeline} />}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Pipeline position">
            <Stack gap={1.25}>
              {STAGES.map((s, i) => {
                const done = STAGES.indexOf(opp.stage) >= i || opp.stage === 'Closed Won';
                const current = opp.stage === s;
                return (
                  <Stack key={s} direction="row" gap={1.25} alignItems="center">
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700,
                      bgcolor: done ? alpha('#0E7C7B', .14) : 'surface.sunken',
                      color: done ? '#0E7C7B' : 'text.disabled',
                    }}>{done ? '✓' : i + 1}</Box>
                    <Typography variant="body2" sx={{ fontWeight: current ? 700 : 400, color: done ? 'text.primary' : 'text.disabled' }}>
                      {s}
                    </Typography>
                  </Stack>
                );
              })}
              {opp.stage === 'Closed Lost' && (
                <Stack direction="row" gap={1.25} alignItems="center">
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: alpha('#DC2626', .14), color: '#DC2626', display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700 }}>×</Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Closed Lost</Typography>
                </Stack>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Grid cols={2} gap={1.5}>
              <LabelValue label="Current stage duration" value={closed ? '—' : `${currentDays} days`} />
              <LabelValue label="Portfolio average" value={`${(avgStage[opp.stage] ?? 0).toFixed(0)} days`} />
            </Grid>
          </SectionCard>

          <SectionCard title="Underwriting handover" subtitle="BDU retains visibility of the lifecycle after handover">
            <Stack gap={1.5}>
              <LabelValue label="Underwriting status" value={<StatusChip value={opp.underwritingStatus ?? 'Not Handed Over'} />} />
              <LabelValue label="Underwriting unit" value={opp.underwritingUnit ?? 'Not yet allocated'} />
              <LabelValue label="Assigned underwriter" value={underwriter?.name ?? 'Not yet allocated'} />
              <LabelValue label="Handover date" value={opp.handoverDate ? fmtDateTime(opp.handoverDate) : 'Not handed over'} />
              <Divider />
              <Button size="small" variant="outlined" onClick={() => navigate('/pipeline')}>
                Open WIP & underwriting pipeline
              </Button>
            </Stack>
          </SectionCard>

          <SectionCard title="Account team">
            <Stack gap={1.5}>
              {owner && (
                <Stack direction="row" gap={1.25} alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: owner.avatarColor }}>{owner.initials}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{owner.name}</Typography>
                    <Typography variant="caption">{owner.jobTitle} · opportunity owner</Typography>
                  </Box>
                </Stack>
              )}
              {underwriter && (
                <Stack direction="row" gap={1.25} alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: underwriter.avatarColor }}>{underwriter.initials}</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{underwriter.name}</Typography>
                    <Typography variant="caption">{underwriter.jobTitle} · underwriting</Typography>
                  </Box>
                </Stack>
              )}
            </Stack>
          </SectionCard>

          <SectionCard title={`Applications (${applications.length})`}>
            {applications.length === 0 ? (
              <Stack gap={1.5}>
                <Typography variant="body2" color="text.secondary">
                  No digital application has been created for this opportunity yet.
                </Typography>
                <Button size="small" variant="outlined" startIcon={<ArticleIcon />} onClick={() => navigate('/applications/new')}>
                  Create application
                </Button>
              </Stack>
            ) : (
              <Stack gap={1}>
                {applications.map((a) => (
                  <Box
                    key={a.id} onClick={() => navigate(`/applications/${a.id}`)}
                    sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle', cursor: 'pointer', '&:hover': { bgcolor: alpha('#0B2545', .05) } }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{a.reference}</Typography>
                      <StatusChip value={a.status} />
                    </Stack>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>{a.formType}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Stack>
      </Grid>

      {/* --------------------------- Dialogs --------------------------- */}

      <Dialog open={dialog === 'activity'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Log activity</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Type" value={activityForm.type} onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))} fullWidth>
              {['Call', 'Meeting', 'Email', 'Task', 'Site Visit'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField required label="Subject" value={activityForm.subject} onChange={(e) => setActivityForm((f) => ({ ...f, subject: e.target.value }))} fullWidth />
            <Grid cols={2} gap={2}>
              <TextField
                type="date" label="Date" value={activityForm.date}
                onChange={(e) => setActivityForm((f) => ({ ...f, date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField select label="Status" value={activityForm.status} onChange={(e) => setActivityForm((f) => ({ ...f, status: e.target.value }))}>
                {['Planned', 'Completed', 'Overdue', 'Cancelled'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <TextField multiline minRows={3} label="Notes" value={activityForm.notes} onChange={(e) => setActivityForm((f) => ({ ...f, notes: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!activityForm.subject}
            onClick={async () => {
              await api.logActivity({
                type: activityForm.type as never, subject: activityForm.subject,
                ownerId: store.session.userId, date: new Date(activityForm.date).toISOString(),
                status: activityForm.status as never, notes: activityForm.notes,
                relatedType: 'Opportunity', relatedId: opp.id,
              });
              setDialog(null);
              setActivityForm({ type: 'Call', subject: '', notes: '', date: new Date().toISOString().slice(0, 10), status: 'Completed' });
              toast({ message: 'Activity logged', severity: 'success', detail: 'Visible on the opportunity, the customer 360 view and the activity report.' });
            }}
          >
            Log activity
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'handover'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Hand over to underwriting</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Underwriting unit" value={handoverForm.unit} onChange={(e) => setHandoverForm((f) => ({ ...f, unit: e.target.value }))} fullWidth>
              <MenuItem value="STI">Short-Term Insurance (STI)</MenuItem>
              <MenuItem value="Medium/Long-Term Insurance">Medium/Long-Term Insurance</MenuItem>
            </TextField>
            <TextField select label="Assign to underwriter" value={handoverForm.underwriterId} onChange={(e) => setHandoverForm((f) => ({ ...f, underwriterId: e.target.value }))} fullWidth>
              {store.users.filter((u) => u.role === 'underwriting_user' && u.status === 'Active')
                .map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.team}</MenuItem>)}
            </TextField>
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                The work-in-progress record moves into the underwriting queue. The Business Development Unit
                retains full visibility of the lifecycle after handover and continues to see every status change.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await api.handoverToUnderwriting(opp.id, handoverForm.unit as 'STI' | 'Medium/Long-Term Insurance', handoverForm.underwriterId);
              setDialog(null);
              toast({ message: 'Handed over to underwriting', severity: 'success', detail: 'The underwriter has been notified and the BDU retains lifecycle visibility.' });
            }}
          >
            Hand over
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'underwriting'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Update underwriting status</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Underwriting status" value={uwForm.status} onChange={(e) => setUwForm((f) => ({ ...f, status: e.target.value }))} fullWidth>
              {['In Underwriting Queue', 'Under Review', 'Information Requested', 'Approved', 'Declined'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField multiline minRows={3} label="Note to the Business Development Unit" value={uwForm.note} onChange={(e) => setUwForm((f) => ({ ...f, note: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await api.setUnderwritingStatus(opp.id, uwForm.status as UnderwritingStatus, uwForm.note || 'Underwriting status updated.');
              setDialog(null);
              toast({ message: 'Underwriting status updated', severity: 'success', detail: 'The opportunity owner in the BDU has been notified.' });
            }}
          >
            Update status
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!moveTo}
        title={`Move to ${moveTo}?`}
        message="The current stage clock closes, the new stage clock starts and the weighted forecast is recalculated on the new stage probability. An audit event is written."
        confirmLabel="Move opportunity"
        onCancel={() => setMoveTo(null)}
        onConfirm={async () => {
          if (!moveTo) return;
          const target = moveTo;
          setMoveTo(null);
          await api.moveOpportunityStage(opp.id, target);
          toast({ message: `Moved to ${target}`, severity: 'success', detail: 'Stage duration recorded and forecast recalculated.' });
        }}
      />

      <ClosedLostDialog
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        onConfirm={async (reason: ClosedLostReason, detail: string) => {
          await api.moveOpportunityStage(opp.id, 'Closed Lost', { reason, detail });
          setLostOpen(false);
          toast({
            message: 'Opportunity closed lost', severity: 'info',
            detail: `Reason "${reason}" recorded. The record is now read-only for standard users.`,
          });
        }}
      />

      <DocumentUploadDialog
        open={dialog === 'upload'}
        onClose={() => setDialog(null)}
        links={{ customerId: opp.customerId, opportunityId: opp.id, transactionRef: opp.reference }}
      />
    </Box>
  );
}

export default OpportunityDetail;
