import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Checkbox, Divider, FormControlLabel, MenuItem, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShieldIcon from '@mui/icons-material/VerifiedUser';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { api } from '../../services/mockApi';
import { Grid, SectionCard, SimulatedBadge, Stack } from '../../components';
import { toast } from '../../hooks';
import { fmtDate } from '../../utils/dates';

export function PortalNewComplaint() {
  const navigate = useNavigate();
  const store = useStore();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const captchaRequired = store.configuration.security.captchaOnPublicForms;

  const [form, setForm] = React.useState({
    subject: '', description: '', category: '', subCategory: '',
    severity: 'Medium', preferredChannel: customer.preferredChannel,
    contactName: customer.contactPerson, contactEmail: customer.email, contactPhone: customer.phone,
    loggedDate: new Date().toISOString().slice(0, 10),
  });
  const [captcha, setCaptcha] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<{ reference: string; due: string; id: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({
    ...f, [k]: v, ...(k === 'category' ? { subCategory: '' } : {}),
  }));

  const errors: Record<string, string> = {};
  if (!form.subject.trim()) errors.subject = 'Please give your complaint a short title.';
  if (form.description.trim().length < 25) errors.description = 'Please describe the complaint in at least 25 characters so we can investigate it properly.';
  if (!form.category) errors.category = 'Please select the area your complaint relates to.';
  if (!form.contactEmail.trim()) errors.contactEmail = 'We need an email address to acknowledge your complaint.';
  if (captchaRequired && !captcha) errors.captcha = 'Please complete the verification check.';
  if (!consent) errors.consent = 'Please confirm you consent to ECIC processing this information.';

  const show = (k: string) => attempted ? errors[k] : undefined;
  const subCategories = store.configuration.complaintSubCategories[form.category] ?? [];

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <SectionCard>
          <Stack alignItems="center" gap={2} sx={{ py: 3, textAlign: 'center' }}>
            <Box sx={{ width: 78, height: 78, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: alpha('#059669', .12) }}>
              <CheckCircleIcon sx={{ fontSize: 46, color: '#059669' }} />
            </Box>
            <Typography variant="h2">Your complaint has been received</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
              Thank you. Your complaint has been logged and allocated to the ECIC Client Services team. You will
              receive an acknowledgement on your preferred channel shortly.
            </Typography>
            <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'surface.subtle', width: '100%', maxWidth: 460 }}>
              <Stack gap={1.5}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Your case reference</Typography>
                  <Typography variant="h4" sx={{ fontFamily: 'ui-monospace, monospace' }}>{submitted.reference}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary">Target resolution date</Typography>
                  <Typography variant="subtitle1">{submitted.due}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">We will contact you by</Typography>
                  <Typography variant="subtitle1">{form.preferredChannel}</Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mt: 1 }}>
              <Button variant="contained" onClick={() => navigate('/portal/cases')}>Track this case</Button>
              <Button variant="outlined" onClick={() => navigate('/portal')}>Return to the portal</Button>
            </Stack>
          </Stack>
        </SectionCard>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h2" sx={{ mb: 0.75 }}>Submit a complaint</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Tell us what has gone wrong. Your complaint is logged directly into the ECIC case management system, given a
        reference number and a target resolution date, and allocated to a specialist.
      </Typography>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <SectionCard title="Complaint details">
            <Stack gap={2.5}>
              <TextField
                required label="What is your complaint about?" value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                error={!!show('subject')} helperText={show('subject') ?? 'A short title, for example “Policy schedule shows the wrong cover limit”.'}
                fullWidth
              />
              <TextField
                required multiline minRows={5} label="Describe what happened" value={form.description}
                onChange={(e) => set('description', e.target.value)}
                error={!!show('description')}
                helperText={show('description') ?? `${form.description.trim().length} characters. Include dates, reference numbers and who you dealt with if you can.`}
                fullWidth
              />
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField
                  required select label="Which area does this relate to?" value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  error={!!show('category')} helperText={show('category')}
                >
                  {store.configuration.complaintCategories.filter((c) => c.active).map((c) => (
                    <MenuItem key={c.id} value={c.label}>{c.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select label="More specifically" value={form.subCategory}
                  onChange={(e) => set('subCategory', e.target.value)}
                  disabled={!form.category}
                  helperText={form.category ? 'Optional, but it helps us route your complaint faster.' : 'Select an area first.'}
                >
                  {subCategories.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField
                  type="date" label="When did this happen?" value={form.loggedDate}
                  onChange={(e) => set('loggedDate', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select label="How urgent is this?" value={form.severity}
                  onChange={(e) => set('severity', e.target.value)}
                  helperText="This helps us prioritise; ECIC confirms the final severity."
                >
                  <MenuItem value="Critical">Critical — my business is materially affected today</MenuItem>
                  <MenuItem value="High">High — this needs attention this week</MenuItem>
                  <MenuItem value="Medium">Medium — I need this resolved</MenuItem>
                  <MenuItem value="Low">Low — a general concern</MenuItem>
                </TextField>
              </Grid>
              <Divider />
              <Typography variant="overline" color="text.secondary">How should we contact you?</Typography>
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <TextField label="Your name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
                <TextField
                  required label="Email address" value={form.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  error={!!show('contactEmail')} helperText={show('contactEmail')}
                />
                <TextField label="Telephone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
              </Grid>
              <TextField
                select label="Preferred communication channel" value={form.preferredChannel}
                onChange={(e) => set('preferredChannel', e.target.value)}
                helperText="Every update on this complaint will be sent on this channel."
                sx={{ maxWidth: 320 }}
              >
                {['Email', 'Telephone', 'SMS', 'Portal', 'Post'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>

              <Divider />

              {captchaRequired && (
                <Box sx={{
                  p: 2, borderRadius: 2.5, maxWidth: 400,
                  border: '1px solid', borderColor: show('captcha') ? 'error.main' : 'divider',
                  bgcolor: 'surface.subtle',
                }}>
                  <Stack direction="row" gap={1.5} alignItems="center">
                    <Checkbox checked={captcha} onChange={(e) => setCaptcha(e.target.checked)} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>I am not a robot</Typography>
                      <Typography variant="caption">Verification is required on public submissions.</Typography>
                    </Box>
                    <ShieldIcon sx={{ color: captcha ? 'success.main' : 'text.disabled' }} />
                  </Stack>
                  {show('captcha') && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>{show('captcha')}</Typography>
                  )}
                  <Box sx={{ mt: 1 }}><SimulatedBadge label="DEMO / SIMULATED CAPTCHA" /></Box>
                </Box>
              )}

              <FormControlLabel
                control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                label={
                  <Typography variant="body2" sx={{ color: show('consent') ? 'error.main' : undefined }}>
                    I consent to ECIC processing the personal information in this complaint for the purpose of
                    investigating and resolving it, in line with the ECIC privacy notice.
                  </Typography>
                }
              />

              <Divider />
              <Stack direction="row" justifyContent="flex-end" gap={1.5}>
                <Button onClick={() => navigate('/portal/cases')}>Cancel</Button>
                <Button
                  variant="contained" size="large" startIcon={<SendIcon />}
                  onClick={async () => {
                    setAttempted(true);
                    if (Object.keys(errors).length > 0) {
                      toast({
                        message: 'Your complaint could not be submitted',
                        severity: 'error',
                        detail: `${Object.keys(errors).length} item(s) need your attention before we can accept this complaint.`,
                      });
                      return;
                    }
                    const complaint = await api.createComplaint({
                      subject: form.subject, description: form.description,
                      customerId: customer.id, customerKind: 'External',
                      contactName: form.contactName, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
                      loggedDate: form.loggedDate, channel: 'Online Portal',
                      category: form.category, subCategory: form.subCategory || subCategories[0] || '',
                      severity: form.severity as never,
                      preferredChannel: form.preferredChannel as never,
                      businessUnit: 'Client Services',
                      assignedTeam: 'Complaints Team A', assignedToId: 'USR-001',
                    });
                    setSubmitted({
                      reference: complaint.reference,
                      due: fmtDate(complaint.dueDate),
                      id: complaint.id,
                    });
                    toast({
                      message: `Complaint ${complaint.reference} submitted`,
                      severity: 'success',
                      detail: `Target resolution ${fmtDate(complaint.dueDate)}. An acknowledgement has been issued on the ${form.preferredChannel} channel.`,
                    });
                  }}
                >
                  Submit complaint
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="What happens next">
            <Stack gap={1.5}>
              {[
                'Your complaint is logged immediately and given a unique reference number.',
                'We acknowledge it within one business day on your preferred channel.',
                'It is allocated to a Complaints Specialist with a target resolution date.',
                'You can track every status change in My Cases.',
                'We tell you the outcome, and ask whether you are satisfied with it.',
                'If you are not satisfied, the case is automatically escalated to a supervisor.',
              ].map((s, i) => (
                <Stack key={s} direction="row" gap={1.25} alignItems="flex-start">
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: '2px',
                    bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B',
                    display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700,
                  }}>{i + 1}</Box>
                  <Typography variant="body2">{s}</Typography>
                </Stack>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Resolution targets">
            <Stack gap={1}>
              {[['Critical', '2 business days'], ['High', '3 business days'], ['Medium / Low', '5 business days']].map(([sev, target]) => (
                <Stack key={sev} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{sev}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{target}</Typography>
                </Stack>
              ))}
              <Divider />
              <Typography variant="caption">
                All complaints are acknowledged within one business day. The target is set from the severity ECIC
                confirms after reviewing your complaint.
              </Typography>
            </Stack>
          </SectionCard>

          <Alert severity="info">
            <AlertTitle sx={{ fontSize: '0.85rem' }}>Your privacy</AlertTitle>
            <Typography variant="body2">
              The information you provide is used only to investigate and resolve your complaint. Access is
              restricted by role, every access is logged, and the record is retained for the period required by
              law and regulation.
            </Typography>
          </Alert>
        </Stack>
      </Grid>
    </Box>
  );
}

export default PortalNewComplaint;
