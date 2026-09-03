import * as React from 'react';
import { Alert, Box, Button, Chip, Divider, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import UploadIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ShieldIcon from '@mui/icons-material/GppGood';
import BlockIcon from '@mui/icons-material/Block';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import {
  DataTable, DemoScenarioPanel, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import type { Column } from '../components';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num } from '../utils/format';
import type { CrmDocument } from '../types';
import { DocumentUploadDialog, docIcon, fileSize, RelatedDocuments } from './documents/DocumentPanels';

export function Documents() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({
    docType: 'all', classification: 'all', status: 'all', customer: 'all', linked: 'all',
  });
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const focusDoc = params.get('doc');
  const oppFilter = params.get('opportunity');

  const filtered = store.documents.filter((d) =>
    (filters.docType === 'all' || d.docType === filters.docType)
    && (filters.classification === 'all' || d.classification === filters.classification)
    && (filters.status === 'all' || d.status === filters.status)
    && (filters.customer === 'all' || d.customerId === filters.customer)
    && (filters.linked === 'all'
      || (filters.linked === 'lead' && d.leadId)
      || (filters.linked === 'opportunity' && d.opportunityId)
      || (filters.linked === 'application' && d.applicationId)
      || (filters.linked === 'complaint' && d.complaintId))
    && (!oppFilter || d.opportunityId === oppFilter)
    && (!focusDoc || d.id === focusDoc));

  const customerName = (id: string | null) => store.customers.find((c) => c.id === id)?.organisation ?? '—';

  const columns: Column<CrmDocument>[] = [
    {
      id: 'name', label: 'Document', sortValue: (r) => r.name,
      render: (r) => (
        <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{ flexShrink: 0 }}>{docIcon(r.mimeType)}</Box>
          <Box sx={{ minWidth: 0, maxWidth: 340 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }}>
              {r.id} · {r.version} · {fileSize(r.sizeKb)}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { id: 'docType', label: 'Type', sortValue: (r) => r.docType, hideOn: 'md', render: (r) => <Typography variant="body2" noWrap>{r.docType}</Typography> },
    {
      id: 'classification', label: 'Classification', width: 135, sortValue: (r) => r.classification,
      render: (r) => (
        <Chip size="small" label={r.classification} sx={{
          bgcolor: alpha(r.classification === 'Restricted' ? '#DC2626' : r.classification === 'Confidential' ? '#D97706' : '#64748B', .12),
          color: r.classification === 'Restricted' ? '#DC2626' : r.classification === 'Confidential' ? '#D97706' : '#475569',
        }} />
      ),
    },
    { id: 'customer', label: 'Customer', sortValue: (r) => customerName(r.customerId), hideOn: 'sm', render: (r) => <Typography variant="body2" noWrap>{customerName(r.customerId)}</Typography> },
    {
      id: 'linked', label: 'Linked transaction', width: 200, hideOn: 'md',
      render: (r) => (
        <Stack direction="row" gap={0.4} flexWrap="wrap">
          {r.leadId && <Chip size="small" label="Lead" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha('#2563EB', .1), color: '#2563EB' }} />}
          {r.opportunityId && <Chip size="small" label="Opportunity" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha('#0E7C7B', .1), color: '#0E7C7B' }} />}
          {r.applicationId && <Chip size="small" label="Application" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha('#7C3AED', .1), color: '#7C3AED' }} />}
          {r.complaintId && <Chip size="small" label="Case" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha('#DC2626', .1), color: '#DC2626' }} />}
          {!r.leadId && !r.opportunityId && !r.applicationId && !r.complaintId && (
            <Typography variant="caption" color="text.disabled">Customer only</Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'scan', label: 'Security scan', width: 140, sortValue: (r) => r.scanResult,
      render: (r) => (
        <Tooltip title={r.scanResult === 'Clean' ? 'Passed the malware scan and stored' : 'Threat detected — the upload was blocked and quarantined'}>
          <Stack direction="row" gap={0.5} alignItems="center">
            {r.scanResult === 'Clean'
              ? <ShieldIcon sx={{ fontSize: 16, color: 'success.main' }} />
              : <BlockIcon sx={{ fontSize: 16, color: 'error.main' }} />}
            <Typography variant="body2" sx={{ color: r.scanResult === 'Clean' ? 'success.main' : 'error.main', fontWeight: 600 }}>
              {r.scanResult}
            </Typography>
          </Stack>
        </Tooltip>
      ),
    },
    { id: 'status', label: 'Status', width: 105, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    { id: 'uploaded', label: 'Uploaded', hideOn: 'md', sortValue: (r) => r.uploadedAt, render: (r) => <Typography variant="body2">{fmtDate(r.uploadedAt)}</Typography> },
  ];

  const blocked = store.documents.filter((d) => d.status === 'Blocked');

  return (
    <Box>
      <PageHeader
        title="Document Management"
        subtitle="Secure storage with structured metadata, version history, classification, retention and automatic linking to the originating transaction — no manual re-association."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Documents' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Documents', filtered.map((d) => ({
                'Document ID': d.id, Name: d.name, Type: d.docType, Classification: d.classification,
                Customer: customerName(d.customerId), 'Transaction reference': d.transactionRef,
                Version: d.version, Status: d.status, 'Scan result': d.scanResult,
                'Size (KB)': d.sizeKb, 'MIME type': d.mimeType,
                'Uploaded by': store.users.find((u) => u.id === d.uploadedById)?.name ?? '',
                'Upload date': fmtDate(d.uploadedAt), 'Retention until': d.retentionUntil,
                Versions: d.versions.length,
              })))}
            >
              Export Excel
            </Button>
            <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
              Upload document
            </Button>
          </>
        }
      />

      <DemoScenarioPanel
        scenario="A supporting document is uploaded against a transaction. The system validates the file type and size, scans it, classifies it, sets a retention date and links it to the customer and transaction automatically."
        evidence={[
          'File type and size rules enforced from the Configuration Centre',
          'Scanning → Safe → Saved progression, with a demonstrable blocked file',
          'Structured metadata: type, classification, version, status, owner, retention',
          'Full version history per document',
          'Automatic linking to customer, lead, opportunity, application and case',
        ]}
        requirements={[48, 49, 50, 80, 81]}
        next="Open the customer 360 view to follow the traceability chain"
        nextTo="/customers"
      />

      {blocked.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<BlockIcon />}>
          <strong>{blocked.length} upload(s) blocked by the security scan.</strong>{' '}
          {blocked.map((d) => d.name).join(', ')} — quarantined rather than stored, with an audit event written and
          the information security administrator notified.
        </Alert>
      )}

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total documents" value={num(store.documents.length)} colour="#0B2545" />
        <KpiCard dense label="Restricted" value={num(store.documents.filter((d) => d.classification === 'Restricted').length)} sub="Highest classification" colour="#DC2626" onClick={() => set('classification', 'Restricted')} />
        <KpiCard dense label="Confidential" value={num(store.documents.filter((d) => d.classification === 'Confidential').length)} colour="#D97706" onClick={() => set('classification', 'Confidential')} />
        <KpiCard dense label="Signed documents" value={num(store.documents.filter((d) => d.status === 'Signed').length)} colour="#0E7C7B" onClick={() => set('status', 'Signed')} />
        <KpiCard dense label="Blocked uploads" value={num(blocked.length)} sub="Threat detected" colour="#B91C1C" onClick={() => set('status', 'Blocked')} />
        <KpiCard dense label="Multi-version" value={num(store.documents.filter((d) => d.versions.length > 1).length)} sub="Version controlled" colour="#7C3AED" />
      </Grid>

      <FilterBar
        filters={[
          { id: 'docType', label: 'Document type', options: [{ value: 'all', label: 'All types' }, ...Array.from(new Set(store.documents.map((d) => d.docType))).sort().map((t) => ({ value: t, label: t }))], width: 210 },
          { id: 'classification', label: 'Classification', options: [{ value: 'all', label: 'All' }, ...['Public', 'Internal', 'Confidential', 'Restricted'].map((c) => ({ value: c, label: c }))], width: 165 },
          { id: 'status', label: 'Status', options: [{ value: 'all', label: 'All statuses' }, ...['Saved', 'Signed', 'Blocked', 'Archived'].map((s) => ({ value: s, label: s }))], width: 150 },
          { id: 'customer', label: 'Customer', options: [{ value: 'all', label: 'All customers' }, ...store.customers.map((c) => ({ value: c.id, label: c.organisation }))], width: 220 },
          { id: 'linked', label: 'Linked to', options: [{ value: 'all', label: 'Any transaction' }, { value: 'lead', label: 'Lead' }, { value: 'opportunity', label: 'Opportunity' }, { value: 'application', label: 'Application' }, { value: 'complaint', label: 'Complaint' }], width: 170 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => { setFilters({ docType: 'all', classification: 'all', status: 'all', customer: 'all', linked: 'all' }); navigate('/documents'); }}
      />

      {focusDoc ? (
        <SectionCard title="Selected document" action={<Button size="small" onClick={() => navigate('/documents')}>Show all documents</Button>}>
          <RelatedDocuments documents={filtered} />
        </SectionCard>
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          searchable
          searchPlaceholder="Search document name, type, transaction reference or customer…"
          searchFields={(r) => `${r.name} ${r.docType} ${r.transactionRef} ${customerName(r.customerId)} ${r.classification}`}
          defaultSort={{ id: 'uploaded', dir: 'desc' }}
          onRowClick={(r) => navigate(`/documents?doc=${r.id}`)}
          initialRowsPerPage={15}
        />
      )}

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Document traceability chain"
          subtitle="Every document carries the transaction context it was uploaded against, so the full chain can be walked in either direction"
        >
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center" sx={{ mb: 2 }}>
            {['Customer', 'Lead', 'Opportunity', 'Application', 'Quote', 'Signed form', 'Supporting documents', 'Case'].map((n, i, arr) => (
              <React.Fragment key={n}>
                <Chip label={n} sx={{ bgcolor: alpha('#0B2545', .07), fontWeight: 600 }} />
                {i < arr.length - 1 && <Typography sx={{ color: 'text.disabled' }}>→</Typography>}
              </React.Fragment>
            ))}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
            {[
              ['Automatic linking', 'A document uploaded from a case, lead, opportunity or application inherits the customer and transaction links at the moment of upload.'],
              ['No re-association', 'There is no separate workflow step to attach a document to a transaction — the link is created by the context it was uploaded from.'],
              ['Version control', 'Every re-upload creates a new version with the uploader, timestamp, size and change note retained.'],
              ['Retention', 'Each document carries a retention date derived from the record type, supporting the POPIA retention obligation.'],
            ].map(([title, body]) => (
              <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
              </Box>
            ))}
          </Grid>
        </SectionCard>
      </Box>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        links={{ customerId: store.customers[0]?.id ?? null, transactionRef: 'General document library' }}
      />
    </Box>
  );
}

export default Documents;
