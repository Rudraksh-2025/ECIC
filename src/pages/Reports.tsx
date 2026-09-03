import * as React from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, MenuItem, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import TuneIcon from '@mui/icons-material/Tune';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import {
  DemoScenarioPanel, Grid, KpiCard, PageHeader, SectionCard, Stack,
} from '../components';
import { toast } from '../hooks';
import { fmtDateTime } from '../utils/dates';
import { num } from '../utils/format';
import { DATASET_FIELDS, REPORT_CATALOGUE, REPORT_CATEGORIES } from './reports/catalogue';

export function Reports() {
  const navigate = useNavigate();
  const store = useStore();
  const [builder, setBuilder] = React.useState(false);
  const [config, setConfig] = React.useState({
    name: '', dataset: 'complaints', fields: [] as string[], groupBy: '', sortBy: '',
  });

  const featured = REPORT_CATALOGUE.filter((r) => r.featured);
  const fields = DATASET_FIELDS[config.dataset] ?? [];

  const openBuilder = () => {
    setConfig({
      name: '', dataset: 'complaints',
      fields: (DATASET_FIELDS.complaints ?? []).slice(0, 6).map((f) => f.id),
      groupBy: 'businessUnit', sortBy: 'loggedDate',
    });
    setBuilder(true);
  };

  return (
    <Box>
      <PageHeader
        title="Report Centre"
        subtitle="Standard ECIC reports across eight categories, plus a no-code report builder for business users to define, save and export their own reports."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Reports' }]}
        actions={<Button variant="contained" startIcon={<TuneIcon />} onClick={openBuilder}>Customise report</Button>}
      />

      <DemoScenarioPanel
        scenario="A manager needs SLA performance for the quarter, then wants a report ECIC does not ship as standard — so they build it themselves, save it and export it."
        evidence={[
          'Eight report categories covering leads, complaints, opportunities, campaigns, SLA, customers, activities and audit',
          'Every report has KPI cards, charts, filters, grouping, sorting, search and a generation timestamp',
          'Customise Report lets a business user pick fields, grouping, filters and sort with no development',
          'Saved report configurations persist and reopen',
          'Excel-compatible export and a print-ready view, both carrying the filter context and timestamp',
        ]}
        requirements={[23, 40, 42, 43, 75, 76]}
        next="Open the Complaint SLA Performance report"
        nextTo="/reports/RPT-C1"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Standard reports" value={num(REPORT_CATALOGUE.length)} colour="#0B2545" />
        <KpiCard dense label="Categories" value={num(REPORT_CATEGORIES.length)} colour="#2563EB" />
        <KpiCard dense label="Saved reports" value={num(store.savedReports.length)} sub="Built by users" colour="#0E7C7B" />
        <KpiCard dense label="Records available" value={num(store.complaints.length + store.leads.length + store.opportunities.length + store.customers.length)} colour="#7C3AED" />
        <KpiCard dense label="Audit events" value={num(store.auditEvents.length)} colour="#D97706" />
        <KpiCard dense label="Power BI datasets" value="1" sub="Published outbound" colour="#C9A227" onClick={() => navigate('/integrations')} />
      </Grid>

      <SectionCard title="One-click demonstration reports" subtitle="The reports most often requested in a bid demonstration" sx={{ mb: 2.5 }}>
        <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
          {featured.map((r) => (
            <Box
              key={r.id}
              onClick={() => navigate(`/reports/${r.id}`)}
              sx={{
                p: 2, borderRadius: 2.5, cursor: 'pointer',
                border: '1px solid', borderColor: 'divider',
                transition: 'all .15s',
                '&:hover': { borderColor: 'secondary.main', transform: 'translateY(-2px)', boxShadow: '0 10px 26px -18px rgba(11,37,69,.4)' },
              }}
            >
              <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 1 }}>
                <StarIcon sx={{ fontSize: 16, color: '#C9A227' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>{r.category}</Typography>
              </Stack>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>{r.name}</Typography>
              <Typography variant="body2" color="text.secondary">{r.description}</Typography>
            </Box>
          ))}
        </Grid>
      </SectionCard>

      {store.savedReports.length > 0 && (
        <SectionCard title="Saved reports" subtitle="Report configurations created by business users without development" sx={{ mb: 2.5 }}>
          <Stack gap={1}>
            {store.savedReports.map((r) => (
              <Box
                key={r.id}
                sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                  <Box
                    sx={{ minWidth: 0, cursor: 'pointer', flex: 1 }}
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {r.dataset} · {r.fields.length} fields · grouped by {r.groupBy || 'nothing'} ·
                      {' '}saved by {r.createdBy} on {fmtDateTime(r.createdAt)}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={0.5}>
                    <Button size="small" onClick={() => navigate(`/reports/${r.id}`)}>Open</Button>
                    <Button
                      size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        api.deleteReport(r.id);
                        toast({ message: 'Saved report deleted', severity: 'info', detail: 'The configuration was removed and an audit event written.' });
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      )}

      {REPORT_CATEGORIES.map((category) => (
        <SectionCard key={category} title={category} sx={{ mb: 2.5 }}>
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
            {REPORT_CATALOGUE.filter((r) => r.category === category).map((r) => (
              <Box
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                sx={{
                  p: 1.75, borderRadius: 2.5, cursor: 'pointer', bgcolor: 'surface.subtle',
                  border: '1px solid transparent',
                  '&:hover': { borderColor: 'secondary.main', bgcolor: alpha('#0E7C7B', .04) },
                }}
              >
                <Stack direction="row" gap={1.25} alignItems="flex-start">
                  <AssessmentIcon sx={{ fontSize: 20, color: 'primary.main', mt: '2px', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{r.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{r.description}</Typography>
                    <Chip size="small" label={r.dataset} sx={{ mt: 1, height: 19, fontSize: '0.62rem' }} />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      ))}

      {/* Report builder */}
      <Dialog open={builder} onClose={() => setBuilder(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Customise report
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 400 }}>
            Select the data, the fields, the grouping and the sort order. No development is required and no deployment
            is involved — the configuration is saved to your report list.
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack gap={2.5}>
            <TextField
              required label="Report name" value={config.name}
              onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} fullWidth
              placeholder="e.g. Complaints by Business Unit — current quarter"
            />
            <TextField
              select label="Data set" value={config.dataset} fullWidth
              onChange={(e) => {
                const dataset = e.target.value;
                setConfig((c) => ({
                  ...c, dataset,
                  fields: (DATASET_FIELDS[dataset] ?? []).slice(0, 6).map((f) => f.id),
                  groupBy: (DATASET_FIELDS[dataset] ?? [])[2]?.id ?? '',
                  sortBy: (DATASET_FIELDS[dataset] ?? [])[0]?.id ?? '',
                }));
              }}
            >
              {Object.keys(DATASET_FIELDS).map((d) => (
                <MenuItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</MenuItem>
              ))}
            </TextField>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Fields to include ({config.fields.length} of {fields.length} selected)
              </Typography>
              <Grid cols={{ xs: 2, sm: 3 }} gap={0.5} sx={{ mt: 0.5 }}>
                {fields.map((f) => (
                  <FormControlLabel
                    key={f.id}
                    control={
                      <Checkbox
                        size="small" checked={config.fields.includes(f.id)}
                        onChange={(e) => setConfig((c) => ({
                          ...c,
                          fields: e.target.checked ? [...c.fields, f.id] : c.fields.filter((x) => x !== f.id),
                        }))}
                      />
                    }
                    label={<Typography variant="body2">{f.label}</Typography>}
                  />
                ))}
              </Grid>
            </Box>
            <Grid cols={{ xs: 1, sm: 2 }} gap={2}>
              <TextField select label="Group by" value={config.groupBy} onChange={(e) => setConfig((c) => ({ ...c, groupBy: e.target.value }))}>
                <MenuItem value="">No grouping</MenuItem>
                {fields.map((f) => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
              </TextField>
              <TextField select label="Sort by" value={config.sortBy} onChange={(e) => setConfig((c) => ({ ...c, sortBy: e.target.value }))}>
                <MenuItem value="">No sorting</MenuItem>
                {fields.map((f) => <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Alert severity="info">
              Filters, date ranges and search remain available on the generated report. Saved reports appear in your
              report list and can be exported to Excel or printed as a PDF-ready view.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBuilder(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!config.name || config.fields.length === 0}
            onClick={() => {
              const saved = api.saveReport({
                name: config.name, dataset: config.dataset, fields: config.fields,
                groupBy: config.groupBy, filters: {}, sortBy: config.sortBy,
              });
              setBuilder(false);
              toast({
                message: 'Report configuration saved',
                severity: 'success',
                detail: `"${saved.name}" is now available in your report list. No code was written and nothing was deployed.`,
              });
              navigate(`/reports/${saved.id}`);
            }}
          >
            Save and run report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Reports;
