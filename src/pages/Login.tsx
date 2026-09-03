import * as React from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, MenuItem, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import KeyIcon from '@mui/icons-material/VpnKey';
import LoginIcon from '@mui/icons-material/Login';
import LanguageIcon from '@mui/icons-material/Language';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES, ROLE_LIST } from '../data/roles';
import { writeAudit } from '../services/mockApi';
import { Stack } from '../components/Stack';
import { SimulatedBadge } from '../components';
import { MfaDialog } from './SecurityCenter';
import { toast } from '../hooks';
import { BRAND } from '../theme/theme';
import type { RoleId } from '../types';

export function Login() {
  const navigate = useNavigate();
  const store = useStore();
  const setSession = useStore((s) => s.setSession);
  const [roleId, setRoleId] = React.useState<RoleId>('complaints_supervisor');
  const [mfaOpen, setMfaOpen] = React.useState(false);

  const candidate = store.users.find((u) => u.role === roleId && u.status === 'Active');

  const signIn = () => {
    setSession({ role: roleId, userId: candidate?.id ?? store.session.userId, authenticated: true, mfaVerified: true, showSensitiveData: false });
    writeAudit('User signed in', 'Authentication', candidate?.id ?? '—', '—',
      `SSO assertion accepted; MFA satisfied; role: ${ROLES[roleId].name}`);
    toast({
      message: `Signed in as ${candidate?.name}`,
      severity: 'success',
      detail: `${ROLES[roleId].name} · ${ROLES[roleId].permissions.length} permissions · ${ROLES[roleId].modules.length} modules visible.`,
    });
    navigate(roleId === 'portal_customer' ? '/portal' : '/dashboard');
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3,
      background: `linear-gradient(135deg, ${BRAND.NAVY} 0%, ${BRAND.NAVY_LIGHT} 55%, ${BRAND.ACCENT} 190%)`,
    }}>
      <Box sx={{ width: '100%', maxWidth: 940 }}>
        <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 3, justifyContent: 'center' }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            background: `linear-gradient(140deg, ${BRAND.ACCENT} 0%, ${BRAND.NAVY_LIGHT} 70%)`,
            display: 'grid', placeItems: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.03em' }}>EC</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>
              ECIC CRM Platform
            </Typography>
            <Typography sx={{ color: alpha('#fff', .6), fontSize: '0.72rem', letterSpacing: '.08em', fontWeight: 600 }}>
              BID DEMONSTRATION BUILD · FRONTEND ONLY · DUMMY DATA
            </Typography>
          </Box>
        </Stack>

        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h3" sx={{ mb: 0.75 }}>Sign in</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the demonstration role you want to sign in as. The role determines which modules are visible,
                which actions are permitted and whether personal information is masked.
              </Typography>

              <Stack gap={2.5}>
                <TextField
                  select label="Demonstration role" value={roleId} fullWidth
                  onChange={(e) => setRoleId(e.target.value as RoleId)}
                >
                  {ROLE_LIST.map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </TextField>

                {candidate && (
                  <Box sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{candidate.name}</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {candidate.jobTitle} · {candidate.businessUnit}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {candidate.email}
                    </Typography>
                    <Stack direction="row" gap={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                      <Chip size="small" label={`${ROLES[roleId].permissions.length} permissions`} />
                      <Chip size="small" label={`${ROLES[roleId].modules.length} modules`} />
                      <Chip size="small" label={candidate.mfaEnrolled ? 'MFA enrolled' : 'MFA not enrolled'}
                        sx={{ bgcolor: alpha(candidate.mfaEnrolled ? '#059669' : '#DC2626', .12), color: candidate.mfaEnrolled ? '#059669' : '#DC2626', fontWeight: 700 }} />
                    </Stack>
                  </Box>
                )}

                <Alert severity="info" icon={false}>
                  <Typography variant="caption"><strong>Segregation of duties:</strong> {ROLES[roleId].segregationNote}</Typography>
                </Alert>

                <Stack gap={1.25}>
                  <Button
                    fullWidth size="large" variant="contained" startIcon={<KeyIcon />}
                    onClick={signIn}
                  >
                    Sign in with corporate SSO
                  </Button>
                  <Button
                    fullWidth size="large" variant="outlined" startIcon={<LoginIcon />}
                    onClick={() => setMfaOpen(true)}
                  >
                    Sign in with username, password and MFA
                  </Button>
                  <Button
                    fullWidth startIcon={<LanguageIcon />}
                    onClick={() => navigate('/portal')}
                  >
                    Open the customer portal instead
                  </Button>
                </Stack>

                <Divider />
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                  <SimulatedBadge />
                  <Typography variant="caption">
                    Authentication is simulated in this browser-only demonstration. No identity provider is contacted
                    and no credentials are transmitted or stored.
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>

            <Box sx={{
              p: 4, display: { xs: 'none', md: 'block' },
              background: `linear-gradient(150deg, ${alpha(BRAND.NAVY, .04)} 0%, ${alpha(BRAND.ACCENT, .07)} 100%)`,
              borderLeft: '1px solid', borderColor: 'divider',
            }}>
              <Typography variant="overline" color="text.secondary">Demonstration roles available</Typography>
              <Stack gap={1.25} sx={{ mt: 1.25 }}>
                {ROLE_LIST.map((r) => (
                  <Box
                    key={r.id}
                    onClick={() => setRoleId(r.id)}
                    sx={{
                      p: 1.25, borderRadius: 2, cursor: 'pointer',
                      border: '1px solid', borderColor: r.id === roleId ? 'secondary.main' : 'transparent',
                      bgcolor: r.id === roleId ? 'background.paper' : 'transparent',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: r.id === roleId ? 700 : 600 }}>{r.name}</Typography>
                    <Typography variant="caption" sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {r.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Card>

        <Typography sx={{ color: alpha('#fff', .55), fontSize: '0.72rem', textAlign: 'center', mt: 2.5 }}>
          ECIC CRM Platform bid demonstration · all data is fictitious · no production system is connected
        </Typography>
      </Box>

      <MfaDialog
        open={mfaOpen}
        context="internal"
        username={candidate?.email}
        onClose={() => setMfaOpen(false)}
        onSuccess={() => { setMfaOpen(false); signIn(); }}
      />
    </Box>
  );
}

export default Login;
