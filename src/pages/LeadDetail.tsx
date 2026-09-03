import * as React from 'react';
import {
  Alert, AlertTitle, Avatar, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Step, StepLabel, Stepper,
  Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignIcon from '@mui/icons-material/PersonAddAlt';
import CallIcon from '@mui/icons-material/PhoneInTalk';
import ScienceIcon from '@mui/icons-material/Science';
import ConvertIcon from '@mui/icons-material/SwapHoriz';
import BlockIcon from '@mui/icons-material/Block';
import UploadIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore, useMasking } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import {
  ActivityTimeline, DemoScenarioPanel, EmptyState, Grid, LabelValue, PageHeader,
  SectionCard, SlaBar, Stack, StatusChip,
} from '../components';
import { leadSla, toast } from '../hooks';
import { fmtDate, fmtDateTime, isoDate } from '../utils/dates';
import { maskEmail, maskPhone, zar } from '../utils/format';
import { LEAD_PRODUCTS } from '../data/leads';
import { DocumentUploadDialog, RelatedDocuments } from './documents/DocumentPanels';

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const masked = useMasking();
  const [tab, setTab] = React.useState(0);
  const [dialog, setDialog] = React.useState<null | 'assign' | 'analysis' | 'convert' | 'disqualify' | 'upload' | 'activity'>(null);

  const lead = store.leads.find((l) => l.id === id);
  const role = ROLES[store.session.role];
  const canUpdate = role.permissions.includes('lead.update');
  const canAssign = role.permissions.includes('lead.assign');
  const canConvert = role.permissions.includes('lead.convert');

  const [assignForm, setAssignForm] = React.useState({ ownerId: '', backupOwnerId: '' });
  const [analysis, setAnalysis] = React.useState<Record<string, string | boolean>>({});
  const [analysisMeta, setAnalysisMeta] = React.useState({ decision: 'Proceed', riskRating: 'Moderate', notes: '', score: '75' });
  const [convertStep, setConvertStep] = React.useState(0);
  const [convertForm, setConvertForm] = React.useState({
    name: '', ownerId: '', estimatedValue: '', expectedCloseDate: isoDate(60),
    products: [] as { product: string; cover: string; value: number; tenor: string }[],
  });
  const [disqualifyReason, setDisqualifyReason] = React.useState('');
  const [activityForm, setActivityForm] = React.useState({ type: 'Call', subject: '', notes: '' });

  React.useEffect(() => {
    if (!lead) return;
    setAssignForm({ ownerId: lead.ownerId ?? '', backupOwnerId: lead.backupOwnerId ?? '' });
    setAnalysis({ ...lead.desktopAnalysis.values });
    setAnalysisMeta({
      decision: lead.desktopAnalysis.decision ?? 'Proceed',
      riskRating: lead.desktopAnalysis.riskRating ?? 'Moderate',
      notes: lead.desktopAnalysis.notes,
      score: String(lead.qualificationScore || 75),
    });
    setConvertForm({
      name: `${lead.company} - ${lead.productInterest}`,
      ownerId: lead.ownerId ?? '',
      estimatedValue: String(lead.estimatedValue),
      expectedCloseDate: isoDate(60),
      products: [{ product: lead.productInterest, cover: 'Buyer default', value: lead.estimatedValue, tenor: '12 months' }],
    });
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lead) {
    return (
      <EmptyState
        title="Lead not found"
        description="This lead does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/leads')}>Back to leads</Button>}
      />
    );
  }

  const sla = leadSla(lead);
  const owner = store.users.find((u) => u.id === lead.ownerId);
  const backup = store.users.find((u) => u.id === lead.backupOwnerId);
  const campaign = store.campaigns.find((c) => c.id === lead.campaignId);
  const event = store.events.find((e) => e.id === lead.eventId);
  const documents = store.documents.filter((d) => d.leadId === lead.id);
  const activities = store.activities.filter((a) => a.relatedType === 'Lead' && a.relatedId === lead.id);
  const opportunity = store.opportunities.find((o) => o.id === lead.convertedOpportunityId);
  const analysisFields = store.configuration.analysisFields.filter((f) => f.active);
  const sections = Array.from(new Set(analysisFields.map((f) => f.section)));

  const canProgress = !!lead.ownerId;
  const analysisComplete = lead.desktopAnalysis.completed;
  const converted = lead.status === 'Converted';

  return (
    <Box>
      <PageHeader
        title={lead.company}
        subtitle={`${lead.reference} · ${lead.contactName} · captured via ${lead.source}${event ? ` at ${event.name}` : ''} on ${fmtDate(lead.createdDate)}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Leads', to: '/leads' },
          { label: lead.reference },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={lead.status} />
            <StatusChip value={sla.risk} />
            {lead.syncStatus !== 'Synced' && <StatusChip value={lead.syncStatus} />}
            {lead.qualificationScore > 0 && (
              <Chip size="small" label={`Score ${lead.qualificationScore}/100`} sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />
            )}
          </Stack>
        }
        actions={
          !converted && (
            <>
              <Button variant="outlined" startIcon={<AssignIcon />} disabled={!canAssign} onClick={() => setDialog('assign')}>
                {lead.ownerId ? 'Reassign' : 'Assign'}
              </Button>
              <Tooltip title={!canProgress ? 'A lead cannot progress beyond New until a primary owner and backup owner are recorded.' : ''}>
                <span>
                  <Button
                    variant="outlined" startIcon={<CallIcon />}
                    disabled={!canUpdate || !canProgress || ['Contacted', 'Qualified', 'Disqualified'].includes(lead.status)}
                    onClick={async () => {
                      await api.setLeadStatus(lead.id, 'Contacted', 'First contact completed with the client. Requirement and target buyer country captured against the lead.');
                      toast({ message: 'First contact recorded', severity: 'success', detail: 'The first-contact SLA has been satisfied and the lead moved to Contacted.' });
                    }}
                  >
                    Record first contact
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={!canProgress ? 'Assign an owner before performing desktop analysis.' : ''}>
                <span>
                  <Button
                    variant="outlined" startIcon={<ScienceIcon />} disabled={!canUpdate || !canProgress}
                    onClick={() => setDialog('analysis')}
                  >
                    Desktop analysis
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="outlined" color="error" startIcon={<BlockIcon />}
                disabled={!canUpdate || lead.status === 'Disqualified'} onClick={() => setDialog('disqualify')}
              >
                Disqualify
              </Button>
              <Tooltip title={
                !canConvert ? `The ${role.name} role may not convert leads.`
                  : lead.status !== 'Qualified' ? 'Only a qualified lead can be converted. Complete the desktop analysis first.'
                    : 'Convert this lead into an opportunity'
              }>
                <span>
                  <Button
                    variant="contained" startIcon={<ConvertIcon />}
                    disabled={!canConvert || lead.status !== 'Qualified'}
                    onClick={() => { setConvertStep(0); setDialog('convert'); }}
                  >
                    Convert to opportunity
                  </Button>
                </span>
              </Tooltip>
            </>
          )
        }
      />

      {!canProgress && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Assignment required before progression</AlertTitle>
          This lead has no owner. Progression actions are blocked until a primary owner and a backup owner are
          recorded, so that every lead has an accountable officer and continuity of client coverage.
        </Alert>
      )}

      {converted && opportunity && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Converted — permanent traceability retained</AlertTitle>
          This lead was converted into opportunity{' '}
          <RouterLink to={`/opportunities/${opportunity.id}`} style={{ color: 'inherit', fontWeight: 700 }}>
            {opportunity.reference}
          </RouterLink>{' '}
          on {fmtDate(opportunity.createdDate)}. The originating-lead relationship is retained permanently for
          traceability and campaign attribution.
        </Alert>
      )}

      {lead.status === 'Disqualified' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Disqualified</AlertTitle>{lead.disqualifiedReason}
        </Alert>
      )}

      <DemoScenarioPanel
        scenario="A qualified enquiry is worked from assignment through structured desktop analysis to conversion into a sales opportunity, without re-keying a single field."
        evidence={[
          'Mandatory owner and backup owner recorded on the lead',
          'First-contact SLA measured in business days against the configured rule',
          'Configurable desktop analysis with qualification, risk and commercial criteria',
          'Conversion wizard copying account, contacts, history, documents, campaign attribution and the analysis outcome',
          'Permanent originating-lead relationship on the resulting opportunity',
        ]}
        requirements={[25, 26, 27, 28, 31, 32, 51]}
        next={converted ? 'Open the resulting opportunity' : 'Complete desktop analysis and convert'}
        nextTo={converted && opportunity ? `/opportunities/${opportunity.id}` : undefined}
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label="Desktop analysis" />
              <Tab label={`Timeline (${lead.timeline.length})`} />
              <Tab label={`Activities (${activities.length})`} />
              <Tab label={`Documents (${documents.length})`} />
            </Tabs>

            {tab === 0 && (
              <Stack gap={2.5}>
                <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={2}>
                  <LabelValue label="Lead reference" value={lead.reference} mono />
                  <LabelValue label="Contact name" value={lead.contactName} />
                  <LabelValue label="Email" value={masked ? maskEmail(lead.email) : lead.email} />
                  <LabelValue label="Telephone" value={masked ? maskPhone(lead.phone) : lead.phone} />
                  <LabelValue label="Source" value={lead.source} />
                  <LabelValue label="Enquiry type" value={lead.enquiryType} />
                  <LabelValue label="Sector" value={lead.sector} />
                  <LabelValue label="Product interest" value={lead.productInterest} />
                  <LabelValue label="Target market" value={lead.country} />
                  <LabelValue label="Estimated value" value={zar(lead.estimatedValue)} />
                  <LabelValue label="Created" value={fmtDateTime(lead.createdDate)} />
                  <LabelValue label="First contact" value={lead.firstContactDate ? fmtDateTime(lead.firstContactDate) : 'Outstanding'} />
                  <LabelValue label="Campaign" value={campaign ? (
                    <RouterLink to={`/campaigns/${campaign.id}`} style={{ color: '#0E7C7B' }}>{campaign.name}</RouterLink>
                  ) : 'No campaign attribution'} />
                  <LabelValue label="Event" value={event ? (
                    <RouterLink to={`/events/${event.id}`} style={{ color: '#0E7C7B' }}>{event.name}</RouterLink>
                  ) : '—'} />
                  <LabelValue label="Customer account" value={lead.customerId ? (
                    <RouterLink to={`/customers/${lead.customerId}`} style={{ color: '#0E7C7B' }}>
                      {store.customers.find((c) => c.id === lead.customerId)?.organisation}
                    </RouterLink>
                  ) : 'New prospect'} />
                  <LabelValue label="Sync status" value={<StatusChip value={lead.syncStatus} />} />
                </Grid>
                {lead.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="overline" color="text.secondary">Notes</Typography>
                      <Typography variant="body2" sx={{ mt: 0.4, whiteSpace: 'pre-wrap' }}>{lead.notes}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Box>
                {analysisComplete ? (
                  <Stack gap={2.5}>
                    <Alert severity={lead.desktopAnalysis.decision === 'Decline' ? 'warning' : 'success'}>
                      <AlertTitle>
                        Analysis decision: {lead.desktopAnalysis.decision} · Risk rating: {lead.desktopAnalysis.riskRating}
                      </AlertTitle>
                      Completed by {store.users.find((u) => u.id === lead.desktopAnalysis.completedBy)?.name} on{' '}
                      {fmtDateTime(lead.desktopAnalysis.completedAt)}. Qualification score {lead.qualificationScore}/100.
                    </Alert>
                    {sections.map((section) => (
                      <Box key={section}>
                        <Typography variant="overline" color="text.secondary">{section}</Typography>
                        <Grid cols={{ xs: 1, sm: 2 }} gap={1.5} sx={{ mt: 0.75 }}>
                          {analysisFields.filter((f) => f.section === section).map((f) => {
                            const v = lead.desktopAnalysis.values[f.id];
                            return (
                              <Box key={f.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                                <Typography variant="caption" sx={{ display: 'block' }}>{f.label}</Typography>
                                {f.type === 'checkbox' ? (
                                  <Stack direction="row" gap={0.5} alignItems="center">
                                    {v ? <CheckCircleIcon sx={{ fontSize: 15, color: 'success.main' }} />
                                      : <BlockIcon sx={{ fontSize: 15, color: 'error.main' }} />}
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{v ? 'Yes' : 'No'}</Typography>
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{String(v ?? '—')}</Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Grid>
                      </Box>
                    ))}
                    <Box>
                      <Typography variant="overline" color="text.secondary">Analyst notes</Typography>
                      <Typography variant="body2" sx={{ mt: 0.4 }}>{lead.desktopAnalysis.notes}</Typography>
                    </Box>
                    {!converted && (
                      <Button variant="outlined" onClick={() => setDialog('analysis')} sx={{ alignSelf: 'flex-start' }}>
                        Amend analysis
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <EmptyState
                    title="Desktop analysis not yet completed"
                    description="Structured desktop analysis captures the qualification criteria, risk assessment and commercial position, and produces a decision to proceed, refer or decline. The fields shown are maintained in the Configuration Centre without development."
                    icon={<ScienceIcon sx={{ fontSize: 44 }} />}
                    action={
                      <Button variant="contained" disabled={!canProgress} onClick={() => setDialog('analysis')}>
                        Start desktop analysis
                      </Button>
                    }
                  />
                )}
              </Box>
            )}

            {tab === 2 && <ActivityTimeline events={lead.timeline} />}

            {tab === 3 && (
              <Box>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog('activity')}>
                    Log activity
                  </Button>
                </Stack>
                {activities.length === 0 ? (
                  <EmptyState title="No activities logged" description="Calls, meetings, emails and tasks logged against this lead will appear here." />
                ) : (
                  <Stack gap={1}>
                    {activities.map((a) => (
                      <Box key={a.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                          <Stack direction="row" gap={1} alignItems="center">
                            <Chip size="small" label={a.type} sx={{ bgcolor: alpha('#2563EB', .1), color: '#2563EB' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.subject}</Typography>
                          </Stack>
                          <StatusChip value={a.status} />
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          {store.users.find((u) => u.id === a.ownerId)?.name} · {fmtDateTime(a.date)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{a.notes}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
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
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="First-contact SLA">
            <SlaBar consumed={sla.consumed} risk={sla.risk} />
            <Grid cols={2} gap={1.5} sx={{ mt: 2 }}>
              <LabelValue label="Target" value={`${sla.targetDays} business days`} />
              <LabelValue label="Elapsed" value={`${sla.elapsedDays} business days`} />
              <LabelValue label="Due" value={fmtDate(sla.dueDate)} />
              <LabelValue label="Status" value={<StatusChip value={sla.risk} />} />
            </Grid>
          </SectionCard>

          <SectionCard title="Ownership & resource pool" subtitle="Every lead carries a primary and a backup owner">
            <Stack gap={1.75}>
              <Box>
                <Typography variant="overline" color="text.secondary">Primary owner</Typography>
                {owner ? (
                  <Stack direction="row" gap={1.25} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: owner.avatarColor }}>{owner.initials}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{owner.name}</Typography>
                      <Typography variant="caption">{owner.jobTitle} · {owner.team}</Typography>
                    </Box>
                  </Stack>
                ) : <Chip size="small" label="Unassigned" color="warning" sx={{ mt: 0.5 }} />}
              </Box>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary">Backup owner</Typography>
                {backup ? (
                  <Stack direction="row" gap={1.25} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: backup.avatarColor }}>{backup.initials}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{backup.name}</Typography>
                      <Typography variant="caption">{backup.jobTitle} · {backup.team}</Typography>
                    </Box>
                  </Stack>
                ) : <Chip size="small" label="Not set" color="warning" sx={{ mt: 0.5 }} />}
              </Box>
            </Stack>
          </SectionCard>

          <SectionCard title="Lifecycle progression">
            <Stack gap={1}>
              {['New', 'Assigned', 'Contacted', 'Qualified', 'Converted'].map((s, i, arr) => {
                const order = ['New', 'Assigned', 'Contacted', 'Qualified', 'Converted'];
                const current = order.indexOf(lead.status === 'Disqualified' ? 'Contacted' : lead.status);
                const done = i <= current;
                return (
                  <Stack key={s} direction="row" gap={1.25} alignItems="center">
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700,
                      bgcolor: done ? alpha('#0E7C7B', .14) : 'surface.sunken',
                      color: done ? '#0E7C7B' : 'text.disabled',
                    }}>
                      {done ? '✓' : i + 1}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: i === current ? 700 : 400, color: done ? 'text.primary' : 'text.disabled' }}>
                      {s}
                    </Typography>
                    {i < arr.length - 1 && <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />}
                  </Stack>
                );
              })}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      {/* --------------------------- Dialogs --------------------------- */}

      <Dialog open={dialog === 'assign'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Assign lead</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              select required label="Primary owner" value={assignForm.ownerId}
              onChange={(e) => setAssignForm((f) => ({ ...f, ownerId: e.target.value }))} fullWidth
            >
              {store.users.filter((u) => u.status === 'Active' && ['bdu_officer', 'sales_user'].includes(u.role))
                .map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.team}</MenuItem>)}
            </TextField>
            <TextField
              select required label="Backup owner" value={assignForm.backupOwnerId}
              onChange={(e) => setAssignForm((f) => ({ ...f, backupOwnerId: e.target.value }))}
              helperText="Mandatory — maintains resource-pool visibility of the lead." fullWidth
            >
              {store.users.filter((u) => u.status === 'Active' && ['bdu_officer', 'sales_user'].includes(u.role) && u.id !== assignForm.ownerId)
                .map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.team}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!assignForm.ownerId || !assignForm.backupOwnerId}
            onClick={async () => {
              await api.assignLead(lead.id, assignForm.ownerId, assignForm.backupOwnerId);
              setDialog(null);
              toast({
                message: 'Lead assigned', severity: 'success',
                detail: 'The owner was notified, the backup owner recorded and the first-contact SLA is running.',
              });
            }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'analysis'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>
          Desktop analysis
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 400 }}>
            Fields are maintained in Configuration → Desktop Analysis and can be changed by a business administrator without development.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={3}>
            {sections.map((section) => (
              <Box key={section}>
                <Typography variant="overline" color="text.secondary">{section}</Typography>
                <Stack gap={1.5} sx={{ mt: 1 }}>
                  {analysisFields.filter((f) => f.section === section).map((f) => {
                    if (f.type === 'checkbox') {
                      return (
                        <FormControlLabel
                          key={f.id}
                          control={
                            <Checkbox
                              size="small" checked={!!analysis[f.id]}
                              onChange={(e) => setAnalysis((a) => ({ ...a, [f.id]: e.target.checked }))}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {f.label}{f.required && <Typography component="span" color="error"> *</Typography>}
                            </Typography>
                          }
                        />
                      );
                    }
                    if (f.type === 'select') {
                      return (
                        <TextField
                          key={f.id} select label={f.label} required={f.required}
                          value={String(analysis[f.id] ?? '')}
                          onChange={(e) => setAnalysis((a) => ({ ...a, [f.id]: e.target.value }))} fullWidth
                        >
                          {(f.options ?? []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                        </TextField>
                      );
                    }
                    return (
                      <TextField
                        key={f.id} label={f.label} required={f.required}
                        multiline={f.type === 'textarea'} minRows={f.type === 'textarea' ? 2 : undefined}
                        value={String(analysis[f.id] ?? '')}
                        onChange={(e) => setAnalysis((a) => ({ ...a, [f.id]: e.target.value }))} fullWidth
                      />
                    );
                  })}
                </Stack>
              </Box>
            ))}
            <Divider />
            <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
              <TextField select label="Decision" value={analysisMeta.decision} onChange={(e) => setAnalysisMeta((m) => ({ ...m, decision: e.target.value }))}>
                {['Proceed', 'Refer', 'Decline'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField select label="Risk rating" value={analysisMeta.riskRating} onChange={(e) => setAnalysisMeta((m) => ({ ...m, riskRating: e.target.value }))}>
                {['Low', 'Moderate', 'Elevated', 'High'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
              <TextField
                type="number" label="Qualification score (0-100)" value={analysisMeta.score}
                onChange={(e) => setAnalysisMeta((m) => ({ ...m, score: e.target.value }))}
              />
            </Grid>
            <TextField
              multiline minRows={3} label="Analyst notes" value={analysisMeta.notes}
              onChange={(e) => setAnalysisMeta((m) => ({ ...m, notes: e.target.value }))} fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const proceed = analysisMeta.decision !== 'Decline';
              await api.updateLead(lead.id, {
                desktopAnalysis: {
                  completed: true,
                  completedBy: store.session.userId,
                  completedAt: new Date().toISOString(),
                  values: analysis,
                  decision: analysisMeta.decision as 'Proceed' | 'Refer' | 'Decline',
                  notes: analysisMeta.notes,
                  riskRating: analysisMeta.riskRating as 'Low' | 'Moderate' | 'Elevated' | 'High',
                },
                qualificationScore: Number(analysisMeta.score) || 0,
                status: proceed ? 'Qualified' : 'Disqualified',
                disqualifiedReason: proceed ? null : analysisMeta.notes,
              }, `Structured desktop analysis completed against the configured criteria. Decision: ${analysisMeta.decision}. Risk rating: ${analysisMeta.riskRating}. Qualification score: ${analysisMeta.score}/100.`);
              setDialog(null);
              toast({
                message: `Desktop analysis completed — ${analysisMeta.decision}`,
                severity: proceed ? 'success' : 'warning',
                detail: proceed
                  ? 'The lead is now Qualified and can be converted into an opportunity.'
                  : 'The lead has been disqualified and the reason recorded.',
              });
            }}
          >
            Save analysis
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'convert'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>Convert lead to opportunity</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={convertStep} sx={{ mb: 3 }}>
            {['What carries across', 'Opportunity details', 'Products', 'Confirm'].map((s) => (
              <Step key={s}><StepLabel>{s}</StepLabel></Step>
            ))}
          </Stepper>

          {convertStep === 0 && (
            <Stack gap={1.5}>
              <Alert severity="info">
                <AlertTitle>Nothing is re-keyed</AlertTitle>
                The following information is copied onto the new opportunity automatically, and the
                originating-lead relationship is retained permanently.
              </Alert>
              {[
                ['Account and customer record', lead.customerId ? store.customers.find((c) => c.id === lead.customerId)?.organisation ?? '—' : `New prospect: ${lead.company}`],
                ['Contact details', `${lead.contactName} · ${lead.email} · ${lead.phone}`],
                ['Interaction history', `${lead.timeline.length} timeline events and ${activities.length} logged activities`],
                ['Supporting documents', `${documents.length} document(s) re-linked to the opportunity`],
                ['Campaign attribution', campaign ? campaign.name : 'No campaign attribution'],
                ['Event attribution', event ? event.name : 'Not captured at an event'],
                ['Desktop analysis outcome', `${lead.desktopAnalysis.decision} · risk ${lead.desktopAnalysis.riskRating} · score ${lead.qualificationScore}/100`],
                ['Originating lead', `${lead.reference} — retained permanently for traceability`],
              ].map(([label, value]) => (
                <Stack key={label} direction="row" gap={1.5} alignItems="flex-start" sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <CheckCircleIcon sx={{ fontSize: 17, color: 'success.main', mt: '2px' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
                    <Typography variant="caption">{value}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}

          {convertStep === 1 && (
            <Stack gap={2}>
              <TextField
                required label="Opportunity name" value={convertForm.name}
                onChange={(e) => setConvertForm((f) => ({ ...f, name: e.target.value }))} fullWidth
              />
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <TextField select required label="Opportunity owner" value={convertForm.ownerId}
                  onChange={(e) => setConvertForm((f) => ({ ...f, ownerId: e.target.value }))}>
                  {store.users.filter((u) => u.status === 'Active' && ['bdu_officer', 'sales_user'].includes(u.role))
                    .map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                </TextField>
                <TextField
                  required type="number" label="Estimated deal value (ZAR)" value={convertForm.estimatedValue}
                  onChange={(e) => setConvertForm((f) => ({ ...f, estimatedValue: e.target.value }))}
                />
                <TextField
                  required type="date" label="Expected close date" value={convertForm.expectedCloseDate}
                  onChange={(e) => setConvertForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Alert severity="info" icon={false}>
                <Typography variant="caption">
                  Opportunity name, account, owner, estimated value, expected close date, sales stage,
                  product and campaign are all mandatory on an ECIC opportunity.
                </Typography>
              </Alert>
            </Stack>
          )}

          {convertStep === 2 && (
            <Stack gap={2}>
              <Typography variant="body2" color="text.secondary">
                An opportunity may carry a single product or multiple products. Line values roll up to the
                opportunity value.
              </Typography>
              {convertForm.products.map((p, i) => (
                <Box key={i} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Product line {i + 1}</Typography>
                    {convertForm.products.length > 1 && (
                      <IconButton size="small" onClick={() => setConvertForm((f) => ({ ...f, products: f.products.filter((_, j) => j !== i) }))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <Grid cols={{ xs: 1, sm: 2 }} gap={1.5}>
                    <TextField
                      select label="Product" value={p.product}
                      onChange={(e) => setConvertForm((f) => ({
                        ...f, products: f.products.map((x, j) => j === i ? { ...x, product: e.target.value } : x),
                      }))}
                    >
                      {LEAD_PRODUCTS.map((prod) => <MenuItem key={prod} value={prod}>{prod}</MenuItem>)}
                    </TextField>
                    <TextField
                      label="Cover type" value={p.cover}
                      onChange={(e) => setConvertForm((f) => ({
                        ...f, products: f.products.map((x, j) => j === i ? { ...x, cover: e.target.value } : x),
                      }))}
                    />
                    <TextField
                      type="number" label="Value (ZAR)" value={p.value}
                      onChange={(e) => setConvertForm((f) => ({
                        ...f, products: f.products.map((x, j) => j === i ? { ...x, value: Number(e.target.value) } : x),
                      }))}
                    />
                    <TextField
                      label="Tenor" value={p.tenor}
                      onChange={(e) => setConvertForm((f) => ({
                        ...f, products: f.products.map((x, j) => j === i ? { ...x, tenor: e.target.value } : x),
                      }))}
                    />
                  </Grid>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }}
                onClick={() => setConvertForm((f) => ({
                  ...f,
                  products: [...f.products, { product: LEAD_PRODUCTS[0], cover: 'Buyer default', value: 0, tenor: '12 months' }],
                }))}
              >
                Add product line
              </Button>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">Total product value</Typography>
                <Typography variant="subtitle1">{zar(convertForm.products.reduce((s, p) => s + p.value, 0))}</Typography>
              </Stack>
            </Stack>
          )}

          {convertStep === 3 && (
            <Stack gap={2}>
              <Alert severity="success">
                <AlertTitle>Ready to convert</AlertTitle>
                An opportunity reference will be generated, the lead marked Converted and the originating-lead
                link retained permanently.
              </Alert>
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <LabelValue label="Opportunity name" value={convertForm.name} />
                <LabelValue label="Account" value={lead.customerId ? store.customers.find((c) => c.id === lead.customerId)?.organisation : lead.company} />
                <LabelValue label="Owner" value={store.users.find((u) => u.id === convertForm.ownerId)?.name} />
                <LabelValue label="Estimated value" value={zar(Number(convertForm.estimatedValue))} />
                <LabelValue label="Expected close" value={fmtDate(convertForm.expectedCloseDate)} />
                <LabelValue label="Products" value={`${convertForm.products.length} line(s)`} />
                <LabelValue label="Campaign attribution" value={campaign?.name ?? 'None'} />
                <LabelValue label="Originating lead" value={lead.reference} mono />
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {convertStep > 0 && <Button onClick={() => setConvertStep((s) => s - 1)}>Back</Button>}
          {convertStep < 3 ? (
            <Button
              variant="contained" onClick={() => setConvertStep((s) => s + 1)}
              disabled={convertStep === 1 && (!convertForm.name || !convertForm.ownerId || !convertForm.estimatedValue)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained" color="secondary"
              onClick={async () => {
                const opp = await api.convertLead(lead.id, {
                  name: convertForm.name,
                  ownerId: convertForm.ownerId,
                  estimatedValue: Number(convertForm.estimatedValue),
                  expectedCloseDate: convertForm.expectedCloseDate,
                  products: convertForm.products,
                });
                setDialog(null);
                toast({
                  message: `Opportunity ${opp.reference} created`,
                  severity: 'success',
                  detail: 'All lead information carried across. The originating-lead relationship is retained permanently.',
                  action: { label: 'Open opportunity', to: `/opportunities/${opp.id}` },
                });
                navigate(`/opportunities/${opp.id}`);
              }}
            >
              Convert lead
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'disqualify'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Disqualify lead</DialogTitle>
        <DialogContent>
          <TextField
            select required label="Disqualification reason" value={disqualifyReason}
            onChange={(e) => setDisqualifyReason(e.target.value)} fullWidth sx={{ mt: 1 }}
          >
            {[
              'Transaction value below the minimum ECIC underwriting threshold',
              'Insufficient South African local content',
              'Exporter does not meet the minimum trading history requirement',
              'Buyer country outside current ECIC country limits',
              'Sector falls outside the current ECIC mandate',
              'Client has withdrawn the enquiry',
              'Duplicate of an existing lead',
            ].map((r) => <MenuItem key={r} value={r} sx={{ whiteSpace: 'normal' }}>{r}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" color="error" disabled={!disqualifyReason}
            onClick={async () => {
              await api.updateLead(lead.id, { status: 'Disqualified', disqualifiedReason: disqualifyReason },
                `Lead disqualified. Reason: ${disqualifyReason}`);
              setDialog(null);
              toast({ message: 'Lead disqualified', severity: 'info', detail: 'The reason has been recorded on the lead and in the audit trail.' });
            }}
          >
            Disqualify
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'activity'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Log activity</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Activity type" value={activityForm.type} onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))} fullWidth>
              {['Call', 'Meeting', 'Email', 'Task', 'Site Visit'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Subject" value={activityForm.subject} onChange={(e) => setActivityForm((f) => ({ ...f, subject: e.target.value }))} fullWidth required />
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
                ownerId: store.session.userId, date: new Date().toISOString(),
                status: 'Completed', notes: activityForm.notes,
                relatedType: 'Lead', relatedId: lead.id,
              });
              setDialog(null);
              setActivityForm({ type: 'Call', subject: '', notes: '' });
              toast({ message: 'Activity logged', severity: 'success', detail: 'The activity is now visible on the lead and the customer 360 view.' });
            }}
          >
            Log activity
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentUploadDialog
        open={dialog === 'upload'}
        onClose={() => setDialog(null)}
        links={{ customerId: lead.customerId, leadId: lead.id, campaignId: lead.campaignId, transactionRef: lead.reference }}
      />
    </Box>
  );
}

export default LeadDetail;
