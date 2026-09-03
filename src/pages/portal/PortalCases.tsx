import * as React from 'react';
import { Box, Button, Chip, Divider, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { ActivityTimeline, DataTable, EmptyState, Grid, KpiCard, SectionCard, SlaBar, Stack, StatusChip } from '../../components';
import type { Column } from '../../components';
import { useComplaintSla } from '../../hooks';
import { fmtDate } from '../../utils/dates';
import { num } from '../../utils/format';
import type { Complaint } from '../../types';

export function PortalCases() {
  const navigate = useNavigate();
  const store = useStore();
  const slaOf = useComplaintSla();
  const [selected, setSelected] = React.useState<Complaint | null>(null);
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];

  const cases = store.complaints
    .filter((c) => c.customerId === customer.id)
    .map((c) => ({ ...c, _sla: slaOf(c) }));

  const columns: Column<Complaint & { _sla: ReturnType<typeof slaOf> }>[] = [
    {
      id: 'reference', label: 'Case', sortValue: (r) => r.reference,
      render: (r) => (
        <Box sx={{ minWidth: 0, maxWidth: 340 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.subject}</Typography>
          <Typography variant="caption" sx={{ fontFamily: 'ui-monospace, monospace' }}>{r.reference}</Typography>
        </Box>
      ),
    },
    { id: 'status', label: 'Status', width: 130, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status} /> },
    { id: 'category', label: 'Category', hideOn: 'sm', sortValue: (r) => r.category, render: (r) => <Typography variant="body2">{r.category}</Typography> },
    { id: 'raised', label: 'Raised', hideOn: 'sm', sortValue: (r) => r.loggedDate, render: (r) => <Typography variant="body2">{fmtDate(r.loggedDate)}</Typography> },
    {
      id: 'target', label: 'Target resolution', width: 170,
      render: (r) => r.status === 'Closed'
        ? <Typography variant="body2">Closed {fmtDate(r.closedDate)}</Typography>
        : <SlaBar consumed={r._sla.consumed} risk={r._sla.risk} compact />,
    },
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1.5} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h2">My cases</Typography>
          <Typography variant="body2" color="text.secondary">Every complaint you have raised with ECIC, and its current status.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/portal/cases/new')}>Submit a complaint</Button>
      </Stack>

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total cases" value={num(cases.length)} colour="#0B2545" />
        <KpiCard dense label="Open" value={num(cases.filter((c) => c.status !== 'Closed').length)} colour="#D97706" />
        <KpiCard dense label="Resolved" value={num(cases.filter((c) => c.status === 'Resolved').length)} colour="#059669" />
        <KpiCard dense label="Closed" value={num(cases.filter((c) => c.status === 'Closed').length)} colour="#334155" />
      </Grid>

      {selected ? (
        <SectionCard
          title={selected.subject}
          subtitle={`${selected.reference} · raised ${fmtDate(selected.loggedDate)} via ${selected.channel}`}
          action={<Button size="small" onClick={() => setSelected(null)}>Back to all cases</Button>}
        >
          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <StatusChip value={selected.status} />
            <Chip size="small" label={selected.category} />
          </Stack>
          <Typography variant="body2" sx={{ mb: 2 }}>{selected.description}</Typography>
          {selected.resolutionDetail && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="overline" color="text.secondary">Resolution</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, mb: 2 }}>{selected.resolutionDetail}</Typography>
            </>
          )}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Case history</Typography>
          <ActivityTimeline
            events={selected.timeline.filter((t) => !['Update'].includes(t.type)).map((t) => ({
              ...t,
              detail: t.type === 'Investigation' ? 'ECIC has begun investigating your case.' : t.detail,
            }))}
          />
        </SectionCard>
      ) : cases.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No cases yet"
            description="You have not raised a complaint with ECIC. If something is not right, you can submit one at any time."
            action={<Button variant="contained" onClick={() => navigate('/portal/cases/new')}>Submit a complaint</Button>}
          />
        </SectionCard>
      ) : (
        <SectionCard>
          <DataTable
            rows={cases}
            columns={columns}
            searchable
            searchPlaceholder="Search your cases…"
            searchFields={(r) => `${r.reference} ${r.subject} ${r.category}`}
            defaultSort={{ id: 'raised', dir: 'desc' }}
            onRowClick={(r) => setSelected(r)}
          />
        </SectionCard>
      )}
    </Box>
  );
}

export default PortalCases;
