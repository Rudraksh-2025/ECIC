import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, LinearProgress, Switch, FormControlLabel, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ShieldIcon from '@mui/icons-material/Shield';
import KeyIcon from '@mui/icons-material/VpnKey';
import MfaIcon from '@mui/icons-material/PhonelinkLock';
import RoleIcon from '@mui/icons-material/AdminPanelSettings';
import SodIcon from '@mui/icons-material/CompareArrows';
import PrivacyIcon from '@mui/icons-material/PrivacyTip';
import AuditIcon from '@mui/icons-material/History';
import LockIcon from '@mui/icons-material/EnhancedEncryption';
import BackupIcon from '@mui/icons-material/Backup';
import DrIcon from '@mui/icons-material/Dns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SpeedIcon from '@mui/icons-material/Speed';
import { useNavigate } from 'react-router-dom';
import { useStore, useCurrentUser, useMasking } from '../store';
import { ROLES, ROLE_LIST } from '../data/roles';
import { writeAudit } from '../services/mockApi';
import { Grid, KpiCard, LabelValue, PageHeader, SectionCard, SimulatedBadge, Stack } from '../components';
import { toast, useRenderTiming } from '../hooks';
import { maskEmail, maskPhone, num } from '../utils/format';
import { CONTINUITY } from '../data/implementation';

interface ControlCard {
  key: string;
  title: string;
  icon: React.ReactNode;
  status: 'Implemented' | 'Simulated';
  summary: string;
  detail: string[];
}

export function SecurityCenter() {
  const navigate = useNavigate();
  const store = useStore();
  const me = useCurrentUser();
  const masked = useMasking();
  const renderMs = useRenderTiming();
  const setSession = useStore((s) => s.setSession);
  const [tab, setTab] = React.useState(0);
  const [mfaOpen, setMfaOpen] = React.useState(false);
  const [mfaContext, setMfaContext] = React.useState<'internal' | 'portal'>('internal');

  const cfg = store.configuration.security;
  const role = ROLES[store.session.role];
  const canUnmask = role.permissions.includes('pii.unmask');

  const controls: ControlCard[] = [
    {
      key: 'sso', title: 'Single sign-on (SSO)', icon: <KeyIcon />, status: 'Simulated',
      summary: `${cfg.ssoEnabled ? 'Enabled' : 'Disabled'} · SAML 2.0 against the corporate directory`,
      detail: [
        'Identity provider: Microsoft Entra ID (corporate tenant)',
        'Protocol: SAML 2.0 with SCIM 2.0 user provisioning',
        'Directory group membership drives CRM role assignment',
        'De-provisioning on termination is automatic through SCIM',
        `${store.users.filter((u) => u.ssoLinked).length} of ${store.users.length} demonstration users are SSO-linked`,
      ],
    },
    {
      key: 'mfa', title: 'Multi-factor authentication', icon: <MfaIcon />, status: 'Simulated',
      summary: `Mandatory for internal users: ${cfg.mfaRequiredInternal ? 'yes' : 'no'} · portal users: ${cfg.mfaRequiredPortal ? 'yes' : 'no'}`,
      detail: [
        'One-time verification code delivered by SMS or authenticator application',
        'Code validity window with countdown, resend and cancel',
        'Failed verification attempts are recorded in the audit log',
        `${store.users.filter((u) => u.mfaEnrolled).length} of ${store.users.length} demonstration users are enrolled`,
        'Applies equally to internal CRM sign-in and external portal sign-in',
      ],
    },
    {
      key: 'rbac', title: 'Role-based access control', icon: <RoleIcon />, status: 'Implemented',
      summary: `${ROLE_LIST.length} roles with an explicit permission matrix`,
      detail: [
        'Navigation, actions and field visibility all derive from the active role',
        'Permissions are enforced in the interface, not merely described',
        'Role changes are written to the audit log',
        'Record-level isolation for external portal users',
      ],
    },
    {
      key: 'sod', title: 'Segregation of duties', icon: <SodIcon />, status: 'Implemented',
      summary: 'Investigation separated from authorisation; administration separated from transaction processing',
      detail: [
        'A Complaints Specialist may investigate but not close a complaint',
        'A Marketing User may create a campaign but not approve it',
        'A BDU Officer may originate but not make the underwriting decision',
        'A System Administrator may configure but not process transactions',
        'An Executive has full visibility with no transactional edit rights',
      ],
    },
    {
      key: 'privacy', title: 'POPIA / GDPR controls', icon: <PrivacyIcon />, status: 'Implemented',
      summary: `Personal information masking ${cfg.maskPiiByDefault ? 'on by default' : 'off'} · consent captured per customer`,
      detail: [
        'Field-level masking of email addresses, telephone numbers and identifying data',
        'A discrete "Show sensitive data" permission controls unmasking',
        'Every unmasking action is written to the audit log',
        'Consent for processing and for marketing captured and revalidated at send time',
        'Retention date held on every customer and document record',
      ],
    },
    {
      key: 'audit', title: 'Audit logging', icon: <AuditIcon />, status: 'Simulated',
      summary: `${num(store.auditEvents.length)} events recorded · read-only register with chained hashes`,
      detail: [
        'Actor, role, timestamp, entity, before value, after value, IP address and device on every event',
        'Chained integrity hash so tampering would be detectable',
        'No edit or delete action exists in the interface',
        'Production deployment backs this with append-only storage and WORM retention',
      ],
    },
    {
      key: 'encryption', title: 'Encryption', icon: <LockIcon />, status: 'Simulated',
      summary: 'In transit and at rest',
      detail: [
        'Transport: TLS 1.3 enforced, HSTS, modern cipher suites only',
        'At rest: AES-256 on the database, document store and backups',
        'Key management through the platform key vault with annual rotation',
        'Certificate rotation automated with 30-day expiry alerting',
      ],
    },
    {
      key: 'backup', title: 'Backup', icon: <BackupIcon />, status: 'Simulated',
      summary: 'Full daily backup with continuous log shipping',
      detail: [
        CONTINUITY.backupSchedule,
        'Last backup: completed successfully (see the audit log)',
        'Restore testing performed quarterly against a non-production environment',
      ],
    },
    {
      key: 'dr', title: 'Disaster recovery', icon: <DrIcon />, status: 'Simulated',
      summary: `RTO ${CONTINUITY.rto} · RPO ${CONTINUITY.rpo}`,
      detail: [
        `Recovery time objective: ${CONTINUITY.rto}`,
        `Recovery point objective: ${CONTINUITY.rpo}`,
        CONTINUITY.drTest,
        'Secondary region with warm standby and automated failover runbook',
      ],
    },
  ];

  const assurance = [
    { name: 'ISAE 3402 Type II', scope: 'Service organisation controls over the hosted CRM platform', body: 'Independent audit firm', period: 'Annual — 12 months to 31 March', status: 'Current' },
    { name: 'SOC 2 Type II', scope: 'Security, availability and confidentiality trust services criteria', body: 'Independent audit firm', period: 'Annual — 12 months to 31 March', status: 'Current' },
    { name: 'ISO/IEC 27001', scope: 'Information security management system covering the delivery and support organisation', body: 'Accredited certification body', period: '3-year cycle with annual surveillance', status: 'Current' },
    { name: 'Cyber liability insurance', scope: 'Cyber liability and data breach cover for the delivery organisation', body: 'Licensed insurer', period: 'Annual policy', status: 'Current' },
    { name: 'Penetration test', scope: 'Application and infrastructure penetration test of the CRM platform', body: 'Independent security testing firm', period: 'Annual plus on major release', status: 'Scheduled pre-go-live' },
  ];

  const piiSample = store.customers.slice(0, 5);

  return (
    <Box>
      <PageHeader
        title="Security Centre"
        subtitle="Access control, segregation of duties, multi-factor authentication, protection of personal information and audit logging — with every simulated control clearly labelled as such."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Security Centre' }]}
        chips={<Chip size="small" icon={<SpeedIcon />} label={`Screen rendered in ${renderMs} ms`} sx={{ bgcolor: alpha('#059669', .1), color: '#059669', fontWeight: 700 }} />}
        actions={
          <>
            <Button variant="outlined" startIcon={<MfaIcon />} onClick={() => { setMfaContext('internal'); setMfaOpen(true); }}>
              Demonstrate MFA
            </Button>
            <Button variant="contained" onClick={() => navigate('/users')}>Role permission matrix</Button>
          </>
        }
      />

      <Alert severity="warning" sx={{ mb: 2.5 }}>
        <AlertTitle>Honest labelling of what this demonstration proves</AlertTitle>
        This is a frontend-only demonstration running entirely in your browser. Controls marked{' '}
        <strong>Implemented</strong> are genuinely enforced in this build and can be tested live — role-based access,
        segregation of duties, personal information masking and the permission model. Controls marked{' '}
        <strong>DEMO / SIMULATED</strong> — SSO, MFA, encryption, backup, disaster recovery, malware scanning and
        assurance evidence — represent the intended production operating model. We do not claim that a browser
        demonstration delivers production-grade security.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Roles defined" value={num(ROLE_LIST.length)} colour="#0B2545" onClick={() => navigate('/users')} />
        <KpiCard dense label="MFA enrolled" value={`${num(store.users.filter((u) => u.mfaEnrolled).length)}/${num(store.users.length)}`} colour="#0E7C7B" />
        <KpiCard dense label="SSO linked" value={`${num(store.users.filter((u) => u.ssoLinked).length)}/${num(store.users.length)}`} colour="#2563EB" />
        <KpiCard dense label="Audit events" value={num(store.auditEvents.length)} colour="#7C3AED" onClick={() => navigate('/audit')} />
        <KpiCard dense label="Blocked uploads" value={num(store.documents.filter((d) => d.status === 'Blocked').length)} sub="Threat detected" colour="#DC2626" onClick={() => navigate('/documents')} />
        <KpiCard dense label="Suspended accounts" value={num(store.users.filter((u) => u.status !== 'Active').length)} colour="#D97706" onClick={() => navigate('/users')} />
      </Grid>

      <SectionCard sx={{ mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Security controls" />
          <Tab label="Privacy & personal information" />
          <Tab label="Security settings" />
          <Tab label="Assurance evidence" />
          <Tab label="Performance & availability" />
        </Tabs>

        {tab === 0 && (
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
            {controls.map((c) => (
              <Box
                key={c.key}
                sx={{
                  p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start" sx={{ mb: 1 }}>
                  <Stack direction="row" gap={1.25} alignItems="center">
                    <Box sx={{
                      width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center',
                      bgcolor: alpha(c.status === 'Implemented' ? '#059669' : '#7C3AED', .1),
                      color: c.status === 'Implemented' ? '#059669' : '#7C3AED',
                    }}>{c.icon}</Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{c.title}</Typography>
                  </Stack>
                </Stack>
                {c.status === 'Implemented'
                  ? <Chip size="small" label="IMPLEMENTED IN THIS DEMO" sx={{ alignSelf: 'flex-start', mb: 1.25, bgcolor: alpha('#059669', .12), color: '#059669', fontWeight: 700, fontSize: '0.62rem' }} />
                  : <Box sx={{ mb: 1.25 }}><SimulatedBadge /></Box>}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>{c.summary}</Typography>
                <Divider sx={{ mb: 1.25 }} />
                <Stack gap={0.5}>
                  {c.detail.map((d) => (
                    <Typography key={d} variant="caption" sx={{ display: 'block' }}>• {d}</Typography>
                  ))}
                </Stack>
                {c.key === 'mfa' && (
                  <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => { setMfaContext('internal'); setMfaOpen(true); }}>
                    Run the MFA flow
                  </Button>
                )}
                {c.key === 'rbac' && (
                  <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate('/users')}>
                    Open permission matrix
                  </Button>
                )}
                {c.key === 'audit' && (
                  <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate('/audit')}>
                    Open audit log
                  </Button>
                )}
              </Box>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <Stack gap={2.5}>
            <Alert severity={masked ? 'info' : 'warning'} icon={masked ? <VisibilityOffIcon /> : <VisibilityIcon />}>
              <AlertTitle>
                Personal information is currently {masked ? 'masked' : 'visible'} for {me.name} ({role.name})
              </AlertTitle>
              {canUnmask
                ? 'Your role carries the "Show sensitive data" permission. Toggling visibility writes an audit event recording who unmasked what and when.'
                : 'Your role does not carry the "Show sensitive data" permission, so personal information stays masked regardless of the toggle in the header. Switch to Complaints Supervisor, Underwriting User, Executive or System Administrator to demonstrate unmasking.'}
            </Alert>

            <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={store.session.showSensitiveData} disabled={!canUnmask}
                    onChange={(e) => {
                      setSession({ showSensitiveData: e.target.checked });
                      writeAudit(
                        e.target.checked ? 'Sensitive data unmasked' : 'Sensitive data re-masked',
                        'Session', me.id,
                        `PII ${e.target.checked ? 'masked' : 'revealed'}`,
                        `PII ${e.target.checked ? 'revealed' : 'masked'}; justification: security demonstration`,
                      );
                      toast({
                        message: e.target.checked ? 'Personal information revealed' : 'Personal information masked',
                        severity: e.target.checked ? 'warning' : 'success',
                        detail: 'This action was written to the audit log with your identity, role and timestamp.',
                      });
                    }}
                  />
                }
                label={<Typography variant="body2">Show sensitive data (audited)</Typography>}
              />
              <Button size="small" onClick={() => navigate('/audit?entity=Session')}>View unmasking history</Button>
            </Stack>

            <SectionCard title="Live masking demonstration" subtitle="The same customer records, rendered under your current permission" dense>
              <Stack gap={1}>
                {piiSample.map((c) => (
                  <Box key={c.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.organisation}</Typography>
                    <Grid cols={{ xs: 1, sm: 3 }} gap={1.5} sx={{ mt: 0.75 }}>
                      <LabelValue label="Contact person" value={masked ? `${c.contactPerson.split(' ')[0]} ${'•'.repeat(6)}` : c.contactPerson} />
                      <LabelValue label="Email address" value={masked ? maskEmail(c.email) : c.email} />
                      <LabelValue label="Telephone" value={masked ? maskPhone(c.phone) : c.phone} />
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </SectionCard>

            <Grid cols={{ xs: 1, md: 3 }} gap={2}>
              <SectionCard title="Consent management" dense>
                <Stack gap={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Processing consent granted</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {store.customers.filter((c) => c.consentDataProcessing).length}/{store.customers.length}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">Marketing consent granted</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {store.customers.filter((c) => c.consentMarketing).length}/{store.customers.length}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="caption">
                    Consent is revalidated at the point of sending a marketing communication, not only when the
                    audience is built — the control introduced after complaint ECIC-CMP-2026-0009.
                  </Typography>
                </Stack>
              </SectionCard>

              <SectionCard title="Data access logging" dense>
                <Stack gap={1}>
                  <Typography variant="body2">
                    {store.auditEvents.filter((a) => a.action.toLowerCase().includes('unmask')).length} unmasking
                    event(s) recorded in this environment.
                  </Typography>
                  <Divider />
                  <Typography variant="caption">
                    Every access to and change of a customer record is written to the audit log with the actor,
                    role, timestamp, source address and device.
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => navigate('/audit')}>Open audit log</Button>
                </Stack>
              </SectionCard>

              <SectionCard title="Retention & privacy notice" dense>
                <Stack gap={1}>
                  <LabelValue label="Standard retention period" value="7 years from the end of the relationship" />
                  <LabelValue label="Records with a retention date" value={`${store.customers.length + store.documents.length}`} />
                  <Divider />
                  <Typography variant="caption">
                    Data subject access requests are logged as complaints under the Data &amp; Privacy category,
                    acknowledged within one business day and responded to within the statutory period.
                  </Typography>
                </Stack>
              </SectionCard>
            </Grid>
          </Stack>
        )}

        {tab === 2 && (
          <Stack gap={2.5}>
            <Alert severity="info">
              These settings are maintained in the Configuration Centre and are enforced live in this demonstration —
              changing the permitted file types, for example, immediately changes what the document upload accepts.
            </Alert>
            <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
              <LabelValue label="MFA required — internal users" value={cfg.mfaRequiredInternal ? 'Yes' : 'No'} />
              <LabelValue label="MFA required — portal users" value={cfg.mfaRequiredPortal ? 'Yes' : 'No'} />
              <LabelValue label="Single sign-on" value={cfg.ssoEnabled ? 'Enabled' : 'Disabled'} />
              <LabelValue label="CAPTCHA on public forms" value={cfg.captchaOnPublicForms ? 'Enabled' : 'Disabled'} />
              <LabelValue label="Mask personal information by default" value={cfg.maskPiiByDefault ? 'Yes' : 'No'} />
              <LabelValue label="Session timeout" value={`${cfg.sessionTimeoutMinutes} minutes`} />
              <LabelValue label="Maximum file size" value={`${cfg.maxFileSizeMb} MB`} />
              <LabelValue wide label="Permitted file types" value={
                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.4 }}>
                  {cfg.allowedFileTypes.map((t) => <Chip key={t} size="small" label={`.${t}`} />)}
                </Stack>
              } />
              <LabelValue wide label="Password policy" value={cfg.passwordPolicy} />
            </Grid>
            <Divider />
            <Stack direction="row" gap={1.5} flexWrap="wrap">
              <Button variant="contained" onClick={() => navigate('/configuration?tab=security')}>
                Change security configuration
              </Button>
              <Button variant="outlined" onClick={() => navigate('/documents')}>
                Test the file upload controls
              </Button>
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack gap={2}>
            <Alert severity="warning" icon={false}>
              <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
                <SimulatedBadge label="DEMO / PLACEHOLDER EVIDENCE" />
                <Typography variant="body2">
                  The assurance register below contains placeholder entries so the presenter can show where this
                  evidence sits in the platform. Actual certificates and reports are supplied with the bid response.
                </Typography>
              </Stack>
            </Alert>
            <Stack gap={1.25}>
              {assurance.map((a) => (
                <Box key={a.name} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{a.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{a.scope}</Typography>
                    </Box>
                    <Chip
                      size="small" label={a.status}
                      sx={{ bgcolor: alpha(a.status === 'Current' ? '#059669' : '#D97706', .12), color: a.status === 'Current' ? '#059669' : '#D97706', fontWeight: 700 }}
                    />
                  </Stack>
                  <Divider sx={{ my: 1.25 }} />
                  <Grid cols={{ xs: 1, sm: 2 }} gap={1.5}>
                    <LabelValue label="Issuing body" value={a.body} />
                    <LabelValue label="Period" value={a.period} />
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Stack>
        )}

        {tab === 4 && (
          <Stack gap={2.5}>
            <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">This screen rendered in</Typography>
                <Typography variant="h2" sx={{ color: 'success.main' }}>{renderMs} ms</Typography>
                <Typography variant="caption">
                  Measured in your browser. The RFP target is a 3 second response for records and dashboards.
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">Availability target</Typography>
                <Typography variant="h2">99%</Typography>
                <Typography variant="caption">
                  During ECIC business hours (08:00–16:30 SAST, weekdays), excluding agreed maintenance windows.
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">Records held in this demonstration</Typography>
                <Typography variant="h2">
                  {num(store.complaints.length + store.leads.length + store.opportunities.length
                    + store.customers.length + store.documents.length + store.auditEvents.length)}
                </Typography>
                <Typography variant="caption">
                  Every screen in this demonstration renders from this dataset with no perceptible delay.
                </Typography>
              </Box>
            </Grid>
            <Divider />
            <Grid cols={{ xs: 1, md: 2 }} gap={2.5}>
              <SectionCard title="Scalability model" dense>
                <Stack gap={1}>
                  {[
                    'Modular front end over an abstracted service layer — modules extend independently',
                    'Horizontally scalable application tier behind a load balancer',
                    'Read replicas for reporting and Power BI extraction',
                    'Document binaries held in object storage, not the transactional database',
                    'Archiving strategy for closed cases beyond the active retention window',
                    'Volumetric headroom sized for 3x the current ECIC complaint and lead volumes',
                  ].map((s) => <Typography key={s} variant="body2">• {s}</Typography>)}
                </Stack>
              </SectionCard>
              <SectionCard title="Business continuity" dense>
                <Grid cols={2} gap={1.5}>
                  <LabelValue label="RTO" value={CONTINUITY.rto} />
                  <LabelValue label="RPO" value={CONTINUITY.rpo} />
                </Grid>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>{CONTINUITY.backupSchedule}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>{CONTINUITY.drTest}</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate('/implementation')}>
                  Open the continuity plan
                </Button>
              </SectionCard>
            </Grid>
          </Stack>
        )}
      </SectionCard>

      <MfaDialog
        open={mfaOpen}
        context={mfaContext}
        onClose={() => setMfaOpen(false)}
        onSuccess={() => {
          setMfaOpen(false);
          toast({ message: 'Multi-factor authentication successful', severity: 'success', detail: 'The verification was recorded in the audit log.' });
        }}
      />
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Reusable MFA dialog                                                 */
/* ------------------------------------------------------------------ */

export function MfaDialog({
  open, onClose, onSuccess, context = 'internal', username,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  context?: 'internal' | 'portal';
  username?: string;
}) {
  const [step, setStep] = React.useState<'credentials' | 'code' | 'success'>('credentials');
  const [user, setUser] = React.useState(username ?? '');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [issued, setIssued] = React.useState('');
  const [countdown, setCountdown] = React.useState(60);
  const [attempts, setAttempts] = React.useState(0);
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setStep('credentials'); setPassword(''); setCode(''); setIssued('');
      setCountdown(60); setAttempts(0); setError(''); setUser(username ?? '');
    }
  }, [open, username]);

  React.useEffect(() => {
    if (step !== 'code') return undefined;
    const t = window.setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [step]);

  const sendCode = () => {
    if (!user || !password) { setError('Enter both a username and a password.'); return; }
    setError('');
    setSending(true);
    window.setTimeout(() => {
      const generated = String(Math.floor(100000 + Math.random() * 900000));
      setIssued(generated);
      setCountdown(60);
      setCode('');
      setStep('code');
      setSending(false);
      writeAudit('Verification code issued', 'Authentication', user, '—',
        `MFA code issued for ${context === 'portal' ? 'portal' : 'internal'} sign-in; delivery channel: SMS`);
    }, 700);
  };

  const verify = () => {
    if (code === issued) {
      setStep('success');
      writeAudit('Multi-factor authentication successful', 'Authentication', user,
        'MFA: pending', `MFA: verified; channel: SMS; context: ${context}`);
      window.setTimeout(onSuccess, 900);
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setError(next >= 3
      ? 'Three incorrect attempts. In production the account would now be locked and the security team notified. Request a new code to continue this demonstration.'
      : `Incorrect verification code. ${3 - next} attempt(s) remaining before the account is locked.`);
    writeAudit('Failed multi-factor authentication attempt', 'Authentication', user,
      '—', `Result: Denied; Reason: incorrect code; Attempt ${next} of 3`);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Stack direction="row" gap={1.25} alignItems="center" flexWrap="wrap">
          <MfaIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h5">Multi-factor authentication</Typography>
            <Typography variant="caption">
              {context === 'portal' ? 'Customer portal sign-in' : 'Internal CRM sign-in'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {step === 'credentials' && (
          <Stack gap={2}>
            <Alert severity="info" icon={false}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <SimulatedBadge />
                <Typography variant="caption">
                  The verification code is generated and validated in your browser so the flow can be demonstrated
                  reliably. No identity provider is contacted.
                </Typography>
              </Stack>
            </Alert>
            <TextField
              label="Username or email address" value={user} fullWidth autoFocus
              onChange={(e) => setUser(e.target.value)}
            />
            <TextField
              label="Password" type="password" value={password} fullWidth
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendCode(); }}
              helperText="Any value is accepted in this demonstration."
            />
            {error && <Alert severity="error">{error}</Alert>}
            {sending && <LinearProgress />}
          </Stack>
        )}

        {step === 'code' && (
          <Stack gap={2}>
            <Alert severity="success">
              A six-digit verification code has been sent by SMS to the number registered against this account.
            </Alert>
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                <strong>Demonstration aid:</strong> the code issued is{' '}
                <Typography component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{issued}</Typography>.
                In production this is only ever delivered to the registered device.
              </Typography>
            </Alert>
            <TextField
              label="Verification code" value={code} fullWidth autoFocus
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 6) verify(); }}
              slotProps={{
                input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: '1.4rem', letterSpacing: '0.4em' } },
                htmlInput: { inputMode: 'numeric', 'aria-label': 'Six digit verification code' },
              }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: countdown === 0 ? 'error.main' : 'text.secondary' }}>
                {countdown > 0 ? `Code expires in ${countdown}s` : 'Code expired — request a new one'}
              </Typography>
              <Button size="small" onClick={sendCode}>Resend code</Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}

        {step === 'success' && (
          <Stack gap={2} alignItems="center" sx={{ py: 3 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%', display: 'grid', placeItems: 'center',
              bgcolor: alpha('#059669', .12),
            }}>
              <ShieldIcon sx={{ fontSize: 40, color: '#059669' }} />
            </Box>
            <Typography variant="h5">Verification successful</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Multi-factor authentication completed. The successful verification, the issuing of the code and any
              failed attempts have all been written to the audit log.
            </Typography>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>{step === 'success' ? 'Close' : 'Cancel'}</Button>
        {step === 'credentials' && (
          <Button variant="contained" onClick={sendCode} disabled={sending}>Send verification code</Button>
        )}
        {step === 'code' && (
          <Button variant="contained" onClick={verify} disabled={code.length !== 6 || countdown === 0}>Verify</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default SecurityCenter;
