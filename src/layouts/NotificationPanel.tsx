import * as React from 'react';
import { Box, Button, Chip, Divider, List, ListItemButton, Tab, Tabs, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import AppsIcon from '@mui/icons-material/NotificationsActive';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../services/mockApi';
import { Stack } from '../components/Stack';
import { EmptyState } from '../components';
import { relativeTime } from '../utils/dates';

const SEVERITY_COLOUR: Record<string, string> = {
  info: '#2563EB', warning: '#D97706', error: '#DC2626', success: '#059669',
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  Email: <EmailIcon sx={{ fontSize: 13 }} />,
  SMS: <SmsIcon sx={{ fontSize: 13 }} />,
  'In-App': <AppsIcon sx={{ fontSize: 13 }} />,
};

export function routeForNotification(type: string | null, id: string | null): string {
  if (!type || !id) return '/notifications';
  switch (type) {
    case 'Complaint': return `/complaints/${id}`;
    case 'Lead': return `/leads/${id}`;
    case 'Opportunity': return `/opportunities/${id}`;
    case 'Application': return `/applications/${id}`;
    case 'Campaign': return `/campaigns/${id}`;
    case 'CIM': return '/cim';
    case 'Document': return '/documents';
    case 'Integration': return '/integrations';
    default: return '/notifications';
  }
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = React.useState(0);
  const notifications = useStore((s) => s.notifications);
  const userId = useStore((s) => s.session.userId);
  const navigate = useNavigate();

  const mine = notifications.filter((n) => !n.recipientId || n.recipientId === userId);
  const list = tab === 0 ? mine : mine.filter((n) => !n.read);
  const unread = mine.filter((n) => !n.read).length;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 1.75, pb: 0.5 }}>
        <Typography variant="h5">Notifications</Typography>
        <Button size="small" onClick={() => api.markAllNotificationsRead()} disabled={unread === 0}>
          Mark all read
        </Button>
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1.5, minHeight: 38 }}>
        <Tab label={`All (${mine.length})`} sx={{ minHeight: 38 }} />
        <Tab label={`Unread (${unread})`} sx={{ minHeight: 38 }} />
      </Tabs>
      <Divider />
      {list.length === 0 ? (
        <EmptyState title="Nothing here" description="You are up to date — no notifications match this view." />
      ) : (
        <List sx={{ maxHeight: 380, overflowY: 'auto', py: 0 }}>
          {list.slice(0, 40).map((n) => (
            <ListItemButton
              key={n.id}
              onClick={() => {
                api.markNotificationRead(n.id);
                navigate(routeForNotification(n.relatedType, n.relatedId));
                onClose();
              }}
              sx={{
                px: 2, py: 1.25, borderRadius: 0, alignItems: 'flex-start',
                borderLeft: `3px solid ${n.read ? 'transparent' : SEVERITY_COLOUR[n.severity]}`,
                bgcolor: n.read ? 'transparent' : alpha(SEVERITY_COLOUR[n.severity], 0.04),
              }}
            >
              <Box sx={{ minWidth: 0, width: '100%' }}>
                <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: n.read ? 600 : 700 }} noWrap>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" sx={{ flexShrink: 0 }}>{relativeTime(n.createdAt)}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{
                  mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {n.body}
                </Typography>
                <Stack direction="row" gap={0.5} sx={{ mt: 0.75 }} alignItems="center">
                  <Chip
                    size="small" label={n.type}
                    sx={{ height: 18, fontSize: '0.63rem', bgcolor: alpha(SEVERITY_COLOUR[n.severity], 0.12), color: SEVERITY_COLOUR[n.severity] }}
                  />
                  <Chip
                    size="small" icon={CHANNEL_ICON[n.channel] as React.ReactElement} label={n.channel}
                    sx={{ height: 18, fontSize: '0.63rem', '& .MuiChip-icon': { ml: '5px' } }}
                  />
                </Stack>
              </Box>
            </ListItemButton>
          ))}
        </List>
      )}
      <Divider />
      <Box sx={{ p: 1 }}>
        <Button fullWidth size="small" onClick={() => { navigate('/notifications'); onClose(); }}>
          Open notification centre
        </Button>
      </Box>
    </Box>
  );
}
