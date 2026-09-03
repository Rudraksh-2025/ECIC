import * as React from 'react';
import {
  Box, Chip, Divider, InputBase, List, ListItemButton, ListItemText, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Stack } from '../components/Stack';
import { EmptyState } from '../components';
import { zar } from '../utils/format';

interface Hit {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  to: string;
  colour: string;
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState('');
  const navigate = useNavigate();
  const store = useStore();

  const hits = React.useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Hit[] = [];
    const match = (...vals: (string | null | undefined)[]) =>
      vals.some((v) => (v ?? '').toLowerCase().includes(q));

    store.customers.filter((c) => match(c.organisation, c.contactPerson, c.id, c.sector, c.country))
      .slice(0, 5).forEach((c) => out.push({
        id: c.id, type: 'Customer', title: c.organisation,
        subtitle: `${c.customerType} · ${c.sector} · ${c.country}`,
        to: `/customers/${c.id}`, colour: '#0B2545',
      }));

    store.complaints.filter((c) => match(c.reference, c.subject, c.description, c.category))
      .slice(0, 5).forEach((c) => out.push({
        id: c.id, type: 'Complaint', title: `${c.reference} — ${c.subject}`,
        subtitle: `${c.status} · ${c.severity} · ${c.category}`,
        to: `/complaints/${c.id}`, colour: '#DC2626',
      }));

    store.leads.filter((l) => match(l.reference, l.company, l.contactName, l.email))
      .slice(0, 5).forEach((l) => out.push({
        id: l.id, type: 'Lead', title: `${l.company} — ${l.contactName}`,
        subtitle: `${l.reference} · ${l.status} · ${l.source}`,
        to: `/leads/${l.id}`, colour: '#2563EB',
      }));

    store.opportunities.filter((o) => match(o.reference, o.name))
      .slice(0, 5).forEach((o) => out.push({
        id: o.id, type: 'Opportunity', title: o.name,
        subtitle: `${o.reference} · ${o.stage} · ${zar(o.estimatedValue, true)}`,
        to: `/opportunities/${o.id}`, colour: '#0E7C7B',
      }));

    store.applications.filter((a) => match(a.reference, a.formType))
      .slice(0, 4).forEach((a) => out.push({
        id: a.id, type: 'Application', title: `${a.reference} — ${a.formType}`,
        subtitle: a.status, to: `/applications/${a.id}`, colour: '#7C3AED',
      }));

    store.documents.filter((d) => match(d.name, d.docType, d.transactionRef))
      .slice(0, 4).forEach((d) => out.push({
        id: d.id, type: 'Document', title: d.name,
        subtitle: `${d.docType} · ${d.classification} · ${d.status}`,
        to: `/documents?doc=${d.id}`, colour: '#C9A227',
      }));

    store.campaigns.filter((c) => match(c.name, c.reference))
      .slice(0, 3).forEach((c) => out.push({
        id: c.id, type: 'Campaign', title: c.name,
        subtitle: `${c.reference} · ${c.type} · ${c.status}`,
        to: `/campaigns/${c.id}`, colour: '#D97706',
      }));

    store.faqs.filter((f) => match(f.question, f.answer))
      .slice(0, 3).forEach((f) => out.push({
        id: f.id, type: 'FAQ', title: f.question,
        subtitle: f.category, to: `/faqs?q=${encodeURIComponent(f.question)}`, colour: '#059669',
      }));

    return out;
  }, [query, store]);

  const go = (to: string) => { navigate(to); onClose(); };

  return (
    <Box>
      <Stack direction="row" gap={1.5} alignItems="center" sx={{ px: 2.5, py: 2 }}>
        <SearchIcon sx={{ color: 'text.secondary' }} />
        <InputBase
          autoFocus fullWidth value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) go(hits[0].to); }}
          placeholder="Search customers, complaints, leads, opportunities, applications, documents, campaigns, FAQs…"
          sx={{ fontSize: '0.95rem' }}
          inputProps={{ 'aria-label': 'Global search' }}
        />
      </Stack>
      <Divider />
      {query.trim().length < 2 ? (
        <Box sx={{ px: 2.5, py: 3 }}>
          <Typography variant="overline" color="text.secondary">Try searching for</Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
            {['Highveld', 'ECIC-CMP', 'Zambezi', 'escalated', 'signed application', 'Africa Trade Expo', 'complaint'].map((s) => (
              <Chip key={s} label={s} size="small" onClick={() => setQuery(s)} sx={{ cursor: 'pointer' }} />
            ))}
          </Stack>
        </Box>
      ) : hits.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing in the demonstration dataset matches "${query}". Try a customer name, a reference number, or a keyword such as "escalated".`}
        />
      ) : (
        <List sx={{ maxHeight: 420, overflowY: 'auto', py: 0.5 }}>
          {hits.map((h) => (
            <ListItemButton key={`${h.type}-${h.id}`} onClick={() => go(h.to)} sx={{ px: 2.5, py: 1 }}>
              <Chip
                label={h.type} size="small"
                sx={{ mr: 1.5, minWidth: 88, bgcolor: alpha(h.colour, 0.11), color: h.colour, fontSize: '0.65rem' }}
              />
              <ListItemText
                primary={h.title}
                secondary={h.subtitle}
                slotProps={{
                  primary: { sx: { fontSize: '0.85rem', fontWeight: 600 }, noWrap: true },
                  secondary: { sx: { fontSize: '0.72rem' }, noWrap: true },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
      <Divider />
      <Stack direction="row" gap={2} sx={{ px: 2.5, py: 1.25 }} alignItems="center">
        <Typography variant="caption">
          {hits.length > 0 ? `${hits.length} result${hits.length > 1 ? 's' : ''} · Enter opens the first` : 'Press ⌘K / Ctrl+K to open search anywhere'}
        </Typography>
      </Stack>
    </Box>
  );
}
