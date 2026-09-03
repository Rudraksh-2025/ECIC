import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, MenuItem, Step, StepContent, StepLabel, Stepper, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaletteIcon from '@mui/icons-material/Palette';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import {
  DemoScenarioPanel, Grid, KpiCard, LabelValue, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import { toast } from '../hooks';
import { fmtDate, fmtDateTime } from '../utils/dates';
import { num } from '../utils/format';
import type { ComplianceCheck } from '../types';

const ASSET_TYPES = [
  'Exhibition stand graphic', 'Digital advertisement', 'Print collateral',
  'Presentation', 'Exhibition banner', 'Email template', 'Social media post',
];

const TEMPLATES = [
  'Exhibition Stand Pack v4.2', 'Digital Social Pack v4.2', 'Print Collateral Pack v4.2',
  'Email Template Pack v4.2', 'Unbranded deck',
];

export function Cim() {
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = React.useState(0);
  const [review, setReview] = React.useState<{ versionId: string; stepIndex: number } | null>(null);
  const [comment, setComment] = React.useState('');
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [assetForm, setAssetForm] = React.useState({
    name: '', campaignId: '', assetType: ASSET_TYPES[0], template: TEMPLATES[0],
    reviewerId: 'USR-009', logoCorrect: true, coloursCorrect: true, disclaimer: true, wording: true,
  });

  const current = store.cimVersions.find((c) => c.current);
  const draft = store.cimVersions.find((c) => !c.current && c.status !== 'Obsolete');
  const obsolete = store.cimVersions.filter((c) => c.status === 'Obsolete');
  const assets = store.marketingAssets;
  const failing = assets.filter((a) => a.checks.some((c) => !c.passed));

  const buildChecks = (): ComplianceCheck[] => {
    const approvedTemplate = assetForm.template !== 'Unbranded deck';
    return [
      { id: 'chk_logo', label: 'Approved ECIC logo lockup used at minimum clear space', passed: assetForm.logoCorrect, detail: assetForm.logoCorrect ? `Primary horizontal lockup detected at the required clear space per CIM ${current?.version} section 3.1.` : 'Legacy 2019 lockup detected — retired in the current Corporate Identity Manual.' },
      { id: 'chk_colour', label: 'Colour palette matches the approved CIM palette', passed: assetForm.coloursCorrect, detail: assetForm.coloursCorrect ? 'All colour values resolve to the approved primary and accent palette.' : 'A colour outside the approved palette was detected (nearest approved value: #0E7C7B).' },
      { id: 'chk_disclaimer', label: 'Mandatory financial services disclaimer present', passed: assetForm.disclaimer, detail: assetForm.disclaimer ? 'Standard disclaimer block present and legible at final output size.' : 'The required disclaimer block is absent from the artwork.' },
      { id: 'chk_template', label: 'Approved CIM template used', passed: approvedTemplate, detail: approvedTemplate ? `Asset produced from "${assetForm.template}".` : 'The asset was not produced from an approved CIM template pack.' },
      { id: 'chk_wording', label: 'Brand wording and product naming compliant', passed: assetForm.wording, detail: assetForm.wording ? 'Product naming matches the controlled product nomenclature.' : 'Non-approved product naming detected — use the controlled product names.' },
      { id: 'chk_reviewer', label: 'Marketing Communications Specialist assigned as reviewer', passed: !!assetForm.reviewerId, detail: assetForm.reviewerId ? 'Reviewer assigned in line with the mandatory CIM approval step.' : 'No Marketing Communications Specialist assigned — the mandatory approval step is unassigned.' },
    ];
  };

  const previewChecks = buildChecks();
  const previewFailing = previewChecks.filter((c) => !c.passed);

  return (
    <Box>
      <PageHeader
        title="Corporate Identity Manual"
        subtitle="Version-controlled CIM repository with a governed approval workflow and automated compliance checking of marketing assets against the current approved version."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Corporate Identity Manual' }]}
        chips={current && <Chip size="small" icon={<PaletteIcon />} label={`Current: ${current.version}`} sx={{ bgcolor: alpha('#059669', .12), color: '#059669', fontWeight: 700 }} />}
        actions={<Button variant="contained" onClick={() => setSubmitOpen(true)}>Submit marketing asset</Button>}
      />

      <DemoScenarioPanel
        scenario="Marketing submits an exhibition banner for a campaign. The system checks it against the current approved Corporate Identity Manual, and the Marketing Communications Specialist review is mandatory before it can be approved."
        evidence={[
          'One current approved CIM version; every superseded version marked Obsolete and restricted from use',
          'Draft → Marketing Review → Communications Review → Approval → Published workflow with reviewer, date and comments',
          'Automated compliance checklist covering logo, colours, disclaimer, template, wording and reviewer',
          'Mandatory Marketing Communications Specialist reviewer enforced before approval',
          'Notifications and audit history on every approval step',
        ]}
        requirements={[69, 70, 71, 72]}
        next="Advance the v4.3 draft through the approval workflow"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Current version" value={current?.version ?? '—'} sub={`effective ${fmtDate(current?.effectiveDate)}`} colour="#059669" />
        <KpiCard dense label="In approval" value={draft ? '1' : '0'} sub={draft?.version ?? 'None in progress'} colour="#D97706" />
        <KpiCard dense label="Obsolete versions" value={num(obsolete.length)} sub="Restricted from use" colour="#94A3B8" />
        <KpiCard dense label="Assets submitted" value={num(assets.length)} colour="#0B2545" />
        <KpiCard dense label="Compliance failures" value={num(failing.length)} sub="Cannot be approved" colour="#DC2626" />
        <KpiCard dense label="Approved assets" value={num(assets.filter((a) => a.status === 'Approved').length)} colour="#0E7C7B" />
      </Grid>

      <SectionCard>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Version repository" />
          <Tab label="Approval workflow" />
          <Tab label={`Asset compliance (${assets.length})`} />
        </Tabs>

        {tab === 0 && (
          <Stack gap={2}>
            {store.cimVersions.map((v) => (
              <Box
                key={v.id}
                sx={{
                  p: 2, borderRadius: 2.5,
                  border: '2px solid', borderColor: v.current ? alpha('#059669', .4) : 'divider',
                  bgcolor: v.current ? alpha('#059669', .03) : v.restricted ? alpha('#94A3B8', .04) : 'transparent',
                  opacity: v.restricted ? 0.85 : 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="h5">{v.title}</Typography>
                      {v.current && <Chip size="small" label="CURRENT APPROVED VERSION" sx={{ bgcolor: alpha('#059669', .14), color: '#059669', fontWeight: 700 }} />}
                      {v.restricted && <Chip size="small" icon={<LockIcon />} label="RESTRICTED — not for use" sx={{ bgcolor: alpha('#DC2626', .1), color: '#DC2626', fontWeight: 700 }} />}
                      <StatusChip value={v.status} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 780 }}>{v.summary}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Grid cols={{ xs: 2, sm: 4 }} gap={2}>
                  <LabelValue label="Version" value={v.version} />
                  <LabelValue label="Effective date" value={fmtDate(v.effectiveDate)} />
                  <LabelValue label="Owner" value={store.users.find((u) => u.id === v.ownerId)?.name} />
                  <LabelValue label="Approval status" value={<StatusChip value={v.status} />} />
                </Grid>
                {v.changeLog.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="overline" color="text.secondary">Change log</Typography>
                    <Stack gap={0.4} sx={{ mt: 0.4 }}>
                      {v.changeLog.map((c) => <Typography key={c} variant="body2">• {c}</Typography>)}
                    </Stack>
                  </Box>
                )}
                {v.restricted && (
                  <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
                    <Typography variant="caption">
                      This version is retained for audit purposes only. Marketing assets may not be produced against it,
                      and the compliance check will fail any asset that references it.
                    </Typography>
                  </Alert>
                )}
              </Box>
            ))}
          </Stack>
        )}

        {tab === 1 && (
          <Stack gap={3}>
            {store.cimVersions.filter((v) => v.status !== 'Obsolete').map((v) => (
              <Box key={v.id}>
                <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
                  <Typography variant="h5">{v.version}</Typography>
                  <StatusChip value={v.status} />
                  {v.current && <Chip size="small" label="Published" sx={{ bgcolor: alpha('#059669', .12), color: '#059669', fontWeight: 700 }} />}
                </Stack>
                <Stepper orientation="vertical" nonLinear>
                  {v.approvalSteps.map((s, i) => (
                    <Step key={s.step} active expanded completed={s.status === 'Approved'}>
                      <StepLabel
                        error={s.status === 'Rejected'}
                        optional={
                          <Typography variant="caption">
                            {s.role}{s.date ? ` · ${fmtDateTime(s.date)}` : ' · not yet actioned'}
                          </Typography>
                        }
                      >
                        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{s.step}</Typography>
                          <Chip
                            size="small" label={s.status}
                            sx={{
                              height: 19,
                              bgcolor: alpha(s.status === 'Approved' ? '#059669' : s.status === 'In Progress' ? '#D97706' : s.status === 'Rejected' ? '#DC2626' : '#94A3B8', .12),
                              color: s.status === 'Approved' ? '#059669' : s.status === 'In Progress' ? '#D97706' : s.status === 'Rejected' ? '#DC2626' : '#64748B',
                              fontWeight: 700,
                            }}
                          />
                        </Stack>
                      </StepLabel>
                      <StepContent>
                        {s.actorId && (
                          <Typography variant="body2" color="text.secondary">
                            {store.users.find((u) => u.id === s.actorId)?.name}
                          </Typography>
                        )}
                        {s.comment && (
                          <Typography variant="body2" sx={{ mt: 0.4, fontStyle: 'italic' }}>“{s.comment}”</Typography>
                        )}
                        {(s.status === 'In Progress' || s.status === 'Not Started') && !v.current && (
                          <Button
                            size="small" variant="outlined" sx={{ mt: 1 }}
                            disabled={s.status === 'Not Started'}
                            onClick={() => { setComment(''); setReview({ versionId: v.id, stepIndex: i }); }}
                          >
                            {s.status === 'In Progress' ? 'Action this step' : 'Awaiting previous step'}
                          </Button>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            ))}
            <Alert severity="info">
              <AlertTitle>Publication replaces the current version</AlertTitle>
              When every approval step is complete the version is published, becomes the current approved CIM, and the
              previously current version is automatically marked Obsolete and restricted from use.
            </Alert>
          </Stack>
        )}

        {tab === 2 && (
          <Stack gap={2}>
            {failing.length > 0 && (
              <Alert severity="error">
                <AlertTitle>{failing.length} asset(s) failing CIM compliance</AlertTitle>
                These assets cannot be approved until the failing checks are resolved.
              </Alert>
            )}
            {assets.map((a) => {
              const failed = a.checks.filter((c) => !c.passed);
              return (
                <Box key={a.id} sx={{
                  p: 2, borderRadius: 2.5, border: '1px solid',
                  borderColor: failed.length ? alpha('#DC2626', .35) : 'divider',
                  bgcolor: failed.length ? alpha('#DC2626', .02) : 'transparent',
                }}>
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1">{a.name}</Typography>
                      <Typography variant="caption">
                        {a.assetType} · {a.templateUsed} · CIM {a.cimVersion} ·
                        {' '}campaign {store.campaigns.find((c) => c.id === a.campaignId)?.name ?? a.campaignId} ·
                        {' '}submitted {fmtDateTime(a.submittedAt)} by {store.users.find((u) => u.id === a.submittedById)?.name}
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center">
                      <Chip
                        size="small"
                        label={`${a.checks.length - failed.length}/${a.checks.length} checks passed`}
                        sx={{ bgcolor: alpha(failed.length ? '#DC2626' : '#059669', .12), color: failed.length ? '#DC2626' : '#059669', fontWeight: 700 }}
                      />
                      <StatusChip value={a.status} />
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid cols={{ xs: 1, md: 2 }} gap={1.25}>
                    {a.checks.map((c) => (
                      <Stack key={c.id} direction="row" gap={1.25} alignItems="flex-start">
                        {c.passed
                          ? <CheckCircleIcon sx={{ fontSize: 17, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                          : <CancelIcon sx={{ fontSize: 17, color: 'error.main', mt: '2px', flexShrink: 0 }} />}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: c.passed ? 500 : 700, color: c.passed ? 'text.primary' : 'error.main' }}>
                            {c.label}
                          </Typography>
                          <Typography variant="caption">{c.detail}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="caption">
                      Reviewer: {store.users.find((u) => u.id === a.reviewerId)?.name ?? 'Not assigned — mandatory step incomplete'}
                    </Typography>
                    <Button size="small" onClick={() => navigate(`/campaigns/${a.campaignId}`)}>Open campaign</Button>
                  </Stack>
                </Box>
              );
            })}
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                <strong>DEMO / SIMULATED compliance engine.</strong> The checks shown are rule-based simulations of the
                brand governance controls: the demonstration does not perform image analysis on the artwork. In a
                production deployment the same checklist is applied by the reviewer with automated pre-checks where
                artwork metadata permits.
              </Typography>
            </Alert>
          </Stack>
        )}
      </SectionCard>

      {/* Approval step dialog */}
      <Dialog open={!!review} onClose={() => setReview(null)} fullWidth maxWidth="sm">
        <DialogTitle>Action approval step</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            {review && (
              <Alert severity="info" icon={false}>
                <Typography variant="body2">
                  <strong>
                    {store.cimVersions.find((v) => v.id === review.versionId)?.approvalSteps[review.stepIndex].step}
                  </strong>{' '}
                  for {store.cimVersions.find((v) => v.id === review.versionId)?.version}
                </Typography>
              </Alert>
            )}
            <TextField
              multiline minRows={3} label="Review comment" value={comment}
              onChange={(e) => setComment(e.target.value)} fullWidth
              helperText="Recorded against the approval step and in the audit trail."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReview(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              if (!review) return;
              await api.advanceCimStep(review.versionId, review.stepIndex, false, comment || 'Returned for amendment.');
              setReview(null);
              toast({ message: 'Step rejected', severity: 'info', detail: 'The version has returned to draft and the owner has been notified.' });
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!review) return;
              await api.advanceCimStep(review.versionId, review.stepIndex, true, comment || 'Approved.');
              setReview(null);
              toast({ message: 'Step approved', severity: 'success', detail: 'The workflow advanced to the next approval step and an audit event was written.' });
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset submission dialog */}
      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Submit marketing asset for CIM compliance</DialogTitle>
        <DialogContent dividers>
          <Grid cols={{ xs: 1, md: 2 }} gap={3}>
            <Stack gap={2}>
              <TextField label="Asset name" value={assetForm.name} onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))} fullWidth required />
              <TextField select label="Campaign" value={assetForm.campaignId} onChange={(e) => setAssetForm((f) => ({ ...f, campaignId: e.target.value }))} fullWidth required>
                {store.campaigns.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField select label="Asset type" value={assetForm.assetType} onChange={(e) => setAssetForm((f) => ({ ...f, assetType: e.target.value }))} fullWidth>
                {ASSET_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField select label="Template used" value={assetForm.template} onChange={(e) => setAssetForm((f) => ({ ...f, template: e.target.value }))} fullWidth>
                {TEMPLATES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="CIM version" value={current?.version ?? ''} disabled fullWidth
                helperText="Assets are always checked against the current approved version." />
              <TextField
                select label="Marketing Communications Specialist (reviewer)" value={assetForm.reviewerId}
                onChange={(e) => setAssetForm((f) => ({ ...f, reviewerId: e.target.value }))} fullWidth
                helperText="Mandatory — an asset without an assigned reviewer fails compliance."
              >
                <MenuItem value="">Not assigned</MenuItem>
                {store.users.filter((u) => u.role === 'marketing_user').map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name} — {u.jobTitle}</MenuItem>
                ))}
              </TextField>
              <Divider />
              <Typography variant="overline" color="text.secondary">Asset attributes (drive the compliance check)</Typography>
              {([
                ['logoCorrect', 'Approved logo lockup used'],
                ['coloursCorrect', 'Approved colour palette used'],
                ['disclaimer', 'Mandatory disclaimer included'],
                ['wording', 'Approved product naming used'],
              ] as const).map(([key, label]) => (
                <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{label}</Typography>
                  <Button
                    size="small"
                    variant={assetForm[key] ? 'contained' : 'outlined'}
                    color={assetForm[key] ? 'success' : 'error'}
                    onClick={() => setAssetForm((f) => ({ ...f, [key]: !f[key] }))}
                  >
                    {assetForm[key] ? 'Yes' : 'No'}
                  </Button>
                </Stack>
              ))}
            </Stack>

            <Box>
              <Typography variant="overline" color="text.secondary">Live compliance check</Typography>
              <Stack gap={1.25} sx={{ mt: 1 }}>
                {previewChecks.map((c) => (
                  <Stack key={c.id} direction="row" gap={1.25} alignItems="flex-start">
                    {c.passed
                      ? <CheckCircleIcon sx={{ fontSize: 17, color: 'success.main', mt: '2px', flexShrink: 0 }} />
                      : <CancelIcon sx={{ fontSize: 17, color: 'error.main', mt: '2px', flexShrink: 0 }} />}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: c.passed ? 500 : 700, color: c.passed ? 'text.primary' : 'error.main' }}>
                        {c.label}
                      </Typography>
                      <Typography variant="caption">{c.detail}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Alert severity={previewFailing.length ? 'error' : 'success'}>
                <AlertTitle sx={{ fontSize: '0.85rem' }}>
                  {previewFailing.length ? `${previewFailing.length} check(s) failing` : 'All checks passing'}
                </AlertTitle>
                <Typography variant="body2">
                  {previewFailing.length
                    ? 'This asset will be submitted for compliance review but cannot be approved until the failing checks are resolved.'
                    : 'This asset can proceed to Marketing Communications Specialist approval.'}
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSubmitOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={!assetForm.name || !assetForm.campaignId}
            onClick={async () => {
              await api.submitMarketingAsset({
                name: assetForm.name, campaignId: assetForm.campaignId, assetType: assetForm.assetType,
                templateUsed: assetForm.template, cimVersion: current?.version ?? 'v4.2',
                submittedById: store.session.userId, submittedAt: new Date().toISOString(),
                status: previewFailing.length ? 'Compliance Review' : 'Approved',
                checks: previewChecks, reviewerId: assetForm.reviewerId || null,
              });
              setSubmitOpen(false);
              setTab(2);
              toast({
                message: previewFailing.length ? 'Asset submitted — compliance failures recorded' : 'Asset submitted and approved',
                severity: previewFailing.length ? 'warning' : 'success',
                detail: previewFailing.length
                  ? `${previewFailing.length} compliance check(s) failed against CIM ${current?.version}. The reviewer has been notified.`
                  : `All compliance checks passed against CIM ${current?.version}.`,
              });
            }}
          >
            Submit asset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Cim;
