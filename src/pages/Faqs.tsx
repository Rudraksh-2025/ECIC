import * as React from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Divider,
  InputAdornment, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThumbUpIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDownAlt';
import StarIcon from '@mui/icons-material/Star';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { EmptyState, Grid, KpiCard, PageHeader, SectionCard, Stack } from '../components';
import { toast } from '../hooks';
import { num } from '../utils/format';

export function Faqs({ portal }: { portal?: boolean }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = useStore();
  const [query, setQuery] = React.useState(params.get('q') ?? '');
  const [category, setCategory] = React.useState('All');
  const [expanded, setExpanded] = React.useState<string | false>(false);
  const [votes, setVotes] = React.useState<Record<string, 'up' | 'down'>>({});

  const categories = ['All', ...Array.from(new Set(store.faqs.map((f) => f.category)))];

  const filtered = store.faqs.filter((f) => {
    const matchesCategory = category === 'All' || f.category === category;
    if (!matchesCategory) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
  });

  const popular = store.faqs.filter((f) => f.popular).sort((a, b) => b.views - a.views).slice(0, 6);

  const content = (
    <>
      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard sx={{ mb: 2.5 }}>
            <TextField
              fullWidth value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the FAQ library — try “documents”, “complaint”, “MFA” or “premium”…"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                },
                htmlInput: { 'aria-label': 'Search frequently asked questions' },
              }}
            />
            <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1.75 }}>
              {categories.map((c) => (
                <Chip
                  key={c} label={c} size="small"
                  onClick={() => setCategory(c)}
                  sx={{
                    cursor: 'pointer', fontWeight: 600,
                    bgcolor: category === c ? alpha('#0B2545', .12) : 'surface.sunken',
                    color: category === c ? 'primary.main' : 'text.secondary',
                  }}
                />
              ))}
            </Stack>
          </SectionCard>

          {filtered.length === 0 ? (
            <SectionCard>
              <EmptyState
                title="No matching questions"
                description={`Nothing in the FAQ library matches “${query}”. Start a chat and an ECIC agent will help you directly.`}
                action={<Button variant="contained" startIcon={<SupportAgentIcon />} onClick={() => navigate(portal ? '/portal/chat' : '/chat')}>Chat to an agent</Button>}
              />
            </SectionCard>
          ) : (
            <SectionCard title={`${filtered.length} question${filtered.length === 1 ? '' : 's'}`} subtitle={category === 'All' ? 'All categories' : category}>
              {filtered.map((f) => {
                const related = store.faqs.filter((r) => f.relatedIds.includes(r.id));
                const vote = votes[f.id];
                return (
                  <Accordion
                    key={f.id} disableGutters elevation={0}
                    expanded={expanded === f.id}
                    onChange={(_, isExpanded) => setExpanded(isExpanded ? f.id : false)}
                    sx={{
                      border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 1,
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': { borderColor: 'secondary.main' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" gap={1} alignItems="center" sx={{ minWidth: 0, pr: 1 }}>
                        {f.popular && <StarIcon sx={{ fontSize: 15, color: '#C9A227', flexShrink: 0 }} />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.question}</Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>{f.answer}</Typography>
                      <Divider sx={{ my: 1.75 }} />
                      <Stack direction="row" justifyContent="space-between" gap={1.5} flexWrap="wrap" alignItems="center">
                        <Stack direction="row" gap={0.75} alignItems="center">
                          <Typography variant="caption">Was this helpful?</Typography>
                          <Button
                            size="small" startIcon={<ThumbUpIcon sx={{ fontSize: 15 }} />}
                            variant={vote === 'up' ? 'contained' : 'outlined'} color="success"
                            onClick={() => {
                              setVotes((v) => ({ ...v, [f.id]: 'up' }));
                              toast({ message: 'Thank you for the feedback', severity: 'success', detail: 'Helpful ratings inform which articles the chatbot prioritises.' });
                            }}
                          >
                            Yes ({f.helpful + (vote === 'up' ? 1 : 0)})
                          </Button>
                          <Button
                            size="small" startIcon={<ThumbDownIcon sx={{ fontSize: 15 }} />}
                            variant={vote === 'down' ? 'contained' : 'outlined'} color="error"
                            onClick={() => {
                              setVotes((v) => ({ ...v, [f.id]: 'down' }));
                              toast({ message: 'Thank you — we will review this article', severity: 'info', detail: 'Articles rated unhelpful are queued for review by Client Services.' });
                            }}
                          >
                            No ({f.notHelpful + (vote === 'down' ? 1 : 0)})
                          </Button>
                        </Stack>
                        <Button size="small" startIcon={<SupportAgentIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(portal ? '/portal/chat' : '/chat')}>
                          Still need help? Escalate to an agent
                        </Button>
                      </Stack>
                      {related.length > 0 && (
                        <>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="caption" sx={{ display: 'block', mb: 0.75 }}>Related questions</Typography>
                          <Stack direction="row" gap={0.75} flexWrap="wrap">
                            {related.map((r) => (
                              <Chip
                                key={r.id} size="small" label={r.question}
                                onClick={() => { setExpanded(r.id); setCategory('All'); setQuery(''); }}
                                sx={{ cursor: 'pointer', maxWidth: 400 }}
                              />
                            ))}
                          </Stack>
                        </>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', mt: 1.5 }}>
                        {f.category} · {num(f.views)} views · article {f.id}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </SectionCard>
          )}
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Popular questions" subtitle="Most viewed articles across the library">
            <Stack gap={1}>
              {popular.map((f) => (
                <Box
                  key={f.id}
                  onClick={() => { setCategory('All'); setQuery(''); setExpanded(f.id); }}
                  sx={{
                    p: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: 'surface.subtle',
                    '&:hover': { bgcolor: alpha('#0B2545', .05) },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.question}</Typography>
                  <Typography variant="caption">{f.category} · {num(f.views)} views</Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Cannot find an answer?">
            <Stack gap={1.5}>
              <Typography variant="body2" color="text.secondary">
                The FAQ library backs the chatbot, so anything answered here is also answered in chat. If your
                question is not covered, an ECIC agent can help and will create a case so nothing is lost.
              </Typography>
              <Button variant="contained" startIcon={<SupportAgentIcon />} onClick={() => navigate(portal ? '/portal/chat' : '/chat')}>
                Start a chat
              </Button>
              {!portal && (
                <Button variant="outlined" onClick={() => navigate('/complaints/new')}>Log a complaint</Button>
              )}
              {portal && (
                <Button variant="outlined" onClick={() => navigate('/portal/cases/new')}>Submit a complaint</Button>
              )}
            </Stack>
          </SectionCard>

          <SectionCard title="Library statistics">
            <Grid cols={2} gap={1.5}>
              <Box>
                <Typography variant="caption">Articles</Typography>
                <Typography variant="h4">{num(store.faqs.length)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Categories</Typography>
                <Typography variant="h4">{num(categories.length - 1)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Total views</Typography>
                <Typography variant="h4">{num(store.faqs.reduce((s, f) => s + f.views, 0))}</Typography>
              </Box>
              <Box>
                <Typography variant="caption">Helpful ratings</Typography>
                <Typography variant="h4">{num(store.faqs.reduce((s, f) => s + f.helpful, 0))}</Typography>
              </Box>
            </Grid>
          </SectionCard>
        </Stack>
      </Grid>
    </>
  );

  if (portal) return content;

  return (
    <Box>
      <PageHeader
        title="FAQ Library"
        subtitle="A searchable knowledge base of thirty-two ECIC questions across nine categories, backing both the customer portal and the chatbot."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'FAQ Library' }]}
        actions={<Button variant="contained" onClick={() => navigate('/chat')}>Open chat</Button>}
      />

      <Grid cols={{ xs: 2, sm: 4 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Articles" value={num(store.faqs.length)} colour="#0B2545" />
        <KpiCard dense label="Categories" value={num(categories.length - 1)} colour="#2563EB" />
        <KpiCard dense label="Total views" value={num(store.faqs.reduce((s, f) => s + f.views, 0))} colour="#0E7C7B" />
        <KpiCard dense label="Popular articles" value={num(store.faqs.filter((f) => f.popular).length)} colour="#C9A227" />
      </Grid>

      {content}

      <Box sx={{ mt: 2.5 }}>
        <Alert severity="info" icon={false}>
          <Typography variant="caption">
            The FAQ library is the single knowledge source for the portal, the chatbot and agent-assisted chat.
            Articles rated unhelpful are queued for review, so the knowledge base improves from real usage.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default Faqs;
