import * as React from 'react';
import { Alert, Box, Button, Chip, Divider, MenuItem, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Grid, KpiCard, PageHeader, SectionCard, Stack } from '../components';
import { ChatEngine } from './chat/ChatEngine';
import { fmtDateTime } from '../utils/dates';
import { num } from '../utils/format';

export function Chat() {
  const navigate = useNavigate();
  const store = useStore();
  const [customerId, setCustomerId] = React.useState(store.customers[0]?.id ?? '');
  const [selected, setSelected] = React.useState<string | null>(null);

  const history = store.chatSessions;
  const active = history.find((s) => s.id === selected);
  const escalated = history.filter((s) => s.stage === 'Human Agent' || s.agentId);
  const withCases = history.filter((s) => s.createdCaseId);

  return (
    <Box>
      <PageHeader
        title="Chatbot & Live Chat"
        subtitle="Automated first-line response from the FAQ knowledge base, with urgent routing to a human agent and case creation directly from the conversation."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Chatbot / Live Chat' }]}
        actions={<Button variant="contained" onClick={() => navigate('/portal/chat')}>Open in customer portal</Button>}
      />

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Conversations" value={num(history.length)} colour="#0B2545" />
        <KpiCard dense label="Escalated to agent" value={num(escalated.length)} sub="Bot could not resolve" colour="#D97706" />
        <KpiCard dense label="Cases created" value={num(withCases.length)} sub="From chat transcripts" colour="#DC2626" />
        <KpiCard dense label="Knowledge articles" value={num(store.faqs.length)} sub="Backing the chatbot" colour="#0E7C7B" onClick={() => navigate('/faqs')} />
      </Grid>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard
            title="Live conversation"
            subtitle="Try: “How do I submit a complaint?”, “What documents are required?”, or something urgent such as “This is urgent, I need to speak to someone.”"
            action={
              <TextField
                select size="small" label="Acting as customer" value={customerId}
                onChange={(e) => setCustomerId(e.target.value)} sx={{ minWidth: 230 }}
              >
                {store.customers.filter((c) => c.customerType !== 'Internal').map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.organisation}</MenuItem>
                ))}
              </TextField>
            }
            sx={{ p: 0 }}
          >
            <Box sx={{ mx: -2.5, mb: -2.25 }}>
              <ChatEngine key={customerId} customerId={customerId} />
            </Box>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title={`Conversation history (${history.length})`} subtitle="Past chats retained against the customer record">
            <Stack gap={1}>
              {history.map((s) => (
                <Box
                  key={s.id}
                  onClick={() => setSelected(s.id === selected ? null : s.id)}
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: 'pointer',
                    border: '1px solid', borderColor: selected === s.id ? 'secondary.main' : 'divider',
                    bgcolor: selected === s.id ? alpha('#0E7C7B', .04) : 'transparent',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {store.customers.find((c) => c.id === s.customerId)?.organisation ?? 'Anonymous visitor'}
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                        {s.id} · {s.messages.length} messages · {fmtDateTime(s.startedAt)}
                      </Typography>
                    </Box>
                    <Stack gap={0.5} alignItems="flex-end">
                      <Chip
                        size="small" label={s.stage}
                        sx={{ height: 19, fontSize: '0.62rem', bgcolor: alpha(s.stage === 'Human Agent' ? '#2563EB' : s.stage === 'Closed' ? '#64748B' : '#0E7C7B', .12) }}
                      />
                      {s.urgent && <Chip size="small" label="urgent" sx={{ height: 18, fontSize: '0.58rem', bgcolor: alpha('#DC2626', .12), color: '#DC2626' }} />}
                    </Stack>
                  </Stack>
                  {s.createdCaseId && (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', mt: 0.75, color: 'secondary.main', fontWeight: 700 }}
                      onClick={(e) => { e.stopPropagation(); navigate(`/complaints/${s.createdCaseId}`); }}
                    >
                      Case created: {store.complaints.find((c) => c.id === s.createdCaseId)?.reference} →
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </SectionCard>

          {active && (
            <SectionCard title="Transcript" subtitle={`${active.id} · ${active.stage}`}>
              <Stack gap={1.25} sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {active.messages.map((m) => (
                  <Box key={m.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: m.author === 'customer' ? alpha('#0B2545', .05) : 'surface.subtle' }}>
                    <Stack direction="row" justifyContent="space-between" gap={1}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{m.authorName}</Typography>
                      <Typography variant="caption">{fmtDateTime(m.at)}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.4 }}>{m.text}</Typography>
                  </Box>
                ))}
              </Stack>
              {active.createdCaseId && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Button size="small" variant="outlined" fullWidth onClick={() => navigate(`/complaints/${active.createdCaseId}`)}>
                    Open the case created from this chat
                  </Button>
                </>
              )}
            </SectionCard>
          )}

          <SectionCard title="Routing model">
            <Stack gap={1.25}>
              {[
                ['Bot', 'Answers from the FAQ knowledge base using intent matching on the customer’s wording.'],
                ['Triage', 'Urgent or unresolved conversations are queued for a human agent with the full transcript.'],
                ['Human Agent', 'A Client Services specialist takes over and can create a case directly from the conversation.'],
              ].map(([stage, body]) => (
                <Box key={stage} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{stage}</Typography>
                  <Typography variant="caption">{body}</Typography>
                </Box>
              ))}
            </Stack>
            <Alert severity="info" sx={{ mt: 1.75 }} icon={false}>
              <Typography variant="caption">
                <strong>DEMO / SIMULATED agent.</strong> The agent side of the conversation is simulated. The routing
                model, transcript handover, case creation and audit record are all real and demonstrable.
              </Typography>
            </Alert>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default Chat;
