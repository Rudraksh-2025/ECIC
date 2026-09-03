import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, LinearProgress, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/ReportProblem';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/HelpOutlined';
import { useStore } from '../store';
import { ROLES } from '../data/roles';
import { api } from '../services/mockApi';
import { Grid, KpiCard, LabelValue, PageHeader, SectionCard, SimulatedBadge, Stack } from '../components';
import { toast } from '../hooks';
import { fmtDateTime, relativeTime } from '../utils/dates';
import { num } from '../utils/format';

const STATUS_META: Record<string, { colour: string; icon: React.ReactNode }> = {
  Connected: { colour: '#059669', icon: <CheckCircleIcon sx={{ fontSize: 17 }} /> },
  Degraded: { colour: '#D97706', icon: <WarningIcon sx={{ fontSize: 17 }} /> },
  Disconnected: { colour: '#DC2626', icon: <ErrorIcon sx={{ fontSize: 17 }} /> },
  'Not Configured': { colour: '#64748B', icon: <HelpIcon sx={{ fontSize: 17 }} /> },
};

export function Integrations() {
  const store = useStore();
  const canManage = ROLES[store.session.role].permissions.includes('integration.manage');
  const [syncing, setSyncing] = React.useState<string | null>(null);

  const connected = store.integrations.filter((i) => i.status === 'Connected');
  const degraded = store.integrations.filter((i) => i.status === 'Degraded');
  const errors = store.integrations.reduce((s, i) => s + i.errorCount, 0);
  const records = store.integrations.reduce((s, i) => s + i.recordsSynced, 0);

  const categories = Array.from(new Set(store.integrations.map((i) => i.category)));

  const runSync = async (id: string, name: string) => {
    setSyncing(id);
    await api.runIntegrationSync(id);
    setSyncing(null);
    toast({
      message: `${name} synchronised`,
      severity: 'success',
      detail: 'A simulated synchronisation batch completed. The record count, last-sync time and audit entry were all updated.',
    });
  };

  return (
    <Box>
      <PageHeader
        title="Integration Centre"
        subtitle="The integration landscape the CRM operates within: corporate email, the dtic IFW feed, SMS, social media, calendar, Power BI, SharePoint, Active Directory, policy administration and risk screening."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Integrations' }]}
        chips={<SimulatedBadge tooltip="No external system is contacted in this browser-only demonstration." />}
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <AlertTitle>All integrations on this page are DEMO / SIMULATED</AlertTitle>
        This is a frontend-only demonstration: no external system is contacted, and the connection status, record
        counts and synchronisation actions are illustrative. The page shows the intended integration operating model —
        which systems connect, in which direction, over which protocol, and how their health is monitored — rather
        than live connectivity. Leads sourced from the dtic IFW feed are present in the demonstration data so the
        downstream effect of an inbound integration is visible.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Integrations" value={num(store.integrations.length)} colour="#0B2545" />
        <KpiCard dense label="Connected" value={num(connected.length)} colour="#059669" />
        <KpiCard dense label="Degraded" value={num(degraded.length)} sub="Investigate" colour="#D97706" />
        <KpiCard dense label="Not configured" value={num(store.integrations.filter((i) => i.status === 'Not Configured').length)} colour="#64748B" />
        <KpiCard dense label="Records synchronised" value={num(records)} colour="#2563EB" />
        <KpiCard dense label="Errors recorded" value={num(errors)} colour="#DC2626" />
      </Grid>

      {degraded.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <strong>{degraded.length} integration(s) degraded.</strong>{' '}
          {degraded.map((d) => `${d.name} (${d.errorCount} errors)`).join(', ')} — a system alert has been raised to
          the IT administrator and appears in the notification centre.
        </Alert>
      )}

      {categories.map((category) => (
        <SectionCard key={category} title={category} sx={{ mb: 2.5 }}>
          <Grid cols={{ xs: 1, md: 2 }} gap={2}>
            {store.integrations.filter((i) => i.category === category).map((i) => {
              const meta = STATUS_META[i.status];
              return (
                <Box
                  key={i.id}
                  sx={{
                    p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
                    borderLeft: `4px solid ${meta.colour}`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle1">{i.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{i.description}</Typography>
                    </Box>
                    <Chip
                      size="small" icon={meta.icon as React.ReactElement} label={i.status}
                      sx={{ bgcolor: alpha(meta.colour, .12), color: meta.colour, fontWeight: 700, '& .MuiChip-icon': { color: 'inherit' } }}
                    />
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid cols={{ xs: 2, sm: 3 }} gap={1.5}>
                    <LabelValue label="Direction" value={i.direction} />
                    <LabelValue label="Protocol" value={i.protocol} />
                    <LabelValue label="Last sync" value={i.lastSync ? relativeTime(i.lastSync) : 'Never'} />
                    <LabelValue label="Records synchronised" value={num(i.recordsSynced)} />
                    <LabelValue label="Errors" value={
                      <Typography variant="body2" sx={{ fontWeight: 600, color: i.errorCount > 0 ? 'error.main' : 'text.primary' }}>
                        {num(i.errorCount)}
                      </Typography>
                    } />
                    <LabelValue label="Last sync time" value={i.lastSync ? fmtDateTime(i.lastSync) : '—'} />
                  </Grid>
                  <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, bgcolor: 'surface.sunken' }}>
                    <Typography variant="caption" sx={{ display: 'block' }}>Endpoint (mock)</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                      {i.endpoint}
                    </Typography>
                  </Box>
                  {syncing === i.id && <LinearProgress sx={{ mt: 1.5 }} />}
                  <Stack direction="row" gap={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
                    <Button
                      size="small" variant="outlined" startIcon={<SyncIcon sx={{ fontSize: 17 }} />}
                      disabled={!canManage || syncing === i.id || i.status === 'Not Configured'}
                      onClick={() => runSync(i.id, i.name)}
                    >
                      {syncing === i.id ? 'Synchronising…' : 'Run sync'}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Grid>
        </SectionCard>
      ))}

      <SectionCard title="Integration principles" subtitle="How the CRM is designed to sit within the ECIC estate">
        <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
          {[
            ['Adapter layer', 'Each integration sits behind an adapter, so a change to an external specification is contained and does not ripple through the CRM.'],
            ['Idempotent inbound processing', 'Inbound records carry a source key so a replayed batch cannot create duplicates.'],
            ['Monitored health', 'Every integration reports last sync, record count and error count; degradation raises a system alert to IT.'],
            ['Auditable', 'Every synchronisation run writes an audit event with the batch size and error count.'],
          ].map(([title, body]) => (
            <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
            </Box>
          ))}
        </Grid>
      </SectionCard>
    </Box>
  );
}

export default Integrations;
