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
import { LEAD_ENQUIRY_TYPES, LEAD_PRODUCTS } from '../../data/leads';
import { COUNTRIES } from '../../data/customers';

export function PortalNewEnquiry() {
  const navigate = useNavigate();
  const store = useStore();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const captchaRequired = store.configuration.security.captchaOnPublicForms;

  const [form, setForm] = React.useState({
    contactName: customer.contactPerson, email: customer.email, phone: customer.phone,
    enquiryType: LEAD_ENQUIRY_TYPES[0], productInterest: '', country: '', estimatedValue: '', notes: '',
  });
  const [captcha, setCaptcha] = React.useState(false);
  const [consent, setConsent] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<{ reference: string; owner: string; due: string } | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const errors: Record<string, string> = {};
  if (!form.contactName.trim()) errors.contactName = 'Please give us a contact name.';
  if (!form.email.trim()) errors.email = 'We need an email address to respond to your enquiry.';
  if (!form.productInterest) errors.productInterest = 'Please tell us which cover you are interested in.';
  if (!form.country) errors.country = 'Please tell us the target market.';
  if (captchaRequired && !captcha) errors.captcha = 'Please complete the verification check.';
  if (!consent) errors.consent = 'Please confirm you consent to ECIC processing this information.';

  const show = (k: string) => attempted ? errors[k] : undefined;

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <SectionCard>
          <Stack alignItems="center" gap={2} sx={{ py: 3, textAlign: 'center' }}>
            <Box sx={{ width: 78, height: 78, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: alpha('#059669', .12) }}>
              <CheckCircleIcon sx={{ fontSize: 46, color: '#059669' }} />
            </Box>
            <Typography variant="h2">Thank you — your enquiry is with us</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
              Your enquiry has been logged in the ECIC CRM and allocated to a named Business Development Officer,
              with a backup officer recorded so you always have a point of contact.
            </Typography>
            <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'surface.subtle', width: '100%', maxWidth: 460 }}>
              <Stack gap={1.5}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Your enquiry reference</Typography>
                  <Typography variant="h4" sx={{ fontFamily: 'ui-monospace, monospace' }}>{submitted.reference}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary">Your ECIC contact</Typography>
                  <Typography variant="subtitle1">{submitted.owner}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">We will be in touch by</Typography>
                  <Typography variant="subtitle1">{submitted.due}</Typography>
                </Box>
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mt: 1 }}>
              <Button variant="contained" onClick={() => navigate('/portal/enquiries')}>Track this enquiry</Button>
              <Button variant="outlined" onClick={() => navigate('/portal')}>Return to the portal</Button>
            </Stack>
          </Stack>
        </SectionCard>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h2" sx={{ mb: 0.75 }}>Submit an enquiry</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Tell us what you would like to export and where. Your enquiry goes straight into the ECIC CRM, is allocated
        to a named officer with a backup, and we aim to make first contact within two business days.
      </Typography>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <SectionCard title="Your enquiry">
            <Stack gap={2.5}>
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <TextField
                  required label="Contact name" value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  error={!!show('contactName')} helperText={show('contactName')}
                />
                <TextField
                  required label="Email address" value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={!!show('email')} helperText={show('email')}
                />
                <TextField label="Telephone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </Grid>
              <Divider />
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField select label="What can we help with?" value={form.enquiryType} onChange={(e) => set('enquiryType', e.target.value)}>
                  {LEAD_ENQUIRY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField
                  required select label="Which cover are you interested in?" value={form.productInterest}
                  onChange={(e) => set('productInterest', e.target.value)}
                  error={!!show('productInterest')} helperText={show('productInterest')}
                >
                  {LEAD_PRODUCTS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField
                  required select label="Target market" value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  error={!!show('country')} helperText={show('country') ?? 'The country your buyer or project is in.'}
                >
                  {COUNTRIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField
                  type="number" label="Indicative transaction value (ZAR)" value={form.estimatedValue}
                  onChange={(e) => set('estimatedValue', e.target.value)}
                  helperText="An estimate is fine — it helps us route your enquiry."
                />
              </Grid>
              <TextField
                multiline minRows={4} label="Tell us more about the transaction" value={form.notes}
                onChange={(e) => set('notes', e.target.value)} fullWidth
                helperText="The goods or services, the buyer, the payment terms and the timing all help us respond usefully."
              />

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
                    I consent to ECIC processing the personal information in this enquiry for the purpose of
                    assessing and responding to it, in line with the ECIC privacy notice.
                  </Typography>
                }
              />

              <Divider />
              <Stack direction="row" justifyContent="flex-end" gap={1.5}>
                <Button onClick={() => navigate('/portal/enquiries')}>Cancel</Button>
                <Button
                  variant="contained" size="large" startIcon={<SendIcon />}
                  onClick={async () => {
                    setAttempted(true);
                    if (Object.keys(errors).length > 0) {
                      toast({
                        message: 'Your enquiry could not be submitted',
                        severity: 'error',
                        detail: `${Object.keys(errors).length} item(s) need your attention.`,
                      });
                      return;
                    }
                    const owner = store.users.find((u) => u.id === customer.accountOwnerId)
                      ?? store.users.find((u) => u.role === 'bdu_officer' && u.status === 'Active');
                    const backup = store.users.find((u) => u.role === 'bdu_officer' && u.id !== owner?.id);
                    const lead = await api.createLead({
                      contactName: form.contactName, company: customer.organisation,
                      customerId: customer.id, email: form.email, phone: form.phone,
                      source: 'Customer Portal', enquiryType: form.enquiryType,
                      sector: customer.sector, productInterest: form.productInterest,
                      country: form.country, estimatedValue: Number(form.estimatedValue) || 0,
                      ownerId: owner?.id ?? null, backupOwnerId: backup?.id ?? null,
                      notes: form.notes,
                    });
                    setSubmitted({
                      reference: lead.reference,
                      owner: owner?.name ?? 'Being allocated',
                      due: fmtDate(lead.slaDueDate),
                    });
                    toast({
                      message: `Enquiry ${lead.reference} submitted`,
                      severity: 'success',
                      detail: `Allocated to ${owner?.name} with ${backup?.name} as backup. First contact due ${fmtDate(lead.slaDueDate)}.`,
                    });
                  }}
                >
                  Submit enquiry
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="What happens next">
            <Stack gap={1.5}>
              {[
                'Your enquiry is logged in the ECIC CRM with a reference number.',
                'It is allocated to a named Business Development Officer, with a backup officer.',
                'We aim to make first contact within two business days.',
                'We carry out a desktop analysis of the transaction against ECIC criteria.',
                'If we can support it, we take you through to a formal application.',
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

          <Alert severity="info">
            <AlertTitle sx={{ fontSize: '0.85rem' }}>Not sure which cover you need?</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Our FAQ library explains the difference between short-term and medium/long-term cover, and which
              countries ECIC can support.
            </Typography>
            <Button size="small" variant="outlined" onClick={() => navigate('/portal/faqs')}>Read the FAQs</Button>
          </Alert>
        </Stack>
      </Grid>
    </Box>
  );
}

export default PortalNewEnquiry;
