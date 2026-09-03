import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { DataTable, EmptyState, Grid, KpiCard, SectionCard, Stack, StatusChip } from '../../components';
import type { Column } from '../../components';
import { fmtDate } from '../../utils/dates';
import { num, zar } from '../../utils/format';
import type { Lead } from '../../types';

export function PortalEnquiries() {
  const navigate = useNavigate();
  const store = useStore();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const leads = store.leads.filter((l) => l.customerId === customer.id);

  const columns: Column<Lead>[] = [
    {
      id: 'reference', label: 'Enquiry', sortValue: (r) => r.reference,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 340 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.productInterest}</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace' }}>{r.reference}</Typography>
        </Box>
      ),
    },
    { id: 'enquiryType', label: 'Type', hideOn: 'sm', sortValue: (r) => r.enquiryType, render: (r) => <Typography variant="body2" noWrap>{r.enquiryType}</Typography> },
    { id: 'country', label: 'Target market', hideOn: 'sm', sortValue: (r) => r.country, render: (r) => <Typography variant="body2">{r.country}</Typography> },
    {
      id: 'value', label: 'Indicative value', align: 'right', width: 150, sortValue: (r) => r.estimatedValue,
      render: (r) => <Typography variant="body2" sx={{ fontWeight: 600 }}>{zar(r.estimatedValue, true)}</Typography>,
    },
    { id: 'status', label: 'Status', width: 130, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    {
      id: 'owner', label: 'Your ECIC contact', hideOn: 'sm',
      render: (r) => {
        const u = store.users.find((x) => x.id === r.ownerId);
        return u ? (
          <Box>
            <Typography variant="body2" noWrap>{u.name}</Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }}>{u.phone}</Typography>
          </Box>
        ) : <Typography variant="body2" color="text.disabled">Being allocated</Typography>;
      },
    },
    { id: 'created', label: 'Submitted', hideOn: 'sm', sortValue: (r) => r.createdDate, render: (r) => <Typography variant="body2">{fmtDate(r.createdDate)}</Typography> },
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h2">My enquiries</Typography>
          <Typography variant="body2" color="text.secondary">
            Every cover enquiry you have submitted to ECIC, and the officer handling it.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/portal/enquiries/new')}>
          Submit an enquiry
        </Button>
      </Stack>

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Enquiries" value={num(leads.length)} colour="#0B2545" />
        <KpiCard dense label="In progress" value={num(leads.filter((l) => ['New', 'Assigned', 'Contacted'].includes(l.status)).length)} colour="#2563EB" />
        <KpiCard dense label="Qualified" value={num(leads.filter((l) => l.status === 'Qualified').length)} colour="#059669" />
        <KpiCard dense label="Progressed to cover" value={num(leads.filter((l) => l.status === 'Converted').length)} colour="#0E7C7B" />
      </Grid>

      <SectionCard>
        {leads.length === 0 ? (
          <EmptyState
            title="No enquiries yet"
            description="Tell us what you would like to export and where, and an ECIC Business Development Officer will be in touch within two business days."
            action={<Button variant="contained" onClick={() => navigate('/portal/enquiries/new')}>Submit an enquiry</Button>}
          />
        ) : (
          <DataTable
            rows={leads}
            columns={columns}
            searchable
            searchPlaceholder="Search your enquiries…"
            searchFields={(r) => `${r.reference} ${r.productInterest} ${r.enquiryType} ${r.country}`}
            defaultSort={{ id: 'created', dir: 'desc' }}
          />
        )}
      </SectionCard>
    </Box>
  );
}

export default PortalEnquiries;
