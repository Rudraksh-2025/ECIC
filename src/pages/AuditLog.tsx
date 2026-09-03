import * as React from 'react';
import { Alert, AlertTitle, Box, Button, Chip, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { useStore } from '../store';
import { DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack } from '../components';
import type { Column } from '../components';
import { fmtDateTime, relativeTime } from '../utils/dates';
import { downloadCsv, num } from '../utils/format';
import type { AuditEvent } from '../types';

export function AuditLog() {
  const store = useStore();
  const [filters, setFilters] = React.useState({ entity: 'all', user: 'all', action: 'all', period: 'all' });
  const [selected, setSelected] = React.useState<AuditEvent | null>(null);
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const entities = Array.from(new Set(store.auditEvents.map((a) => a.entity))).sort();
  const actions = Array.from(new Set(store.auditEvents.map((a) => a.action))).sort();

  const filtered = store.auditEvents.filter((a) => {
    if (filters.entity !== 'all' && a.entity !== filters.entity) return false;
    if (filters.user !== 'all' && a.userId !== filters.user) return false;
    if (filters.action !== 'all' && a.action !== filters.action) return false;
    if (filters.period !== 'all') {
      const days = Number(filters.period);
      if (new Date(a.at).getTime() < Date.now() - days * 86400000) return false;
    }
    return true;
  });

  const today = store.auditEvents.filter((a) => new Date(a.at).getTime() > Date.now() - 86400000);
  const securityEvents = store.auditEvents.filter((a) =>
    a.entity === 'Authentication' || a.action.toLowerCase().includes('security')
    || a.action.toLowerCase().includes('unmask') || a.action.toLowerCase().includes('quarantin')
    || a.action.toLowerCase().includes('role') || a.action.toLowerCase().includes('suspend'));

  const columns: Column<AuditEvent>[] = [
    {
      id: 'at', label: 'Timestamp', width: 175, sortValue: (r) => r.at,
      render: (r) => (
        <Box>
          <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.73rem' }}>
            {fmtDateTime(r.at)}
          </Typography>
          <Typography variant="caption">{relativeTime(r.at)}</Typography>
        </Box>
      ),
    },
    {
      id: 'user', label: 'User & role', sortValue: (r) => r.userName, hideOn: 'sm',
      render: (r) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.userName}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.role}</Typography>
        </Box>
      ),
    },
    {
      id: 'action', label: 'Action', sortValue: (r) => r.action,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 300 }} noWrap>{r.action}</Typography>,
    },
    {
      id: 'entity', label: 'Entity', width: 210, sortValue: (r) => r.entity,
      render: (r) => (
        <Box sx={{ minWidth: 0 }}>
          <Chip size="small" label={r.entity} sx={{ height: 19, fontSize: '0.62rem', bgcolor: alpha('#0B2545', .07) }} />
          <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.3, fontFamily: 'ui-monospace, monospace' }}>
            {r.entityId}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'change', label: 'Before → after', hideOn: 'md',
      render: (r) => (
        <Box sx={{ maxWidth: 420, minWidth: 0 }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }} noWrap>{r.beforeValue}</Typography>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }} noWrap>{r.afterValue}</Typography>
        </Box>
      ),
    },
    {
      id: 'source', label: 'Source', width: 170, hideOn: 'md',
      render: (r) => (
        <Box>
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'ui-monospace, monospace' }}>{r.ipAddress}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.device}</Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="A read-only register of every action taken in the CRM, with actor, role, timestamp, before and after values, source address, device and a chained integrity hash."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Audit Log' }]}
        chips={<Chip size="small" icon={<LockIcon />} label="READ-ONLY REGISTER" sx={{ bgcolor: alpha('#0B2545', .09), fontWeight: 700 }} />}
        actions={
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => downloadCsv('ECIC_Audit_Log', filtered.map((a) => ({
              Timestamp: fmtDateTime(a.at), User: a.userName, Role: a.role, Action: a.action,
              Entity: a.entity, 'Entity ID': a.entityId,
              'Before value': a.beforeValue, 'After value': a.afterValue,
              'IP address': a.ipAddress, Device: a.device, 'Integrity hash': a.hash,
            })))}
          >
            Export Excel
          </Button>
        }
      />

      <Alert severity="info" icon={<FingerprintIcon />} sx={{ mb: 2.5 }}>
        <AlertTitle>How immutability is represented here</AlertTitle>
        This demonstration renders the audit register as read-only and chains each entry to its predecessor with an
        integrity hash, so tampering would be detectable. It is a <strong>DEMO / SIMULATED</strong> control:
        a production deployment backs this with append-only storage and WORM retention. We do not claim that a
        browser-based demonstration provides production-grade immutability.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total audit events" value={num(store.auditEvents.length)} colour="#0B2545" />
        <KpiCard dense label="Last 24 hours" value={num(today.length)} colour="#2563EB" onClick={() => set('period', '1')} />
        <KpiCard dense label="Security events" value={num(securityEvents.length)} sub="Auth, roles, PII, files" colour="#DC2626" />
        <KpiCard dense label="Entities covered" value={num(entities.length)} colour="#7C3AED" />
        <KpiCard dense label="Distinct actions" value={num(actions.length)} colour="#0E7C7B" />
        <KpiCard dense label="Users recorded" value={num(new Set(store.auditEvents.map((a) => a.userId)).size)} colour="#D97706" />
      </Grid>

      <FilterBar
        filters={[
          { id: 'entity', label: 'Entity', options: [{ value: 'all', label: 'All entities' }, ...entities.map((e) => ({ value: e, label: e }))], width: 210 },
          { id: 'user', label: 'User', options: [{ value: 'all', label: 'All users' }, ...store.users.map((u) => ({ value: u.id, label: u.name }))], width: 190 },
          { id: 'action', label: 'Action', options: [{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))], width: 265 },
          { id: 'period', label: 'Period', options: [{ value: 'all', label: 'All time' }, { value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }], width: 165 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ entity: 'all', user: 'all', action: 'all', period: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search action, entity, reference, user or value…"
        searchFields={(r) => `${r.action} ${r.entity} ${r.entityId} ${r.userName} ${r.role} ${r.beforeValue} ${r.afterValue}`}
        defaultSort={{ id: 'at', dir: 'desc' }}
        onRowClick={(r) => setSelected(r)}
        initialRowsPerPage={25}
        rowsPerPageOptions={[25, 50, 100]}
        dense
        emptyTitle="No audit events match these filters"
        emptyDescription="Clear the filters, or perform an action elsewhere in the CRM to generate a new audit entry."
      />

      {selected && (
        <Box sx={{ mt: 2.5 }}>
          <SectionCard
            title="Audit event detail"
            subtitle={selected.id}
            action={<Button size="small" onClick={() => setSelected(null)}>Close</Button>}
          >
            <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">Timestamp</Typography>
                <Typography variant="body2">{fmtDateTime(selected.at)}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">User</Typography>
                <Typography variant="body2">{selected.userName}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Role</Typography>
                <Typography variant="body2">{selected.role}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Action</Typography>
                <Typography variant="body2">{selected.action}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Entity</Typography>
                <Typography variant="body2">{selected.entity}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Entity ID</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace' }}>{selected.entityId}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">IP address</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace' }}>{selected.ipAddress}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Device</Typography>
                <Typography variant="body2">{selected.device}</Typography>
              </Box>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid cols={{ xs: 1, md: 2 }} gap={2}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#DC2626', .04), border: '1px solid', borderColor: alpha('#DC2626', .18) }}>
                <Typography variant="overline" color="text.secondary">Before value</Typography>
                <Typography variant="body2" sx={{ mt: 0.4, wordBreak: 'break-word' }}>{selected.beforeValue}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#059669', .04), border: '1px solid', borderColor: alpha('#059669', .18) }}>
                <Typography variant="overline" color="text.secondary">After value</Typography>
                <Typography variant="body2" sx={{ mt: 0.4, wordBreak: 'break-word' }}>{selected.afterValue}</Typography>
              </Box>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
              <FingerprintIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="overline" color="text.secondary">Integrity hash (chained to the preceding record)</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }}>
                  {selected.hash}
                </Typography>
              </Box>
            </Stack>
          </SectionCard>
        </Box>
      )}

      <Box sx={{ mt: 3 }}>
        <SectionCard title="Auditable event types" subtitle="Every category of action the CRM records">
          <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={1.5}>
            {[
              'Sign-in and sign-out', 'Lead creation and assignment', 'Lead conversion',
              'Opportunity stage change', 'Opportunity closure', 'Complaint creation and update',
              'Complaint escalation', 'Complaint closure', 'Document upload',
              'Blocked file quarantine', 'Digital signature', 'Application decision',
              'Campaign approval', 'CIM approval and publication', 'User and role change',
              'Configuration change', 'Communication issued', 'Sensitive data unmasked',
              'Failed authentication', 'Integration synchronisation',
            ].map((e) => {
              const count = store.auditEvents.filter((a) =>
                a.action.toLowerCase().includes(e.split(' ')[0].toLowerCase())).length;
              return (
                <Box key={e} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{e}</Typography>
                  <Typography variant="caption">{count} event(s) recorded</Typography>
                </Box>
              );
            })}
          </Grid>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default AuditLog;
