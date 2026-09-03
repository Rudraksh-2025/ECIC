import * as React from 'react';
import {
  Alert, Box, Button, Chip, Divider, Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import {
  ActivityTimeline, EmptyState, Grid, KpiCard, LabelValue, SectionCard, Stack, StatusChip,
} from '../../components';
import { fmtDate, fmtDateTime } from '../../utils/dates';
import { num } from '../../utils/format';
import { APPLICATION_FORMS } from '../../data/applications';

const WORKFLOW = ['Draft', 'Submitted', 'Under Review', 'Awaiting Approval', 'Approved'];

export function PortalApplications() {
  const navigate = useNavigate();
  const store = useStore();
  const [selected, setSelected] = React.useState<string | null>(null);
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const applications = store.applications.filter((a) => a.customerId === customer.id);
  const active = applications.find((a) => a.id === selected);

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.75 }}>My applications</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Track every ECIC cover application, see exactly where it sits in the review process, and view the documents
        and signature held against it.
      </Typography>

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Applications" value={num(applications.length)} colour="#0B2545" />
        <KpiCard dense label="In review" value={num(applications.filter((a) => ['Submitted', 'Under Review', 'Awaiting Approval'].includes(a.status)).length)} colour="#D97706" />
        <KpiCard dense label="Approved" value={num(applications.filter((a) => a.status === 'Approved').length)} colour="#059669" />
        <KpiCard dense label="Drafts" value={num(applications.filter((a) => a.status === 'Draft').length)} colour="#64748B" />
      </Grid>

      {applications.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No applications yet"
            description="Applications are created once your enquiry has been assessed by an ECIC Business Development Officer. Submit an enquiry to get started."
            action={<Button variant="contained" onClick={() => navigate('/portal/enquiries/new')}>Submit an enquiry</Button>}
          />
        </SectionCard>
      ) : active ? (
        <SectionCard
          title={active.formType}
          subtitle={`${active.reference} · created ${fmtDate(active.createdDate)}`}
          action={<Button size="small" onClick={() => setSelected(null)}>Back to all applications</Button>}
        >
          <Stepper
            activeStep={active.status === 'Rejected' ? 4 : WORKFLOW.indexOf(active.status)}
            alternativeLabel sx={{ mb: 3 }}
          >
            {WORKFLOW.map((s, i) => (
              <Step key={s} completed={i < WORKFLOW.indexOf(active.status)}>
                <StepLabel error={active.status === 'Rejected' && i === 4}>
                  {active.status === 'Rejected' && i === 4 ? 'Not approved' : s}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {active.status === 'Approved' && (
            <Alert severity="success" sx={{ mb: 2.5 }}>
              Your cover was approved on {fmtDate(active.decisionDate)}. Policy documentation has been issued.
            </Alert>
          )}
          {active.status === 'Rejected' && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              <strong>This application was not approved.</strong> {active.rejectionReason}
            </Alert>
          )}

          <Grid cols={{ xs: 2, sm: 4 }} gap={2} sx={{ mb: 2.5 }}>
            <LabelValue label="Reference" value={active.reference} mono />
            <LabelValue label="Status" value={<StatusChip value={active.status} />} />
            <LabelValue label="Submitted" value={active.submittedDate ? fmtDate(active.submittedDate) : 'Not yet submitted'} />
            <LabelValue label="Decision" value={active.decisionDate ? fmtDate(active.decisionDate) : 'Pending'} />
          </Grid>

          {active.signature.signed && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                <DrawIcon sx={{ color: 'secondary.main' }} />
                <Typography variant="overline" color="text.secondary">Digital signature</Typography>
              </Stack>
              <Grid cols={{ xs: 1, sm: 3 }} gap={2} sx={{ mb: 2.5 }}>
                <LabelValue label="Signed by" value={active.signature.signerName} />
                <LabelValue label="Signed at" value={fmtDateTime(active.signature.signedAt)} />
                <LabelValue label="Certificate reference" value={active.signature.certificateRef} mono />
              </Grid>
            </>
          )}

          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Information you provided
          </Typography>
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2} sx={{ mb: 2.5 }}>
            {(APPLICATION_FORMS[active.formType] ?? [])
              .filter((f) => active.values[f.id] !== undefined && active.values[f.id] !== '')
              .map((f) => (
                <LabelValue
                  key={f.id} label={f.label}
                  value={typeof active.values[f.id] === 'boolean'
                    ? (active.values[f.id] ? 'Confirmed' : 'Not confirmed')
                    : String(active.values[f.id])}
                />
              ))}
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Application history
          </Typography>
          <ActivityTimeline events={active.timeline} />
        </SectionCard>
      ) : (
        <Stack gap={1.5}>
          {applications.map((a) => {
            const documents = store.documents.filter((d) => d.applicationId === a.id);
            return (
              <SectionCard
                key={a.id}
                sx={{ cursor: 'pointer', '&:hover': { borderColor: 'secondary.main' } }}
              >
                <Box onClick={() => setSelected(a.id)}>
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1">{a.formType}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {a.reference} · created {fmtDate(a.createdDate)}
                        {a.submittedDate && ` · submitted ${fmtDate(a.submittedDate)}`}
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap">
                      {a.signature.signed && <Chip size="small" icon={<DrawIcon />} label="Signed" />}
                      <Chip size="small" label={`${documents.length} document(s)`} />
                      <StatusChip value={a.status} />
                    </Stack>
                  </Stack>
                  <Stepper
                    activeStep={a.status === 'Rejected' ? 4 : WORKFLOW.indexOf(a.status)}
                    alternativeLabel sx={{ mt: 2.5 }}
                  >
                    {WORKFLOW.map((s, i) => (
                      <Step key={s} completed={i < WORKFLOW.indexOf(a.status)}>
                        <StepLabel error={a.status === 'Rejected' && i === 4}>
                          <Typography variant="caption">
                            {a.status === 'Rejected' && i === 4 ? 'Not approved' : s}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              </SectionCard>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default PortalApplications;
