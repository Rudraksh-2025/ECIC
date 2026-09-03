import * as React from 'react';
import {
  AppBar, Avatar, Badge, Box, Button, Chip, Dialog, DialogContent, Divider, Drawer,
  IconButton, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader,
  Menu, MenuItem, Popover, Snackbar, Alert, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
  BottomNavigation, BottomNavigationAction, LinearProgress, Switch, FormControlLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import LogoutIcon from '@mui/icons-material/Logout';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import WorkIcon from '@mui/icons-material/AssignmentInd';
import ComplaintIcon from '@mui/icons-material/SupportAgent';
import LeadIcon from '@mui/icons-material/PersonSearch';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NAV_GROUPS, ALWAYS_VISIBLE } from '../app/navigation';
import { useStore, useCurrentUser } from '../store';
import { ROLE_LIST, ROLES } from '../data/roles';
import type { RoleId } from '../types';
import { writeAudit } from '../services/mockApi';
import { useComplaintSla, useToastListener, type Toast } from '../hooks';
import { Stack } from '../components/Stack';
import { ConfirmDialog, StatusChip } from '../components';
import { relativeTime } from '../utils/dates';
import { BRAND } from '../theme/theme';
import { GlobalSearch } from './GlobalSearch';
import { NotificationPanel } from './NotificationPanel';

const SIDEBAR_WIDTH = 268;

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 2, flexShrink: 0,
        background: `linear-gradient(140deg, ${BRAND.ACCENT} 0%, ${BRAND.NAVY_LIGHT} 70%)`,
        display: 'grid', placeItems: 'center',
        boxShadow: '0 4px 12px -4px rgba(14,124,123,.6)',
      }}>
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '-0.03em' }}>
          EC
        </Typography>
      </Box>
      {!compact && (
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.15 }}>
            ECIC CRM Platform
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.55), fontSize: '0.65rem', letterSpacing: '.06em', fontWeight: 600 }}>
            BID DEMONSTRATION BUILD
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const role = useStore((s) => s.session.role);
  const presentation = useStore((s) => s.session.presentationMode);
  const notifications = useStore((s) => s.notifications);
  const tasks = useStore((s) => s.tasks);
  const complaints = useStore((s) => s.complaints);
  const userId = useStore((s) => s.session.userId);
  const slaOf = useComplaintSla();

  const unread = notifications.filter((n) => !n.read && (!n.recipientId || n.recipientId === userId)).length;
  const openTasks = tasks.filter((t) => t.status === 'Open' && t.ownerId === userId).length;
  const atRisk = complaints.filter((c) => {
    if (['Closed', 'Resolved'].includes(c.status)) return false;
    const s = slaOf(c);
    return s.risk === 'At Risk' || s.risk === 'Breached';
  }).length;

  const badgeValue = (key?: string) =>
    key === 'notifications' ? unread : key === 'tasks' ? openTasks : key === 'slaAtRisk' ? atRisk : 0;

  const allowed = ROLES[role]?.modules ?? [];

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: BRAND.NAVY, color: '#fff',
      backgroundImage: `radial-gradient(900px 400px at -10% -10%, ${alpha(BRAND.ACCENT, 0.28)} 0%, transparent 60%)`,
    }}>
      <Box sx={{ px: 2.25, py: 2, flexShrink: 0 }}>
        <Logo />
      </Box>
      <Divider sx={{ borderColor: alpha('#fff', 0.08) }} />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, py: 1.25 }}>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => allowed.includes(i.key) || ALWAYS_VISIBLE.includes(i.key));
          if (items.length === 0) return null;
          if (presentation && group.label === 'Governance' && !allowed.includes('security')) return null;
          return (
            <List
              key={group.label}
              dense
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: 'transparent', color: alpha('#fff', 0.42),
                    fontSize: '0.63rem', fontWeight: 700, letterSpacing: '.11em',
                    lineHeight: 2.4, px: 1.5,
                  }}
                >
                  {group.label.toUpperCase()}
                </ListSubheader>
              }
              sx={{ pt: 0, pb: 0.5 }}
            >
              {items.map((item) => {
                const active = location.pathname === item.to
                  || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
                const badge = badgeValue(item.badge);
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.key}
                    component={RouterLink}
                    to={item.to}
                    onClick={onNavigate}
                    selected={active}
                    sx={{
                      mb: 0.25, py: 0.7, px: 1.5,
                      color: active ? '#fff' : alpha('#fff', 0.74),
                      '&.Mui-selected': {
                        bgcolor: alpha('#fff', 0.13),
                        '&:hover': { bgcolor: alpha('#fff', 0.17) },
                      },
                      '&:hover': { bgcolor: alpha('#fff', 0.08) },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: active ? BRAND.GOLD : alpha('#fff', 0.55) }}>
                      <Icon sx={{ fontSize: 19 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: '0.8125rem', fontWeight: active ? 700 : 500 } } }}
                    />
                    {badge > 0 && (
                      <Chip
                        size="small" label={badge}
                        sx={{
                          height: 18, minWidth: 18, fontSize: '0.65rem', fontWeight: 700,
                          bgcolor: item.badge === 'slaAtRisk' ? '#DC2626' : alpha('#fff', 0.2), color: '#fff',
                        }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          );
        })}
      </Box>
      <Divider sx={{ borderColor: alpha('#fff', 0.08) }} />
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <Button
          fullWidth variant="contained" color="secondary" size="small"
          component={RouterLink} to="/bid-demo" onClick={onNavigate}
          startIcon={<SlideshowIcon />}
        >
          Open Bid Demo Mode
        </Button>
        <Typography sx={{ color: alpha('#fff', 0.4), fontSize: '0.65rem', mt: 1.25, textAlign: 'center' }}>
          Frontend demonstration build · dummy data
        </Typography>
      </Box>
    </Box>
  );
}

function RoleSwitcher() {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);
  const users = useStore((s) => s.users);
  const user = useCurrentUser();
  const navigate = useNavigate();

  const change = (roleId: string) => {
    const candidate = users.find((u) => u.role === roleId && u.status === 'Active');
    setSession({ role: roleId as RoleId, userId: candidate?.id ?? session.userId, showSensitiveData: false });
    writeAudit('Role switched (demonstration)', 'Authentication', candidate?.id ?? '—',
      `Role: ${session.role}`, `Role: ${roleId}; User: ${candidate?.name}`);
    setAnchor(null);
    if (roleId === 'portal_customer') navigate('/portal');
    else if (!ROLES[roleId as RoleId]?.modules.includes('dashboard')) navigate('/my-work');
    else navigate('/dashboard');
  };

  return (
    <>
      <Tooltip title="Switch demonstration role — navigation, actions and field visibility all change">
        <Button
          onClick={(e) => setAnchor(e.currentTarget)}
          startIcon={<SwitchAccountIcon />}
          size="small"
          sx={{
            color: 'text.primary', bgcolor: 'surface.sunken', px: 1.5,
            '&:hover': { bgcolor: alpha(BRAND.NAVY, 0.09) },
            maxWidth: { xs: 140, md: 260 },
          }}
        >
          <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {ROLES[session.role].name}
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }} noWrap>
              {user?.name}
            </Typography>
          </Box>
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 520, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="overline" color="text.secondary">Demonstration role switcher</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Switching role immediately changes visible modules, permitted actions and personal
            information masking. This evidences role-based access control and segregation of duties.
          </Typography>
        </Box>
        <Divider />
        {ROLE_LIST.map((r) => {
          const u = users.find((x) => x.role === r.id && x.status === 'Active');
          return (
            <MenuItem
              key={r.id} onClick={() => change(r.id)} selected={r.id === session.role}
              sx={{ py: 1.25, alignItems: 'flex-start', whiteSpace: 'normal' }}
            >
              <Avatar sx={{ width: 30, height: 30, mr: 1.5, mt: 0.25, bgcolor: u?.avatarColor ?? BRAND.NAVY, fontSize: '0.7rem' }}>
                {u?.initials ?? 'EC'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{r.name}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {u?.name ?? 'Demo user'} · {r.permissions.length} permissions
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: 'secondary.dark' }}>
                  {r.segregationNote}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawer, setDrawer] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [notifAnchor, setNotifAnchor] = React.useState<HTMLElement | null>(null);
  const [profileAnchor, setProfileAnchor] = React.useState<HTMLElement | null>(null);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [navigating, setNavigating] = React.useState(false);

  const session = useStore((s) => s.session);
  const setSession = useStore((s) => s.setSession);
  const resetDemo = useStore((s) => s.resetDemo);
  const notifications = useStore((s) => s.notifications);
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read && (!n.recipientId || n.recipientId === session.userId)).length;
  const canUnmask = ROLES[session.role].permissions.includes('pii.unmask');

  useToastListener(React.useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
  }, []));

  React.useEffect(() => {
    setNavigating(true);
    const t = setTimeout(() => setNavigating(false), 220);
    return () => clearTimeout(t);
  }, [location.pathname]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const presentation = session.presentationMode;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isDesktop && !presentation && (
        <Box
          component="nav"
          aria-label="Primary navigation"
          sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, position: 'fixed', inset: '0 auto 0 0', zIndex: 1200 }}
        >
          <Sidebar />
        </Box>
      )}
      <Drawer
        open={drawer} onClose={() => setDrawer(false)}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, border: 0 } } }}
      >
        <Sidebar onNavigate={() => setDrawer(false)} />
      </Drawer>

      <Box sx={{
        flex: 1, minWidth: 0,
        ml: { lg: presentation ? 0 : `${SIDEBAR_WIDTH}px` },
        display: 'flex', flexDirection: 'column',
      }}>
        <AppBar
          position="sticky" elevation={0} className="no-print"
          sx={{
            bgcolor: alpha('#fff', 0.92), backdropFilter: 'blur(10px)',
            borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: { xs: 58, md: 64 }, px: { xs: 1.5, md: 3 } }}>
            {(!isDesktop || presentation) && (
              <IconButton onClick={() => setDrawer(true)} edge="start" aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            )}
            <Button
              onClick={() => setSearchOpen(true)}
              startIcon={<SearchIcon sx={{ fontSize: 18 }} />}
              sx={{
                justifyContent: 'flex-start', color: 'text.secondary', bgcolor: 'surface.sunken',
                px: 1.5, minWidth: { xs: 42, sm: 200, md: 320 },
                '&:hover': { bgcolor: alpha(BRAND.NAVY, 0.08) },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontWeight: 400, fontSize: '0.82rem' }}>
                Search customers, cases, leads, opportunities…
              </Box>
              <Box sx={{ flex: 1 }} />
              <Chip
                label="⌘K" size="small"
                sx={{ display: { xs: 'none', md: 'flex' }, height: 20, fontSize: '0.65rem', bgcolor: 'background.paper' }}
              />
            </Button>
            <Box sx={{ flex: 1 }} />

            {presentation && (
              <Chip
                label="PRESENTATION MODE"
                onDelete={() => setSession({ presentationMode: false })}
                sx={{ bgcolor: alpha(BRAND.GOLD, 0.15), color: '#8A6D0B', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}
              />
            )}

            <Tooltip title={
              canUnmask
                ? (session.showSensitiveData
                  ? 'Personal information is currently visible. Every unmasking action is written to the audit log.'
                  : 'Personal information is masked. Your role may unmask it.')
                : 'Your role does not carry the "Show sensitive data" permission, so personal information stays masked.'
            }>
              <span>
                <IconButton
                  onClick={() => {
                    setSession({ showSensitiveData: !session.showSensitiveData });
                    writeAudit(
                      session.showSensitiveData ? 'Sensitive data re-masked' : 'Sensitive data unmasked',
                      'Session', user.id,
                      `PII ${session.showSensitiveData ? 'revealed' : 'masked'}`,
                      `PII ${session.showSensitiveData ? 'masked' : 'revealed'}; justification: demonstration`,
                    );
                  }}
                  disabled={!canUnmask}
                  aria-label="Toggle sensitive data visibility"
                  color={session.showSensitiveData ? 'secondary' : 'default'}
                >
                  {session.showSensitiveData ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </span>
            </Tooltip>

            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} aria-label={`${unread} unread notifications`}>
              <Badge badgeContent={unread} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {!isMobile && <RoleSwitcher />}

            <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} aria-label="Account menu" sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: user?.avatarColor ?? BRAND.NAVY }}>
                {user?.initials}
              </Avatar>
            </IconButton>
          </Toolbar>
          {navigating && <LinearProgress sx={{ height: 2, borderRadius: 0 }} />}
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1, minWidth: 0,
            px: { xs: 1.75, md: 3 },
            py: { xs: 2, md: 3 },
            pb: { xs: 10, md: 3 },
            maxWidth: presentation ? 1600 : 1520,
            width: '100%', mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {isMobile && (
        <BottomNavigation
          showLabels
          value={location.pathname}
          className="no-print"
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1201,
            borderTop: '1px solid', borderColor: 'divider', height: 62,
          }}
        >
          <BottomNavigationAction label="Dashboard" value="/dashboard" icon={<DashboardIcon />} onClick={() => navigate('/dashboard')} />
          <BottomNavigationAction label="My Work" value="/my-work" icon={<WorkIcon />} onClick={() => navigate('/my-work')} />
          <BottomNavigationAction label="Cases" value="/complaints" icon={<ComplaintIcon />} onClick={() => navigate('/complaints')} />
          <BottomNavigationAction label="Leads" value="/leads" icon={<LeadIcon />} onClick={() => navigate('/leads')} />
          <BottomNavigationAction label="More" value="more" icon={<MoreHorizIcon />} onClick={() => setDrawer(true)} />
        </BottomNavigation>
      )}

      {/* Global search */}
      <Dialog
        open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3, position: 'fixed', top: 70, m: 0, width: '100%', maxWidth: 640 } } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <GlobalSearch onClose={() => setSearchOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Notifications */}
      <Popover
        open={!!notifAnchor} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: { xs: 340, sm: 430 }, maxHeight: 540, borderRadius: 3 } } }}
      >
        <NotificationPanel onClose={() => setNotifAnchor(null)} />
      </Popover>

      {/* Profile */}
      <Menu
        anchorEl={profileAnchor} open={!!profileAnchor} onClose={() => setProfileAnchor(null)}
        slotProps={{ paper: { sx: { width: 300, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Stack direction="row" gap={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: user?.avatarColor }}>{user?.initials}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.primary' }} noWrap>{user?.name}</Typography>
              <Typography variant="caption" noWrap>{user?.jobTitle}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={0.5} sx={{ mt: 1.25 }} flexWrap="wrap">
            <StatusChip value={user?.status} />
            <Chip size="small" label={user?.mfaEnrolled ? 'MFA enrolled' : 'MFA not enrolled'}
              sx={{ bgcolor: alpha(user?.mfaEnrolled ? '#059669' : '#DC2626', 0.12), color: user?.mfaEnrolled ? '#059669' : '#DC2626' }} />
            <Chip size="small" label={user?.ssoLinked ? 'SSO linked' : 'Local account'}
              sx={{ bgcolor: alpha('#2563EB', 0.1), color: '#2563EB' }} />
          </Stack>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Last sign-in {relativeTime(user?.lastLogin)}
          </Typography>
        </Box>
        <Divider />
        {isMobile && (
          <MenuItem onClick={() => { setProfileAnchor(null); navigate('/users'); }}>
            <ListItemIcon><SwitchAccountIcon fontSize="small" /></ListItemIcon>
            Switch demonstration role
          </MenuItem>
        )}
        <Box sx={{ px: 2, py: 0.5 }}>
          <FormControlLabel
            control={
              <Switch
                size="small" checked={presentation}
                onChange={(e) => setSession({ presentationMode: e.target.checked })}
              />
            }
            label={<Typography variant="body2">Presentation mode</Typography>}
          />
        </Box>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/security'); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          Security Centre
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/portal'); }}>
          <ListItemIcon><KeyboardArrowRightIcon fontSize="small" /></ListItemIcon>
          Open customer portal
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setProfileAnchor(null); setResetOpen(true); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><RestartAltIcon fontSize="small" color="error" /></ListItemIcon>
          Reset demo environment
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate('/login'); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out (MFA demo)
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={resetOpen}
        title="Reset the demonstration environment?"
        message="This restores the original seed data and clears every change made during this session: complaints, leads, opportunities, applications, documents, notifications, tasks, configuration changes, saved reports, offline captures, demo progress and the audit log. The active role is returned to Complaints Supervisor."
        confirmLabel="Reset everything"
        confirmColor="error"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetDemo();
          setResetOpen(false);
          navigate('/dashboard');
          window.setTimeout(() => window.location.reload(), 80);
        }}
      />

      {toasts.slice(-1).map((t) => (
        <Snackbar
          key={t.id} open autoHideDuration={5000}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: { xs: 76, md: 24 } }}
        >
          <Alert
            severity={t.severity}
            variant="filled"
            onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            action={
              <Stack direction="row" gap={0.5} alignItems="center">
                {t.action && (
                  <Button color="inherit" size="small" onClick={() => { navigate(t.action!.to); setToasts([]); }}>
                    {t.action.label}
                  </Button>
                )}
                <IconButton size="small" color="inherit" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
            sx={{ maxWidth: 480, alignItems: 'center' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.message}</Typography>
            {t.detail && <Typography variant="caption" sx={{ color: alpha('#fff', 0.85) }}>{t.detail}</Typography>}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}
