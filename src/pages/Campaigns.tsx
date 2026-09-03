import * as React from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  MenuItem, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import {
  DataTable, DemoScenarioPanel, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import type { Column } from '../components';
import { toast } from '../hooks';
import { fmtDate, isoDate } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';
import { campaignPerformance } from '../utils/analytics';
import type { Campaign } from '../types';

export function Campaigns() {
  const navigate = useNavigate();
  const store = useStore();
  const role = ROLES[store.session.role];
  const canCreate = role.permissions.includes('campaign.create');
  const [filters, setFilters] = React.useState({ status: 'all', type: 'all', approval: 'all', owner: 'all' });
  const [wizard, setWizard] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [attempted, setAttempted] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({
    templateId: '', name: '', objective: '', kpi: '', segmentation: '',
  });

  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));
  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const template = store.configuration.campaignTemplates.find((t) => t.id === form.templateId);

  const applyTemplate = (templateId: string) => {
    const t = store.configuration.campaignTemplates.find((x) => x.id === templateId);
    if (!t) { setForm((f) => ({ ...f, templateId })); return; }
    const seeded: Record<string, string> = { templateId };
    t.fields.forEach((f) => {
      if (f.defaultValue) seeded[f.id] = f.defaultValue;
      else if (t.defaults[f.id] != null) seeded[f.id] = String(t.defaults[f.id]);
      else if (f.type === 'date') seeded[f.id] = f.id === 'endDate' ? isoDate(60) : isoDate(7);
      else seeded[f.id] = '';
    });
    setForm((f) => ({ ...f, ...seeded }));
    toast({
      message: `Template "${t.name}" applied`,
      severity: 'info',
      detail: `${t.fields.filter((x) => x.required).length} mandatory field(s) defined by the template, ${Object.keys(t.defaults).length} pre-populated with default values.`,
    });
  };

  const templateErrors = template
    ? template.fields.filter((f) => f.required && !form[f.id]).map((f) => f.label)
    : [];
  const nameError = attempted && !form.name ? 'A campaign name is required.' : undefined;

  const filtered = store.campaigns.filter((c) =>
    (filters.status === 'all' || c.status === filters.status)
    && (filters.type === 'all' || c.type === filters.type)
    && (filters.approval === 'all' || c.approvalStatus === filters.approval)
    && (filters.owner === 'all' || c.ownerId === filters.owner));

  const perf = campaignPerformance(store.campaigns, store.leads, store.opportunities);

  const columns: Column<Campaign>[] = [
    {
      id: 'name', label: 'Campaign', sortValue: (r) => r.name,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 340 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {r.reference} · {r.type} · {r.targetAudience}
          </Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 115, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    { id: 'approval', label: 'Approval', width: 150, sortValue: (r) => r.approvalStatus, render: (r) => <StatusChip value={r.approvalStatus} /> },
    {
      id: 'dates', label: 'Period', hideOn: 'md', sortValue: (r) => r.startDate,
      render: (r) => <Typography variant="body2" noWrap>{fmtDate(r.startDate)} – {fmtDate(r.endDate)}</Typography>,
    },
    {
      id: 'budget', label: 'Budget / spend', align: 'right', width: 145, sortValue: (r) => r.budget,
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.budget, true)}</Typography>
          <Typography variant="caption">spent {zar(r.actualSpend, true)}</Typography>
        </Box>
      ),
    },
    {
      id: 'leads', label: 'Leads / qualified', align: 'center', width: 140, hideOn: 'md',
      sortValue: (r) => r.leadsGenerated,
      render: (r) => (
        <Typography variant="body2">
          {num(r.leadsGenerated)} <Typography component="span" variant="caption">/ {num(r.qualifiedLeads)}</Typography>
        </Typography>
      ),
    },
    {
      id: 'roi', label: 'ROI', align: 'right', width: 105,
      sortValue: (r) => perf.find((p) => p.campaign.id === r.id)?.roi ?? 0,
      render: (r) => {
        const p = perf.find((x) => x.campaign.id === r.id);
        if (!p || p.spend === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
        if (!p.started) return <Typography variant="caption" color="text.disabled">Not started</Typography>;
        return (
          <Chip
            size="small" label={pct(p.roi)}
            sx={{ bgcolor: alpha(p.roi >= 300 ? '#059669' : p.roi >= 120 ? '#D97706' : '#DC2626', .12), color: p.roi >= 300 ? '#059669' : p.roi >= 120 ? '#D97706' : '#DC2626', fontWeight: 700 }}
          />
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Marketing Campaigns"
        subtitle="Campaign records built from pre-configured templates with mandatory field validation, approval routing and Corporate Identity Manual alignment."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Campaigns' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Campaigns', filtered.map((c) => {
                const p = perf.find((x) => x.campaign.id === c.id);
                return {
                  'Campaign ID': c.reference, Name: c.name, Type: c.type, Objective: c.objective,
                  KPI: c.kpi, 'Target audience': c.targetAudience, Segmentation: c.segmentation,
                  'Budget (ZAR)': c.budget, 'Actual spend (ZAR)': c.actualSpend,
                  'Start date': c.startDate, 'End date': c.endDate,
                  'Expected revenue (ZAR)': c.expectedRevenue, 'Forecast revenue (ZAR)': c.forecastRevenue,
                  'Actual revenue (ZAR)': c.actualRevenue, Status: c.status,
                  'Approval status': c.approvalStatus,
                  Owner: store.users.find((u) => u.id === c.ownerId)?.name ?? '',
                  'CIM version': c.cimVersion, 'Leads generated': c.leadsGenerated,
                  'Qualified leads': c.qualifiedLeads, 'Opportunities created': c.opportunitiesCreated,
                  'ROI %': p ? Math.round(p.roi) : 0,
                  Recommendation: p?.recommendation ?? '',
                };
              }))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} disabled={!canCreate} onClick={() => { setWizard(true); setStep(0); setAttempted(false); setForm({ templateId: '', name: '', objective: '', kpi: '', segmentation: '' }); }}>
              New campaign
            </Button>
          </>
        }
      />

      <DemoScenarioPanel
        scenario="A Marketing User creates a new exhibition campaign from a pre-configured template. The template pre-populates budget, audience and expected ROI, and enforces the mandatory fields on save."
        evidence={[
          'Three pre-configured campaign templates: exhibition, digital and product launch',
          'Template pre-populates budget, target, expected ROI, audience and product',
          'Mandatory campaign data validated with inline errors before save',
          'Approval routing to the Marketing Communications Specialist',
          'Templates are maintained in the Configuration Centre without development',
        ]}
        requirements={[62, 63, 66, 67]}
        next="Open campaign performance to see ROI analysis"
        nextTo="/campaign-performance"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Campaigns" value={num(store.campaigns.length)} colour="#0B2545" />
        <KpiCard dense label="Active" value={num(store.campaigns.filter((c) => c.status === 'Active').length)} colour="#059669" onClick={() => set('status', 'Active')} />
        <KpiCard dense label="Planned" value={num(store.campaigns.filter((c) => c.status === 'Planned').length)} colour="#2563EB" onClick={() => set('status', 'Planned')} />
        <KpiCard dense label="Awaiting approval" value={num(store.campaigns.filter((c) => c.approvalStatus === 'Pending Approval').length)} colour="#D97706" onClick={() => set('approval', 'Pending Approval')} />
        <KpiCard dense label="Total budget" value={zar(store.campaigns.reduce((s, c) => s + c.budget, 0), true)} sub={`spent ${zar(store.campaigns.reduce((s, c) => s + c.actualSpend, 0), true)}`} colour="#C9A227" />
        <KpiCard dense label="Attributed revenue" value={zar(store.campaigns.reduce((s, c) => s + c.actualRevenue, 0), true)} colour="#0E7C7B" />
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...['Planned', 'Active', 'Completed', 'Cancelled'].map((s) => ({ value: s, label: s }))] },
          { id: 'type', label: 'Type', options: [{ value: 'all', label: 'All types' }, ...['Exhibition', 'Digital', 'Product Launch', 'Roadshow', 'Webinar', 'Trade Mission'].map((t) => ({ value: t, label: t }))], width: 170 },
          { id: 'approval', label: 'Approval', options: [{ value: 'all', label: 'All' }, ...['Draft', 'Pending Approval', 'Approved', 'Rejected'].map((a) => ({ value: a, label: a }))], width: 170 },
          { id: 'owner', label: 'Owner', options: [{ value: 'all', label: 'All owners' }, ...store.users.filter((u) => u.role === 'marketing_user').map((u) => ({ value: u.id, label: u.name }))], width: 190 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ status: 'all', type: 'all', approval: 'all', owner: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search campaign name, reference or objective…"
        searchFields={(r) => `${r.name} ${r.reference} ${r.objective} ${r.type} ${r.targetAudience}`}
        defaultSort={{ id: 'dates', dir: 'desc' }}
        onRowClick={(r) => navigate(`/campaigns/${r.id}`)}
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Campaign templates"
          subtitle="Business administrators maintain these templates in the Configuration Centre — adding a mandatory field changes what is enforced on the next campaign created"
          action={<Button size="small" onClick={() => navigate('/configuration?tab=campaigns')}>Configure templates</Button>}
        >
          <Grid cols={{ xs: 1, md: 3 }} gap={2}>
            {store.configuration.campaignTemplates.map((t) => (
              <Box key={t.id} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{t.name}</Typography>
                  <Chip size="small" label={t.type} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{t.description}</Typography>
                <Divider sx={{ my: 1.25 }} />
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {t.fields.length} fields · {t.fields.filter((f) => f.required).length} mandatory ·
                  {t.requiresApproval ? ' approval required' : ' no approval required'} · CIM {t.cimVersionRequired}
                </Typography>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      </Box>

      {/* Campaign creation wizard */}
      <Dialog open={wizard} onClose={() => setWizard(false)} fullWidth maxWidth="md">
        <DialogTitle>Create campaign</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            {['Select template', 'Campaign details', 'Review'].map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>

          {step === 0 && (
            <Stack gap={2}>
              <Alert severity="info">
                Selecting a template pre-populates budget, audience, expected ROI and product, and defines which
                fields are mandatory for this campaign type.
              </Alert>
              {store.configuration.campaignTemplates.map((t) => (
                <Box
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  sx={{
                    p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                    border: '2px solid', borderColor: form.templateId === t.id ? 'secondary.main' : 'divider',
                    bgcolor: form.templateId === t.id ? alpha('#0E7C7B', .04) : 'transparent',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{t.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{t.description}</Typography>
                    </Box>
                    <Chip size="small" label={t.type} />
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Pre-populates: {Object.keys(t.defaults).join(', ')} · Mandatory: {t.fields.filter((f) => f.required).map((f) => f.label).join(', ')}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {step === 1 && template && (
            <Stack gap={2.5}>
              <TextField
                required label="Campaign name" value={form.name} onChange={(e) => setField('name', e.target.value)}
                error={!!nameError} helperText={nameError} fullWidth
              />
              <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
                {template.fields.map((f) => {
                  const error = attempted && f.required && !form[f.id];
                  if (f.type === 'select') {
                    return (
                      <TextField
                        key={f.id} select required={f.required} label={f.label} value={form[f.id] ?? ''}
                        onChange={(e) => setField(f.id, e.target.value)}
                        error={error} helperText={error ? `${f.label} is required by this template.` : undefined}
                      >
                        {(f.options ?? []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                      </TextField>
                    );
                  }
                  return (
                    <TextField
                      key={f.id} required={f.required} label={f.label}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      multiline={f.type === 'textarea'} minRows={f.type === 'textarea' ? 2 : undefined}
                      value={form[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)}
                      error={error} helperText={error ? `${f.label} is required by this template.` : undefined}
                      slotProps={f.type === 'date' ? { inputLabel: { shrink: true } } : undefined}
                    />
                  );
                })}
              </Grid>
              <Divider />
              <TextField label="Objective" multiline minRows={2} value={form.objective} onChange={(e) => setField('objective', e.target.value)} fullWidth />
              <TextField label="KPI" value={form.kpi} onChange={(e) => setField('kpi', e.target.value)} fullWidth
                helperText="For example: 150 leads, 40% qualification rate, ROI > 350%" />
            </Stack>
          )}

          {step === 2 && template && (
            <Stack gap={2}>
              {templateErrors.length > 0 || !form.name ? (
                <Alert severity="error">
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>This campaign cannot be saved</Typography>
                  {!form.name && <Typography variant="body2">• A campaign name is required.</Typography>}
                  {templateErrors.map((e) => <Typography key={e} variant="body2">• {e} is required by the {template.name} template.</Typography>)}
                </Alert>
              ) : (
                <Alert severity="success">
                  All mandatory template fields are complete.{' '}
                  {template.requiresApproval && 'On save the campaign enters Pending Approval and routes to the Marketing Communications Specialist.'}
                </Alert>
              )}
              <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
                <Box><Typography variant="overline" color="text.secondary">Template</Typography><Typography variant="body2">{template.name}</Typography></Box>
                <Box><Typography variant="overline" color="text.secondary">Name</Typography><Typography variant="body2">{form.name || '—'}</Typography></Box>
                {template.fields.map((f) => (
                  <Box key={f.id}>
                    <Typography variant="overline" color="text.secondary">{f.label}</Typography>
                    <Typography variant="body2">{form[f.id] || '—'}</Typography>
                  </Box>
                ))}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWizard(false)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 2 ? (
            <Button variant="contained" disabled={step === 0 && !form.templateId} onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={async () => {
                setAttempted(true);
                if (!form.name || templateErrors.length > 0) {
                  toast({ message: 'Mandatory campaign data missing', severity: 'error', detail: 'The template defines fields that must be completed before the campaign can be saved.' });
                  setStep(1);
                  return;
                }
                const c = await api.createCampaign({
                  name: form.name, type: template!.type, objective: form.objective, kpi: form.kpi,
                  targetAudience: form.target ?? '', segmentation: form.audience ?? '',
                  budget: Number(form.budget) || 0,
                  startDate: form.startDate, endDate: form.endDate,
                  expectedRevenue: (Number(form.budget) || 0) * ((Number(form.expectedRoi) || 0) / 100),
                  templateId: template!.id,
                  extraFields: Object.fromEntries(template!.fields.map((f) => [f.id, form[f.id] ?? ''])),
                });
                setWizard(false);
                toast({
                  message: `Campaign ${c.reference} created`,
                  severity: 'success',
                  detail: c.approvalStatus === 'Pending Approval'
                    ? 'The campaign routed to the Marketing Communications Specialist for approval.'
                    : 'The campaign was saved as a draft.',
                  action: { label: 'Open campaign', to: `/campaigns/${c.id}` },
                });
                navigate(`/campaigns/${c.id}`);
              }}
            >
              Create campaign
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Campaigns;
