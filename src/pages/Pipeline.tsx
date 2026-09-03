import * as React from 'react';
import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, MenuItem, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import { Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import { toast } from '../hooks';
import { fmtDate } from '../utils/dates';
import { num, zar } from '../utils/format';
import type { UnderwritingStatus } from '../types';

const UW_STAGES: UnderwritingStatus[] = [
  'Awaiting Handover', 'In Underwriting Queue', 'Under Review', 'Information Requested', 'Approved', 'Declined',
];

export function Pipeline() {
  const navigate = useNavigate();
  const store = useStore();
  const role = ROLES[store.session.role];
  const canUnderwrite = role.permissions.includes('underwriting.update');
  const [unitFilter, setUnitFilter] = React.useState('all');
  const [update, setUpdate] = React.useState<{ id: string } | null>(null);
  const [form, setForm] = React.useState({ status: 'Under Review', note: '' });

  const promising = store.leads.filter((l) => l.status === 'Qualified');
  const wip = store.opportunities.filter((o) =>
    !o.closedDate && (unitFilter === 'all' || o.underwritingUnit === unitFilter));
  const inQueue = wip.filter((o) => o.underwritingStatus && !['Not Handed Over', 'Awaiting Handover'].includes(o.underwritingStatus));
  const awaiting = wip.filter((o) => o.underwritingStatus === 'Awaiting Handover');
  const applications = store.applications.filter((a) => ['Submitted', 'Under Review', 'Awaiting Approval'].includes(a.status));

  const customerName = (id: string) => store.customers.find((c) => c.id === id)?.organisation ?? '—';

  return (
    <Box>
      <PageHeader
        title="WIP Pipeline & Underwriting Handover"
        subtitle="The work-in-progress view shared between the Business Development Unit and Underwriting. BDU retains full lifecycle visibility after handover; Underwriting updates the status on the same record."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'WIP & Underwriting' }]}
        actions={
          <TextField
            select size="small" label="Underwriting unit" value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)} sx={{ minWidth: 240 }}
          >
            <MenuItem value="all">All units</MenuItem>
            <MenuItem value="STI">Short-Term Insurance (STI)</MenuItem>
            <MenuItem value="Medium/Long-Term Insurance">Medium/Long-Term Insurance</MenuItem>
          </TextField>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Promising leads" value={num(promising.length)} sub="Qualified, not yet converted" colour="#2563EB" onClick={() => navigate('/leads?status=Qualified')} />
        <KpiCard dense label="WIP opportunities" value={num(wip.length)} sub={zar(wip.reduce((s, o) => s + o.estimatedValue, 0), true)} colour="#0B2545" />
        <KpiCard dense label="Awaiting handover" value={num(awaiting.length)} sub="Ready for underwriting" colour="#D97706" />
        <KpiCard dense label="In underwriting" value={num(inQueue.length)} sub="Queue and review" colour="#7C3AED" />
        <KpiCard dense label="Applications in review" value={num(applications.length)} colour="#0E7C7B" onClick={() => navigate('/applications')} />
        <KpiCard dense label="Information requested" value={num(wip.filter((o) => o.underwritingStatus === 'Information Requested').length)} sub="Blocked pending BDU" colour="#DC2626" />
      </Grid>

      <SectionCard
        title="Underwriting workflow"
        subtitle="Qualified → WIP → Handover to underwriting → Underwriting review → Status update → BDU tracking → Completion"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          {['Qualified', 'WIP', 'Handover', 'Underwriting review', 'Status update', 'BDU tracking', 'Completion'].map((s, i, arr) => (
            <React.Fragment key={s}>
              <Box sx={{
                px: 1.75, py: 1, borderRadius: 2, bgcolor: 'surface.subtle',
                border: '1px solid', borderColor: 'divider', minWidth: 118, textAlign: 'center',
              }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{s}</Typography>
              </Box>
              {i < arr.length - 1 && <Typography sx={{ color: 'text.disabled' }}>→</Typography>}
            </React.Fragment>
          ))}
        </Stack>
      </SectionCard>

      <Box sx={{ display: 'flex', gap: 1.75, overflowX: 'auto', pb: 2 }}>
        {UW_STAGES.map((stage) => {
          const items = wip.filter((o) => o.underwritingStatus === stage);
          const colour = stage === 'Approved' ? '#059669' : stage === 'Declined' ? '#DC2626'
            : stage === 'Information Requested' ? '#D97706' : stage === 'Under Review' ? '#7C3AED' : '#2563EB';
          return (
            <Box key={stage} sx={{ minWidth: 290, width: 290, flexShrink: 0 }}>
              <Box sx={{ px: 1.5, py: 1.25, borderRadius: 2, bgcolor: alpha(colour, .08), mb: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ color: colour, fontWeight: 700 }}>{stage}</Typography>
                  <Chip size="small" label={items.length} sx={{ height: 20, bgcolor: alpha(colour, .16), color: colour, fontWeight: 700 }} />
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                  {zar(items.reduce((s, o) => s + o.estimatedValue, 0), true)}
                </Typography>
              </Box>
              <Stack gap={1.25}>
                {items.map((o) => {
                  const uw = store.users.find((u) => u.id === o.underwritingOwnerId);
                  const bdu = store.users.find((u) => u.id === o.ownerId);
                  const relatedApps = store.applications.filter((a) => a.opportunityId === o.id);
                  return (
                    <Box
                      key={o.id}
                      sx={{
                        p: 1.5, borderRadius: 2.5, bgcolor: 'background.paper',
                        border: '1px solid', borderColor: 'divider', borderLeft: `3px solid ${colour}`,
                      }}
                    >
                      <Typography
                        variant="caption" onClick={() => navigate(`/opportunities/${o.id}`)}
                        sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, cursor: 'pointer', color: 'secondary.main' }}
                      >
                        {o.reference}
                      </Typography>
                      <Typography variant="body2" sx={{
                        fontWeight: 600, mt: 0.4, display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{o.name}</Typography>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>{customerName(o.customerId)}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Stack gap={0.5}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">Value</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{zar(o.estimatedValue, true)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">Unit</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{o.underwritingUnit ?? '—'}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption">Handed over</Typography>
                          <Typography variant="caption">{o.handoverDate ? fmtDate(o.handoverDate) : '—'}</Typography>
                        </Stack>
                        {relatedApps.length > 0 && (
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption">Application</Typography>
                            <Typography
                              variant="caption" sx={{ fontWeight: 600, cursor: 'pointer', color: 'secondary.main' }}
                              onClick={() => navigate(`/applications/${relatedApps[0].id}`)}
                            >
                              {relatedApps[0].status}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
                        <Stack direction="row" gap={0.5}>
                          {bdu && (
                            <Tooltip title={`BDU owner: ${bdu.name}`}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.53rem', bgcolor: bdu.avatarColor }}>{bdu.initials}</Avatar>
                            </Tooltip>
                          )}
                          {uw && (
                            <Tooltip title={`Underwriter: ${uw.name}`}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.53rem', bgcolor: uw.avatarColor }}>{uw.initials}</Avatar>
                            </Tooltip>
                          )}
                        </Stack>
                        <Tooltip title={!canUnderwrite ? 'Only an Underwriting User may update this status. Switch role to demonstrate.' : ''}>
                          <span>
                            <Button
                              size="small" disabled={!canUnderwrite}
                              onClick={() => { setForm({ status: o.underwritingStatus ?? 'Under Review', note: '' }); setUpdate({ id: o.id }); }}
                            >
                              Update
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })}
                {items.length === 0 && (
                  <Box sx={{ p: 2.5, borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="caption">No items in this queue</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

      <Grid cols={{ xs: 1, lg: 2 }} gap={2.5} sx={{ mt: 1 }}>
        <SectionCard
          title={`Promising leads awaiting conversion (${promising.length})`}
          subtitle="Qualified leads not yet converted into an opportunity"
          action={<Button size="small" onClick={() => navigate('/leads?status=Qualified')}>Open leads</Button>}
        >
          <Stack gap={1}>
            {promising.slice(0, 6).map((l) => (
              <Box
                key={l.id} onClick={() => navigate(`/leads/${l.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'surface.subtle' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{l.company}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {l.reference} · {l.productInterest} · score {l.qualificationScore}/100
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>{zar(l.estimatedValue, true)}</Typography>
                </Stack>
              </Box>
            ))}
            {promising.length === 0 && <Typography variant="body2" color="text.secondary">No qualified leads awaiting conversion.</Typography>}
          </Stack>
        </SectionCard>

        <SectionCard
          title={`Applications in underwriting (${applications.length})`}
          subtitle="Digital applications submitted and awaiting an underwriting decision"
          action={<Button size="small" onClick={() => navigate('/applications')}>Open applications</Button>}
        >
          <Stack gap={1}>
            {applications.slice(0, 6).map((a) => (
              <Box
                key={a.id} onClick={() => navigate(`/applications/${a.id}`)}
                sx={{
                  p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'surface.subtle' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{customerName(a.customerId)}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>{a.reference} · {a.formType}</Typography>
                  </Box>
                  <StatusChip value={a.status} />
                </Stack>
              </Box>
            ))}
            {applications.length === 0 && <Typography variant="body2" color="text.secondary">No applications currently in underwriting.</Typography>}
          </Stack>
        </SectionCard>
      </Grid>

      <Dialog open={!!update} onClose={() => setUpdate(null)} fullWidth maxWidth="sm">
        <DialogTitle>Update underwriting status</DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ pt: 1 }}>
            <TextField select label="Underwriting status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} fullWidth>
              {['In Underwriting Queue', 'Under Review', 'Information Requested', 'Approved', 'Declined'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              multiline minRows={3} label="Note to the Business Development Unit" value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} fullWidth
              helperText="The BDU owner is notified and retains full visibility of the lifecycle."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setUpdate(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!update) return;
              await api.setUnderwritingStatus(update.id, form.status as UnderwritingStatus, form.note || 'Underwriting status updated.');
              setUpdate(null);
              toast({ message: 'Underwriting status updated', severity: 'success', detail: 'The Business Development Unit owner has been notified.' });
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Pipeline;
