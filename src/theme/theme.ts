import { createTheme, alpha } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    surface: { subtle: string; raised: string; sunken: string };
    brandGradient: string;
  }
  interface PaletteOptions {
    surface?: { subtle: string; raised: string; sunken: string };
    brandGradient?: string;
  }
}

const NAVY = '#0B2545';
const NAVY_LIGHT = '#13315C';
const ACCENT = '#0E7C7B';
const GOLD = '#C9A227';

export const statusColour: Record<string, string> = {
  // Complaint
  Logged: '#64748B',
  Assigned: '#2563EB',
  'In Progress': '#7C3AED',
  'Pending Information': '#D97706',
  Escalated: '#DC2626',
  Resolved: '#059669',
  Closed: '#334155',
  // Lead
  New: '#2563EB',
  Contacted: '#7C3AED',
  Qualified: '#059669',
  Disqualified: '#94A3B8',
  Converted: '#0E7C7B',
  // Opportunity
  Qualification: '#2563EB',
  'Proposal / Solution': '#7C3AED',
  Negotiation: '#D97706',
  'Closed Won': '#059669',
  'Closed Lost': '#DC2626',
  // SLA
  'On Track': '#059669',
  'At Risk': '#D97706',
  Breached: '#DC2626',
  Met: '#0E7C7B',
  // Generic
  Planned: '#2563EB',
  Active: '#059669',
  Completed: '#334155',
  Cancelled: '#94A3B8',
  Draft: '#64748B',
  Submitted: '#2563EB',
  'Under Review': '#7C3AED',
  'Awaiting Approval': '#D97706',
  Approved: '#059669',
  Rejected: '#DC2626',
  Published: '#059669',
  Obsolete: '#94A3B8',
  Safe: '#059669',
  Scanning: '#D97706',
  Blocked: '#DC2626',
  Saved: '#0E7C7B',
  Signed: '#0E7C7B',
  Connected: '#059669',
  Degraded: '#D97706',
  Disconnected: '#DC2626',
  Synced: '#059669',
  'Stored Offline': '#D97706',
  'Pending Sync': '#D97706',
  Critical: '#B91C1C',
  High: '#DC2626',
  Medium: '#D97706',
  Low: '#0E7C7B',
  P1: '#B91C1C',
  P2: '#DC2626',
  P3: '#D97706',
  P4: '#0E7C7B',
  Open: '#2563EB',
  Demonstrated: '#059669',
  'Partially Demonstrated': '#D97706',
  Simulated: '#7C3AED',
  'Configuration Demo': '#0E7C7B',
};

export function colourFor(key: string | null | undefined): string {
  if (!key) return '#64748B';
  return statusColour[key] ?? '#64748B';
}

const options: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: NAVY, light: NAVY_LIGHT, dark: '#06182F', contrastText: '#FFFFFF' },
    secondary: { main: ACCENT, light: '#26A5A3', dark: '#095B5A', contrastText: '#FFFFFF' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
    success: { main: '#059669' },
    info: { main: '#2563EB' },
    background: { default: '#F4F6FA', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#5A6B85' },
    divider: '#E3E8F0',
    surface: { subtle: '#F8FAFC', raised: '#FFFFFF', sunken: '#EEF2F8' },
    brandGradient: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_LIGHT} 55%, ${ACCENT} 160%)`,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontSize: '1rem', fontWeight: 700 },
    h6: { fontSize: '0.9375rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 600 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, color: '#5A6B85' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem', color: '#5A6B85' },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.09em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F4F6FA' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': { background: '#C6D0E0', borderRadius: 8, border: '2px solid #F4F6FA' },
        '*::-webkit-scrollbar-thumb:hover': { background: '#A9B7CC' },
        '@media print': {
          '.no-print': { display: 'none !important' },
          body: { backgroundColor: '#fff' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #E3E8F0',
          borderRadius: 14,
          boxShadow: '0 1px 2px rgba(11,37,69,0.04), 0 8px 24px -16px rgba(11,37,69,0.18)',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { paddingBottom: 4 },
        title: { fontSize: '0.9375rem', fontWeight: 700 },
        subheader: { fontSize: '0.75rem' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16 },
        sizeSmall: { paddingInline: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        sizeSmall: { height: 22, fontSize: '0.7rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #EDF1F7', fontSize: '0.8125rem' },
        head: {
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#5A6B85',
          backgroundColor: '#F8FAFC',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: alpha(NAVY, 0.025) } },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10, backgroundColor: '#fff' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', minHeight: 44 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#0F172A', fontSize: '0.75rem', borderRadius: 8, padding: '6px 10px' },
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiListItemButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 999, height: 6 } } },
    MuiAvatar: { styleOverrides: { root: { fontSize: '0.8rem', fontWeight: 700 } } },
  },
};

export const theme = createTheme(options);

export const presentationTheme = createTheme({
  ...options,
  typography: {
    ...options.typography,
    fontSize: 15.5,
  },
});

export const BRAND = { NAVY, NAVY_LIGHT, ACCENT, GOLD };
