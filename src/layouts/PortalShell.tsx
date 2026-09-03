import * as React from 'react';
import {
  AppBar, Avatar, Alert, Badge, Box, Button, Chip, Container, Divider, IconButton, Menu, MenuItem,
  Snackbar, Toolbar, Typography, useMediaQuery, useTheme, BottomNavigation, BottomNavigationAction,
  ListItemIcon, Drawer, List, ListItemButton, ListItemText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import CaseIcon from '@mui/icons-material/Gavel';
import EnquiryIcon from '@mui/icons-material/ContactSupport';
import AppIcon from '@mui/icons-material/Article';
import DocIcon from '@mui/icons-material/FolderShared';
import FaqIcon from '@mui/icons-material/HelpCenter';
import ChatIcon from '@mui/icons-material/Forum';
import ProfileIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Stack } from '../components/Stack';
import { useToastListener, type Toast } from '../hooks';
import { BRAND } from '../theme/theme';

const PORTAL_NAV = [
  { label: 'Home', to: '/portal', icon: HomeIcon, exact: true },
  { label: 'My cases', to: '/portal/cases', icon: CaseIcon },
  { label: 'My enquiries', to: '/portal/enquiries', icon: EnquiryIcon },
  { label: 'My applications', to: '/portal/applications', icon: AppIcon },
  { label: 'My documents', to: '/portal/documents', icon: DocIcon },
  { label: 'Help & FAQs', to: '/portal/faqs', icon: FaqIcon },
  { label: 'Chat with us', to: '/portal/chat', icon: ChatIcon },
  { label: 'My profile', to: '/portal/profile', icon: ProfileIcon },
];

export function PortalShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const setSession = useStore((s) => s.setSession);
  const [drawer, setDrawer] = React.useState(false);
  const [accountAnchor, setAccountAnchor] = React.useState<HTMLElement | null>(null);
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  useToastListener(React.useCallback((t: Toast) => setToasts((prev) => [...prev, t]), []));

  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const openCases = store.complaints.filter((c) => c.customerId === customer.id && c.status !== 'Closed').length;

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#F7F9FC' }}>
      <AppBar
        position="sticky" elevation={0}
        sx={{
          background: `linear-gradient(120deg, ${BRAND.NAVY} 0%, ${BRAND.NAVY_LIGHT} 70%, ${BRAND.ACCENT} 210%)`,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Toolbar sx={{ gap: 1.5, px: { xs: 1.5, md: 3 }, minHeight: { xs: 60, md: 68 } }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={() => setDrawer(true)} aria-label="Open portal menu">
                <MenuIcon />
              </IconButton>
            )}
            <Stack
              direction="row" gap={1.25} alignItems="center"
              sx={{ cursor: 'pointer', minWidth: 0 }}
              onClick={() => navigate('/portal')}
            >
              <Box sx={{
                width: 34, height: 34, borderRadius: 2, flexShrink: 0,
                bgcolor: alpha('#fff', .16), display: 'grid', placeItems: 'center',
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.78rem' }}>EC</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.15 }} noWrap>
                  ECIC Customer Portal
                </Typography>
                <Typography sx={{ color: alpha('#fff', .62), fontSize: '0.66rem', fontWeight: 600, letterSpacing: '.05em' }} noWrap>
                  EXPORT CREDIT INSURANCE CORPORATION
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ flex: 1 }} />

            {!isMobile && (
              <Stack direction="row" gap={0.5}>
                {PORTAL_NAV.slice(0, 6).map((item) => (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    size="small"
                    sx={{
                      color: isActive(item.to, item.exact) ? '#fff' : alpha('#fff', .74),
                      bgcolor: isActive(item.to, item.exact) ? alpha('#fff', .14) : 'transparent',
                      '&:hover': { bgcolor: alpha('#fff', .1) },
                      fontWeight: isActive(item.to, item.exact) ? 700 : 500,
                    }}
                  >
                    {item.label}
                    {item.to === '/portal/cases' && openCases > 0 && (
                      <Chip
                        size="small" label={openCases}
                        sx={{ ml: 0.75, height: 17, minWidth: 17, fontSize: '0.6rem', bgcolor: alpha('#fff', .25), color: '#fff' }}
                      />
                    )}
                  </Button>
                ))}
              </Stack>
            )}

            <IconButton color="inherit" onClick={(e) => setAccountAnchor(e.currentTarget)} sx={{ p: 0.5 }} aria-label="Account menu">
              <Badge color="error" badgeContent={openCases} max={9}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#fff', .2), color: '#fff', fontSize: '0.75rem' }}>
                  {customer.organisation.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </Avatar>
              </Badge>
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ bgcolor: alpha(BRAND.GOLD, .1), borderBottom: '1px solid', borderColor: alpha(BRAND.GOLD, .25) }}>
        <Container maxWidth="xl">
          <Stack direction="row" gap={1} alignItems="center" sx={{ py: 0.75 }} flexWrap="wrap">
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#8A6D0B' }}>
              DEMONSTRATION PORTAL
            </Typography>
            <Typography variant="caption" sx={{ color: '#8A6D0B' }}>
              — signed in as {customer.contactPerson} of {customer.organisation}. All data is fictitious.
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => navigate('/dashboard')} sx={{ color: '#8A6D0B', fontSize: '0.7rem' }}>
              Return to the internal CRM →
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth="xl"
        component="main"
        sx={{ flex: 1, py: { xs: 2.5, md: 4 }, pb: { xs: 10, md: 4 } }}
      >
        <Outlet />
      </Container>

      <Box sx={{ bgcolor: BRAND.NAVY, color: alpha('#fff', .7), py: 3, mt: 4 }} className="no-print">
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                Export Credit Insurance Corporation of South Africa
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                Block C7 &amp; C8, Eco Origins Office Park, 349 Witch-Hazel Avenue, Highveld Ext 79, Centurion
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                +27 12 471 3000 · info@ecic.demo.co.za · weekdays 08:00–16:30 SAST
              </Typography>
            </Box>
            <Stack gap={0.5}>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>Privacy notice</Typography>
              <Typography variant="caption" sx={{ maxWidth: 460 }}>
                ECIC processes your personal information in line with the Protection of Personal Information Act.
                Access is restricted by role, every access is logged, and information is retained only for the
                period required by law and regulation.
              </Typography>
            </Stack>
          </Stack>
        </Container>
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
          <BottomNavigationAction label="Home" value="/portal" icon={<HomeIcon />} onClick={() => navigate('/portal')} />
          <BottomNavigationAction label="Cases" value="/portal/cases" icon={<CaseIcon />} onClick={() => navigate('/portal/cases')} />
          <BottomNavigationAction label="Applications" value="/portal/applications" icon={<AppIcon />} onClick={() => navigate('/portal/applications')} />
          <BottomNavigationAction label="Chat" value="/portal/chat" icon={<ChatIcon />} onClick={() => navigate('/portal/chat')} />
          <BottomNavigationAction label="Menu" value="menu" icon={<MenuIcon />} onClick={() => setDrawer(true)} />
        </BottomNavigation>
      )}

      <Drawer open={drawer} onClose={() => setDrawer(false)} slotProps={{ paper: { sx: { width: 280 } } }}>
        <Box sx={{ p: 2, bgcolor: BRAND.NAVY, color: '#fff' }}>
          <Typography sx={{ fontWeight: 700 }}>ECIC Customer Portal</Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', .7) }}>{customer.organisation}</Typography>
        </Box>
        <List>
          {PORTAL_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.to} component={RouterLink} to={item.to}
                onClick={() => setDrawer(false)}
                selected={isActive(item.to, item.exact)}
              >
                <ListItemIcon sx={{ minWidth: 38 }}><Icon fontSize="small" /></ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }} />
              </ListItemButton>
            );
          })}
        </List>
        <Divider />
        <List>
          <ListItemButton onClick={() => { setDrawer(false); navigate('/dashboard'); }}>
            <ListItemIcon sx={{ minWidth: 38 }}><BusinessIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Internal CRM" slotProps={{ primary: { sx: { fontSize: '0.875rem' } } }} />
          </ListItemButton>
        </List>
      </Drawer>

      <Menu
        anchorEl={accountAnchor} open={!!accountAnchor} onClose={() => setAccountAnchor(null)}
        slotProps={{ paper: { sx: { width: 320, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{customer.contactPerson}</Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>{customer.organisation}</Typography>
          <Chip size="small" label={`Customer ID ${customer.id}`} sx={{ mt: 1, height: 20, fontSize: '0.65rem' }} />
        </Box>
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.75 }}>Switch demonstration customer</Typography>
          {store.customers.filter((c) => c.customerType !== 'Internal').slice(0, 6).map((c) => (
            <MenuItem
              key={c.id} selected={c.id === customer.id}
              onClick={() => { setSession({ portalCustomerId: c.id }); setAccountAnchor(null); }}
              sx={{ borderRadius: 1.5, fontSize: '0.82rem' }}
            >
              {c.organisation}
            </MenuItem>
          ))}
        </Box>
        <Divider />
        <MenuItem onClick={() => { setAccountAnchor(null); navigate('/portal/profile'); }}>
          <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
          My profile and consent
        </MenuItem>
        <MenuItem onClick={() => { setAccountAnchor(null); navigate('/dashboard'); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out of the portal
        </MenuItem>
      </Menu>

      {toasts.slice(-1).map((t) => (
        <Snackbar
          key={t.id} open autoHideDuration={5000}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ bottom: { xs: 76, md: 24 } }}
        >
          <Alert
            severity={t.severity} variant="filled"
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
            sx={{ maxWidth: 520 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.message}</Typography>
            {t.detail && <Typography variant="caption" sx={{ color: alpha('#fff', .85) }}>{t.detail}</Typography>}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
}

export default PortalShell;
