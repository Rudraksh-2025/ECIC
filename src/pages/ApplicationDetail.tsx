import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, MenuItem, Step, StepLabel, Stepper, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DrawIcon from '@mui/icons-material/Draw';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import UploadIcon from '@mui/icons-material/UploadFile';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import {
  ActivityTimeline, DemoScenarioPanel, EmptyState, Grid, LabelValue, PageHeader,
  SectionCard, SimulatedBadge, Stack, StatusChip,
} from '../components';
import { toast } from '../hooks';
import { fmtDate, fmtDateTime } from '../utils/dates';
import { APPLICATION_FORMS } from '../data/applications';
import { DocumentUploadDialog, RelatedDocuments } from './documents/DocumentPanels';

const WORKFLOW = ['Draft', 'Submitted', 'Under Review', 'Awaiting Approval', 'Approved'];

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = React.useState(0);
  const [dialog, setDialog] = React.useState<null | 'sign' | 'upload' | 'decide'>(null);
  const [values, setValues] = React.useState<Record<string, string | number | boolean>>({});
  const [attempted, setAttempted] = React.useState(false);
  const [signForm, setSignForm] = React.useState({ name: '', email: '', consent: false, signature: '' });
  const [decision, setDecision] = React.useState({ approved: true, reason: '' });

  const app = store.applications.find((a) => a.id === id);
  const role = ROLES[store.session.role];
  const canSubmit = role.permissions.includes('application.submit');
  const canSign = role.permissions.includes('application.sign') || role.permissions.includes('application.submit');
  const canApprove = role.permissions.includes('application.approve');

  React.useEffect(() => {
    if (!app) return;
    setValues({ ...app.values });
    const customer = store.customers.find((c) => c.id === app.customerId);
    setSignForm({ name: customer?.contactPerson ?? '', email: customer?.email ?? '', consent: false, signature: '' });
  }, [app?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!app) {
    return (
      <EmptyState
        title="Application not found"
        description="This application does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/applications')}>Back to applications</Button>}
      />
    );
  }

  const fields = APPLICATION_FORMS[app.formType] ?? [];
  const sections = Array.from(new Set(fields.map((f) => f.section)));
  const customer = store.customers.find((c) => c.id === app.customerId);
  const opportunity = store.opportunities.find((o) => o.id === app.opportunityId);
  const documents = store.documents.filter((d) => d.applicationId === app.id);
  const editable = app.status === 'Draft' && !app.locked;

  const missing = fields.filter((f) => f.required && !values[f.id] && values[f.id] !== 0);
  const stepIndex = app.status === 'Rejected' ? 4 : WORKFLOW.indexOf(app.status);

  const saveField = (fieldId: string, value: string | number | boolean) => {
    setValues((v) => ({ ...v, [fieldId]: value }));
    void api.updateApplication(app.id, { [fieldId]: value });
  };

  return (
    <Box>
      <PageHeader
        title={app.formType}
        subtitle={`${app.reference} · ${customer?.organisation ?? '—'}${opportunity ? ` · linked to ${opportunity.reference}` : ''}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Applications', to: '/applications' },
          { label: app.reference },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={app.status} />
            {app.signature.signed && <Chip size="small" icon={<DrawIcon />} label="Digitally signed" sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />}
            {app.locked && <Chip size="small" icon={<LockIcon />} label="Locked" sx={{ bgcolor: alpha('#334155', .12) }} />}
          </Stack>
        }
        actions={
          <>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setDialog('upload')}>
              Upload document
            </Button>
            {!app.signature.signed && (
              <Tooltip title={!canSign ? `The ${role.name} role may not sign applications.` : ''}>
                <span>
                  <Button variant="outlined" startIcon={<DrawIcon />} disabled={!canSign} onClick={() => setDialog('sign')}>
                    Sign application
                  </Button>
                </span>
              </Tooltip>
            )}
            {app.status === 'Draft' && (
              <Tooltip title={missing.length ? `${missing.length} mandatory field(s) outstanding` : ''}>
                <span>
                  <Button
                    variant="contained" startIcon={<SendIcon />}
                    disabled={!canSubmit || missing.length > 0}
                    onClick={async () => {
                      setAttempted(true);
                      if (missing.length > 0) return;
                      await api.submitApplication(app.id);
                      toast({
                        message: `Application ${app.reference} submitted`,
                        severity: 'success',
                        detail: 'Validation passed. Underwriting has been notified and the customer receives an acknowledgement.',
                      });
                    }}
                  >
                    Submit application
                  </Button>
                </span>
              </Tooltip>
            )}
            {['Submitted', 'Under Review', 'Awaiting Approval'].includes(app.status) && (
              <Tooltip title={!canApprove ? 'Segregation of duties: only an Underwriting User may decide an application. Switch role to demonstrate.' : ''}>
                <span>
                  <Button variant="contained" color="secondary" disabled={!canApprove} onClick={() => setDialog('decide')}>
                    Record underwriting decision
                  </Button>
                </span>
              </Tooltip>
            )}
          </>
        }
      />

      {app.locked && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
          <AlertTitle>Locked after digital signature</AlertTitle>
          Signed by {app.signature.signerName} on {fmtDateTime(app.signature.signedAt)}. The document cannot be
          amended after signature. Certificate reference {app.signature.certificateRef}.
        </Alert>
      )}
      {app.status === 'Rejected' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Application rejected</AlertTitle>{app.rejectionReason}
        </Alert>
      )}
      {app.status === 'Approved' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Cover approved</AlertTitle>
          Approved on {fmtDate(app.decisionDate)} by {store.users.find((u) => u.id === app.approverId)?.name}.
          Policy documentation generation has been triggered and the client notified.
        </Alert>
      )}

      <DemoScenarioPanel
        scenario="An ECIC cover application is completed digitally, signed electronically, submitted for underwriting review and decided — with every step visible to the customer in the portal."
        evidence={[
          'Sectioned, mobile-friendly form rendered from configurable field definitions',
          'Mandatory field validation blocking submission',
          'Simulated digital signature capturing signer, consent, timestamp, IP and device',
          'Record locking on signature and a workflow status stepper',
          'Segregation of duties between the submitting officer and the deciding underwriter',
        ]}
        requirements={[29, 44, 45, 46, 47, 52, 86]}
        next="Show the documents automatically linked to this application"
      />

      <Box sx={{ mb: 2.5 }}>
        <SectionCard>
          <Stepper activeStep={stepIndex} alternativeLabel>
            {WORKFLOW.map((s, i) => (
              <Step key={s} completed={i < stepIndex}>
                <StepLabel error={app.status === 'Rejected' && i === 4}>
                  {app.status === 'Rejected' && i === 4 ? 'Rejected' : s}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </SectionCard>
      </Box>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Application form" />
              <Tab label="Signature" />
              <Tab label={`Documents (${documents.length})`} />
              <Tab label={`History (${app.timeline.length})`} />
            </Tabs>

            {tab === 0 && (
              <Stack gap={3}>
                {editable && (
                  <Alert severity={missing.length ? 'warning' : 'success'} icon={false}>
                    <Typography variant="body2">
                      {missing.length
                        ? `${missing.length} mandatory field(s) outstanding: ${missing.slice(0, 4).map((f) => f.label).join(', ')}${missing.length > 4 ? '…' : ''}. The application cannot be submitted until these are complete.`
                        : 'All mandatory fields are complete. This application is ready to sign and submit.'}
                    </Typography>
                  </Alert>
                )}
                {sections.map((section) => (
                  <Box key={section}>
                    <Typography variant="overline" color="text.secondary">{section}</Typography>
                    <Divider sx={{ mt: 0.5, mb: 1.75 }} />
                    <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                      {fields.filter((f) => f.section === section).map((f) => {
                        const value = values[f.id];
                        const error = attempted && f.required && !value && value !== 0;
                        if (f.type === 'checkbox') {
                          return (
                            <Box key={f.id} sx={{ gridColumn: { sm: '1 / -1' } }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small" checked={!!value} disabled={!editable}
                                    onChange={(e) => saveField(f.id, e.target.checked)}
                                  />
                                }
                                label={
                                  <Typography variant="body2" sx={{ color: error ? 'error.main' : undefined }}>
                                    {f.label}{f.required && <Typography component="span" color="error"> *</Typography>}
                                  </Typography>
                                }
                              />
                            </Box>
                          );
                        }
                        if (f.type === 'select') {
                          return (
                            <TextField
                              key={f.id} select label={f.label} required={f.required} disabled={!editable}
                              value={String(value ?? '')} onChange={(e) => saveField(f.id, e.target.value)}
                              error={error} helperText={error ? 'This field is required.' : f.helper}
                            >
                              {(f.options ?? []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                            </TextField>
                          );
                        }
                        return (
                          <TextField
                            key={f.id}
                            label={f.label} required={f.required} disabled={!editable}
                            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                            multiline={f.type === 'textarea'} minRows={f.type === 'textarea' ? 3 : undefined}
                            value={String(value ?? '')} onChange={(e) => saveField(f.id, e.target.value)}
                            error={error} helperText={error ? 'This field is required.' : f.helper}
                            sx={{ gridColumn: f.type === 'textarea' ? { sm: '1 / -1' } : undefined }}
                            slotProps={f.type === 'date' ? { inputLabel: { shrink: true } } : undefined}
                          />
                        );
                      })}
                    </Grid>
                  </Box>
                ))}
                {editable && (
                  <Typography variant="caption">
                    Changes are saved to the draft automatically as you type. Narrow the browser window to see the
                    same form rendered for a phone.
                  </Typography>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Box>
                {app.signature.signed ? (
                  <Stack gap={2.5}>
                    <Alert severity="success" icon={<DrawIcon />}>
                      <AlertTitle>Application digitally signed</AlertTitle>
                      The document was locked at the moment of signature and an audit event recorded.
                    </Alert>
                    <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
                      <LabelValue label="Signer name" value={app.signature.signerName} />
                      <LabelValue label="Signer email" value={app.signature.signerEmail} />
                      <LabelValue label="Signed at" value={fmtDateTime(app.signature.signedAt)} />
                      <LabelValue label="Method" value={app.signature.method} />
                      <LabelValue label="IP address" value={app.signature.ipAddress} mono />
                      <LabelValue label="Device" value={app.signature.device} />
                      <LabelValue label="Consent recorded" value={app.signature.consent ? 'Yes' : 'No'} />
                      <LabelValue label="Certificate reference" value={app.signature.certificateRef} mono />
                      <LabelValue label="Document state" value={<StatusChip value="Signed" />} />
                    </Grid>
                    <Alert severity="info" icon={false}>
                      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                        <SimulatedBadge />
                        <Typography variant="caption">
                          This signature is generated in the browser for demonstration purposes. A production
                          deployment integrates a qualified advanced electronic signature provider; the workflow,
                          locking behaviour and audit record shown here are what that integration produces.
                        </Typography>
                      </Stack>
                    </Alert>
                  </Stack>
                ) : (
                  <EmptyState
                    title="Not yet signed"
                    description="The application must be digitally signed before it can be submitted for underwriting. Signing captures the signer identity, consent, timestamp and device, then locks the document."
                    icon={<DrawIcon sx={{ fontSize: 44 }} />}
                    action={<Button variant="contained" disabled={!canSign} onClick={() => setDialog('sign')}>Sign application</Button>}
                  />
                )}
              </Box>
            )}

            {tab === 2 && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }} icon={false}>
                  <Typography variant="caption">
                    Documents uploaded here inherit the customer, opportunity and application links automatically.
                    There is no manual re-association step.
                  </Typography>
                </Alert>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
                  <Button size="small" variant="outlined" startIcon={<UploadIcon />} onClick={() => setDialog('upload')}>
                    Upload document
                  </Button>
                </Stack>
                <RelatedDocuments documents={documents} />
              </Box>
            )}

            {tab === 3 && <ActivityTimeline events={app.timeline} />}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Application record">
            <Grid cols={2} gap={1.5}>
              <LabelValue label="Reference" value={app.reference} mono />
              <LabelValue label="Status" value={<StatusChip value={app.status} />} />
              <LabelValue label="Customer" value={
                <RouterLink to={`/customers/${app.customerId}`} style={{ color: '#0E7C7B' }}>{customer?.organisation}</RouterLink>
              } />
              <LabelValue label="Opportunity" value={opportunity ? (
                <RouterLink to={`/opportunities/${opportunity.id}`} style={{ color: '#0E7C7B' }}>{opportunity.reference}</RouterLink>
              ) : '—'} />
              <LabelValue label="Owner" value={store.users.find((u) => u.id === app.ownerId)?.name} />
              <LabelValue label="Reviewer" value={store.users.find((u) => u.id === app.reviewerId)?.name ?? '—'} />
              <LabelValue label="Created" value={fmtDate(app.createdDate)} />
              <LabelValue label="Submitted" value={app.submittedDate ? fmtDate(app.submittedDate) : '—'} />
              <LabelValue label="Decision" value={app.decisionDate ? fmtDate(app.decisionDate) : '—'} />
              <LabelValue label="Documents" value={String(documents.length)} />
            </Grid>
          </SectionCard>

          <SectionCard title="Mandatory field status">
            <Stack gap={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Mandatory fields complete</Typography>
                <Chip
                  size="small"
                  label={`${fields.filter((f) => f.required).length - missing.length} / ${fields.filter((f) => f.required).length}`}
                  sx={{ bgcolor: alpha(missing.length ? '#D97706' : '#059669', .12), color: missing.length ? '#D97706' : '#059669', fontWeight: 700 }}
                />
              </Stack>
              {missing.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="caption">Outstanding:</Typography>
                  {missing.slice(0, 8).map((f) => (
                    <Typography key={f.id} variant="caption" sx={{ display: 'block' }}>• {f.label}</Typography>
                  ))}
                </>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      {/* --------------------------- Dialogs --------------------------- */}

      <Dialog open={dialog === 'sign'} onClose={() => setDialog(null)} fullWidth maxWidth="md">
        <DialogTitle>
          <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
            <span>Digitally sign application</span>
            <SimulatedBadge tooltip="Signature generation is simulated in the browser for this demonstration." />
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={2.5}>
            <Box>
              <Typography variant="overline" color="text.secondary">Document preview</Typography>
              <Box sx={{
                mt: 0.75, p: 2.5, borderRadius: 2.5, bgcolor: 'surface.subtle',
                border: '1px solid', borderColor: 'divider', maxHeight: 220, overflowY: 'auto',
              }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{app.formType}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5 }}>
                  {app.reference} · {customer?.organisation}
                </Typography>
                {fields.filter((f) => values[f.id] !== undefined && values[f.id] !== '').slice(0, 12).map((f) => (
                  <Stack key={f.id} direction="row" justifyContent="space-between" gap={2} sx={{ py: 0.35, borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption">{f.label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right' }}>
                      {typeof values[f.id] === 'boolean' ? (values[f.id] ? 'Confirmed' : 'Not confirmed') : String(values[f.id])}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Box>
            <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
              <TextField required label="Signer full name" value={signForm.name} onChange={(e) => setSignForm((f) => ({ ...f, name: e.target.value }))} />
              <TextField required label="Signer email address" value={signForm.email} onChange={(e) => setSignForm((f) => ({ ...f, email: e.target.value }))} />
            </Grid>
            <Box>
              <Typography variant="overline" color="text.secondary">Signature</Typography>
              <TextField
                fullWidth value={signForm.signature}
                onChange={(e) => setSignForm((f) => ({ ...f, signature: e.target.value }))}
                placeholder="Type your full name to sign"
                slotProps={{
                  input: {
                    sx: {
                      fontFamily: '"Segoe Script", "Brush Script MT", cursive',
                      fontSize: '1.5rem', py: 1.5,
                      bgcolor: alpha('#0E7C7B', .04),
                    },
                  },
                }}
              />
            </Box>
            <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
              <LabelValue label="Timestamp" value={new Date().toLocaleString('en-ZA')} />
              <LabelValue label="IP address (mock)" value="10.24.11.87" mono />
              <LabelValue label="Device" value={navigator.userAgent.includes('Mac') ? 'Safari on macOS' : 'Chrome on Windows'} />
            </Grid>
            <FormControlLabel
              control={<Checkbox checked={signForm.consent} onChange={(e) => setSignForm((f) => ({ ...f, consent: e.target.checked }))} />}
              label={
                <Typography variant="body2">
                  I confirm the information in this application is accurate and complete, I consent to it being
                  signed electronically, and I understand the document will be locked against further amendment.
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained" startIcon={<DrawIcon />}
            disabled={!signForm.consent || !signForm.name || !signForm.email || signForm.signature.trim().length < 3}
            onClick={async () => {
              await api.signApplication(app.id, signForm.name, signForm.email);
              setDialog(null);
              setTab(1);
              toast({
                message: 'Application digitally signed',
                severity: 'success',
                detail: 'Signer identity, consent, timestamp and device recorded. The document is now locked and an audit event was written.',
              });
            }}
          >
            Sign application
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === 'decide'} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Record underwriting decision</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField
              select label="Decision" value={decision.approved ? 'approve' : 'reject'}
              onChange={(e) => setDecision((d) => ({ ...d, approved: e.target.value === 'approve' }))} fullWidth
            >
              <MenuItem value="approve">Approve — cover granted</MenuItem>
              <MenuItem value="reject">Reject — cover declined</MenuItem>
            </TextField>
            {!decision.approved && (
              <TextField
                required multiline minRows={3} label="Reason for decline" value={decision.reason}
                onChange={(e) => setDecision((d) => ({ ...d, reason: e.target.value }))} fullWidth
                helperText="The reason is communicated to the client and retained on the record."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={decision.approved ? 'success' : 'error'}
            startIcon={decision.approved ? <CheckIcon /> : <CloseIcon />}
            disabled={!decision.approved && decision.reason.trim().length < 10}
            onClick={async () => {
              await api.decideApplication(app.id, decision.approved, decision.reason);
              setDialog(null);
              toast({
                message: decision.approved ? 'Application approved' : 'Application rejected',
                severity: decision.approved ? 'success' : 'info',
                detail: 'The decision was recorded, the owner notified and an audit event written.',
              });
            }}
          >
            {decision.approved ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <DocumentUploadDialog
        open={dialog === 'upload'}
        onClose={() => setDialog(null)}
        links={{
          customerId: app.customerId, applicationId: app.id,
          opportunityId: app.opportunityId, transactionRef: app.reference,
        }}
      />
    </Box>
  );
}

export default ApplicationDetail;
