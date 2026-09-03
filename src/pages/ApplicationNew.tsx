import * as React from 'react';
import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import { DemoScenarioPanel, Grid, PageHeader, SectionCard, Stack } from '../components';
import { toast } from '../hooks';
import { APPLICATION_FORMS, APPLICATION_FORM_TYPES } from '../data/applications';

export function ApplicationNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const [form, setForm] = React.useState({
    customerId: params.get('customer') ?? '',
    opportunityId: params.get('opportunity') ?? '',
    formType: '',
  });
  const [attempted, setAttempted] = React.useState(false);

  const opportunities = store.opportunities.filter(
    (o) => !o.closedDate && (!form.customerId || o.customerId === form.customerId),
  );
  const fields = form.formType ? APPLICATION_FORMS[form.formType] ?? [] : [];
  const sections = Array.from(new Set(fields.map((f) => f.section)));

  const errors: Record<string, string> = {};
  if (!form.customerId) errors.customerId = 'Select the customer this application is for.';
  if (!form.formType) errors.formType = 'Select the application form to complete.';

  return (
    <Box>
      <PageHeader
        title="Create a digital application"
        subtitle="Select the customer, link the opportunity and choose the application form. The application inherits both links automatically."
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Applications', to: '/applications' },
          { label: 'New application' },
        ]}
        actions={<Button variant="outlined" onClick={() => navigate('/applications')}>Cancel</Button>}
      />

      <DemoScenarioPanel
        scenario="A Business Development Officer starts a cover application on behalf of an exporter, linked to the opportunity already in the pipeline."
        evidence={[
          'Customer and opportunity links are inherited by the application and every document uploaded against it',
          'Forms are defined as configurable field metadata and rendered generically',
          'Drafts auto-save and can be completed on desktop, tablet or phone',
        ]}
        requirements={[29, 44, 46, 50]}
      />

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' } }}>
          <SectionCard title="Application setup">
            <Stack gap={2.5}>
              <TextField
                select required label="Customer" value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value, opportunityId: '' }))}
                error={attempted && !!errors.customerId} helperText={attempted ? errors.customerId : undefined}
                fullWidth
              >
                {store.customers.filter((c) => c.customerType !== 'Internal').map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.organisation}</MenuItem>
                ))}
              </TextField>
              <TextField
                select label="Linked opportunity" value={form.opportunityId}
                onChange={(e) => setForm((f) => ({ ...f, opportunityId: e.target.value }))}
                helperText="Linking the opportunity carries the transaction reference onto every document uploaded against this application."
                fullWidth disabled={!form.customerId}
              >
                <MenuItem value="">No linked opportunity</MenuItem>
                {opportunities.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.reference} — {o.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select required label="Application form" value={form.formType}
                onChange={(e) => setForm((f) => ({ ...f, formType: e.target.value }))}
                error={attempted && !!errors.formType} helperText={attempted ? errors.formType : undefined}
                fullWidth
              >
                {APPLICATION_FORM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>

              {form.formType && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>{form.formType}</strong> contains {fields.length} fields across {sections.length} sections
                    ({sections.join(', ')}), of which {fields.filter((f) => f.required).length} are mandatory.
                    Field definitions are configuration, not code.
                  </Typography>
                </Alert>
              )}

              <Stack direction="row" justifyContent="flex-end" gap={1}>
                <Button onClick={() => navigate('/applications')}>Cancel</Button>
                <Button
                  variant="contained" endIcon={<ArrowForwardIcon />}
                  onClick={async () => {
                    setAttempted(true);
                    if (Object.keys(errors).length > 0) {
                      toast({ message: 'Cannot create the application', severity: 'error', detail: Object.values(errors).join(' ') });
                      return;
                    }
                    const customer = store.customers.find((c) => c.id === form.customerId);
                    const app = await api.createApplication({
                      customerId: form.customerId,
                      opportunityId: form.opportunityId || null,
                      formType: form.formType,
                      values: {
                        legalName: customer?.organisation ?? '',
                        registrationNo: customer?.registrationNo ?? '',
                      },
                    });
                    toast({
                      message: `Application ${app.reference} created`,
                      severity: 'success',
                      detail: 'The draft auto-saves as you complete it. Nothing is submitted to ECIC until you sign and submit.',
                    });
                    navigate(`/applications/${app.id}`);
                  }}
                >
                  Create and open form
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        </Box>

        <SectionCard title="Form preview" subtitle={form.formType || 'Select a form to preview its structure'}>
          {sections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Choose an application form to see the sections and mandatory fields it contains.
            </Typography>
          ) : (
            <Stack gap={2}>
              {sections.map((section) => (
                <Box key={section}>
                  <Typography variant="overline" color="text.secondary">{section}</Typography>
                  <Stack gap={0.5} sx={{ mt: 0.5 }}>
                    {fields.filter((f) => f.section === section).map((f) => (
                      <Typography key={f.id} variant="body2">
                        • {f.label}{f.required && <Typography component="span" color="error"> *</Typography>}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Grid>
    </Box>
  );
}

export default ApplicationNew;
