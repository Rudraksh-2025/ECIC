import * as React from 'react';
import { Avatar, Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import DrawIcon from '@mui/icons-material/Draw';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  DataTable, DemoScenarioPanel, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import type { Column } from '../components';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num } from '../utils/format';
import type { Application } from '../types';

const WORKFLOW = ['Draft', 'Submitted', 'Under Review', 'Awaiting Approval', 'Approved'];

export function Applications() {
  const navigate = useNavigate();
  const store = useStore();
  const [filters, setFilters] = React.useState({ status: 'all', formType: 'all', owner: 'all', signed: 'all' });
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const filtered = store.applications.filter((a) =>
    (filters.status === 'all' || a.status === filters.status)
    && (filters.formType === 'all' || a.formType === filters.formType)
    && (filters.owner === 'all' || a.ownerId === filters.owner)
    && (filters.signed === 'all' || (filters.signed === 'signed' ? a.signature.signed : !a.signature.signed)));

  const customerName = (id: string) => store.customers.find((c) => c.id === id)?.organisation ?? '—';

  const columns: Column<Application>[] = [
    {
      id: 'reference', label: 'Reference', width: 165, sortValue: (r) => r.reference,
      render: (r) => (
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}>
            {r.reference}
          </Typography>
          {r.signature.signed && <Tooltip title={`Digitally signed ${fmtDate(r.signature.signedAt)}`}><DrawIcon sx={{ fontSize: 14, color: 'secondary.main' }} /></Tooltip>}
          {r.locked && <Tooltip title="Locked after signature"><LockIcon sx={{ fontSize: 13, color: 'text.disabled' }} /></Tooltip>}
        </Stack>
      ),
    },
    {
      id: 'form', label: 'Application & customer', sortValue: (r) => r.formType,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 360 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.formType}</Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>{customerName(r.customerId)}</Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 150, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    {
      id: 'workflow', label: 'Workflow position', width: 190, hideOn: 'md',
      render: (r) => {
        const idx = r.status === 'Rejected' ? WORKFLOW.length - 1 : WORKFLOW.indexOf(r.status);
        return (
          <Stack direction="row" gap={0.4} alignItems="center">
            {WORKFLOW.map((s, i) => (
              <Tooltip key={s} title={s}>
                <Box sx={{
                  width: 22, height: 5, borderRadius: 3,
                  bgcolor: r.status === 'Rejected' && i >= idx ? '#DC2626'
                    : i <= idx ? '#0E7C7B' : alpha('#0B2545', .12),
                }} />
              </Tooltip>
            ))}
          </Stack>
        );
      },
    },
    {
      id: 'owner', label: 'Owner', hideOn: 'sm', sortValue: (r) => r.ownerId,
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
      id: 'reviewer', label: 'Underwriter', hideOn: 'md', sortValue: (r) => r.reviewerId ?? '',
      render: (r) => <Typography variant="body2" noWrap>{store.users.find((u) => u.id === (r.reviewerId ?? r.approverId))?.name ?? '—'}</Typography>,
    },
    {
      id: 'docs', label: 'Docs', align: 'center', width: 70, hideOn: 'md',
      render: (r) => <Chip size="small" label={r.documentIds.length} sx={{ height: 20, bgcolor: alpha('#C9A227', .14), color: '#8A6D0B', fontWeight: 700 }} />,
    },
    {
      id: 'created', label: 'Created', hideOn: 'md', sortValue: (r) => r.createdDate,
      render: (r) => <Typography variant="body2">{fmtDate(r.createdDate)}</Typography>,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Digital Applications"
        subtitle="Electronic application forms replacing manual paperwork — completed on any device, digitally signed, locked on signature and routed through the underwriting workflow."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Applications' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Applications', filtered.map((a) => ({
                Reference: a.reference, 'Form type': a.formType, Customer: customerName(a.customerId),
                Opportunity: store.opportunities.find((o) => o.id === a.opportunityId)?.reference ?? '',
                Status: a.status, Owner: store.users.find((u) => u.id === a.ownerId)?.name ?? '',
                Reviewer: store.users.find((u) => u.id === a.reviewerId)?.name ?? '',
                Approver: store.users.find((u) => u.id === a.approverId)?.name ?? '',
                Created: fmtDate(a.createdDate), Submitted: a.submittedDate ? fmtDate(a.submittedDate) : '',
                Decision: a.decisionDate ? fmtDate(a.decisionDate) : '',
                Signed: a.signature.signed ? 'Yes' : 'No',
                'Signed at': a.signature.signedAt ? fmtDate(a.signature.signedAt) : '',
                'Certificate reference': a.signature.certificateRef,
                Documents: a.documentIds.length, 'Rejection reason': a.rejectionReason ?? '',
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/applications/new')}>
              New application
            </Button>
          </>
        }
      />

      <DemoScenarioPanel
        scenario="An exporter completes an ECIC cover application digitally, signs it electronically and submits it. Underwriting reviews and approves it — all without a paper form."
        evidence={[
          'Three ECIC application forms rendered from configurable field definitions',
          'Draft auto-save, mandatory validation and mobile-friendly layout',
          'Simulated digital signature capturing signer, consent, timestamp and device',
          'Document locking on signature and a workflow status stepper',
          'Supporting documents linked automatically to the application and opportunity',
        ]}
        requirements={[29, 44, 45, 46, 47, 52]}
        next="Open a draft application and sign it"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total applications" value={num(store.applications.length)} colour="#0B2545" />
        <KpiCard dense label="Drafts" value={num(store.applications.filter((a) => a.status === 'Draft').length)} sub="Not yet submitted" colour="#64748B" onClick={() => set('status', 'Draft')} />
        <KpiCard dense label="In review" value={num(store.applications.filter((a) => ['Submitted', 'Under Review'].includes(a.status)).length)} colour="#2563EB" onClick={() => set('status', 'Under Review')} />
        <KpiCard dense label="Awaiting approval" value={num(store.applications.filter((a) => a.status === 'Awaiting Approval').length)} colour="#D97706" onClick={() => set('status', 'Awaiting Approval')} />
        <KpiCard dense label="Approved" value={num(store.applications.filter((a) => a.status === 'Approved').length)} colour="#059669" onClick={() => set('status', 'Approved')} />
        <KpiCard dense label="Digitally signed" value={num(store.applications.filter((a) => a.signature.signed).length)} sub="Locked records" colour="#0E7C7B" onClick={() => set('signed', 'signed')} />
      </Grid>

      <FilterBar
        filters={[
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...['Draft', 'Submitted', 'Under Review', 'Awaiting Approval', 'Approved', 'Rejected'].map((s) => ({ value: s, label: s }))], width: 180 },
          { id: 'formType', label: 'Form type', options: [{ value: 'all', label: 'All forms' }, ...Array.from(new Set(store.applications.map((a) => a.formType))).map((f) => ({ value: f, label: f }))], width: 300 },
          { id: 'owner', label: 'Owner', options: [{ value: 'all', label: 'All owners' }, ...store.users.filter((u) => u.status === 'Active').map((u) => ({ value: u.id, label: u.name }))], width: 175 },
          { id: 'signed', label: 'Signature', options: [{ value: 'all', label: 'All' }, { value: 'signed', label: 'Signed' }, { value: 'unsigned', label: 'Not signed' }], width: 145 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ status: 'all', formType: 'all', owner: 'all', signed: 'all' })}
      />

      <DataTable
        rows={filtered}
        columns={columns}
        searchable
        searchPlaceholder="Search reference, form type or customer…"
        searchFields={(r) => `${r.reference} ${r.formType} ${customerName(r.customerId)}`}
        defaultSort={{ id: 'created', dir: 'desc' }}
        onRowClick={(r) => navigate(`/applications/${r.id}`)}
        initialRowsPerPage={15}
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard title="Application workflow" subtitle="Every status change raises a notification to the responsible party and is visible to the customer in the portal">
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            {[...WORKFLOW, 'Rejected'].map((s, i, arr) => (
              <React.Fragment key={s}>
                <Box sx={{
                  px: 1.75, py: 1, borderRadius: 2, textAlign: 'center',
                  bgcolor: 'surface.subtle', border: '1px solid', borderColor: 'divider', minWidth: 118,
                }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{s}</Typography>
                  <Typography variant="caption">
                    {store.applications.filter((a) => a.status === s).length} application(s)
                  </Typography>
                </Box>
                {i < arr.length - 2 && <Typography sx={{ color: 'text.disabled' }}>→</Typography>}
              </React.Fragment>
            ))}
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Applications;
