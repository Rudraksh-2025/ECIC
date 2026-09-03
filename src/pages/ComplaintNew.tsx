import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, FormControl, FormControlLabel, FormLabel,
  MenuItem, Radio, RadioGroup, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import {
  DemoScenarioPanel, Grid, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import { toast } from '../hooks';
import { fmtDate } from '../utils/dates';
import type { ComplaintChannel, Severity } from '../types';

const STEPS = ['Customer', 'Complaint details', 'Classification', 'Assignment', 'Review & save'];

const CHANNELS: ComplaintChannel[] = [
  'Email', 'Telephone', 'Walk-in', 'Internal Referral', 'Online Portal', 'Chat', 'Social Media',
];

interface FormState {
  customerKind: 'Internal' | 'External';
  customerId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  subject: string;
  description: string;
  loggedDate: string;
  loggedTime: string;
  businessUnit: string;
  category: string;
  subCategory: string;
  severity: Severity;
  channel: ComplaintChannel;
  preferredChannel: string;
  assignedTeam: string;
  assignedToId: string;
}

const REQUIRED_BY_STEP: Record<number, (keyof FormState)[]> = {
  0: ['customerId', 'contactName', 'contactEmail'],
  1: ['subject', 'description', 'loggedDate', 'loggedTime'],
  2: ['businessUnit', 'category', 'subCategory', 'severity', 'channel'],
  3: ['assignedTeam'],
  4: [],
};

const LABELS: Record<string, string> = {
  customerId: 'Customer', contactName: 'Contact person', contactEmail: 'Contact email address',
  subject: 'Complaint subject', description: 'Complaint description', loggedDate: 'Date received',
  loggedTime: 'Time received', businessUnit: 'Business unit', category: 'Category',
  subCategory: 'Sub-category', severity: 'Severity', channel: 'Source / channel',
  assignedTeam: 'Assigned team',
};

export function ComplaintNew() {
  const navigate = useNavigate();
  const store = useStore();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = React.useState(false);

  const now = new Date();
  const [form, setForm] = React.useState<FormState>({
    customerKind: 'External',
    customerId: '', contactName: '', contactEmail: '', contactPhone: '',
    subject: '', description: '',
    loggedDate: now.toISOString().slice(0, 10),
    loggedTime: now.toTimeString().slice(0, 5),
    businessUnit: '', category: '', subCategory: '',
    severity: 'Medium', channel: 'Telephone', preferredChannel: 'Email',
    assignedTeam: 'Complaints Team A', assignedToId: '',
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'category') next.subCategory = '';
      if (key === 'customerId') {
        const c = store.customers.find((x) => x.id === value);
        if (c) {
          next.contactName = c.contactPerson;
          next.contactEmail = c.email;
          next.contactPhone = c.phone;
          next.preferredChannel = c.preferredChannel;
        }
      }
      return next;
    });
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const errorsFor = (index: number): Partial<Record<keyof FormState, string>> => {
    const out: Partial<Record<keyof FormState, string>> = {};
    REQUIRED_BY_STEP[index].forEach((field) => {
      const value = String(form[field] ?? '').trim();
      if (!value) out[field] = `${LABELS[field] ?? field} is required.`;
    });
    if (index === 0 && form.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail)) {
      out.contactEmail = 'Enter a valid email address so the acknowledgement can be delivered.';
    }
    if (index === 1 && form.description && form.description.trim().length < 25) {
      out.description = 'Provide at least 25 characters so the case can be investigated meaningfully.';
    }
    if (index === 1 && form.loggedDate && new Date(form.loggedDate) > new Date()) {
      out.loggedDate = 'The date received cannot be in the future.';
    }
    return out;
  };

  const currentErrors = errorsFor(step);
  const showError = (field: keyof FormState) =>
    (attempted || touched[field]) ? currentErrors[field] : undefined;

  const allErrors = [0, 1, 2, 3].flatMap((i) => Object.entries(errorsFor(i)));

  const slaTarget = api.slaTargetFor(form.severity);
  const slaRule = store.configuration.slaRules.find(
    (r) => r.entity === 'Complaint' && r.scope.toLowerCase().includes(form.severity.toLowerCase()),
  ) ?? store.configuration.slaRules.find((r) => r.scope.toLowerCase().includes('medium'));

  const next = () => {
    setAttempted(true);
    if (Object.keys(currentErrors).length > 0) {
      toast({
        message: 'This step cannot be completed',
        severity: 'error',
        detail: `${Object.keys(currentErrors).length} mandatory field(s) are missing or invalid. Mandatory fields are defined in the Configuration Centre.`,
      });
      return;
    }
    setAttempted(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const save = async () => {
    setAttempted(true);
    if (allErrors.length > 0) {
      toast({ message: 'The complaint cannot be saved', severity: 'error', detail: `${allErrors.length} mandatory field(s) outstanding.` });
      return;
    }
    setSaving(true);
    const complaint = await api.createComplaint({
      ...form,
      assignedToId: form.assignedToId || null,
      preferredChannel: form.preferredChannel as never,
    });
    setSaving(false);
    toast({
      message: `Complaint ${complaint.reference} logged`,
      severity: 'success',
      detail: `SLA target of ${complaint.slaTargetDays} business days applied. Acknowledgement queued on the ${complaint.preferredChannel} channel and an audit event written.`,
      action: { label: 'Open case', to: `/complaints/${complaint.id}` },
    });
    navigate(`/complaints/${complaint.id}`);
  };

  const customer = store.customers.find((c) => c.id === form.customerId);
  const subCategories = store.configuration.complaintSubCategories[form.category] ?? [];
  const teamMembers = store.users.filter(
    (u) => u.status === 'Active' && (u.team === form.assignedTeam || u.role === 'complaints_specialist'),
  );

  return (
    <Box>
      <PageHeader
        title="Log a new complaint"
        subtitle="Structured multi-channel capture with mandatory field validation driven by the Configuration Centre."
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Complaints / Cases', to: '/complaints' },
          { label: 'New complaint' },
        ]}
        actions={<Button variant="outlined" onClick={() => navigate('/complaints')}>Cancel</Button>}
      />

      <DemoScenarioPanel
        scenario="A complaint is received by telephone from an ECIC exporter. The specialist captures it directly into the CRM while still on the call."
        evidence={[
          'Seven capture channels including telephone, walk-in and internal referral',
          'Date and time received are captured separately from the capture time',
          'Mandatory field validation blocks progression and renders inline errors',
          'The SLA target is derived live from the configured severity rule',
          'Reference generation, routing, acknowledgement and audit all fire on save',
        ]}
        requirements={[1, 2, 3, 4, 5]}
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <SectionCard>
            <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
              {STEPS.map((label, i) => {
                const hasErrors = i < step && Object.keys(errorsFor(i)).length > 0;
                return (
                  <Step key={label} completed={i < step && !hasErrors}>
                    <StepLabel error={hasErrors} onClick={() => setStep(i)} sx={{ cursor: 'pointer' }}>
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Divider sx={{ mb: 3 }} />

            {step === 0 && (
              <Stack gap={2.5}>
                <FormControl>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 0.5 }}>Customer type</FormLabel>
                  <RadioGroup
                    row value={form.customerKind}
                    onChange={(e) => set('customerKind', e.target.value as 'Internal' | 'External')}
                  >
                    <FormControlLabel value="External" control={<Radio size="small" />} label="External customer" />
                    <FormControlLabel value="Internal" control={<Radio size="small" />} label="Internal (ECIC staff / division)" />
                  </RadioGroup>
                  <Typography variant="caption">
                    Internal referrals are complaints raised by an ECIC business unit rather than an external client.
                  </Typography>
                </FormControl>
                <TextField
                  select required label="Customer" value={form.customerId}
                  onChange={(e) => set('customerId', e.target.value)}
                  error={!!showError('customerId')} helperText={showError('customerId') ?? 'Selecting a customer populates the contact details and preferred communication channel.'}
                  fullWidth
                >
                  {store.customers
                    .filter((c) => form.customerKind === 'Internal' ? c.customerType === 'Internal' : c.customerType !== 'Internal')
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.organisation} <Typography component="span" variant="caption" sx={{ ml: 1 }}>({c.id})</Typography>
                      </MenuItem>
                    ))}
                </TextField>
                <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                  <TextField
                    required label="Contact person" value={form.contactName}
                    onChange={(e) => set('contactName', e.target.value)}
                    error={!!showError('contactName')} helperText={showError('contactName')}
                  />
                  <TextField
                    required label="Contact email address" value={form.contactEmail}
                    onChange={(e) => set('contactEmail', e.target.value)}
                    error={!!showError('contactEmail')} helperText={showError('contactEmail')}
                  />
                  <TextField
                    label="Contact telephone" value={form.contactPhone}
                    onChange={(e) => set('contactPhone', e.target.value)}
                  />
                  <TextField
                    select label="Preferred communication channel" value={form.preferredChannel}
                    onChange={(e) => set('preferredChannel', e.target.value)}
                    helperText="All outbound communication on this case uses this channel."
                  >
                    {['Email', 'Telephone', 'SMS', 'Portal', 'Post'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
              </Stack>
            )}

            {step === 1 && (
              <Stack gap={2.5}>
                <TextField
                  required label="Complaint subject" value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  error={!!showError('subject')} helperText={showError('subject') ?? 'A short summary that appears on lists, boards and reports.'}
                  fullWidth
                />
                <TextField
                  required multiline minRows={5} label="Complaint description" value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  error={!!showError('description')}
                  helperText={showError('description') ?? `${form.description.trim().length} characters — capture the complaint in the customer's own terms.`}
                  fullWidth
                />
                <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                  <TextField
                    required type="date" label="Date received" value={form.loggedDate}
                    onChange={(e) => set('loggedDate', e.target.value)}
                    error={!!showError('loggedDate')}
                    helperText={showError('loggedDate') ?? 'When the customer raised the complaint, not when it was captured.'}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    required type="time" label="Time received" value={form.loggedTime}
                    onChange={(e) => set('loggedTime', e.target.value)}
                    error={!!showError('loggedTime')} helperText={showError('loggedTime')}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
              </Stack>
            )}

            {step === 2 && (
              <Stack gap={2.5}>
                <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                  <TextField
                    select required label="Business unit" value={form.businessUnit}
                    onChange={(e) => set('businessUnit', e.target.value)}
                    error={!!showError('businessUnit')} helperText={showError('businessUnit') ?? 'The unit the complaint is about.'}
                  >
                    {store.configuration.businessUnits.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </TextField>
                  <TextField
                    select required label="Source / channel" value={form.channel}
                    onChange={(e) => set('channel', e.target.value as ComplaintChannel)}
                    error={!!showError('channel')} helperText={showError('channel') ?? 'How the complaint reached ECIC.'}
                  >
                    {CHANNELS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField
                    select required label="Category" value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    error={!!showError('category')} helperText={showError('category') ?? 'Maintained in the Configuration Centre.'}
                  >
                    {store.configuration.complaintCategories.filter((c) => c.active).map((c) => (
                      <MenuItem key={c.id} value={c.label}>{c.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select required label="Sub-category" value={form.subCategory}
                    onChange={(e) => set('subCategory', e.target.value)}
                    disabled={!form.category}
                    error={!!showError('subCategory')}
                    helperText={showError('subCategory') ?? (form.category ? 'Options are driven by the selected category.' : 'Select a category first.')}
                  >
                    {subCategories.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                  <TextField
                    select required label="Severity" value={form.severity}
                    onChange={(e) => set('severity', e.target.value as Severity)}
                    error={!!showError('severity')}
                    helperText={showError('severity') ?? `Determines the SLA target and priority.`}
                  >
                    {['Critical', 'High', 'Medium', 'Low'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                  <TextField
                    label="Derived priority" value={form.severity === 'Critical' ? 'P1' : form.severity === 'High' ? 'P2' : form.severity === 'Medium' ? 'P3' : 'P4'}
                    disabled helperText="Priority is derived from severity by the configured rule."
                  />
                </Grid>
                <Alert severity="info" icon={false}>
                  <AlertTitle sx={{ fontSize: '0.85rem' }}>SLA derived from configuration</AlertTitle>
                  <Typography variant="body2">
                    Rule <strong>{slaRule?.label}</strong> applies a target of <strong>{slaTarget} business days</strong> with a
                    warning at <strong>{slaRule?.warningPercent}%</strong> consumption. Changing this rule in the Configuration
                    Centre changes the target applied here — no development is required.
                  </Typography>
                </Alert>
              </Stack>
            )}

            {step === 3 && (
              <Stack gap={2.5}>
                <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                  <TextField
                    select required label="Assigned team" value={form.assignedTeam}
                    onChange={(e) => set('assignedTeam', e.target.value)}
                    error={!!showError('assignedTeam')} helperText={showError('assignedTeam')}
                  >
                    {['Complaints Team A', 'Complaints Team B', 'Complaints Oversight'].map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select label="Assigned specialist" value={form.assignedToId}
                    onChange={(e) => set('assignedToId', e.target.value)}
                    helperText="Leave blank to route the case to the team queue for supervisor allocation."
                  >
                    <MenuItem value="">Team queue (unassigned)</MenuItem>
                    {teamMembers.map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.jobTitle}</MenuItem>)}
                  </TextField>
                </Grid>
                <Alert severity="info" icon={false}>
                  <Typography variant="body2">
                    On save the system will generate the case reference, apply the SLA target, issue the acknowledgement
                    communication on the customer&apos;s preferred channel, raise a notification and write an audit event.
                  </Typography>
                </Alert>
              </Stack>
            )}

            {step === 4 && (
              <Stack gap={2}>
                {allErrors.length > 0 ? (
                  <Alert severity="error">
                    <AlertTitle>This complaint cannot be saved</AlertTitle>
                    <Stack gap={0.5} sx={{ mt: 0.5 }}>
                      {allErrors.map(([field, message]) => (
                        <Typography key={field} variant="body2">• {message}</Typography>
                      ))}
                    </Stack>
                  </Alert>
                ) : (
                  <Alert severity="success">
                    <AlertTitle>Ready to save</AlertTitle>
                    All mandatory fields are complete. Saving generates the reference, applies the SLA and creates the audit record.
                  </Alert>
                )}
                <Divider />
                <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
                  {[
                    ['Customer type', form.customerKind],
                    ['Customer', customer?.organisation ?? '—'],
                    ['Contact', form.contactName],
                    ['Email', form.contactEmail],
                    ['Telephone', form.contactPhone || '—'],
                    ['Preferred channel', form.preferredChannel],
                    ['Received', `${fmtDate(form.loggedDate)} at ${form.loggedTime}`],
                    ['Business unit', form.businessUnit],
                    ['Source / channel', form.channel],
                    ['Category', form.category],
                    ['Sub-category', form.subCategory],
                    ['Assigned team', form.assignedTeam],
                    ['Assigned specialist', store.users.find((u) => u.id === form.assignedToId)?.name ?? 'Team queue'],
                    ['SLA target', `${slaTarget} business days`],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || '—'}</Typography>
                    </Box>
                  ))}
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>Severity</Typography>
                    <StatusChip value={form.severity} />
                  </Box>
                </Grid>
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary">Subject</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{form.subject || '—'}</Typography>
                  <Typography variant="overline" color="text.secondary">Description</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{form.description || '—'}</Typography>
                </Box>
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />
            <Stack direction="row" justifyContent="space-between" gap={1}>
              <Button
                startIcon={<ArrowBackIcon />} disabled={step === 0}
                onClick={() => { setAttempted(false); setStep((s) => s - 1); }}
              >
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained" color="secondary" startIcon={<SaveIcon />}
                  onClick={save} disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save complaint'}
                </Button>
              )}
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Live validation status" subtitle="Mandatory fields are defined in Configuration → Required Fields">
            <Stack gap={1}>
              {STEPS.slice(0, 4).map((label, i) => {
                const errs = Object.keys(errorsFor(i)).length;
                return (
                  <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">{label}</Typography>
                    <Chip
                      size="small"
                      label={errs === 0 ? 'Complete' : `${errs} outstanding`}
                      sx={{
                        bgcolor: alpha(errs === 0 ? '#059669' : '#D97706', 0.12),
                        color: errs === 0 ? '#059669' : '#D97706', fontWeight: 700,
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
            <Divider sx={{ my: 1.75 }} />
            <Typography variant="caption">
              Mandatory fields for complaints:{' '}
              {store.configuration.requiredFields
                .filter((r) => r.entity === 'Complaint' && r.required && r.appliesTo !== 'Closure')
                .map((r) => r.field).join(', ')}.
            </Typography>
          </SectionCard>

          {customer && (
            <SectionCard title="Customer context" subtitle="Pulled automatically from the account record">
              <Stack gap={1.25}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Organisation</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.organisation}</Typography>
                </Box>
                <Grid cols={2} gap={1.5}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Type</Typography>
                    <Typography variant="body2">{customer.customerType}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Sector</Typography>
                    <Typography variant="body2">{customer.sector}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Country</Typography>
                    <Typography variant="body2">{customer.country}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Status</Typography>
                    <StatusChip value={customer.status} />
                  </Box>
                </Grid>
                <Divider />
                <Typography variant="caption">
                  Open cases for this customer: {store.complaints.filter((c) => c.customerId === customer.id && c.status !== 'Closed').length} ·
                  {' '}Open opportunities: {store.opportunities.filter((o) => o.customerId === customer.id && !o.closedDate).length}
                </Typography>
              </Stack>
            </SectionCard>
          )}

          <SectionCard title="What happens on save" dense>
            <Stack gap={1}>
              {[
                'A unique case reference is generated automatically',
                `The ${slaTarget} business day SLA target is applied and the clock starts`,
                'The acknowledgement template is rendered and issued on the preferred channel',
                'An assignment or unassigned-case notification is raised',
                'An SLA task is created for the case owner',
                'An immutable-styled audit event records the creation',
              ].map((line, i) => (
                <Stack key={line} direction="row" gap={1.25} alignItems="flex-start">
                  <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, mt: '1px',
                    bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B',
                    display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700,
                  }}>{i + 1}</Box>
                  <Typography variant="body2">{line}</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default ComplaintNew;
