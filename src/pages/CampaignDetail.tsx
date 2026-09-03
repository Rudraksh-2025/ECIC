import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, LinearProgress, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import { EmptyState, Grid, KpiCard, LabelValue, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import { toast } from '../hooks';
import { campaignPerformance } from '../utils/analytics';
import { fmtDate } from '../utils/dates';
import { num, pct, zar } from '../utils/format';

export function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = React.useState(0);
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [comment, setComment] = React.useState('');

  const campaign = store.campaigns.find((c) => c.id === id);
  const role = ROLES[store.session.role];
  const canApprove = role.permissions.includes('campaign.approve') || role.permissions.includes('cim.approve') || store.session.userId === 'USR-009';

  if (!campaign) {
    return (
      <EmptyState
        title="Campaign not found"
        description="This campaign does not exist in the demonstration dataset."
        action={<Button variant="contained" onClick={() => navigate('/campaigns')}>Back to campaigns</Button>}
      />
    );
  }

  const perf = campaignPerformance([campaign], store.leads, store.opportunities)[0];
  const leads = store.leads.filter((l) => l.campaignId === campaign.id);
  const opportunities = store.opportunities.filter((o) => o.campaignId === campaign.id);
  const assets = store.marketingAssets.filter((a) => a.campaignId === campaign.id);
  const event = store.events.find((e) => e.id === campaign.eventId);
  const template = store.configuration.campaignTemplates.find((t) => t.id === campaign.templateId);
  const owner = store.users.find((u) => u.id === campaign.ownerId);

  const spendPct = campaign.budget ? (campaign.actualSpend / campaign.budget) * 100 : 0;

  return (
    <Box>
      <PageHeader
        title={campaign.name}
        subtitle={`${campaign.reference} · ${campaign.type} · ${fmtDate(campaign.startDate)} to ${fmtDate(campaign.endDate)}`}
        breadcrumbs={[
          { label: 'ECIC CRM', to: '/dashboard' },
          { label: 'Campaigns', to: '/campaigns' },
          { label: campaign.name },
        ]}
        chips={
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            <StatusChip value={campaign.status} />
            <StatusChip value={campaign.approvalStatus} />
            <Chip size="small" label={`CIM ${campaign.cimVersion}`} sx={{ bgcolor: alpha('#C9A227', .14), color: '#8A6D0B', fontWeight: 700 }} />
          </Stack>
        }
        actions={
          campaign.approvalStatus === 'Pending Approval' && (
            <Button variant="contained" disabled={!canApprove} onClick={() => setApproveOpen(true)}>
              Review approval
            </Button>
          )
        }
      />

      {campaign.approvalStatus === 'Pending Approval' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Awaiting Marketing Communications Specialist sign-off</AlertTitle>
          This campaign was created from the {template?.name ?? 'campaign'} template, which requires approval before
          activation. The approval step is a separate role from the campaign creator.
        </Alert>
      )}

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Budget" value={zar(campaign.budget, true)} sub={`${pct(spendPct)} spent`} colour="#0B2545" />
        <KpiCard dense label="Actual spend" value={zar(campaign.actualSpend, true)} colour="#D97706" />
        <KpiCard dense label="Leads generated" value={num(perf.leads)} sub={`${num(perf.qualified)} qualified`} colour="#2563EB" />
        <KpiCard dense label="Opportunities" value={num(perf.opportunities)} colour="#7C3AED" />
        <KpiCard dense label="Attributable premium" value={zar(perf.revenue, true)} colour="#059669" />
        <KpiCard
          dense label="ROI"
          value={perf.started ? pct(perf.roi) : 'Not started'}
          sub={perf.recommendation}
          colour={!perf.started ? '#64748B' : perf.roi >= 300 ? '#059669' : perf.roi >= 120 ? '#D97706' : '#DC2626'}
        />
      </Grid>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Overview" />
              <Tab label={`Leads (${leads.length})`} />
              <Tab label={`Opportunities (${opportunities.length})`} />
              <Tab label={`Marketing assets (${assets.length})`} />
            </Tabs>

            {tab === 0 && (
              <Stack gap={2.5}>
                <Grid cols={{ xs: 2, sm: 3 }} gap={2}>
                  <LabelValue label="Campaign ID" value={campaign.reference} mono />
                  <LabelValue label="Type" value={campaign.type} />
                  <LabelValue label="Status" value={<StatusChip value={campaign.status} />} />
                  <LabelValue label="Owner" value={owner?.name} />
                  <LabelValue label="Start date" value={fmtDate(campaign.startDate)} />
                  <LabelValue label="End date" value={fmtDate(campaign.endDate)} />
                  <LabelValue label="Target audience" value={campaign.targetAudience} />
                  <LabelValue label="Segmentation" value={campaign.segmentation} />
                  <LabelValue label="Template" value={template?.name ?? 'Created without a template'} />
                  <LabelValue label="Expected premium revenue" value={zar(campaign.expectedRevenue)} />
                  <LabelValue label="Forecast premium revenue" value={zar(campaign.forecastRevenue)} />
                  <LabelValue label="Actual premium revenue" value={zar(campaign.actualRevenue)} />
                  <LabelValue label="Approval status" value={<StatusChip value={campaign.approvalStatus} />} />
                  <LabelValue label="Approver" value={store.users.find((u) => u.id === campaign.approverId)?.name ?? 'Not yet approved'} />
                  <LabelValue label="Linked event" value={event ? (
                    <RouterLink to={`/events/${event.id}`} style={{ color: '#0E7C7B' }}>{event.name}</RouterLink>
                  ) : '—'} />
                </Grid>
                <Divider />
                <Box>
                  <Typography variant="overline" color="text.secondary">Objective</Typography>
                  <Typography variant="body2" sx={{ mt: 0.4 }}>{campaign.objective}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Key performance indicator</Typography>
                  <Typography variant="body2" sx={{ mt: 0.4 }}>{campaign.kpi}</Typography>
                </Box>
                {Object.keys(campaign.extraFields).length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="overline" color="text.secondary">Template fields</Typography>
                      <Grid cols={{ xs: 2, sm: 3 }} gap={1.5} sx={{ mt: 0.5 }}>
                        {Object.entries(campaign.extraFields).map(([k, v]) => (
                          <LabelValue key={k} label={template?.fields.find((f) => f.id === k)?.label ?? k} value={String(v)} />
                        ))}
                      </Grid>
                    </Box>
                  </>
                )}
              </Stack>
            )}

            {tab === 1 && (
              <Stack gap={1}>
                {leads.length === 0 && <EmptyState title="No attributed leads" description="Leads captured against this campaign will appear here." />}
                {leads.map((l) => (
                  <Box
                    key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                    sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'secondary.main' } }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{l.company}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block' }}>{l.reference} · {l.source} · {l.contactName}</Typography>
                      </Box>
                      <Stack direction="row" gap={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{zar(l.estimatedValue, true)}</Typography>
                        <StatusChip value={l.status} />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 2 && (
              <Stack gap={1}>
                {opportunities.length === 0 && <EmptyState title="No attributed opportunities" description="Opportunities converted from this campaign's leads will appear here." />}
                {opportunities.map((o) => (
                  <Box
                    key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)}
                    sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'secondary.main' } }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{o.name}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block' }}>{o.reference}</Typography>
                      </Box>
                      <Stack direction="row" gap={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{zar(o.estimatedValue, true)}</Typography>
                        <StatusChip value={o.stage} />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 3 && (
              <Stack gap={1.5}>
                {assets.length === 0 && (
                  <EmptyState
                    title="No marketing assets submitted"
                    description="Assets submitted for this campaign are checked against the current Corporate Identity Manual before approval."
                    action={<Button variant="outlined" onClick={() => navigate('/cim')}>Open CIM compliance</Button>}
                  />
                )}
                {assets.map((a) => {
                  const failed = a.checks.filter((c) => !c.passed);
                  return (
                    <Box key={a.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{a.name}</Typography>
                          <Typography variant="caption">{a.assetType} · {a.templateUsed} · CIM {a.cimVersion}</Typography>
                        </Box>
                        <StatusChip value={a.status} />
                      </Stack>
                      <Divider sx={{ my: 1.25 }} />
                      <Stack gap={0.5}>
                        {a.checks.map((c) => (
                          <Stack key={c.id} direction="row" gap={1} alignItems="flex-start">
                            <Box sx={{
                              width: 8, height: 8, borderRadius: '50%', mt: '5px', flexShrink: 0,
                              bgcolor: c.passed ? '#059669' : '#DC2626',
                            }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: c.passed ? 400 : 600, color: c.passed ? 'text.primary' : 'error.main' }}>
                                {c.label}
                              </Typography>
                              <Typography variant="caption">{c.detail}</Typography>
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                      {failed.length > 0 && (
                        <Alert severity="error" sx={{ mt: 1.25 }} icon={false}>
                          <Typography variant="caption">
                            {failed.length} compliance check(s) failing — the asset cannot be approved until these are resolved.
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Budget utilisation">
            <Stack gap={1.5}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2">Spend against budget</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{pct(spendPct)}</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate" value={Math.min(100, spendPct)}
                  sx={{
                    height: 8, bgcolor: alpha('#0B2545', .08),
                    '& .MuiLinearProgress-bar': { bgcolor: spendPct > 100 ? '#DC2626' : spendPct > 85 ? '#D97706' : '#059669' },
                  }}
                />
              </Box>
              <Grid cols={2} gap={1.5}>
                <LabelValue label="Budget" value={zar(campaign.budget)} />
                <LabelValue label="Spent" value={zar(campaign.actualSpend)} />
                <LabelValue label="Remaining" value={zar(Math.max(0, campaign.budget - campaign.actualSpend))} />
                <LabelValue label="Cost per lead" value={perf.leads ? zar(perf.costPerLead) : '—'} />
              </Grid>
            </Stack>
          </SectionCard>

          <SectionCard title="Performance recommendation">
            <Alert
              severity={perf.recommendation === 'Prioritise' ? 'success' : perf.recommendation === 'Monitor' ? 'info' : 'warning'}
            >
              <AlertTitle sx={{ fontSize: '0.9rem' }}>{perf.recommendation}</AlertTitle>
              <Typography variant="body2">{perf.rationale}</Typography>
            </Alert>
            <Divider sx={{ my: 1.75 }} />
            <Grid cols={2} gap={1.5}>
              <LabelValue label="ROI" value={perf.started ? pct(perf.roi) : 'Not started'} />
              <LabelValue label="Conversion rate" value={pct(perf.conversion)} />
              <LabelValue label="Leads" value={num(perf.leads)} />
              <LabelValue label="Qualified" value={num(perf.qualified)} />
            </Grid>
            <Typography variant="caption" sx={{ display: 'block', mt: 1.5 }}>
              Recommendations are illustrative analytics derived from the demonstration dataset, not investment advice.
            </Typography>
          </SectionCard>
        </Stack>
      </Grid>

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Campaign approval</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <Alert severity="info" icon={false}>
              <Typography variant="caption">
                The approval step is performed by the Marketing Communications Specialist, separately from the
                marketing user who created the campaign. This segregation is configured in the Configuration Centre.
              </Typography>
            </Alert>
            <TextField multiline minRows={3} label="Approval comment" value={comment} onChange={(e) => setComment(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              await api.approveCampaign(campaign.id, false, comment || 'Returned for amendment.');
              setApproveOpen(false);
              toast({ message: 'Campaign rejected', severity: 'info', detail: 'The campaign owner has been notified and the decision recorded in the audit log.' });
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              await api.approveCampaign(campaign.id, true, comment || 'Approved.');
              setApproveOpen(false);
              toast({ message: 'Campaign approved', severity: 'success', detail: 'The approver, decision and comment were recorded in the audit log.' });
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CampaignDetail;
