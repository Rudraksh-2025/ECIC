import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, MenuItem, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/ReportProblem';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MergeIcon from '@mui/icons-material/CallMerge';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import { DemoScenarioPanel, Grid, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import { toast, useDebounced } from '../hooks';
import { fmtDate } from '../utils/dates';
import { LEAD_ENQUIRY_TYPES, LEAD_PRODUCTS } from '../data/leads';
import { SECTORS, COUNTRIES } from '../data/customers';
import type { LeadSource } from '../types';

export function LeadNew() {
  const navigate = useNavigate();
  const store = useStore();
  const [attempted, setAttempted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = React.useState(false);

  const [form, setForm] = React.useState({
    contactName: '', company: '', email: '', phone: '',
    source: 'Manual Capture' as LeadSource, enquiryType: 'New cover enquiry',
    sector: '', productInterest: '', country: 'South Africa',
    campaignId: '', customerId: '', ownerId: '', backupOwnerId: '',
    estimatedValue: '', notes: '',
  });

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDismissedDuplicates(false);
  };

  const debounced = useDebounced(
    { email: form.email, phone: form.phone, company: form.company, contactName: form.contactName },
    350,
  );

  const duplicates = React.useMemo(
    () => api.findDuplicateLeads(debounced),
    [debounced],
  );

  const errors: Record<string, string> = {};
  if (!form.contactName.trim()) errors.contactName = 'Contact name is required.';
  if (!form.company.trim()) errors.company = 'Company name is required.';
  if (!form.email.trim()) errors.email = 'Email address is required.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.sector) errors.sector = 'Sector is required for assignment routing.';
  if (!form.productInterest) errors.productInterest = 'Product interest is required.';
  if (form.ownerId && !form.backupOwnerId) errors.backupOwnerId = 'A backup owner must be recorded whenever a primary owner is assigned.';

  const show = (k: string) => attempted ? errors[k] : undefined;

  const save = async () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0) {
      toast({
        message: 'The lead cannot be saved',
        severity: 'error',
        detail: `${Object.keys(errors).length} mandatory field(s) are missing or invalid.`,
      });
      return;
    }
    if (duplicates.length > 0 && !dismissedDuplicates) {
      toast({
        message: 'Possible duplicate leads detected',
        severity: 'warning',
        detail: 'Review the matches below and choose to merge, open the existing lead, or continue anyway.',
      });
      return;
    }
    setSaving(true);
    const lead = await api.createLead({
      ...form,
      customerId: form.customerId || null,
      campaignId: form.campaignId || null,
      ownerId: form.ownerId || null,
      backupOwnerId: form.backupOwnerId || null,
      estimatedValue: Number(form.estimatedValue) || 0,
    });
    setSaving(false);
    toast({
      message: `Lead ${lead.reference} created`,
      severity: 'success',
      detail: form.ownerId
        ? 'Assigned with a backup owner. First-contact SLA started and the owner notified.'
        : 'The lead is unassigned and cannot progress beyond New until an owner and backup are recorded.',
      action: { label: 'Open lead', to: `/leads/${lead.id}` },
    });
    navigate(`/leads/${lead.id}`);
  };

  const owners = store.users.filter((u) => u.status === 'Active' && ['bdu_officer', 'sales_user'].includes(u.role));

  return (
    <Box>
      <PageHeader
        title="Capture a new lead"
        subtitle="Structured capture with live duplicate detection and mandatory assignment including a visible backup resource."
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Leads', to: '/leads' },
          { label: 'New lead' },
        ]}
        actions={<Button variant="outlined" onClick={() => navigate('/leads')}>Cancel</Button>}
      />

      <DemoScenarioPanel
        scenario="A Business Development Officer captures an enquiry received by telephone. As they type the email address, the CRM checks the configured matching rules and surfaces possible duplicates before the record is created."
        evidence={[
          'Duplicate detection runs live against email, telephone and company name',
          'The matched rule and its confidence weight are shown to the user',
          'Review, open, merge or continue-anyway options on every match',
          'A backup owner is mandatory whenever a primary owner is assigned',
        ]}
        requirements={[24, 27, 30]}
        next="Try entering grace.mabaso@highveldsteel.demo.africa"
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <SectionCard title="Lead details">
            <Stack gap={2.5}>
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField
                  required label="Contact name" value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  error={!!show('contactName')} helperText={show('contactName')}
                />
                <TextField
                  required label="Company" value={form.company}
                  onChange={(e) => set('company', e.target.value)}
                  error={!!show('company')} helperText={show('company')}
                />
                <TextField
                  required label="Email address" value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={!!show('email')}
                  helperText={show('email') ?? 'Checked against existing leads as you type.'}
                />
                <TextField
                  label="Telephone" value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  helperText="Normalised digits are matched against existing leads."
                />
              </Grid>
              <Divider />
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField select required label="Source" value={form.source} onChange={(e) => set('source', e.target.value)}>
                  {store.configuration.leadSources.filter((s) => s.active).map((s) => (
                    <MenuItem key={s.id} value={s.label}>{s.label}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Enquiry type" value={form.enquiryType} onChange={(e) => set('enquiryType', e.target.value)}>
                  {LEAD_ENQUIRY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField
                  select required label="Sector" value={form.sector} onChange={(e) => set('sector', e.target.value)}
                  error={!!show('sector')} helperText={show('sector') ?? 'Drives assignment routing.'}
                >
                  {SECTORS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField
                  select required label="Product interest" value={form.productInterest}
                  onChange={(e) => set('productInterest', e.target.value)}
                  error={!!show('productInterest')} helperText={show('productInterest')}
                >
                  {LEAD_PRODUCTS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField select label="Target market / country" value={form.country} onChange={(e) => set('country', e.target.value)}>
                  {COUNTRIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField
                  type="number" label="Estimated value (ZAR)" value={form.estimatedValue}
                  onChange={(e) => set('estimatedValue', e.target.value)}
                />
                <TextField select label="Campaign attribution" value={form.campaignId} onChange={(e) => set('campaignId', e.target.value)}
                  helperText="Attribution carries through to the opportunity and campaign ROI reporting.">
                  <MenuItem value="">No campaign</MenuItem>
                  {store.campaigns.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
                <TextField select label="Existing customer" value={form.customerId} onChange={(e) => set('customerId', e.target.value)}
                  helperText="Link to an existing account if this enquiry relates to a current client.">
                  <MenuItem value="">New prospect (no account yet)</MenuItem>
                  {store.customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.organisation}</MenuItem>)}
                </TextField>
              </Grid>
              <Divider />
              <Typography variant="overline" color="text.secondary">Assignment</Typography>
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField select label="Primary owner" value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)}
                  helperText="A lead cannot progress beyond New without an owner.">
                  <MenuItem value="">Leave unassigned</MenuItem>
                  {owners.map((u) => <MenuItem key={u.id} value={u.id}>{u.name} — {u.team}</MenuItem>)}
                </TextField>
                <TextField
                  select label="Backup owner" value={form.backupOwnerId}
                  onChange={(e) => set('backupOwnerId', e.target.value)}
                  disabled={!form.ownerId}
                  error={!!show('backupOwnerId')}
                  helperText={show('backupOwnerId') ?? 'Mandatory when a primary owner is set — maintains resource-pool visibility.'}
                >
                  {owners.filter((u) => u.id !== form.ownerId).map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name} — {u.team}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <TextField
                multiline minRows={3} label="Notes" value={form.notes}
                onChange={(e) => set('notes', e.target.value)} fullWidth
              />
              <Divider />
              <Stack direction="row" justifyContent="flex-end" gap={1}>
                <Button onClick={() => navigate('/leads')}>Cancel</Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save lead'}
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          {duplicates.length > 0 ? (
            <SectionCard
              title="Possible duplicate leads"
              subtitle={`${duplicates.length} existing record(s) match the configured detection rules`}
              icon={<WarningIcon sx={{ color: 'warning.main' }} />}
              sx={{ borderColor: alpha('#D97706', .5), bgcolor: alpha('#D97706', .03) }}
            >
              <Stack gap={1.5}>
                {duplicates.map(({ lead, matches, confidence }) => (
                  <Box key={lead.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary' }} noWrap>{lead.company}</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {lead.reference} · {lead.contactName} · created {fmtDate(lead.createdDate)}
                        </Typography>
                      </Box>
                      <Chip
                        size="small" label={`${confidence}% match`}
                        sx={{ bgcolor: alpha(confidence >= 85 ? '#DC2626' : '#D97706', .14), color: confidence >= 85 ? '#DC2626' : '#D97706', fontWeight: 700 }}
                      />
                    </Stack>
                    <Stack gap={0.4} sx={{ mt: 1 }}>
                      {matches.map((m) => (
                        <Typography key={m.field} variant="caption" sx={{ display: 'block' }}>
                          • <strong>{m.field}</strong> — {m.rule} (weight {m.weight})
                        </Typography>
                      ))}
                    </Stack>
                    <Stack direction="row" gap={0.75} sx={{ mt: 1.25 }} flexWrap="wrap">
                      <StatusChip value={lead.status} />
                      <Box sx={{ flex: 1 }} />
                      <Button size="small" startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => navigate(`/leads/${lead.id}`)}>
                        Open
                      </Button>
                      <Button
                        size="small" startIcon={<MergeIcon sx={{ fontSize: 15 }} />}
                        onClick={async () => {
                          await api.updateLead(lead.id, {
                            notes: `${lead.notes}\n\nMerged capture ${new Date().toLocaleString('en-ZA')}: ${form.contactName}, ${form.company}, ${form.email}, ${form.phone}. ${form.notes}`.trim(),
                          }, `Duplicate capture merged into this lead. The new enquiry details were appended rather than creating a second record.`);
                          toast({
                            message: 'Merged into the existing lead',
                            severity: 'success',
                            detail: `The captured details were appended to ${lead.reference} and no duplicate record was created.`,
                          });
                          navigate(`/leads/${lead.id}`);
                        }}
                      >
                        Merge
                      </Button>
                    </Stack>
                  </Box>
                ))}
                <Divider />
                <Button
                  size="small" color="warning" variant={dismissedDuplicates ? 'contained' : 'outlined'}
                  onClick={() => {
                    setDismissedDuplicates(true);
                    toast({ message: 'Duplicate warning acknowledged', severity: 'info', detail: 'The lead can now be saved. The override is recorded in the audit trail.' });
                  }}
                >
                  {dismissedDuplicates ? 'Override acknowledged — you may save' : 'Continue anyway (not a duplicate)'}
                </Button>
              </Stack>
            </SectionCard>
          ) : (
            <SectionCard title="Duplicate detection" subtitle="Live matching against the configured rules">
              <Alert severity="success" icon={false}>
                <AlertTitle sx={{ fontSize: '0.85rem' }}>No duplicates detected</AlertTitle>
                <Typography variant="body2">
                  The email, telephone and company values entered so far do not match any existing lead.
                </Typography>
              </Alert>
              <Divider sx={{ my: 1.75 }} />
              <Typography variant="overline" color="text.secondary">Active matching rules</Typography>
              <Stack gap={1} sx={{ mt: 0.75 }}>
                {store.configuration.duplicateRules.filter((r) => r.active).map((r) => (
                  <Stack key={r.id} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.field}</Typography>
                      <Typography variant="caption">{r.matchType}</Typography>
                    </Box>
                    <Chip size="small" label={`${r.weight}%`} />
                  </Stack>
                ))}
              </Stack>
              <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/configuration?tab=leads')}>
                Configure matching rules
              </Button>
            </SectionCard>
          )}

          <SectionCard title="Validation status" dense>
            <Stack gap={1}>
              {[
                ['Contact name', !errors.contactName],
                ['Company', !errors.company],
                ['Email address', !errors.email],
                ['Sector', !errors.sector],
                ['Product interest', !errors.productInterest],
                ['Backup owner (if assigned)', !errors.backupOwnerId],
              ].map(([label, ok]) => (
                <Stack key={label as string} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{label}</Typography>
                  <Chip
                    size="small" label={ok ? 'OK' : 'Required'}
                    sx={{ bgcolor: alpha(ok ? '#059669' : '#D97706', .12), color: ok ? '#059669' : '#D97706', fontWeight: 700 }}
                  />
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default LeadNew;
