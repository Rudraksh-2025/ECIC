import * as React from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Divider, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tooltip, Paper, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SwitchAccountIcon from '@mui/icons-material/SwitchAccount';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ALL_PERMISSIONS, ROLE_LIST, ROLES } from '../data/roles';
import { writeAudit } from '../services/mockApi';
import {
  DataTable, DemoScenarioPanel, Grid, KpiCard, PageHeader, SectionCard, Stack, StatusChip,
} from '../components';
import type { Column } from '../components';
import { toast } from '../hooks';
import { fmtDateTime, relativeTime } from '../utils/dates';
import { downloadCsv, num } from '../utils/format';
import type { Permission, RoleId, User } from '../types';

const PERMISSION_GROUPS: { label: string; prefix: string }[] = [
  { label: 'Complaints', prefix: 'complaint.' },
  { label: 'Leads', prefix: 'lead.' },
  { label: 'Opportunities', prefix: 'opportunity.' },
  { label: 'Applications', prefix: 'application.' },
  { label: 'Documents', prefix: 'document.' },
  { label: 'Marketing & CIM', prefix: 'campaign.' },
  { label: 'CIM governance', prefix: 'cim.' },
  { label: 'Underwriting', prefix: 'underwriting.' },
  { label: 'Reporting', prefix: 'report.' },
  { label: 'Administration', prefix: 'config.' },
  { label: 'Security', prefix: 'security.' },
  { label: 'Other', prefix: '' },
];

function groupOf(permission: string): string {
  const match = PERMISSION_GROUPS.find((g) => g.prefix && permission.startsWith(g.prefix));
  return match?.label ?? 'Other';
}

export function UsersRoles() {
  const navigate = useNavigate();
  const store = useStore();
  const setSession = useStore((s) => s.setSession);
  const [tab, setTab] = React.useState(0);

  const activeRole = store.session.role;

  const switchTo = (roleId: RoleId) => {
    const candidate = store.users.find((u) => u.role === roleId && u.status === 'Active');
    setSession({ role: roleId, userId: candidate?.id ?? store.session.userId, showSensitiveData: false });
    writeAudit('Role switched (demonstration)', 'Authentication', candidate?.id ?? '—',
      `Role: ${activeRole}`, `Role: ${roleId}; User: ${candidate?.name}`);
    toast({
      message: `Now acting as ${ROLES[roleId].name}`,
      severity: 'success',
      detail: `${ROLES[roleId].modules.length} module(s) visible, ${ROLES[roleId].permissions.length} permission(s). ${ROLES[roleId].segregationNote}`,
    });
    if (roleId === 'portal_customer') navigate('/portal');
  };

  const userColumns: Column<User>[] = [
    {
      id: 'name', label: 'User', sortValue: (r) => r.name,
      render: (r) => (
        <Stack direction="row" gap={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: r.avatarColor }}>{r.initials}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }}>{r.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { id: 'role', label: 'Role', width: 190, sortValue: (r) => ROLES[r.role].name, render: (r) => <Chip size="small" label={ROLES[r.role].name} sx={{ bgcolor: alpha('#0B2545', .08), fontWeight: 600 }} /> },
    { id: 'jobTitle', label: 'Job title', hideOn: 'md', sortValue: (r) => r.jobTitle, render: (r) => <Typography variant="body2" noWrap>{r.jobTitle}</Typography> },
    { id: 'businessUnit', label: 'Business unit', hideOn: 'md', sortValue: (r) => r.businessUnit, render: (r) => <Typography variant="body2" noWrap>{r.businessUnit}</Typography> },
    { id: 'status', label: 'Status', width: 110, sortValue: (r) => r.status, render: (r) => <StatusChip value={r.status === 'Active' ? 'Active' : 'Escalated'} /> },
    {
      id: 'security', label: 'MFA / SSO', width: 150, hideOn: 'sm',
      render: (r) => (
        <Stack direction="row" gap={0.5}>
          <Chip size="small" label={r.mfaEnrolled ? 'MFA' : 'No MFA'}
            sx={{ height: 19, fontSize: '0.62rem', bgcolor: alpha(r.mfaEnrolled ? '#059669' : '#DC2626', .12), color: r.mfaEnrolled ? '#059669' : '#DC2626', fontWeight: 700 }} />
          <Chip size="small" label={r.ssoLinked ? 'SSO' : 'Local'}
            sx={{ height: 19, fontSize: '0.62rem', bgcolor: alpha(r.ssoLinked ? '#2563EB' : '#94A3B8', .12), color: r.ssoLinked ? '#2563EB' : '#64748B', fontWeight: 700 }} />
        </Stack>
      ),
    },
    {
      id: 'lastLogin', label: 'Last sign-in', width: 165, hideOn: 'md', sortValue: (r) => r.lastLogin,
      render: (r) => (
        <Tooltip title={fmtDateTime(r.lastLogin)}>
          <Typography variant="body2">{relativeTime(r.lastLogin)}</Typography>
        </Tooltip>
      ),
    },
    {
      id: 'actions', label: '', width: 130,
      render: (r) => (
        <Button
          size="small" variant={r.role === activeRole ? 'contained' : 'outlined'}
          startIcon={<SwitchAccountIcon sx={{ fontSize: 16 }} />}
          disabled={r.status !== 'Active'}
          onClick={(e) => { e.stopPropagation(); switchTo(r.role); }}
        >
          {r.role === activeRole ? 'Active' : 'Act as'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users & Roles"
        subtitle="Nine ECIC roles with an explicit permission matrix and documented segregation of duties. Switching role changes the navigation, the permitted actions and the visibility of personal information in the same session."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Users & Roles' }]}
        chips={<Chip size="small" label={`Acting as: ${ROLES[activeRole].name}`} sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />}
        actions={
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => downloadCsv('ECIC_Role_Permission_Matrix',
              ROLE_LIST.map((r) => ({
                Role: r.name,
                Description: r.description,
                'Segregation of duties': r.segregationNote,
                'Permission count': r.permissions.length,
                Permissions: r.permissions.join(' | '),
                'Visible modules': r.modules.join(' | '),
              })))}
          >
            Export matrix
          </Button>
        }
      />

      <DemoScenarioPanel
        scenario="The evaluator asks how ECIC prevents the person who investigates a complaint from also authorising its closure. The role matrix answers it, and the role switcher proves it in the live interface."
        evidence={[
          'Nine roles with an explicit, exportable permission matrix',
          'Documented segregation rationale on every role',
          'Live role switching that changes navigation, actions and field visibility',
          'Closure, approval and administration rights held by different roles',
          'User records showing MFA enrolment, SSO linkage and account status',
        ]}
        requirements={[20, 86, 87, 77, 78]}
        next="Switch to Complaints Specialist and try to close a complaint"
        nextTo="/complaints"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Roles" value={num(ROLE_LIST.length)} colour="#0B2545" />
        <KpiCard dense label="Users" value={num(store.users.length)} colour="#2563EB" />
        <KpiCard dense label="Active accounts" value={num(store.users.filter((u) => u.status === 'Active').length)} colour="#059669" />
        <KpiCard dense label="Suspended" value={num(store.users.filter((u) => u.status !== 'Active').length)} colour="#DC2626" />
        <KpiCard dense label="MFA enrolled" value={num(store.users.filter((u) => u.mfaEnrolled).length)} colour="#0E7C7B" />
        <KpiCard dense label="Permissions defined" value={num(ALL_PERMISSIONS.length)} colour="#7C3AED" />
      </Grid>

      <SectionCard>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Role definitions" />
          <Tab label="Permission matrix" />
          <Tab label={`Users (${store.users.length})`} />
          <Tab label="Module visibility" />
        </Tabs>

        {tab === 0 && (
          <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2}>
            {ROLE_LIST.map((r) => {
              const isActive = r.id === activeRole;
              const user = store.users.find((u) => u.role === r.id && u.status === 'Active');
              return (
                <Box
                  key={r.id}
                  sx={{
                    p: 2, borderRadius: 2.5, display: 'flex', flexDirection: 'column',
                    border: '2px solid', borderColor: isActive ? 'secondary.main' : 'divider',
                    bgcolor: isActive ? alpha('#0E7C7B', .03) : 'transparent',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                    <Typography variant="subtitle1">{r.name}</Typography>
                    {isActive && <Chip size="small" label="ACTIVE" sx={{ bgcolor: alpha('#0E7C7B', .14), color: '#0E7C7B', fontWeight: 700, fontSize: '0.6rem' }} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, flex: 1 }}>{r.description}</Typography>
                  <Alert severity="info" icon={false} sx={{ mt: 1.5, py: 0.5 }}>
                    <Typography variant="caption">{r.segregationNote}</Typography>
                  </Alert>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                    <Chip size="small" label={`${r.permissions.length} permissions`} />
                    <Chip size="small" label={`${r.modules.length} modules`} />
                  </Stack>
                  {user && (
                    <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: '0.62rem', bgcolor: user.avatarColor }}>{user.initials}</Avatar>
                      <Typography variant="caption">{user.name} · {user.team}</Typography>
                    </Stack>
                  )}
                  <Button
                    size="small" variant={isActive ? 'contained' : 'outlined'} fullWidth
                    startIcon={<SwitchAccountIcon sx={{ fontSize: 17 }} />}
                    onClick={() => switchTo(r.id)}
                  >
                    {isActive ? 'Currently active' : `Act as ${r.name}`}
                  </Button>
                </Box>
              );
            })}
          </Grid>
        )}

        {tab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              A tick means the role holds the permission. The gaps are the control: notice that no single role can
              both investigate and authorise the closure of a complaint, and that the System Administrator holds no
              transactional rights at all.
            </Alert>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, maxHeight: 640 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 230, position: 'sticky', left: 0, zIndex: 3, bgcolor: '#F8FAFC' }}>
                      Permission
                    </TableCell>
                    {ROLE_LIST.map((r) => (
                      <TableCell key={r.id} align="center" sx={{ minWidth: 92 }}>
                        <Tooltip title={r.segregationNote}>
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.62rem', lineHeight: 1.25, display: 'block' }}>
                            {r.name}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PERMISSION_GROUPS.map((group) => {
                    const perms = ALL_PERMISSIONS.filter((p) => groupOf(p) === group.label);
                    if (perms.length === 0) return null;
                    return (
                      <React.Fragment key={group.label}>
                        <TableRow>
                          <TableCell
                            colSpan={ROLE_LIST.length + 1}
                            sx={{ bgcolor: alpha('#0B2545', .04), fontWeight: 700, fontSize: '0.7rem', letterSpacing: '.06em' }}
                          >
                            {group.label.toUpperCase()}
                          </TableCell>
                        </TableRow>
                        {perms.map((p) => (
                          <TableRow key={p} hover>
                            <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper', fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}>
                              {p}
                            </TableCell>
                            {ROLE_LIST.map((r) => {
                              const has = r.permissions.includes(p as Permission);
                              return (
                                <TableCell key={r.id} align="center" sx={{ bgcolor: r.id === activeRole ? alpha('#0E7C7B', .05) : undefined }}>
                                  {has
                                    ? <CheckIcon sx={{ fontSize: 17, color: 'success.main' }} />
                                    : <CloseIcon sx={{ fontSize: 15, color: alpha('#DC2626', .3) }} />}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 2 && (
          <DataTable
            rows={store.users}
            columns={userColumns}
            searchable
            searchPlaceholder="Search name, email, role, team or business unit…"
            searchFields={(r) => `${r.name} ${r.email} ${r.jobTitle} ${r.businessUnit} ${r.team} ${ROLES[r.role].name}`}
            defaultSort={{ id: 'name', dir: 'asc' }}
            initialRowsPerPage={20}
          />
        )}

        {tab === 3 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Module visibility is part of the access model, not merely a cosmetic filter. A module hidden from a
              role is unreachable for that role, including by direct URL entry.
            </Alert>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, maxHeight: 560 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 210, position: 'sticky', left: 0, zIndex: 3, bgcolor: '#F8FAFC' }}>Module</TableCell>
                    {ROLE_LIST.map((r) => (
                      <TableCell key={r.id} align="center" sx={{ minWidth: 92 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.62rem', lineHeight: 1.25, display: 'block' }}>
                          {r.name}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(new Set(ROLE_LIST.flatMap((r) => r.modules))).sort().map((m) => (
                    <TableRow key={m} hover>
                      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper', fontWeight: 600 }}>{m}</TableCell>
                      {ROLE_LIST.map((r) => (
                        <TableCell key={r.id} align="center" sx={{ bgcolor: r.id === activeRole ? alpha('#0E7C7B', .05) : undefined }}>
                          {r.modules.includes(m)
                            ? <CheckIcon sx={{ fontSize: 17, color: 'success.main' }} />
                            : <CloseIcon sx={{ fontSize: 15, color: alpha('#DC2626', .3) }} />}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
              <Typography variant="caption">
                The Customer (Portal User) role has no internal CRM modules at all — external users reach only the
                customer portal, and see only their own organisation&apos;s records.
              </Typography>
            </Alert>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}

export default UsersRoles;
