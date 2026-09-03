import * as React from 'react';
import { Alert, Box, Button, Chip, Typography } from '@mui/material';
import UploadIcon from '@mui/icons-material/UploadFile';
import { useStore } from '../../store';
import { EmptyState, Grid, KpiCard, SectionCard, Stack } from '../../components';
import { DocumentUploadDialog, RelatedDocuments } from '../documents/DocumentPanels';
import { num } from '../../utils/format';

export function PortalDocuments() {
  const store = useStore();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const documents = store.documents.filter((d) => d.customerId === customer.id && d.status !== 'Blocked');
  const cfg = store.configuration.security;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h2">My documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Everything you have provided to ECIC, and everything ECIC has issued to you.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
          Upload a document
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2.5 }}>
        Permitted file types: <strong>{cfg.allowedFileTypes.map((t) => `.${t}`).join(', ')}</strong>.
        Maximum size <strong>{cfg.maxFileSizeMb} MB</strong>. Every upload is security scanned before it is stored,
        and is automatically linked to the case, enquiry or application you uploaded it against — you never have to
        attach it twice.
      </Alert>

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Documents" value={num(documents.length)} colour="#0B2545" />
        <KpiCard dense label="Signed" value={num(documents.filter((d) => d.status === 'Signed').length)} colour="#0E7C7B" />
        <KpiCard dense label="Linked to applications" value={num(documents.filter((d) => d.applicationId).length)} colour="#7C3AED" />
        <KpiCard dense label="Linked to cases" value={num(documents.filter((d) => d.complaintId).length)} colour="#DC2626" />
      </Grid>

      <SectionCard title="Document library" subtitle="Select a document to see its details and version history">
        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Documents you upload against an enquiry, application or case appear here, together with anything ECIC issues to you."
            action={<Button variant="contained" onClick={() => setUploadOpen(true)}>Upload a document</Button>}
          />
        ) : (
          <RelatedDocuments documents={documents} showLinks={false} />
        )}
      </SectionCard>

      <Box sx={{ mt: 2.5 }}>
        <SectionCard title="How ECIC protects your documents">
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
            {[
              ['Security scanned', 'Every upload is scanned before it is stored. Anything suspicious is rejected and quarantined.'],
              ['Classified', 'Each document is classified so that access is restricted to the ECIC staff who need it.'],
              ['Version controlled', 'Replacing a document keeps the previous version, with who changed it and when.'],
              ['Retention managed', 'Documents are retained only for the period required by law and regulation.'],
            ].map(([title, body]) => (
              <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
              </Box>
            ))}
          </Grid>
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 2 }}>
            {cfg.allowedFileTypes.map((t) => <Chip key={t} size="small" label={`.${t}`} />)}
          </Stack>
        </SectionCard>
      </Box>

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        links={{ customerId: customer.id, transactionRef: `Portal upload — ${customer.organisation}` }}
      />
    </Box>
  );
}

export default PortalDocuments;
