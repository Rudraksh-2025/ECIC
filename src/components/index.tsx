import * as React from 'react';
import {
  Alert, AlertTitle, Box, Breadcrumbs, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton,
  InputAdornment, LinearProgress, Link as MuiLink, MenuItem, Paper, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TableSortLabel, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Stack } from './Stack';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import InboxIcon from '@mui/icons-material/Inbox';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Link as RouterLink } from 'react-router-dom';
import { colourFor } from '../theme/theme';
import { fmtDateTime, relativeTime } from '../utils/dates';

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

export function Grid({
  children, cols = 12, gap = 2, sx,
}: {
  children: React.ReactNode;
  cols?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  gap?: number;
  sx?: object;
}) {
  const template = typeof cols === 'number'
    ? { xs: `repeat(${cols}, minmax(0, 1fr))` }
    : {
      xs: `repeat(${cols.xs ?? 1}, minmax(0, 1fr))`,
      sm: `repeat(${cols.sm ?? cols.xs ?? 2}, minmax(0, 1fr))`,
      md: `repeat(${cols.md ?? cols.sm ?? 3}, minmax(0, 1fr))`,
      lg: `repeat(${cols.lg ?? cols.md ?? 4}, minmax(0, 1fr))`,
    };
  return <Box sx={{ display: 'grid', gridTemplateColumns: template, gap, ...sx }}>{children}</Box>;
}

export function PageHeader({
  title, subtitle, breadcrumbs = [], actions, chips,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: React.ReactNode;
  chips?: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
          sx={{ mb: 1, '& .MuiBreadcrumbs-li': { fontSize: '0.75rem' } }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((b, i) =>
            b.to && i < breadcrumbs.length - 1 ? (
              <MuiLink key={b.label} component={RouterLink} to={b.to} underline="hover" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {b.label}
              </MuiLink>
            ) : (
              <Typography key={b.label} sx={{ fontSize: '0.75rem' }} color="text.secondary">{b.label}</Typography>
            ))}
        </Breadcrumbs>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="h2" sx={{ lineHeight: 1.2 }}>{title}</Typography>
            {chips}
          </Stack>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 900 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Stack direction="row" gap={1} flexWrap="wrap" className="no-print">{actions}</Stack>}
      </Stack>
    </Box>
  );
}

export function SectionCard({
  title, subtitle, action, children, dense, sx, icon,
}: {
  title?: string; subtitle?: string; action?: React.ReactNode;
  children: React.ReactNode; dense?: boolean; sx?: object; icon?: React.ReactNode;
}) {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', ...sx }}>
      {(title || action) && (
        <Box sx={{
          px: dense ? 2 : 2.5, pt: dense ? 1.75 : 2.25, pb: 1.25,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2,
        }}>
          <Stack direction="row" gap={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
            {icon}
            <Box sx={{ minWidth: 0 }}>
              {title && <Typography variant="h5">{title}</Typography>}
              {subtitle && <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>{subtitle}</Typography>}
            </Box>
          </Stack>
          {action && <Box className="no-print" sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
      )}
      <CardContent sx={{ pt: title ? 0.5 : 2.25, px: dense ? 2 : 2.5, pb: '18px !important', flex: 1 }}>
        {children}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Status and value display                                            */
/* ------------------------------------------------------------------ */

export function StatusChip({
  value, size = 'small', variant = 'soft', icon,
}: {
  value: string | null | undefined;
  size?: 'small' | 'medium';
  variant?: 'soft' | 'solid' | 'outlined';
  icon?: React.ReactElement;
}) {
  if (!value) return <Typography variant="body2" color="text.disabled">—</Typography>;
  const c = colourFor(value);
  const styles = variant === 'solid'
    ? { bgcolor: c, color: '#fff' }
    : variant === 'outlined'
      ? { bgcolor: 'transparent', color: c, border: `1px solid ${alpha(c, 0.5)}` }
      : { bgcolor: alpha(c, 0.12), color: c };
  return (
    <Chip
      size={size}
      label={value}
      icon={icon}
      sx={{ ...styles, '& .MuiChip-icon': { color: 'inherit', fontSize: 15 } }}
    />
  );
}

export function KpiCard({
  label, value, sub, delta, deltaLabel, colour, icon, onClick, dense,
}: {
  label: string; value: React.ReactNode; sub?: string;
  delta?: number; deltaLabel?: string; colour?: string;
  icon?: React.ReactNode; onClick?: () => void; dense?: boolean;
}) {
  const accent = colour ?? '#0B2545';
  return (
    <Card
      onClick={onClick}
      sx={{
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .15s ease, box-shadow .15s ease',
        ...(onClick ? { '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 28px -18px rgba(11,37,69,.35)' } } : {}),
      }}
    >
      <Box sx={{ position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 3, bgcolor: accent }} />
      <CardContent sx={{ py: dense ? 1.75 : 2.25, px: 2.25, pb: `${dense ? 14 : 18}px !important` }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>{label}</Typography>
          {icon && <Box sx={{ color: accent, opacity: 0.55, display: 'flex' }}>{icon}</Box>}
        </Stack>
        <Typography sx={{ fontSize: dense ? '1.4rem' : '1.65rem', fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25, lineHeight: 1.15 }}>
          {value}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5, minHeight: 18 }}>
          {delta != null && (
            <Stack direction="row" alignItems="center" gap={0.25} sx={{ color: delta >= 0 ? 'success.main' : 'error.main' }}>
              {delta >= 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
              <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 700 }}>
                {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
              </Typography>
            </Stack>
          )}
          {(sub || deltaLabel) && (
            <Typography variant="caption" noWrap>{deltaLabel ?? sub}</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function LabelValue({
  label, value, mono, wide,
}: { label: string; value: React.ReactNode; mono?: boolean; wide?: boolean }) {
  return (
    <Box sx={{ gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        sx={{ fontWeight: 500, fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined, wordBreak: 'break-word' }}
      >
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export function SimulatedBadge({ label = 'DEMO / SIMULATED', tooltip }: { label?: string; tooltip?: string }) {
  const chip = (
    <Chip
      size="small"
      icon={<ScienceIcon />}
      label={label}
      sx={{
        bgcolor: alpha('#7C3AED', 0.1), color: '#7C3AED',
        fontWeight: 700, letterSpacing: '.04em', fontSize: '0.65rem',
        '& .MuiChip-icon': { color: 'inherit', fontSize: 14 },
      }}
    />
  );
  return tooltip ? <Tooltip title={tooltip}>{chip}</Tooltip> : chip;
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title, description, action, icon,
}: { title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
      <Box sx={{ color: 'text.disabled', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
        {icon ?? <InboxIcon sx={{ fontSize: 44 }} />}
      </Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

export function LoadingState({ rows = 5, label }: { rows?: number; label?: string }) {
  return (
    <Box sx={{ py: 2 }} aria-busy="true" aria-live="polite">
      {label && (
        <Stack direction="row" gap={1} alignItems="center" sx={{ mb: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Stack>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={34} sx={{ mb: 0.75, borderRadius: 1 }} />
      ))}
    </Box>
  );
}

export function ErrorState({ title, description, onRetry }: { title: string; description?: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={onRetry ? <Button color="inherit" size="small" onClick={onRetry}>Retry</Button> : undefined}
    >
      <AlertTitle>{title}</AlertTitle>
      {description}
    </Alert>
  );
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', confirmColor = 'primary',
  onConfirm, onCancel, children,
}: {
  open: boolean; title: string; message?: string; confirmLabel?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        {message && <DialogContentText sx={{ fontSize: '0.875rem' }}>{message}</DialogContentText>}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Demo scenario panel                                                 */
/* ------------------------------------------------------------------ */

export function DemoScenarioPanel({
  scenario, evidence, next, nextTo, requirements,
}: {
  scenario: string; evidence: string[]; next?: string; nextTo?: string; requirements?: number[];
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <Card
      className="no-print"
      sx={{
        mb: 2.5, borderColor: alpha('#0E7C7B', 0.35),
        background: `linear-gradient(135deg, ${alpha('#0E7C7B', 0.05)} 0%, ${alpha('#0B2545', 0.04)} 100%)`,
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Stack direction="row" gap={1} alignItems="center">
            <ScienceIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography variant="overline" sx={{ color: 'secondary.dark' }}>Demo scenario</Typography>
          </Stack>
          <Button size="small" onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Show'}</Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>{scenario}</Typography>
        {open && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Grid cols={{ xs: 1, md: 2 }} gap={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">Requirement evidence</Typography>
                <Stack gap={0.5} sx={{ mt: 0.5 }}>
                  {evidence.map((e) => (
                    <Stack key={e} direction="row" gap={0.75} alignItems="flex-start">
                      <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', mt: '2px' }} />
                      <Typography variant="body2">{e}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Box>
                {requirements && requirements.length > 0 && (
                  <>
                    <Typography variant="overline" color="text.secondary">Annexure C requirements</Typography>
                    <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75, mb: 2 }}>
                      {requirements.map((r) => (
                        <Chip
                          key={r} size="small" label={`#${r}`}
                          component={RouterLink} to={`/coverage?req=${r}`} clickable
                          sx={{ bgcolor: alpha('#0B2545', 0.07), fontWeight: 700 }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
                {next && (
                  <>
                    <Typography variant="overline" color="text.secondary">Next step</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {nextTo ? (
                        <Button size="small" variant="outlined" component={RouterLink} to={nextTo} endIcon={<ArrowForwardIcon />}>
                          {next}
                        </Button>
                      ) : (
                        <Typography variant="body2">{next}</Typography>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Data table                                                          */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  hideOn?: 'xs' | 'sm' | 'md';
}

export function DataTable<T extends { id: string }>({
  rows, columns, onRowClick, searchable, searchPlaceholder = 'Search…',
  searchFields, defaultSort, rowsPerPageOptions = [10, 25, 50, 100],
  initialRowsPerPage = 10, emptyTitle = 'No records found',
  emptyDescription = 'Adjust your filters or search terms to see results.',
  toolbar, dense, stickyHeader, maxHeight,
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  defaultSort?: { id: string; dir: 'asc' | 'desc' };
  rowsPerPageOptions?: number[];
  initialRowsPerPage?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  dense?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number;
}) {
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [perPage, setPerPage] = React.useState(initialRowsPerPage);
  const [sort, setSort] = React.useState(defaultSort ?? null);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const isMd = useMediaQuery(theme.breakpoints.down('md'));

  const visibleColumns = columns.filter((c) => {
    if (!c.hideOn) return true;
    if (c.hideOn === 'xs' && isSm) return false;
    if (c.hideOn === 'sm' && isSm) return false;
    if (c.hideOn === 'md' && isMd) return false;
    return true;
  });

  const filtered = React.useMemo(() => {
    if (!query || !searchFields) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchFields(r).toLowerCase().includes(q));
  }, [rows, query, searchFields]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return filtered;
    const out = [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return sort.dir === 'desc' ? out.reverse() : out;
  }, [filtered, sort, columns]);

  React.useEffect(() => { setPage(0); }, [query, rows.length]);

  const paged = sorted.slice(page * perPage, page * perPage + perPage);

  return (
    <Box>
      {(searchable || toolbar) && (
        <Stack
          direction={{ xs: 'column', md: 'row' }} gap={1.5}
          sx={{ mb: 1.5 }} alignItems={{ xs: 'stretch', md: 'center' }} className="no-print"
        >
          {searchable && (
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              sx={{ minWidth: { md: 280 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>
                  ),
                },
                htmlInput: { 'aria-label': searchPlaceholder },
              }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {toolbar}
        </Stack>
      )}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2.5, borderColor: 'divider', maxHeight, overflowX: 'auto' }}
      >
        <Table size={dense ? 'small' : 'medium'} stickyHeader={stickyHeader}>
          <TableHead>
            <TableRow>
              {visibleColumns.map((c) => (
                <TableCell key={c.id} align={c.align} sx={{ width: c.width }}>
                  {c.sortValue ? (
                    <TableSortLabel
                      active={sort?.id === c.id}
                      direction={sort?.id === c.id ? sort.dir : 'asc'}
                      onClick={() => setSort((s) =>
                        s?.id === c.id ? { id: c.id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id: c.id, dir: 'asc' })}
                    >
                      {c.label}
                    </TableSortLabel>
                  ) : c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((row) => (
              <TableRow
                key={row.id}
                hover={!!onRowClick}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {visibleColumns.map((c) => (
                  <TableCell key={c.id} align={c.align}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} sx={{ border: 0 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {sorted.length > rowsPerPageOptions[0] && (
        <TablePagination
          component="div"
          className="no-print"
          count={sorted.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          onRowsPerPageChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{ '& .MuiTablePagination-toolbar': { minHeight: 48, pl: 1 } }}
        />
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Filter bar                                                          */
/* ------------------------------------------------------------------ */

export interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  width?: number;
}

export function FilterBar({
  filters, values, onChange, onReset, extra,
}: {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  onReset?: () => void;
  extra?: React.ReactNode;
}) {
  const active = Object.values(values).filter((v) => v && v !== 'all').length;
  return (
    <Paper
      variant="outlined" className="no-print"
      sx={{ p: 1.5, mb: 2, borderRadius: 2.5, borderColor: 'divider', bgcolor: 'surface.subtle' }}
    >
      <Stack direction="row" gap={1.25} flexWrap="wrap" alignItems="center">
        {filters.map((f) => (
          <TextField
            key={f.id} select label={f.label} value={values[f.id] ?? 'all'}
            onChange={(e) => onChange(f.id, e.target.value)}
            sx={{ minWidth: f.width ?? 165, bgcolor: 'background.paper', borderRadius: 2 }}
          >
            {f.options.map((o) => (
              <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.85rem' }}>{o.label}</MenuItem>
            ))}
          </TextField>
        ))}
        {extra}
        <Box sx={{ flex: 1 }} />
        {active > 0 && onReset && (
          <Button size="small" onClick={onReset}>Clear {active} filter{active > 1 ? 's' : ''}</Button>
        )}
      </Stack>
    </Paper>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export function ActivityTimeline({
  events, max,
}: {
  events: { id: string; at: string; actor: string; actorRole: string; type: string; title: string; detail: string }[];
  max?: number;
}) {
  const items = max ? events.slice(-max) : events;
  const ordered = [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  if (ordered.length === 0) {
    return <EmptyState title="No history yet" description="Actions taken on this record will appear here." />;
  }
  return (
    <Stack sx={{ position: 'relative', pl: 0 }}>
      {ordered.map((e, i) => {
        const c = colourFor(e.type) === '#64748B' ? '#0B2545' : colourFor(e.type);
        return (
          <Stack key={e.id} direction="row" gap={2} sx={{ position: 'relative', pb: i === ordered.length - 1 ? 0 : 2.5 }}>
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <Box sx={{
                width: 11, height: 11, borderRadius: '50%', bgcolor: c, mt: '5px',
                boxShadow: `0 0 0 3px ${alpha(c, 0.16)}`,
              }} />
              {i < ordered.length - 1 && (
                <Box sx={{ flex: 1, width: '1.5px', bgcolor: 'divider', mt: 0.75 }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>{e.title}</Typography>
                <Chip size="small" label={e.type} sx={{ bgcolor: alpha(c, 0.1), color: c, height: 19, fontSize: '0.65rem' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{e.detail}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {e.actor} · {e.actorRole} · <Tooltip title={fmtDateTime(e.at)}><span>{relativeTime(e.at)}</span></Tooltip>
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/* SLA gauge                                                           */
/* ------------------------------------------------------------------ */

export function SlaBar({
  consumed, risk, compact,
}: { consumed: number; risk: string; compact?: boolean }) {
  const c = colourFor(risk);
  return (
    <Box sx={{ minWidth: compact ? 90 : 150 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.4 }}>
        <Typography variant="caption" sx={{ color: c, fontWeight: 700 }}>{risk}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{Math.min(999, Math.round(consumed))}%</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, consumed)}
        sx={{
          height: compact ? 4 : 6,
          bgcolor: alpha(c, 0.14),
          '& .MuiLinearProgress-bar': { bgcolor: c },
        }}
        aria-label={`SLA ${Math.round(consumed)} percent consumed, ${risk}`}
      />
    </Box>
  );
}

export function IconStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" gap={1.25} alignItems="center">
      <Box sx={{
        width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center',
        bgcolor: alpha('#0B2545', 0.06), color: 'primary.main',
      }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

export { IconButton, Tooltip, Stack };
