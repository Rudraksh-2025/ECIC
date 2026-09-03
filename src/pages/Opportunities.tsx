import * as React from 'react';
import {
  Avatar, Box, Button, Chip, LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import DownloadIcon from '@mui/icons-material/Download';
import LockIcon from '@mui/icons-material/Lock';
import DragIcon from '@mui/icons-material/DragIndicator';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import { ConfirmDialog, DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip } from '../components';
import type { Column } from '../components';
import { toast } from '../hooks';
import { averageStageDurations, pipelineMetrics } from '../utils/analytics';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num, pct, zar } from '../utils/format';
import type { ClosedLostReason, Opportunity, OpportunityStage } from '../types';
import { ClosedLostDialog } from './opportunities/ClosedLostDialog';

const STAGES: OpportunityStage[] = ['Qualification', 'Proposal / Solution', 'Negotiation', 'Closed Won', 'Closed Lost'];

export function Opportunities() {
  const navigate = useNavigate();
  const store = useStore();
  const [view, setView] = React.useState<'board' | 'list'>('board');
  const [filters, setFilters] = React.useState({ stage: 'all', owner: 'all', campaign: 'all', underwriting: 'all', forecast: 'all' });
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [pendingMove, setPendingMove] = React.useState<{ id: string; stage: OpportunityStage } | null>(null);
  const [lostDialog, setLostDialog] = React.useState<{ id: string } | null>(null);

  const role = ROLES[store.session.role];
  const canUpdate = role.permissions.includes('opportunity.update');

  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const filtered = store.opportunities.filter((o) =>
    (filters.stage === 'all' || o.stage === filters.stage)
    && (filters.owner === 'all' || o.ownerId === filters.owner)
    && (filters.campaign === 'all' || o.campaignId === filters.campaign)
    && (filters.underwriting === 'all' || o.underwritingStatus === filters.underwriting)
    && (filters.forecast === 'all' || o.forecastCategory === filters.forecast));

  const metrics = pipelineMetrics(store.opportunities, store.leads);
  const avgStage = averageStageDurations(store.opportunities);

  const customerName = (id: string) => store.customers.find((c) => c.id === id)?.organisation ?? '—';
  const userName = (id: string) => store.users.find((u) => u.id === id)?.name ?? '—';

  const currentStageDays = (o: Opportunity) => {
    const current = o.stageHistory[o.stageHistory.length - 1];
    if (!current || current.exitedAt) return 0;
    return Math.max(1, Math.round((Date.now() - new Date(current.enteredAt).getTime()) / 86400000));
  };

  const move = async (id: string, stage: OpportunityStage) => {
    if (stage === 'Closed Lost') { setLostDialog({ id }); return; }
    setPendingMove({ id, stage });
  };

  const columns: Column<Opportunity>[] = [
    {
      id: 'reference', label: 'Reference', width: 160, sortValue: (r) => r.reference,
      render: (r) => (
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}>
            {r.reference}
          </Typography>
          {r.closedDate && <Tooltip title="Closed — read-only for standard users"><LockIcon sx={{ fontSize: 13, color: 'text.disabled' }} /></Tooltip>}
        </Stack>
      ),
    },
    {
      id: 'name', label: 'Opportunity', sortValue: (r) => r.name,
      render: (r) => (
        <Box sx={{ maxWidth: 340, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            {customerName(r.customerId)} · {r.products.length} product line{r.products.length > 1 ? 's' : ''}
          </Typography>
        </Box>
      ),
    },
    { id: 'stage', label: 'Stage', width: 155, sortValue: (r) => r.stage, render: (r) => <StatusChip value={r.stage} /> },
    {
      id: 'value', label: 'Value', align: 'right', width: 118, sortValue: (r) => r.estimatedValue,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 700 }}>{zar(r.estimatedValue, true)}</Typography>,
    },
    {
      id: 'weighted', label: 'Weighted', align: 'right', width: 112, hideOn: 'md',
      sortValue: (r) => r.estimatedValue * r.probability / 100,
      render: (r) => (
        <Box>
          <Typography variant="body2">{zar(r.estimatedValue * r.probability / 100, true)}</Typography>
          <Typography variant="caption">{r.probability}%</Typography>
        </Box>
      ),
    },
    {
      id: 'stageTime', label: 'Time in stage', width: 140, hideOn: 'md',
      sortValue: (r) => currentStageDays(r),
      render: (r) => {
        if (r.closedDate) return <Typography variant="caption" color="text.disabled">Closed</Typography>;
        const days = currentStageDays(r);
        const avg = avgStage[r.stage] ?? days;
        const ratio = avg ? Math.min(200, (days / avg) * 100) : 50;
        return (
          <Tooltip title={`${days} days in ${r.stage} · portfolio average ${avg.toFixed(0)} days`}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: ratio > 130 ? 'error.main' : 'text.primary' }}>
                {days}d {ratio > 130 && '· stalled'}
              </Typography>
              <LinearProgress
                variant="determinate" value={Math.min(100, ratio)}
                sx={{
                  mt: 0.4, height: 4,
                  bgcolor: alpha('#0B2545', .08),
                  '& .MuiLinearProgress-bar': { bgcolor: ratio > 130 ? '#DC2626' : ratio > 90 ? '#D97706' : '#059669' },
                }}
              />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'owner', label: 'Owner', hideOn: 'sm', sortValue: (r) => userName(r.ownerId),
      render: (r) => {
        const u = store.users.find((x) => x.id === r.ownerId);
        return (
          <Stack direction="row" gap={0.75} alignItems="center">
            <Avatar sx={{ width: 21, height: 21, fontSize: '0.58rem', bgcolor: u?.avatarColor }}>{u?.initials}</Avatar>
            <Typography variant="body2" noWrap>{u?.name}</Typography>
          </Stack>
        );
      },
    },
    {
      id: 'underwriting', label: 'Underwriting', hideOn: 'md', sortValue: (r) => r.underwritingStatus ?? '',
      render: (r) => r.underwritingStatus && r.underwritingStatus !== 'Not Handed Over'
        ? <Chip size="small" label={r.underwritingStatus} sx={{ bgcolor: alpha('#7C3AED', .1), color: '#7C3AED' }} />
        : <Typography variant="caption" color="text.disabled">—</Typography>,
    },
    {
      id: 'close', label: 'Expected close', hideOn: 'md', sortValue: (r) => r.expectedCloseDate,
      render: (r) => <Typography variant="body2">{fmtDate(r.expectedCloseDate)}</Typography>,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Opportunities"
        subtitle="Sales pipeline management with drag-and-drop stage movement, stage timing, multi-product opportunities, mandatory closed-lost reasons and protection of closed records."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Opportunities' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Opportunities', filtered.map((o) => ({
                Reference: o.reference, Name: o.name, Customer: customerName(o.customerId),
                Stage: o.stage, 'Estimated value (ZAR)': o.estimatedValue, Probability: o.probability,
                'Weighted value (ZAR)': Math.round(o.estimatedValue * o.probability / 100),
                'Forecast category': o.forecastCategory, Owner: userName(o.ownerId),
                Campaign: store.campaigns.find((c) => c.id === o.campaignId)?.name ?? '',
                'Originating lead': store.leads.find((l) => l.id === o.originatingLeadId)?.reference ?? '',
                Products: o.products.map((p) => p.product).join(' | '),
                'Expected close': o.expectedCloseDate, Created: fmtDate(o.createdDate),
                Closed: o.closedDate ? fmtDate(o.closedDate) : '',
                'Closed lost reason': o.closedLostReason ?? '',
                'Underwriting status': o.underwritingStatus ?? '', 'Underwriting unit': o.underwritingUnit ?? '',
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" onClick={() => navigate('/analytics')}>Revenue forecast</Button>
          </>
        }
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Open pipeline" value={zar(metrics.openValue, true)} sub={`${num(metrics.openCount)} opportunities`} colour="#0B2545" />
        <KpiCard dense label="Weighted forecast" value={zar(metrics.weighted, true)} sub="Probability adjusted" colour="#0E7C7B" />
        <KpiCard dense label="Commit" value={zar(metrics.commit, true)} sub="Negotiation stage" colour="#7C3AED" />
        <KpiCard dense label="Won revenue" value={zar(metrics.won, true)} sub={`${num(metrics.wonCount)} deals won`} colour="#059669" />
        <KpiCard dense label="Win ratio" value={pct(metrics.winRatio)} sub={`${num(metrics.lostCount)} lost`} colour="#2563EB" />
        <KpiCard dense label="Avg deal / velocity" value={zar(metrics.averageDeal, true)} sub={`${metrics.velocityDays.toFixed(0)} day cycle`} colour="#D97706" />
      </Grid>

      <FilterBar
        filters={[
          { id: 'stage', label: 'Stage', options: [{ value: 'all', label: 'All stages' }, ...STAGES.map((s) => ({ value: s, label: s }))], width: 175 },
          { id: 'owner', label: 'Owner', options: [{ value: 'all', label: 'All owners' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 175 },
          { id: 'campaign', label: 'Campaign', options: [{ value: 'all', label: 'All campaigns' }, ...store.campaigns.map((c) => ({ value: c.id, label: c.name }))], width: 200 },
          { id: 'forecast', label: 'Forecast category', options: [{ value: 'all', label: 'All' }, ...['Pipeline', 'Best Case', 'Commit', 'Closed'].map((f) => ({ value: f, label: f }))], width: 170 },
          { id: 'underwriting', label: 'Underwriting', options: [{ value: 'all', label: 'All' }, ...['Not Handed Over', 'Awaiting Handover', 'In Underwriting Queue', 'Under Review', 'Information Requested', 'Approved', 'Declined'].map((s) => ({ value: s, label: s }))], width: 195 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ stage: 'all', owner: 'all', campaign: 'all', underwriting: 'all', forecast: 'all' })}
        extra={
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)} sx={{ bgcolor: 'background.paper' }}>
            <ToggleButton value="board"><ViewKanbanIcon sx={{ fontSize: 18, mr: 0.5 }} /> Board</ToggleButton>
            <ToggleButton value="list"><ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} /> List</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {view === 'board' ? (
        <Box sx={{ display: 'flex', gap: 1.75, overflowX: 'auto', pb: 2 }}>
          {STAGES.map((stage) => {
            const items = filtered.filter((o) => o.stage === stage);
            const value = items.reduce((s, o) => s + o.estimatedValue, 0);
            const weighted = items.reduce((s, o) => s + o.estimatedValue * o.probability / 100, 0);
            const colour = stage === 'Closed Won' ? '#059669' : stage === 'Closed Lost' ? '#DC2626'
              : stage === 'Negotiation' ? '#D97706' : stage === 'Proposal / Solution' ? '#7C3AED' : '#2563EB';
            const isTarget = dropTarget === stage && dragging;
            return (
              <Box
                key={stage}
                sx={{ minWidth: 296, width: 296, flexShrink: 0 }}
                onDragOver={(e) => { e.preventDefault(); setDropTarget(stage); }}
                onDragLeave={() => setDropTarget((t) => t === stage ? null : t)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = dragging;
                  setDragging(null);
                  setDropTarget(null);
                  if (!id) return;
                  const opp = store.opportunities.find((o) => o.id === id);
                  if (!opp || opp.stage === stage) return;
                  if (!canUpdate) {
                    toast({ message: 'Permission denied', severity: 'error', detail: `The ${role.name} role may not change opportunity stages.` });
                    return;
                  }
                  if (opp.closedDate) {
                    toast({ message: 'Closed opportunity is read-only', severity: 'warning', detail: 'Closed opportunities cannot be reopened by standard users.' });
                    return;
                  }
                  move(id, stage);
                }}
              >
                <Box sx={{
                  px: 1.5, py: 1.25, borderRadius: 2, mb: 1.25,
                  bgcolor: alpha(colour, isTarget ? 0.18 : 0.08),
                  border: isTarget ? `1px dashed ${colour}` : '1px solid transparent',
                  transition: 'all .15s',
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ color: colour, fontWeight: 700 }}>{stage}</Typography>
                    <Chip size="small" label={items.length} sx={{ height: 20, bgcolor: alpha(colour, .16), color: colour, fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                    {zar(value, true)}{!stage.startsWith('Closed') && ` · weighted ${zar(weighted, true)}`}
                  </Typography>
                </Box>
                <Stack gap={1.25} sx={{ minHeight: 120 }}>
                  {items.map((o) => {
                    const u = store.users.find((x) => x.id === o.ownerId);
                    const days = currentStageDays(o);
                    const avg = avgStage[o.stage] ?? days;
                    const stalled = !o.closedDate && avg > 0 && days > avg * 1.3;
                    return (
                      <Box
                        key={o.id}
                        draggable={canUpdate && !o.closedDate}
                        onDragStart={() => setDragging(o.id)}
                        onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                        onClick={() => navigate(`/opportunities/${o.id}`)}
                        sx={{
                          p: 1.5, borderRadius: 2.5, bgcolor: 'background.paper',
                          border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                          borderLeft: `3px solid ${colour}`,
                          opacity: dragging === o.id ? 0.45 : 1,
                          transition: 'box-shadow .15s, transform .15s',
                          '&:hover': { boxShadow: '0 8px 22px -14px rgba(11,37,69,.4)', transform: 'translateY(-1px)' },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={0.5}>
                          <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                            {o.reference}
                          </Typography>
                          {canUpdate && !o.closedDate && <DragIcon sx={{ fontSize: 15, color: 'text.disabled' }} />}
                          {o.closedDate && <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                        </Stack>
                        <Typography variant="body2" sx={{
                          fontWeight: 600, mt: 0.4, display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{o.name}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block', mb: 1 }}>
                          {customerName(o.customerId)}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{zar(o.estimatedValue, true)}</Typography>
                          <Stack direction="row" gap={0.5} alignItems="center">
                            {stalled && (
                              <Tooltip title={`${days} days in stage against a ${avg.toFixed(0)} day average`}>
                                <Chip size="small" label={`${days}d`} sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha('#DC2626', .12), color: '#DC2626' }} />
                              </Tooltip>
                            )}
                            <Tooltip title={u?.name ?? ''}>
                              <Avatar sx={{ width: 20, height: 20, fontSize: '0.55rem', bgcolor: u?.avatarColor }}>{u?.initials}</Avatar>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        {o.underwritingStatus && o.underwritingStatus !== 'Not Handed Over' && (
                          <Chip
                            size="small" label={o.underwritingStatus}
                            sx={{ mt: 1, height: 18, fontSize: '0.6rem', bgcolor: alpha('#7C3AED', .1), color: '#7C3AED' }}
                          />
                        )}
                      </Box>
                    );
                  })}
                  {items.length === 0 && (
                    <Box sx={{ p: 2.5, borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography variant="caption">{canUpdate ? 'Drop an opportunity here' : 'No opportunities'}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          searchable
          searchPlaceholder="Search opportunity, reference or customer…"
          searchFields={(r) => `${r.reference} ${r.name} ${customerName(r.customerId)} ${r.products.map((p) => p.product).join(' ')}`}
          defaultSort={{ id: 'value', dir: 'desc' }}
          onRowClick={(r) => navigate(`/opportunities/${r.id}`)}
          initialRowsPerPage={15}
        />
      )}

      <Box sx={{ mt: 3 }}>
        <SectionCard title="Average time in stage" subtitle="Portfolio benchmark used to identify stalled opportunities">
          <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
            {['Qualification', 'Proposal / Solution', 'Negotiation'].map((s) => (
              <Box key={s} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">{s}</Typography>
                <Typography variant="h4" sx={{ mt: 0.25 }}>{(avgStage[s] ?? 0).toFixed(0)} days</Typography>
                <Typography variant="caption">
                  {filtered.filter((o) => o.stage === s && !o.closedDate).length} opportunities currently in stage
                </Typography>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      </Box>

      <ConfirmDialog
        open={!!pendingMove}
        title={`Move to ${pendingMove?.stage}?`}
        message={`The stage clock on the current stage will be closed, the new stage clock started, the weighted forecast recalculated and an audit event written.`}
        confirmLabel="Move opportunity"
        onCancel={() => setPendingMove(null)}
        onConfirm={async () => {
          if (!pendingMove) return;
          const { id, stage } = pendingMove;
          setPendingMove(null);
          await api.moveOpportunityStage(id, stage);
          toast({
            message: `Opportunity moved to ${stage}`,
            severity: 'success',
            detail: 'Stage duration recorded and the weighted forecast recalculated.',
          });
        }}
      />

      <ClosedLostDialog
        open={!!lostDialog}
        onClose={() => setLostDialog(null)}
        onConfirm={async (reason: ClosedLostReason, detail: string) => {
          if (!lostDialog) return;
          await api.moveOpportunityStage(lostDialog.id, 'Closed Lost', { reason, detail });
          setLostDialog(null);
          toast({
            message: 'Opportunity closed lost',
            severity: 'info',
            detail: `Reason "${reason}" recorded. The opportunity is now read-only for standard users and feeds the win/loss analysis report.`,
          });
        }}
      />
    </Box>
  );
}

export default Opportunities;
