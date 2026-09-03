import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, FormControlLabel, MenuItem, Switch, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import MfaIcon from '@mui/icons-material/PhonelinkLock';
import PrivacyIcon from '@mui/icons-material/PrivacyTip';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { api, writeAudit } from '../../services/mockApi';
import { Grid, LabelValue, SectionCard, SimulatedBadge, Stack, StatusChip } from '../../components';
import { MfaDialog } from '../SecurityCenter';
import { toast } from '../../hooks';
import { fmtDate } from '../../utils/dates';

export function PortalProfile() {
  const navigate = useNavigate();
  const store = useStore();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const [mfaOpen, setMfaOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    contactPerson: customer.contactPerson,
    email: customer.email,
    phone: customer.phone,
    preferredChannel: customer.preferredChannel as string,
    consentMarketing: customer.consentMarketing,
  });

  React.useEffect(() => {
    setForm({
      contactPerson: customer.contactPerson, email: customer.email, phone: customer.phone,
      preferredChannel: customer.preferredChannel, consentMarketing: customer.consentMarketing,
    });
  }, [customer.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    store.apply((d) => {
      d.customers = d.customers.map((c) => c.id === customer.id ? {
        ...c,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone,
        preferredChannel: form.preferredChannel as typeof c.preferredChannel,
        consentMarketing: form.consentMarketing,
      } : c);
    });
    writeAudit('Customer profile updated (portal)', 'Customer', customer.id,
      `Contact: ${customer.contactPerson}; Channel: ${customer.preferredChannel}; Marketing consent: ${customer.consentMarketing}`,
      `Contact: ${form.contactPerson}; Channel: ${form.preferredChannel}; Marketing consent: ${form.consentMarketing}`);
    toast({
      message: 'Your details have been updated',
      severity: 'success',
      detail: 'The change was recorded in the ECIC audit log. Consent changes take effect immediately.',
    });
  };

  const accessLog = store.auditEvents
    .filter((a) => a.entityId === customer.id
      || store.complaints.some((c) => c.customerId === customer.id && c.reference === a.entityId)
      || store.applications.some((x) => x.customerId === customer.id && x.reference === a.entityId))
    .slice(0, 12);

  return (
    <Box sx={{ maxWidth: 1100 }}>
      <Typography variant="h2" sx={{ mb: 0.75 }}>My profile</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Keep your contact details current, choose how ECIC communicates with you, manage your consent and see who
        has accessed your records.
      </Typography>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard title="Contact details" subtitle="Used for every communication about your cases, enquiries and applications" sx={{ mb: 2.5 }}>
            <Stack gap={2.5}>
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                <TextField label="Contact person" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
                <TextField label="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <TextField label="Telephone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                <TextField
                  select label="Preferred communication channel" value={form.preferredChannel}
                  onChange={(e) => setForm((f) => ({ ...f, preferredChannel: e.target.value }))}
                  helperText="ECIC will contact you on this channel about every case and application."
                >
                  {['Email', 'Telephone', 'SMS', 'Portal', 'Post'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Divider />
              <Typography variant="overline" color="text.secondary">Organisation details</Typography>
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <LabelValue label="Organisation" value={customer.organisation} />
                <LabelValue label="Customer ID" value={customer.id} mono />
                <LabelValue label="Registration number" value={customer.registrationNo} mono />
                <LabelValue label="Sector" value={customer.sector} />
                <LabelValue label="Country" value={customer.country} />
                <LabelValue label="Account status" value={<StatusChip value={customer.status} />} />
              </Grid>
              <Typography variant="caption">
                To change your organisation details, contact your ECIC account manager —
                {' '}{store.users.find((u) => u.id === customer.accountOwnerId)?.name}.
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="contained" startIcon={<SaveIcon />} onClick={save}>Save my details</Button>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard title="Consent and privacy" subtitle="You control how ECIC uses your information">
            <Stack gap={2}>
              <Box sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="center" flexWrap="wrap">
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Processing consent</Typography>
                    <Typography variant="caption">
                      Required for ECIC to assess enquiries, issue cover and handle complaints.
                    </Typography>
                  </Box>
                  <Chip
                    size="small" label={customer.consentDataProcessing ? 'Granted' : 'Withheld'}
                    sx={{ bgcolor: alpha(customer.consentDataProcessing ? '#059669' : '#DC2626', .12), color: customer.consentDataProcessing ? '#059669' : '#DC2626', fontWeight: 700 }}
                  />
                </Stack>
              </Box>
              <Box sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="center" flexWrap="wrap">
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>Marketing communications</Typography>
                    <Typography variant="caption">
                      Exhibition invitations, product updates and trade mission announcements.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.consentMarketing}
                        onChange={(e) => setForm((f) => ({ ...f, consentMarketing: e.target.checked }))}
                      />
                    }
                    label={<Typography variant="body2">{form.consentMarketing ? 'Opted in' : 'Opted out'}</Typography>}
                  />
                </Stack>
              </Box>
              <Alert severity="info" icon={<PrivacyIcon />}>
                <AlertTitle sx={{ fontSize: '0.85rem' }}>Consent is checked at the point of sending</AlertTitle>
                Withdrawing marketing consent takes effect immediately. ECIC revalidates consent when a communication
                is sent, not only when the audience is built, so a withdrawal cannot be overtaken by a campaign that
                was already prepared.
              </Alert>
              <Divider />
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <LabelValue label="Information retained until" value={fmtDate(customer.retentionUntil)} />
                <LabelValue label="Records held" value={
                  `${store.complaints.filter((c) => c.customerId === customer.id).length} cases · ${store.applications.filter((a) => a.customerId === customer.id).length} applications`
                } />
                <LabelValue label="Documents held" value={String(store.documents.filter((d) => d.customerId === customer.id).length)} />
              </Grid>
              <Stack direction="row" gap={1.5} flexWrap="wrap">
                <Button
                  variant="outlined" startIcon={<DownloadIcon />}
                  onClick={async () => {
                    const complaint = await api.createComplaint({
                      subject: 'Data subject access request',
                      description: `${customer.contactPerson} of ${customer.organisation} has requested a copy of all personal information held by ECIC, together with the purpose of processing, submitted through the customer portal under section 23 of the Protection of Personal Information Act.`,
                      customerId: customer.id, customerKind: 'External',
                      channel: 'Online Portal', category: 'Data & Privacy',
                      subCategory: 'Personal information request',
                      severity: 'High', businessUnit: 'Legal & Compliance',
                      assignedTeam: 'Complaints Team B', assignedToId: 'USR-002',
                      preferredChannel: form.preferredChannel as never,
                    });
                    toast({
                      message: `Request ${complaint.reference} logged`,
                      severity: 'success',
                      detail: 'Your data subject access request has been logged and will be acknowledged within one business day.',
                      action: { label: 'Track request', to: '/portal/cases' },
                    });
                  }}
                >
                  Request a copy of my information
                </Button>
                <Button variant="outlined" onClick={() => navigate('/portal/faqs?q=privacy')}>
                  Read the privacy notice
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Sign-in security">
            <Stack gap={1.75}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Multi-factor authentication</Typography>
                <Chip
                  size="small"
                  label={store.configuration.security.mfaRequiredPortal ? 'Required' : 'Optional'}
                  sx={{ bgcolor: alpha('#059669', .12), color: '#059669', fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="caption">
                Portal sign-in requires a one-time verification code in addition to your password. This protects the
                confidential commercial and personal information held in your ECIC profile.
              </Typography>
              <Button variant="outlined" startIcon={<MfaIcon />} onClick={() => setMfaOpen(true)}>
                Test multi-factor authentication
              </Button>
              <Divider />
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <SimulatedBadge />
                <Typography variant="caption">
                  Authentication is simulated in this demonstration.
                </Typography>
              </Stack>
            </Stack>
          </SectionCard>

          <SectionCard title="Who has accessed my records" subtitle="Every access to your information is logged">
            <Stack gap={1}>
              {accessLog.length === 0 && (
                <Typography variant="body2" color="text.secondary">No access events recorded yet.</Typography>
              )}
              {accessLog.map((a) => (
                <Box key={a.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.action}</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {a.userName} · {a.role}
                  </Typography>
                  <Typography variant="caption">{new Date(a.at).toLocaleString('en-ZA')}</Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>

      <MfaDialog
        open={mfaOpen}
        context="portal"
        username={customer.email}
        onClose={() => setMfaOpen(false)}
        onSuccess={() => {
          setMfaOpen(false);
          toast({ message: 'Verification successful', severity: 'success', detail: 'Your identity was confirmed and the event recorded in the audit log.' });
        }}
      />
    </Box>
  );
}

export default PortalProfile;
