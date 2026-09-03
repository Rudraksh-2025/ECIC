import * as React from 'react';
import {
  Alert, Avatar, Box, Button, Chip, Divider, IconButton, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';
import EscalateIcon from '@mui/icons-material/SupportAgent';
import { useStore } from '../../store';
import { api } from '../../services/mockApi';
import { Stack } from '../../components/Stack';
import { toast } from '../../hooks';
import { CHAT_SUGGESTIONS, CHATBOT_INTENTS, URGENT_KEYWORDS } from '../../data/knowledge';
import { fmtTime } from '../../utils/dates';
import type { ChatMessage, ChatSession } from '../../types';

const FALLBACK = 'I do not have a knowledge-base article that answers that directly. I can connect you to an ECIC agent who will be able to help — select “Escalate to agent” below, and a case will be created so nothing is lost.';

function newId() {
  return `M-${Date.now().toString(36)}-${Math.round(Math.random() * 1e5).toString(36)}`;
}

export function ChatEngine({
  customerId, compact, onCaseCreated,
}: {
  customerId: string | null;
  compact?: boolean;
  onCaseCreated?: (complaintId: string) => void;
}) {
  const store = useStore();
  const [session, setSession] = React.useState<ChatSession>(() => ({
    id: `CHT-${Date.now().toString(36).toUpperCase()}`,
    customerId,
    stage: 'Bot',
    agentId: null,
    startedAt: new Date().toISOString(),
    urgent: false,
    createdCaseId: null,
    messages: [{
      id: newId(), author: 'bot', authorName: 'ECIC Assistant',
      text: 'Good day, and welcome to ECIC. I can answer questions about complaints, applications, products, the portal and privacy. What would you like to know?',
      at: new Date().toISOString(),
      suggestions: CHAT_SUGGESTIONS,
    }],
  }));
  const [input, setInput] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [session.messages, typing]);

  // Persist the conversation as a side effect, never during render.
  React.useEffect(() => { api.saveChatSession(session); }, [session]);

  const push = (msg: ChatMessage, patch: Partial<ChatSession> = {}) => {
    setSession((s) => ({ ...s, ...patch, messages: [...s.messages, msg] }));
  };

  const answer = (question: string) => {
    const q = question.toLowerCase();
    const urgent = URGENT_KEYWORDS.some((k) => q.includes(k));
    const intent = CHATBOT_INTENTS.find((i) => i.keywords.some((k) => q.includes(k)));
    const faq = intent ? store.faqs.find((f) => f.id === intent.faqId) : undefined;

    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      if (urgent && session.stage === 'Bot') {
        push({
          id: newId(), author: 'bot', authorName: 'ECIC Assistant',
          text: 'This sounds time-sensitive. I can answer general questions, but for anything urgent I would rather put you through to an ECIC agent directly.',
          at: new Date().toISOString(),
        }, { urgent: true });
        return;
      }
      if (faq) {
        const related = store.faqs.filter((f) => faq.relatedIds.includes(f.id)).map((f) => f.question);
        push({
          id: newId(), author: 'bot', authorName: 'ECIC Assistant',
          text: faq.answer,
          at: new Date().toISOString(),
          suggestions: related.length ? related : CHAT_SUGGESTIONS,
        });
      } else {
        push({
          id: newId(), author: 'bot', authorName: 'ECIC Assistant',
          text: FALLBACK, at: new Date().toISOString(), suggestions: CHAT_SUGGESTIONS,
        }, { urgent: true });
      }
    }, 750);
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const customerName = store.customers.find((c) => c.id === customerId)?.contactPerson ?? 'You';
    push({ id: newId(), author: 'customer', authorName: customerName, text, at: new Date().toISOString() });
    setInput('');
    if (session.stage === 'Human Agent') {
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        push({
          id: newId(), author: 'agent',
          authorName: store.users.find((u) => u.id === session.agentId)?.name ?? 'ECIC Agent',
          text: 'Thank you — I have that on the case now. I am checking the detail with the responsible team and will come straight back to you.',
          at: new Date().toISOString(),
        });
      }, 900);
      return;
    }
    answer(text);
  };

  const escalate = () => {
    const agent = store.users.find((u) => u.role === 'complaints_specialist' && u.status === 'Active');
    push({
      id: newId(), author: 'system', authorName: 'System',
      text: 'Conversation escalated: Bot → Triage → Human Agent',
      at: new Date().toISOString(),
    }, { stage: 'Triage' });
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setSession((s) => ({
        ...s, stage: 'Human Agent', agentId: agent?.id ?? 'USR-001',
        messages: [...s.messages, {
          id: newId(), author: 'agent', authorName: agent?.name ?? 'ECIC Agent',
          text: `Good day, ${agent?.name ?? 'ECIC Agent'} here from ECIC Client Services. I have the transcript of your conversation with the assistant. How can I help?`,
          at: new Date().toISOString(),
        }],
      }));
      toast({ message: 'Routed to a live agent', severity: 'success', detail: 'Bot → Triage → Human Agent. The full transcript was handed over.' });
    }, 1200);
  };

  const createCase = async () => {
    const transcript = session.messages
      .filter((m) => m.author === 'customer')
      .map((m) => m.text).join(' | ');
    const complaint = await api.createCaseFromChat(
      session,
      customerId ?? store.customers[0].id,
      'Query raised through live chat',
      `Case created from live chat conversation ${session.id}.\n\nCustomer statements: ${transcript || 'No customer statements captured.'}`,
    );
    push({
      id: newId(), author: 'system', authorName: 'System',
      text: `Case ${complaint.reference} created from this conversation and assigned to ${store.users.find((u) => u.id === complaint.assignedToId)?.name}.`,
      at: new Date().toISOString(),
    }, { createdCaseId: complaint.id });
    toast({
      message: `Case ${complaint.reference} created from chat`,
      severity: 'success',
      detail: 'The conversation transcript was captured on the case and the SLA clock started.',
      action: { label: 'Open case', to: `/complaints/${complaint.id}` },
    });
    onCaseCreated?.(complaint.id);
  };

  const lastSuggestions = [...session.messages].reverse().find((m) => m.suggestions)?.suggestions ?? [];

  const bubbleFor = (m: ChatMessage) => {
    if (m.author === 'system') {
      return (
        <Box key={m.id} sx={{ textAlign: 'center', my: 1 }}>
          <Chip size="small" label={m.text} sx={{ bgcolor: alpha('#0B2545', .07), fontSize: '0.68rem', height: 'auto', py: 0.5 }} />
        </Box>
      );
    }
    const isCustomer = m.author === 'customer';
    const colour = m.author === 'bot' ? '#0E7C7B' : m.author === 'agent' ? '#2563EB' : '#0B2545';
    return (
      <Stack
        key={m.id} direction={isCustomer ? 'row-reverse' : 'row'} gap={1.25}
        sx={{ mb: 1.75 }} alignItems="flex-start"
      >
        <Avatar sx={{ width: 30, height: 30, bgcolor: colour, flexShrink: 0 }}>
          {m.author === 'bot' ? <SmartToyIcon sx={{ fontSize: 17 }} />
            : m.author === 'agent' ? <SupportAgentIcon sx={{ fontSize: 17 }} />
              : <PersonIcon sx={{ fontSize: 17 }} />}
        </Avatar>
        <Box sx={{ maxWidth: '78%' }}>
          <Box sx={{
            px: 1.75, py: 1.25, borderRadius: 3,
            borderTopLeftRadius: isCustomer ? 12 : 4,
            borderTopRightRadius: isCustomer ? 4 : 12,
            bgcolor: isCustomer ? 'primary.main' : alpha(colour, .07),
            color: isCustomer ? '#fff' : 'text.primary',
          }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{m.text}</Typography>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.4, textAlign: isCustomer ? 'right' : 'left' }}>
            {m.authorName} · {fmtTime(m.at)}
          </Typography>
        </Box>
      </Stack>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: compact ? 520 : 620 }}>
      <Stack
        direction="row" justifyContent="space-between" alignItems="center" gap={1}
        sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}
      >
        <Stack direction="row" gap={1} alignItems="center">
          {(['Bot', 'Triage', 'Human Agent'] as const).map((s, i, arr) => {
            const order = ['Bot', 'Triage', 'Human Agent'];
            const active = order.indexOf(session.stage) >= i;
            return (
              <React.Fragment key={s}>
                <Chip
                  size="small" label={s}
                  sx={{
                    height: 22, fontWeight: 700, fontSize: '0.65rem',
                    bgcolor: active ? alpha('#0E7C7B', .14) : 'surface.sunken',
                    color: active ? '#0E7C7B' : 'text.disabled',
                  }}
                />
                {i < arr.length - 1 && <Typography variant="caption" sx={{ color: 'text.disabled' }}>→</Typography>}
              </React.Fragment>
            );
          })}
        </Stack>
        <Stack direction="row" gap={0.75}>
          {session.stage === 'Bot' && (
            <Button size="small" variant={session.urgent ? 'contained' : 'outlined'} color={session.urgent ? 'error' : 'primary'} startIcon={<EscalateIcon sx={{ fontSize: 16 }} />} onClick={escalate}>
              Escalate to agent
            </Button>
          )}
          {session.stage === 'Human Agent' && !session.createdCaseId && (
            <Button size="small" variant="contained" onClick={createCase}>Create case from chat</Button>
          )}
        </Stack>
      </Stack>

      {session.urgent && session.stage === 'Bot' && (
        <Alert severity="warning" square sx={{ borderRadius: 0 }}>
          <Typography variant="caption">
            This looks like it needs a person. Select <strong>Escalate to agent</strong> to route the conversation
            Bot → Triage → Human Agent with the full transcript.
          </Typography>
        </Alert>
      )}
      {session.createdCaseId && (
        <Alert severity="success" square sx={{ borderRadius: 0 }}>
          <Typography variant="caption">
            Case created from this conversation. The transcript is retained on the case for the investigation.
          </Typography>
        </Alert>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'surface.subtle' }}>
        {session.messages.map(bubbleFor)}
        {typing && (
          <Stack direction="row" gap={1.25} alignItems="center" sx={{ mb: 1.5 }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: session.stage === 'Human Agent' ? '#2563EB' : '#0E7C7B' }}>
              {session.stage === 'Human Agent' ? <SupportAgentIcon sx={{ fontSize: 17 }} /> : <SmartToyIcon sx={{ fontSize: 17 }} />}
            </Avatar>
            <Stack direction="row" gap={0.5} sx={{ px: 1.75, py: 1.5, borderRadius: 3, bgcolor: alpha('#0E7C7B', .07) }}>
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{
                  width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled',
                  animation: 'ecic-pulse 1.1s infinite', animationDelay: `${i * 0.18}s`,
                }} />
              ))}
            </Stack>
          </Stack>
        )}
        <div ref={endRef} />
      </Box>

      {lastSuggestions.length > 0 && session.stage === 'Bot' && (
        <Box sx={{ px: 1.5, pt: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.75 }}>Suggested questions</Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {lastSuggestions.slice(0, 5).map((s) => (
              <Chip key={s} size="small" label={s} onClick={() => send(s)} sx={{ cursor: 'pointer', mb: 0.75 }} />
            ))}
          </Stack>
        </Box>
      )}

      <Divider />
      <Stack direction="row" gap={1} sx={{ p: 1.5 }} alignItems="center">
        <TextField
          fullWidth size="small" placeholder="Type your question…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          slotProps={{ htmlInput: { 'aria-label': 'Chat message' } }}
        />
        <IconButton color="primary" onClick={() => send(input)} disabled={!input.trim()} aria-label="Send message">
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
