import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, LinearProgress, MenuItem, TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import ImageIcon from '@mui/icons-material/Image';
import MailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/GppGood';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import { Link as RouterLink } from 'react-router-dom';
import { useStore } from '../../store';
import { api } from '../../services/mockApi';
import { EmptyState, Grid, LabelValue, Stack, StatusChip } from '../../components';
import { toast } from '../../hooks';
import { fmtDate, fmtDateTime } from '../../utils/dates';
import type { CrmDocument, DocumentClassification } from '../../types';

export function docIcon(mime: string) {
  if (mime.includes('pdf')) return <PictureAsPdfIcon sx={{ fontSize: 19, color: '#DC2626' }} />;
  if (mime.includes('spreadsheet') || mime.includes('csv')) return <TableChartIcon sx={{ fontSize: 19, color: '#059669' }} />;
  if (mime.includes('image')) return <ImageIcon sx={{ fontSize: 19, color: '#7C3AED' }} />;
  if (mime.includes('outlook')) return <MailIcon sx={{ fontSize: 19, color: '#2563EB' }} />;
  return <DescriptionIcon sx={{ fontSize: 19, color: '#0B2545' }} />;
}

export function fileSize(kb: number): string {
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function RelatedDocuments({ documents, showLinks = true }: { documents: CrmDocument[]; showLinks?: boolean }) {
  const store = useStore();
  const [selected, setSelected] = React.useState<CrmDocument | null>(null);

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents linked yet"
        description="Documents uploaded from this record are linked to it automatically — no manual re-association step is required."
      />
    );
  }

  return (
    <>
      <Stack gap={1}>
        {documents.map((d) => (
          <Box
            key={d.id}
            onClick={() => setSelected(d)}
            sx={{
              p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'surface.subtle' },
            }}
          >
            <Stack direction="row" gap={1.5} alignItems="center">
              <Box sx={{ flexShrink: 0 }}>{docIcon(d.mimeType)}</Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{d.name}</Typography>
                <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                  {d.docType} · {d.version} · {fileSize(d.sizeKb)} · uploaded {fmtDate(d.uploadedAt)} by{' '}
                  {store.users.find((u) => u.id === d.uploadedById)?.name ?? 'system'}
                </Typography>
              </Box>
              <Stack direction="row" gap={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                <Chip size="small" label={d.classification} sx={{
                  bgcolor: alpha(d.classification === 'Restricted' ? '#DC2626' : d.classification === 'Confidential' ? '#D97706' : '#64748B', .12),
                  color: d.classification === 'Restricted' ? '#DC2626' : d.classification === 'Confidential' ? '#D97706' : '#475569',
                }} />
                <StatusChip value={d.status} />
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        {selected && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Stack direction="row" gap={1.25} alignItems="center">
                {docIcon(selected.mimeType)}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" noWrap>{selected.name}</Typography>
                  <Typography variant="caption">{selected.docType} · {selected.id}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{
                height: 200, borderRadius: 2.5, bgcolor: 'surface.sunken', display: 'grid',
                placeItems: 'center', mb: 2.5, border: '1px dashed', borderColor: 'divider',
              }}>
                <Stack alignItems="center" gap={1}>
                  {docIcon(selected.mimeType)}
                  <Typography variant="body2" color="text.secondary">Document preview</Typography>
                  <Chip size="small" label="DEMO / SIMULATED preview — binary content is not stored in this browser demonstration"
                    sx={{ bgcolor: alpha('#7C3AED', .1), color: '#7C3AED', maxWidth: 460, height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center' } }} />
                </Stack>
              </Box>
              <Typography variant="overline" color="text.secondary">Document metadata</Typography>
              <Grid cols={{ xs: 2, sm: 3, md: 4 }} gap={2} sx={{ mt: 0.5, mb: 2.5 }}>
                <LabelValue label="Document type" value={selected.docType} />
                <LabelValue label="Classification" value={selected.classification} />
                <LabelValue label="Version" value={selected.version} />
                <LabelValue label="Status" value={<StatusChip value={selected.status} />} />
                <LabelValue label="Size" value={fileSize(selected.sizeKb)} />
                <LabelValue label="Uploaded by" value={store.users.find((u) => u.id === selected.uploadedById)?.name} />
                <LabelValue label="Upload date" value={fmtDateTime(selected.uploadedAt)} />
                <LabelValue label="Security scan" value={
                  <Stack direction="row" gap={0.5} alignItems="center">
                    {selected.scanResult === 'Clean'
                      ? <ShieldIcon sx={{ fontSize: 15, color: 'success.main' }} />
                      : <BlockIcon sx={{ fontSize: 15, color: 'error.main' }} />}
                    <Typography variant="body2">{selected.scanResult}</Typography>
                  </Stack>
                } />
                <LabelValue label="Transaction reference" value={selected.transactionRef || '—'} mono />
                <LabelValue label="Retention until" value={fmtDate(selected.retentionUntil)} />
                <LabelValue label="MIME type" value={selected.mimeType} mono />
                <LabelValue label="Document ID" value={selected.id} mono />
              </Grid>

              {showLinks && (
                <>
                  <Typography variant="overline" color="text.secondary">Linked records — full traceability</Typography>
                  <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75, mb: 2.5 }}>
                    {selected.customerId && (
                      <Chip size="small" clickable component={RouterLink} to={`/customers/${selected.customerId}`}
                        label={`Customer: ${store.customers.find((c) => c.id === selected.customerId)?.organisation ?? selected.customerId}`} />
                    )}
                    {selected.leadId && (
                      <Chip size="small" clickable component={RouterLink} to={`/leads/${selected.leadId}`}
                        label={`Lead: ${store.leads.find((l) => l.id === selected.leadId)?.reference ?? selected.leadId}`} />
                    )}
                    {selected.opportunityId && (
                      <Chip size="small" clickable component={RouterLink} to={`/opportunities/${selected.opportunityId}`}
                        label={`Opportunity: ${store.opportunities.find((o) => o.id === selected.opportunityId)?.reference ?? selected.opportunityId}`} />
                    )}
                    {selected.applicationId && (
                      <Chip size="small" clickable component={RouterLink} to={`/applications/${selected.applicationId}`}
                        label={`Application: ${store.applications.find((a) => a.id === selected.applicationId)?.reference ?? selected.applicationId}`} />
                    )}
                    {selected.complaintId && (
                      <Chip size="small" clickable component={RouterLink} to={`/complaints/${selected.complaintId}`}
                        label={`Case: ${store.complaints.find((c) => c.id === selected.complaintId)?.reference ?? selected.complaintId}`} />
                    )}
                    {selected.campaignId && (
                      <Chip size="small" clickable component={RouterLink} to={`/campaigns/${selected.campaignId}`}
                        label={`Campaign: ${store.campaigns.find((c) => c.id === selected.campaignId)?.name ?? selected.campaignId}`} />
                    )}
                  </Stack>
                </>
              )}

              <Typography variant="overline" color="text.secondary">
                <Stack direction="row" gap={0.75} alignItems="center" component="span">
                  <HistoryIcon sx={{ fontSize: 15 }} /> Version history
                </Stack>
              </Typography>
              <Stack gap={1} sx={{ mt: 0.75 }}>
                {selected.versions.map((v) => (
                  <Stack key={v.version} direction="row" gap={1.5} alignItems="center"
                    sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                    <Chip size="small" label={v.version} sx={{ fontWeight: 700 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2">{v.note}</Typography>
                      <Typography variant="caption">
                        {store.users.find((u) => u.id === v.uploadedById)?.name} · {fmtDateTime(v.uploadedAt)} · {fileSize(v.sizeKb)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Tooltip title="In this frontend demonstration no binary content is stored, so a metadata summary is downloaded instead.">
                <Button
                  variant="contained" startIcon={<DownloadIcon />}
                  onClick={() => {
                    const blob = new Blob([
                      `ECIC CRM PLATFORM — DOCUMENT METADATA (DEMO)\n`,
                      `Generated: ${new Date().toLocaleString('en-ZA')}\n\n`,
                      `Name: ${selected.name}\nType: ${selected.docType}\nClassification: ${selected.classification}\n`,
                      `Version: ${selected.version}\nStatus: ${selected.status}\nScan result: ${selected.scanResult}\n`,
                      `Transaction reference: ${selected.transactionRef}\nRetention until: ${selected.retentionUntil}\n`,
                    ], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selected.id}_metadata.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
              </Tooltip>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

const SAMPLE_FILES = [
  { name: 'Audited_Annual_Financial_Statements_2025.pdf', sizeKb: 4180, mime: 'application/pdf', type: 'Financial Statements' },
  { name: 'Export_Contract_Signed.pdf', sizeKb: 2240, mime: 'application/pdf', type: 'Contract' },
  { name: 'Buyer_Credit_Report.pdf', sizeKb: 860, mime: 'application/pdf', type: 'Credit Report' },
  { name: 'Premium_Calculation.xlsx', sizeKb: 312, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', type: 'Worksheet' },
  { name: 'Customer_Correspondence.msg', sizeKb: 96, mime: 'application/vnd.ms-outlook', type: 'Correspondence' },
  { name: 'buyer_statement_final.pdf.exe', sizeKb: 1840, mime: 'application/x-msdownload', type: 'Unclassified Upload' },
  { name: 'Project_Photographs.zip', sizeKb: 18400, mime: 'application/zip', type: 'Supporting Document' },
];

export function DocumentUploadDialog({
  open, onClose, links,
}: {
  open: boolean;
  onClose: () => void;
  links: Partial<CrmDocument>;
}) {
  const config = useStore((s) => s.configuration.security);
  const [file, setFile] = React.useState(SAMPLE_FILES[0].name);
  const [classification, setClassification] = React.useState<DocumentClassification>('Confidential');
  const [phase, setPhase] = React.useState<'idle' | 'uploading' | 'scanning' | 'safe' | 'blocked'>('idle');
  const [progress, setProgress] = React.useState(0);
  const [reason, setReason] = React.useState('');

  const selected = SAMPLE_FILES.find((f) => f.name === file)!;
  const validation = api.validateUpload(selected.name, selected.sizeKb);

  const reset = () => { setPhase('idle'); setProgress(0); setReason(''); };

  const start = async () => {
    setPhase('uploading');
    setProgress(0);
    for (let p = 0; p <= 100; p += 10) {
      setProgress(p);
      await new Promise((r) => setTimeout(r, 45));
    }
    setPhase('scanning');
    await new Promise((r) => setTimeout(r, 900));
    if (!validation.ok) {
      setPhase('blocked');
      setReason(validation.reason);
      await api.uploadDocument({
        ...links, name: selected.name, docType: selected.type, classification,
        sizeKb: selected.sizeKb, mimeType: selected.mime, status: 'Blocked',
      });
      toast({ message: 'Upload blocked by the security scan', severity: 'error', detail: validation.reason });
      return;
    }
    setPhase('safe');
    await api.uploadDocument({
      ...links, name: selected.name, docType: selected.type, classification,
      sizeKb: selected.sizeKb, mimeType: selected.mime,
    });
    toast({
      message: 'Document uploaded and linked',
      severity: 'success',
      detail: `Security scan returned Clean. The document was linked automatically to ${links.transactionRef ?? 'this record'} with no manual re-association.`,
    });
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} fullWidth maxWidth="sm">
      <DialogTitle>Upload document</DialogTitle>
      <DialogContent dividers>
        <Stack gap={2.5}>
          <Alert severity="info" icon={false}>
            <Typography variant="caption">
              Permitted file types: <strong>{config.allowedFileTypes.join(', ')}</strong> ·
              Maximum size: <strong>{config.maxFileSizeMb} MB</strong>. Both rules are maintained in
              Configuration → Security and are enforced at upload.
            </Typography>
          </Alert>
          <TextField
            select label="Select a file" value={file}
            onChange={(e) => { setFile(e.target.value); reset(); }}
            disabled={phase !== 'idle'} fullWidth
            helperText="A file picker is simulated so the security controls can be demonstrated reliably during the presentation."
          >
            {SAMPLE_FILES.map((f) => (
              <MenuItem key={f.name} value={f.name}>
                {f.name} <Typography component="span" variant="caption" sx={{ ml: 1 }}>({fileSize(f.sizeKb)})</Typography>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Document classification" value={classification}
            onChange={(e) => setClassification(e.target.value as DocumentClassification)}
            disabled={phase !== 'idle'} fullWidth
          >
            {(['Public', 'Internal', 'Confidential', 'Restricted'] as DocumentClassification[]).map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>

          {phase !== 'idle' && (
            <Box>
              <Stack gap={1.25}>
                {[
                  { key: 'uploading', label: 'Uploading', done: phase !== 'uploading' },
                  { key: 'scanning', label: 'Security scanning', done: phase === 'safe' || phase === 'blocked' },
                  { key: 'safe', label: phase === 'blocked' ? 'Blocked' : 'Safe — stored and linked', done: phase === 'safe' || phase === 'blocked' },
                ].map((s) => (
                  <Stack key={s.key} direction="row" gap={1.25} alignItems="center">
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%',
                      bgcolor: phase === 'blocked' && s.key === 'safe' ? '#DC2626' : s.done ? '#059669' : '#D97706',
                      animation: !s.done ? 'ecic-pulse 1s infinite' : 'none',
                    }} />
                    <Typography variant="body2" sx={{ fontWeight: s.done ? 600 : 400 }}>{s.label}</Typography>
                  </Stack>
                ))}
              </Stack>
              {phase === 'uploading' && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1.5 }} />}
              {phase === 'scanning' && <LinearProgress sx={{ mt: 1.5 }} />}
            </Box>
          )}

          {phase === 'blocked' && (
            <Alert severity="error">
              <AlertTitle>Upload rejected</AlertTitle>
              <Typography variant="body2">{reason}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption">
                The file was quarantined rather than stored, an audit event was written and the information
                security administrator was notified. File scanning is a DEMO / SIMULATED control in this
                browser-only build; a production deployment integrates an anti-malware service.
              </Typography>
            </Alert>
          )}
          {phase === 'safe' && (
            <Alert severity="success">
              <AlertTitle>Uploaded, scanned and linked</AlertTitle>
              <Typography variant="body2">
                The document was stored with classification {classification}, a retention date, version v1.0 and
                automatic links to the originating record. It now appears under Related Documents without any
                manual re-association.
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => { reset(); onClose(); }}>{phase === 'safe' || phase === 'blocked' ? 'Done' : 'Cancel'}</Button>
        <Button
          variant="contained" onClick={start}
          disabled={phase !== 'idle'}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
