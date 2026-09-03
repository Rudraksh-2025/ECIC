import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, IconButton, MenuItem, Switch,
  FormControlLabel, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CameraIcon from '@mui/icons-material/PhotoCamera';
import RestartIcon from '@mui/icons-material/RestartAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import {
  DemoScenarioPanel, Grid, KpiCard, LabelValue, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import { toast } from '../hooks';
import { fmtDateTime } from '../utils/dates';
import { num, pct } from '../utils/format';
import { LEAD_PRODUCTS } from '../data/leads';
import { SECTORS } from '../data/customers';

/** Delegate badge payloads the simulated scanner returns. */
const BADGES = [
  { name: 'Sibongile Mahlangu', company: 'Mpumalanga Chrome Exporters (Pty) Ltd', email: 'sibongile.mahlangu@mpumalangachrome.demo.africa', phone: '+27 13 656 2211', sector: 'Metals & Mining', product: LEAD_PRODUCTS[0] },
  { name: 'Dries van Heerden', company: 'Karoo Solar Components CC', email: 'dries.vanheerden@karoosolar.demo.africa', phone: '+27 53 831 4477', sector: 'Energy & Power', product: LEAD_PRODUCTS[2] },
  { name: 'Fatou Diallo', company: 'Dakar Marine Supplies SARL', email: 'fatou.diallo@dakarmarine.demo.africa', phone: '+221 33 869 1200', sector: 'Marine & Shipbuilding', product: LEAD_PRODUCTS[6] },
  { name: 'Ravi Pillay', company: 'Pinetown Precision Engineering', email: 'ravi.pillay@pinetownprecision.demo.africa', phone: '+27 31 701 5588', sector: 'Manufacturing', product: LEAD_PRODUCTS[0] },
  { name: 'Grace Wanjiku', company: 'Thika Textile Mills Ltd', email: 'grace.wanjiku@thikatextile.demo.africa', phone: '+254 67 220 3311', sector: 'Textiles & Apparel', product: LEAD_PRODUCTS[0] },
];

type Phase = 'select' | 'scanning' | 'review' | 'confirmed';

export function QrCapture() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();

  const qrEvents = store.events.filter((e) => e.qrCaptureEnabled && e.status !== 'Cancelled');
  const [eventId, setEventId] = React.useState(
    params.get('event') ?? qrEvents.find((e) => e.status === 'Active')?.id ?? qrEvents[0]?.id ?? '',
  );
  const [offline, setOffline] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>('select');
  const [badgeIndex, setBadgeIndex] = React.useState(0);
  const [form, setForm] = React.useState({ name: '', company: '', email: '', phone: '', sector: '', product: '' });
  const [result, setResult] = React.useState<{ reference: string; owner: string; sync: string; leadId: string | null } | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  const event = store.events.find((e) => e.id === eventId);
  const eventLeads = store.leads.filter((l) => l.eventId === eventId);
  const captures = store.offlineCaptures;
  const pending = captures.filter((c) => c.status === 'Stored Offline');

  const startScan = () => {
    setPhase('scanning');
    window.setTimeout(() => {
      const badge = BADGES[badgeIndex % BADGES.length];
      setBadgeIndex((i) => i + 1);
      setForm({ ...badge });
      setPhase('review');
      toast({ message: 'QR code scanned', severity: 'success', detail: `Delegate badge decoded for ${badge.name} at ${badge.company}. Correct any field before submitting.` });
    }, 1900);
  };

  const submit = async () => {
    if (!eventId || !form.name || !form.company || !form.email) {
      toast({ message: 'Capture incomplete', severity: 'error', detail: 'Name, company and email address are required before the lead can be created.' });
      return;
    }
    const { lead, capture } = await api.captureQrLead({ ...form, eventId, offline });
    if (lead) {
      setResult({
        reference: lead.reference,
        owner: store.users.find((u) => u.id === lead.ownerId)?.name ?? 'Unassigned',
        sync: 'Synced',
        leadId: lead.id,
      });
      toast({ message: `Lead ${lead.reference} created`, severity: 'success', detail: 'Synchronised to the CRM and assigned with a backup owner.' });
    } else if (capture) {
      setResult({ reference: capture.id, owner: 'Assigned on synchronisation', sync: 'Stored Offline', leadId: null });
      toast({ message: 'Captured offline', severity: 'info', detail: 'The capture is held on the device and will create a CRM lead when you synchronise.' });
    }
    setPhase('confirmed');
  };

  const reset = () => {
    setForm({ name: '', company: '', email: '', phone: '', sector: '', product: '' });
    setResult(null);
    setPhase('select');
  };

  return (
    <Box>
      <PageHeader
        title="QR Exhibition Lead Capture"
        subtitle="A mobile-first capture experience for the exhibition stand team: scan a delegate badge, correct the details, submit, and the lead is in the CRM with full event and campaign attribution — online or offline."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'QR Lead Capture' }]}
        chips={
          offline
            ? <Chip size="small" icon={<CloudOffIcon />} label="OFFLINE MODE" sx={{ bgcolor: alpha('#D97706', .14), color: '#B45309', fontWeight: 700 }} />
            : <Chip size="small" label="ONLINE" sx={{ bgcolor: alpha('#059669', .12), color: '#059669', fontWeight: 700 }} />
        }
        actions={
          <FormControlLabel
            control={<Switch checked={offline} onChange={(e) => { setOffline(e.target.checked); reset(); }} />}
            label={<Typography variant="body2">Offline mode</Typography>}
          />
        }
      />

      <DemoScenarioPanel
        scenario="ECIC is exhibiting at a trade expo. A stand team member scans a delegate's badge on a phone, corrects one field, submits, and the lead appears in the CRM assigned to a Business Development Officer. The same flow works with no connectivity."
        evidence={[
          'Event selection before capture, applying the event and campaign attribution automatically',
          'Simulated camera and QR scan returning the delegate payload',
          'Manual correction of every captured field before submission',
          'Immediate synchronisation to the CRM with owner assignment and a success confirmation',
          'Offline capture held on the device with a Stored Offline badge and a Sync Now action',
          'Per-event capture, conversion and follow-up metrics',
        ]}
        requirements={[53, 54, 55, 56, 57, 58, 59, 60, 97]}
        next="Open the lead that was just created"
        nextTo={result?.leadId ? `/leads/${result.leadId}` : '/leads'}
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        {/* Mobile device frame */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{
            width: 340, maxWidth: '100%', borderRadius: 6, p: 1,
            bgcolor: '#0F172A', boxShadow: '0 26px 60px -28px rgba(11,37,69,.7)',
            border: '8px solid #0F172A',
          }}>
            <Box sx={{ height: 22, display: 'grid', placeItems: 'center' }}>
              <Box sx={{ width: 76, height: 5, borderRadius: 3, bgcolor: '#1E293B' }} />
            </Box>
            <Box sx={{ bgcolor: 'background.default', borderRadius: 4, overflow: 'hidden', minHeight: 560 }}>
              {/* Device header */}
              <Box sx={{
                px: 2, py: 1.5,
                background: 'linear-gradient(135deg, #0B2545 0%, #13315C 60%, #0E7C7B 180%)',
                color: '#fff',
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>ECIC Lead Capture</Typography>
                  <Chip
                    size="small"
                    label={offline ? 'Offline' : 'Online'}
                    sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: alpha(offline ? '#D97706' : '#059669', .3), color: '#fff',
                    }}
                  />
                </Stack>
                <Typography sx={{ fontSize: '0.68rem', opacity: .75, mt: .25 }}>
                  {event ? `${event.name} · ${event.city}` : 'Select an event to begin'}
                </Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                {phase === 'select' && (
                  <Stack gap={2}>
                    <TextField
                      select fullWidth label="Event" value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                    >
                      {qrEvents.map((e) => (
                        <MenuItem key={e.id} value={e.id}>
                          {e.name} {e.status === 'Active' ? '(live)' : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                    {event && (
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Campaign: {store.campaigns.find((c) => c.id === event.campaignId)?.name ?? 'None'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Leads captured so far: {eventLeads.length} of {event.expectedLeads} target
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{
                      height: 230, borderRadius: 3, display: 'grid', placeItems: 'center',
                      bgcolor: alpha('#0B2545', .04), border: '2px dashed', borderColor: 'divider',
                    }}>
                      <Stack alignItems="center" gap={1}>
                        <QrIcon sx={{ fontSize: 62, color: 'text.disabled' }} />
                        <Typography variant="caption">Camera ready</Typography>
                      </Stack>
                    </Box>
                    <Button
                      fullWidth size="large" variant="contained" startIcon={<CameraIcon />}
                      disabled={!eventId} onClick={startScan}
                    >
                      Start scanning
                    </Button>
                    <Typography variant="caption" sx={{ textAlign: 'center' }}>
                      Camera access is simulated for this demonstration.
                    </Typography>
                  </Stack>
                )}

                {phase === 'scanning' && (
                  <Stack gap={2} alignItems="center" sx={{ py: 2 }}>
                    <Box sx={{
                      position: 'relative', width: 230, height: 230, borderRadius: 3,
                      bgcolor: '#0F172A', overflow: 'hidden',
                    }}>
                      {[0, 1, 2, 3].map((i) => (
                        <Box key={i} sx={{
                          position: 'absolute', width: 34, height: 34,
                          borderTop: i < 2 ? '3px solid #0E7C7B' : 'none',
                          borderBottom: i >= 2 ? '3px solid #0E7C7B' : 'none',
                          borderLeft: i % 2 === 0 ? '3px solid #0E7C7B' : 'none',
                          borderRight: i % 2 === 1 ? '3px solid #0E7C7B' : 'none',
                          borderRadius: 1.5,
                          top: i < 2 ? 14 : undefined, bottom: i >= 2 ? 14 : undefined,
                          left: i % 2 === 0 ? 14 : undefined, right: i % 2 === 1 ? 14 : undefined,
                        }} />
                      ))}
                      <Box sx={{
                        position: 'absolute', left: 18, right: 18, top: '50%',
                        height: 2, bgcolor: '#0E7C7B', boxShadow: '0 0 14px 2px rgba(14,124,123,.9)',
                        animation: 'ecic-scan 1.4s ease-in-out infinite',
                      }} />
                      <QrIcon sx={{ position: 'absolute', inset: 0, m: 'auto', fontSize: 92, color: alpha('#fff', .16) }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Scanning delegate badge…</Typography>
                    <Typography variant="caption" sx={{ textAlign: 'center' }}>
                      Hold the device steady over the QR code on the delegate badge.
                    </Typography>
                  </Stack>
                )}

                {phase === 'review' && (
                  <Stack gap={1.75}>
                    <Alert severity="success" icon={<CheckCircleIcon />} sx={{ py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>QR scan successful</Typography>
                    </Alert>
                    <Typography variant="caption">
                      Check and correct the captured details before submitting.
                    </Typography>
                    <TextField size="small" fullWidth required label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    <TextField size="small" fullWidth required label="Company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
                    <TextField size="small" fullWidth required label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    <TextField size="small" fullWidth label="Telephone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    <TextField size="small" fullWidth select label="Sector" value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}>
                      {SECTORS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                    <TextField size="small" fullWidth select label="Product interest" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}>
                      {LEAD_PRODUCTS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </TextField>
                    <Divider />
                    <Typography variant="caption">
                      Event: <strong>{event?.name}</strong> · Campaign:{' '}
                      <strong>{store.campaigns.find((c) => c.id === event?.campaignId)?.name ?? 'None'}</strong>
                    </Typography>
                    <Button fullWidth size="large" variant="contained" onClick={submit}>
                      {offline ? 'Store offline' : 'Submit lead'}
                    </Button>
                    <Button fullWidth size="small" onClick={reset}>Cancel</Button>
                  </Stack>
                )}

                {phase === 'confirmed' && result && (
                  <Stack gap={2} alignItems="center" sx={{ py: 2 }}>
                    <Box sx={{
                      width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      bgcolor: alpha(result.sync === 'Synced' ? '#059669' : '#D97706', .12),
                    }}>
                      {result.sync === 'Synced'
                        ? <CheckCircleIcon sx={{ fontSize: 42, color: '#059669' }} />
                        : <CloudOffIcon sx={{ fontSize: 40, color: '#D97706' }} />}
                    </Box>
                    <Typography variant="h5" sx={{ textAlign: 'center' }}>
                      {result.sync === 'Synced' ? 'Lead captured successfully' : 'Stored offline'}
                    </Typography>
                    <Box sx={{ width: '100%', p: 1.5, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                      <Stack gap={1}>
                        <LabelValue label="Reference" value={result.reference} mono />
                        <LabelValue label="Contact" value={`${form.name}, ${form.company}`} />
                        <LabelValue label="Assigned owner" value={result.owner} />
                        <LabelValue label="Sync status" value={<StatusChip value={result.sync} />} />
                        <LabelValue label="Event" value={event?.name} />
                      </Stack>
                    </Box>
                    {result.sync === 'Stored Offline' && (
                      <Alert severity="warning" sx={{ width: '100%', py: 0.5 }}>
                        <Typography variant="caption">
                          Held on the device. Use Sync Now when connectivity returns to create the CRM lead.
                        </Typography>
                      </Alert>
                    )}
                    <Stack direction="row" gap={1} sx={{ width: '100%' }}>
                      <Button fullWidth variant="contained" startIcon={<QrIcon />} onClick={() => { reset(); startScan(); }}>
                        Scan next
                      </Button>
                      {result.leadId && (
                        <IconButton color="primary" onClick={() => navigate(`/leads/${result.leadId}`)} aria-label="Open lead">
                          <OpenInNewIcon />
                        </IconButton>
                      )}
                    </Stack>
                    <Button fullWidth size="small" startIcon={<RestartIcon />} onClick={reset}>Start over</Button>
                  </Stack>
                )}
              </Box>
            </Box>
            <Box sx={{ height: 18, display: 'grid', placeItems: 'center' }}>
              <Box sx={{ width: 110, height: 4, borderRadius: 3, bgcolor: '#1E293B' }} />
            </Box>
          </Box>
        </Box>

        {/* Side panels */}
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
            <KpiCard dense label="Leads at this event" value={num(eventLeads.length)} sub={`target ${num(event?.expectedLeads ?? 0)}`} colour="#2563EB" />
            <KpiCard dense label="Qualified" value={num(eventLeads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length)} sub={pct(eventLeads.length ? (eventLeads.filter((l) => ['Qualified', 'Converted'].includes(l.status)).length / eventLeads.length) * 100 : 0)} colour="#059669" />
            <KpiCard dense label="Pending sync" value={num(pending.length)} sub="Held on device" colour="#D97706" />
            <KpiCard dense label="Follow-up outstanding" value={num(eventLeads.filter((l) => !l.firstContactDate).length)} sub="No first contact yet" colour="#DC2626" />
          </Grid>

          <SectionCard
            title="Offline capture queue"
            subtitle="Captures held on the device when connectivity is unavailable"
            action={
              <Button
                variant="contained" size="small" startIcon={<SyncIcon />}
                disabled={pending.length === 0 || syncing}
                onClick={async () => {
                  setSyncing(true);
                  const created = await api.syncOfflineCaptures();
                  setSyncing(false);
                  toast({
                    message: `${created.length} offline capture(s) synchronised`,
                    severity: 'success',
                    detail: `CRM leads created: ${created.map((l) => l.reference).join(', ')}. Each was assigned an owner and a backup owner.`,
                  });
                }}
              >
                {syncing ? 'Synchronising…' : `Sync now (${pending.length})`}
              </Button>
            }
            sx={{ mb: 2.5 }}
          >
            {captures.length === 0 ? (
              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  No offline captures yet. Switch on <strong>Offline mode</strong> above and capture a lead — it will be
                  held here as <strong>Stored Offline</strong> until you synchronise.
                </Typography>
              </Alert>
            ) : (
              <Stack gap={1}>
                {captures.map((c) => (
                  <Box key={c.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.company}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                          {c.name} · {c.email} · captured {fmtDateTime(c.capturedAt)}
                        </Typography>
                      </Box>
                      <Stack direction="row" gap={0.75} alignItems="center">
                        <StatusChip value={c.status} />
                        {c.leadId && (
                          <Button size="small" onClick={() => navigate(`/leads/${c.leadId}`)}>Open lead</Button>
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>

          <SectionCard title="Capture flow" subtitle="The nine steps demonstrated on the device to the left">
            <Grid cols={{ xs: 1, sm: 3 }} gap={1.5}>
              {[
                ['1. Select event', 'The event determines the campaign attribution applied to every lead captured.'],
                ['2. Start scanning', 'The device camera is opened for QR acquisition.'],
                ['3. Scan success', 'The delegate badge payload is decoded and confirmed to the user.'],
                ['4. Autofill', 'Name, company, contact details, sector and product interest are populated.'],
                ['5. Manual correction', 'Every field remains editable — scanned data is never trusted blindly.'],
                ['6. Submit', 'Validation runs on name, company and email before the lead is created.'],
                ['7. Confirmation', 'Reference, assigned owner and sync status are confirmed on screen.'],
                ['8. Assignment', 'A primary and backup Business Development Officer are assigned automatically.'],
                ['9. Synchronisation', 'Online captures sync immediately; offline captures queue for Sync Now.'],
              ].map(([title, body]) => (
                <Box key={title} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                  <Typography variant="caption">{body}</Typography>
                </Box>
              ))}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" icon={false}>
              <AlertTitle sx={{ fontSize: '0.85rem' }}>DEMO / SIMULATED camera</AlertTitle>
              <Typography variant="body2">
                Camera access and QR decoding are simulated so the flow is reliable during a live presentation.
                A production mobile application uses the device camera and the same submission pipeline.
              </Typography>
            </Alert>
          </SectionCard>
        </Box>
      </Grid>
    </Box>
  );
}

export default QrCapture;
