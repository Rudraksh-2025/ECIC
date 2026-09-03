import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Chip, Divider, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DataTable, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack,
} from '../components';
import type { Column } from '../components';
import { downloadCsv, num, pct } from '../utils/format';
import { REQUIREMENTS, REQUIREMENT_AREAS, REQUIREMENT_STATUSES } from '../data/requirements';
import type { RequirementRow } from '../types';

const STATUS_COLOUR: Record<string, string> = {
  Demonstrated: '#059669',
  'Partially Demonstrated': '#D97706',
  Simulated: '#7C3AED',
  'Configuration Demo': '#0E7C7B',
};

export function Coverage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const focusReq = params.get('req') ? Number(params.get('req')) : null;
  const [filters, setFilters] = React.useState({ area: 'all', status: 'all', module: 'all' });
  const [selected, setSelected] = React.useState<RequirementRow | null>(
    focusReq ? REQUIREMENTS.find((r) => r.id === focusReq) ?? null : null,
  );

  React.useEffect(() => {
    if (focusReq) {
      const r = REQUIREMENTS.find((x) => x.id === focusReq);
      if (r) setSelected(r);
    }
  }, [focusReq]);

  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const modules = Array.from(new Set(REQUIREMENTS.map((r) => r.module))).sort();

  const filtered = REQUIREMENTS.filter((r) =>
    (filters.area === 'all' || r.area === filters.area)
    && (filters.status === 'all' || r.status === filters.status)
    && (filters.module === 'all' || r.module === filters.module));

  const byStatus = REQUIREMENT_STATUSES.map((s) => ({
    status: s,
    count: REQUIREMENTS.filter((r) => r.status === s).length,
  }));

  type Row = Omit<RequirementRow, 'id'> & { id: string; number: number };

  const columns: Column<Row>[] = [
    {
      id: 'num', label: '#', width: 62, align: 'center',
      sortValue: (r) => r.number,
      render: (r) => (
        <Chip
          size="small" label={r.id}
          sx={{
            fontWeight: 700, minWidth: 38,
            bgcolor: alpha(STATUS_COLOUR[r.status], .12), color: STATUS_COLOUR[r.status],
          }}
        />
      ),
    },
    { id: 'area', label: 'Area', width: 165, sortValue: (r) => r.area, render: (r) => <Typography variant="body2" noWrap>{r.area}</Typography> },
    {
      id: 'requirement', label: 'Requirement', sortValue: (r) => r.requirement,
      render: (r) => (
        <Typography variant="body2" sx={{ fontWeight: 600, maxWidth: 420 }}>{r.requirement}</Typography>
      ),
    },
    { id: 'module', label: 'CRM module', width: 175, hideOn: 'md', sortValue: (r) => r.module, render: (r) => <Typography variant="body2" noWrap>{r.module}</Typography> },
    { id: 'demoScreen', label: 'Demo screen', width: 210, hideOn: 'md', sortValue: (r) => r.demoScreen, render: (r) => <Typography variant="body2" noWrap>{r.demoScreen}</Typography> },
    {
      id: 'status', label: 'Status', width: 190, sortValue: (r) => r.status,
      render: (r) => (
        <Chip
          size="small" label={r.status}
          sx={{ bgcolor: alpha(STATUS_COLOUR[r.status], .12), color: STATUS_COLOUR[r.status], fontWeight: 700 }}
        />
      ),
    },
    {
      id: 'open', label: '', width: 110,
      render: (r) => (
        <Button
          size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
          onClick={(e) => { e.stopPropagation(); navigate(r.route); }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Requirement Coverage Matrix"
        subtitle="All 101 ECIC Annexure C requirements mapped to the CRM module, the demonstration screen, the evidence shown and the coverage status — so any requirement can be answered immediately during the presentation."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Requirement Coverage' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DownloadIcon />}
              onClick={() => downloadCsv('ECIC_Requirement_Coverage_Matrix', filtered.map((r) => ({
                'Requirement #': r.id, Area: r.area, Requirement: r.requirement,
                'CRM module': r.module, 'Demo screen': r.demoScreen, Route: r.route,
                'Demonstration evidence': r.evidence, Status: r.status, Notes: r.notes,
              })))}
            >
              Export matrix
            </Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
              Print matrix
            </Button>
          </>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <AlertTitle>Answering “how does your solution address requirement 57?”</AlertTitle>
        Search or filter for the requirement number, read the evidence, and select <strong>Open</strong> to go
        straight to the screen that demonstrates it. Every requirement carries an honest status: whether it is
        genuinely demonstrated in this build, demonstrated through configuration, or represented as a labelled
        simulation of a control that cannot exist in a browser-only demonstration.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Total requirements" value={num(REQUIREMENTS.length)} sub="Annexure C" colour="#0B2545" />
        {byStatus.map((s) => (
          <KpiCard
            key={s.status} dense label={s.status} value={num(s.count)}
            sub={pct((s.count / REQUIREMENTS.length) * 100)}
            colour={STATUS_COLOUR[s.status]}
            onClick={() => set('status', s.status)}
          />
        ))}
        <KpiCard dense label="Requirement areas" value={num(REQUIREMENT_AREAS.length)} colour="#2563EB" />
      </Grid>

      <SectionCard title="Coverage by requirement area" sx={{ mb: 2.5 }}>
        <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
          {REQUIREMENT_AREAS.map((area) => {
            const items = REQUIREMENTS.filter((r) => r.area === area);
            const demonstrated = items.filter((r) => r.status === 'Demonstrated' || r.status === 'Configuration Demo').length;
            return (
              <Box
                key={area}
                onClick={() => set('area', area)}
                sx={{
                  p: 1.75, borderRadius: 2.5, cursor: 'pointer', bgcolor: 'surface.subtle',
                  border: '1px solid transparent', '&:hover': { borderColor: 'secondary.main' },
                }}
              >
                <Typography variant="overline" color="text.secondary">{area}</Typography>
                <Typography variant="h3" sx={{ my: 0.25 }}>{items.length}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  requirements · {demonstrated} demonstrated live
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.4, mt: 1 }}>
                  {REQUIREMENT_STATUSES.map((s) => {
                    const n = items.filter((r) => r.status === s).length;
                    if (n === 0) return null;
                    return (
                      <Box
                        key={s}
                        sx={{
                          flex: n, height: 6, borderRadius: 3,
                          bgcolor: STATUS_COLOUR[s],
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" gap={2} flexWrap="wrap">
          {REQUIREMENT_STATUSES.map((s) => (
            <Stack key={s} direction="row" gap={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLOUR[s] }} />
              <Typography variant="caption">
                <strong>{s}</strong> —{' '}
                {s === 'Demonstrated' ? 'fully working in this build and shown live'
                  : s === 'Configuration Demo' ? 'demonstrated by changing configuration with no development'
                    : s === 'Simulated' ? 'a labelled simulation of a control that cannot exist in a browser-only build'
                      : 'partially shown; the remainder is described'}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </SectionCard>

      {selected && (
        <SectionCard
          title={`Requirement ${selected.id} — ${selected.area}`}
          subtitle={selected.requirement}
          sx={{ mb: 2.5, borderColor: alpha(STATUS_COLOUR[selected.status], .4) }}
          action={
            <Stack direction="row" gap={1}>
              <Button size="small" onClick={() => { setSelected(null); setParams({}); }}>Close</Button>
              <Button size="small" variant="contained" endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(selected.route)}>
                Open the demo screen
              </Button>
            </Stack>
          }
        >
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">CRM module</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.module}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Demo screen</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.demoScreen}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Route</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace' }}>{selected.route}</Typography>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">Status</Typography>
              <Chip
                size="small" label={selected.status}
                sx={{ bgcolor: alpha(STATUS_COLOUR[selected.status], .12), color: STATUS_COLOUR[selected.status], fontWeight: 700 }}
              />
            </Box>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary">Demonstration evidence</Typography>
          <Typography variant="body1" sx={{ mt: 0.5, mb: 2, lineHeight: 1.7 }}>{selected.evidence}</Typography>
          <Typography variant="overline" color="text.secondary">Notes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{selected.notes}</Typography>
        </SectionCard>
      )}

      <FilterBar
        filters={[
          { id: 'area', label: 'Requirement area', options: [{ value: 'all', label: 'All areas' }, ...REQUIREMENT_AREAS.map((a) => ({ value: a, label: a }))], width: 210 },
          { id: 'status', label: 'Coverage status', options: [{ value: 'all', label: 'All statuses' }, ...REQUIREMENT_STATUSES.map((s) => ({ value: s, label: s }))], width: 210 },
          { id: 'module', label: 'CRM module', options: [{ value: 'all', label: 'All modules' }, ...modules.map((m) => ({ value: m, label: m }))], width: 210 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => { setFilters({ area: 'all', status: 'all', module: 'all' }); setParams({}); setSelected(null); }}
      />

      <DataTable
        rows={filtered.map((r) => ({ ...r, id: String(r.id), number: r.id }))}
        columns={columns}
        searchable
        searchPlaceholder="Search a requirement number, keyword, module or screen — for example “57”, “escalation” or “MFA”…"
        searchFields={(r) => `${r.id} ${r.area} ${r.requirement} ${r.module} ${r.demoScreen} ${r.evidence} ${r.notes} ${r.status}`}
        defaultSort={{ id: 'num', dir: 'asc' }}
        onRowClick={(r) => { setSelected(REQUIREMENTS.find((x) => String(x.id) === r.id) ?? null); setParams({ req: r.id }); }}
        initialRowsPerPage={25}
        rowsPerPageOptions={[25, 50, 101]}
        dense
      />

      <Box sx={{ mt: 3 }}>
        <SectionCard title="What each coverage status means" subtitle="Stated plainly so the evaluation panel can rely on it">
          <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
            {[
              ['Demonstrated', 'The requirement is genuinely implemented in this demonstration build and can be exercised live in front of the panel.', STATUS_COLOUR.Demonstrated],
              ['Configuration Demo', 'The requirement is met through configuration. The presenter changes a setting and the behaviour changes immediately, with no development and no deployment.', STATUS_COLOUR['Configuration Demo']],
              ['Simulated', 'The requirement concerns a control that cannot genuinely exist in a browser-only demonstration — encryption, SSO, malware scanning, disaster recovery. The interface, workflow and audit records are real; the underlying control is represented and clearly labelled DEMO / SIMULATED.', STATUS_COLOUR.Simulated],
              ['Partially Demonstrated', 'Part of the requirement is shown live and the remainder is described in the accompanying content.', STATUS_COLOUR['Partially Demonstrated']],
            ].map(([title, body, colour]) => (
              <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: alpha(colour, .3), bgcolor: alpha(colour, .02) }}>
                <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colour }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                  <Chip size="small" label={num(REQUIREMENTS.filter((r) => r.status === title).length)} sx={{ height: 19, fontWeight: 700 }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">{body}</Typography>
              </Box>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Button variant="contained" onClick={() => navigate('/bid-demo')}>Open Bid Demo Mode</Button>
            <Button variant="outlined" onClick={() => navigate('/implementation')}>Implementation approach</Button>
            <Button variant="outlined" onClick={() => navigate('/security')}>Security Centre</Button>
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Coverage;
