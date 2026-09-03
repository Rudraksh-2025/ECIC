import * as React from 'react';
import { Alert, Box, Button, Chip, Divider, Tab, Tabs, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import AppsIcon from '@mui/icons-material/NotificationsActive';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import {
  DemoScenarioPanel, EmptyState, FilterBar, Grid, KpiCard, PageHeader, SectionCard, Stack,
} from '../components';
import { toast } from '../hooks';
import { fmtDateTime, relativeTime } from '../utils/dates';
import { num } from '../utils/format';
import { routeForNotification } from '../layouts/NotificationPanel';

const SEVERITY_COLOUR: Record<string, string> = {
  info: '#2563EB', warning: '#D97706', error: '#DC2626', success: '#059669',
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  Email: <EmailIcon sx={{ fontSize: 14 }} />,
  SMS: <SmsIcon sx={{ fontSize: 14 }} />,
  'In-App': <AppsIcon sx={{ fontSize: 14 }} />,
};

export function Notifications() {
  const navigate = useNavigate();
  const store = useStore();
  const [tab, setTab] = React.useState(0);
  const [filters, setFilters] = React.useState({ type: 'all', channel: 'all', severity: 'all' });
  const set = (id: string, value: string) => setFilters((f) => ({ ...f, [id]: value }));

  const mine = store.notifications.filter((n) => !n.recipientId || n.recipientId === store.session.userId);
  const scoped = tab === 0 ? mine : tab === 1 ? mine.filter((n) => !n.read) : store.notifications;

  const filtered = scoped.filter((n) =>
    (filters.type === 'all' || n.type === filters.type)
    && (filters.channel === 'all' || n.channel === filters.channel)
    && (filters.severity === 'all' || n.severity === filters.severity));

  const unread = mine.filter((n) => !n.read).length;

  return (
    <Box>
      <PageHeader
        title="Notification Centre"
        subtitle="Every notification raised by the CRM across the in-app, email and SMS channels, rendered from the configurable communication templates."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Notifications' }]}
        actions={
          <>
            <Button
              variant="outlined" startIcon={<DoneAllIcon />} disabled={unread === 0}
              onClick={() => {
                api.markAllNotificationsRead();
                toast({ message: 'All notifications marked as read', severity: 'success' });
              }}
            >
              Mark all read
            </Button>
            <Button variant="contained" onClick={() => navigate('/configuration?tab=templates')}>
              Configure templates
            </Button>
          </>
        }
      />

      <DemoScenarioPanel
        scenario="Customers and staff are notified at every stage of the complaint, lead and application lifecycles. The content of each message comes from a template a business administrator can edit."
        evidence={[
          'Twelve configurable templates covering the full complaint, lead and application lifecycles',
          'In-app, email and SMS channels represented per notification',
          'Rendered message content visible on every notification',
          'SLA warning and breach alerts raised automatically from the configured thresholds',
          'Unread counts that update as notifications are read',
        ]}
        requirements={[5, 6, 15, 52, 91]}
        next="Edit a template and trigger the notification again"
        nextTo="/configuration?tab=templates"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="All notifications" value={num(store.notifications.length)} colour="#0B2545" />
        <KpiCard dense label="Unread (yours)" value={num(unread)} colour="#DC2626" onClick={() => setTab(1)} />
        <KpiCard dense label="SLA alerts" value={num(store.notifications.filter((n) => n.type.startsWith('SLA')).length)} colour="#D97706" onClick={() => set('type', 'SLA Warning')} />
        <KpiCard dense label="Escalations" value={num(store.notifications.filter((n) => n.type === 'Escalation').length)} colour="#B91C1C" onClick={() => set('type', 'Escalation')} />
        <KpiCard dense label="Approval requests" value={num(store.notifications.filter((n) => n.type === 'Approval Request').length)} colour="#7C3AED" onClick={() => set('type', 'Approval Request')} />
        <KpiCard dense label="Customer communications" value={num(store.notifications.filter((n) => n.type === 'Communication Sent').length)} colour="#059669" onClick={() => set('type', 'Communication Sent')} />
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`My notifications (${mine.length})`} />
        <Tab label={`Unread (${unread})`} />
        <Tab label={`All users (${store.notifications.length})`} />
      </Tabs>

      <FilterBar
        filters={[
          { id: 'type', label: 'Type', options: [{ value: 'all', label: 'All types' }, ...['SLA Warning', 'SLA Breach', 'Assignment', 'Approval Request', 'Escalation', 'New Lead', 'Customer Reply', 'System Alert', 'Communication Sent'].map((t) => ({ value: t, label: t }))], width: 205 },
          { id: 'channel', label: 'Channel', options: [{ value: 'all', label: 'All channels' }, ...['In-App', 'Email', 'SMS'].map((c) => ({ value: c, label: c }))], width: 160 },
          { id: 'severity', label: 'Severity', options: [{ value: 'all', label: 'All' }, ...['info', 'success', 'warning', 'error'].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))], width: 145 },
        ]}
        values={filters}
        onChange={set}
        onReset={() => setFilters({ type: 'all', channel: 'all', severity: 'all' })}
      />

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState title="No notifications match these filters" description="Clear the filters, or perform a workflow action elsewhere in the CRM to raise a new notification." />
        </SectionCard>
      ) : (
        <Stack gap={1.25}>
          {filtered.slice(0, 80).map((n) => (
            <Box
              key={n.id}
              onClick={() => {
                api.markNotificationRead(n.id);
                if (n.relatedType && n.relatedId) navigate(routeForNotification(n.relatedType, n.relatedId));
              }}
              sx={{
                p: 2, borderRadius: 2.5, cursor: 'pointer',
                bgcolor: n.read ? 'background.paper' : alpha(SEVERITY_COLOUR[n.severity], .03),
                border: '1px solid', borderColor: 'divider',
                borderLeft: `4px solid ${n.read ? alpha(SEVERITY_COLOUR[n.severity], .35) : SEVERITY_COLOUR[n.severity]}`,
                '&:hover': { borderColor: SEVERITY_COLOUR[n.severity] },
              }}
            >
              <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: n.read ? 600 : 700 }}>
                      {n.title}
                    </Typography>
                    {!n.read && <Chip size="small" label="Unread" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(SEVERITY_COLOUR[n.severity], .14), color: SEVERITY_COLOUR[n.severity], fontWeight: 700 }} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, whiteSpace: 'pre-wrap' }}>
                    {n.body}
                  </Typography>
                </Box>
                <Stack gap={0.75} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                  <Typography variant="caption">{relativeTime(n.createdAt)}</Typography>
                  <Stack direction="row" gap={0.5}>
                    <Chip
                      size="small" icon={CHANNEL_ICON[n.channel] as React.ReactElement} label={n.channel}
                      sx={{ height: 21, fontSize: '0.65rem', '& .MuiChip-icon': { ml: '6px' } }}
                    />
                    <Chip
                      size="small" label={n.type}
                      sx={{ height: 21, fontSize: '0.65rem', bgcolor: alpha(SEVERITY_COLOUR[n.severity], .1), color: SEVERITY_COLOUR[n.severity], fontWeight: 600 }}
                    />
                  </Stack>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1.25 }} />
              <Stack direction="row" justifyContent="space-between" gap={1} flexWrap="wrap">
                <Typography variant="caption">
                  {fmtDateTime(n.createdAt)}
                  {n.recipientId && ` · to ${store.users.find((u) => u.id === n.recipientId)?.name ?? n.recipientId}`}
                  {n.relatedType && ` · ${n.relatedType} ${n.relatedId}`}
                </Typography>
                {n.relatedType && n.relatedId && (
                  <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 700 }}>Open record →</Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 3 }}>
        <SectionCard
          title="Communication templates in use"
          subtitle="Each notification above was rendered from one of these templates, which are edited in the Configuration Centre without development"
          action={<Button size="small" onClick={() => navigate('/configuration?tab=templates')}>Edit templates</Button>}
        >
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
            {store.configuration.notificationTemplates.map((t) => (
              <Box key={t.id} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{t.name}</Typography>
                  <Chip size="small" label={t.channel} sx={{ height: 19, fontSize: '0.62rem' }} />
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Trigger: {t.trigger}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }} noWrap>
                  {t.subject}
                </Typography>
              </Box>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" icon={false}>
            <Typography variant="caption">
              <strong>DEMO / SIMULATED delivery.</strong> Email and SMS transmission is simulated in this
              browser-only build. The message content, the channel selection driven by the customer&apos;s preferred
              channel, and the audit record of the communication are all real and demonstrable.
            </Typography>
          </Alert>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Notifications;
