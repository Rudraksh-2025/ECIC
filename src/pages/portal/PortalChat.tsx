import { Box, Button, Typography } from '@mui/material';
import FaqIcon from '@mui/icons-material/HelpCenter';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Grid, SectionCard, Stack } from '../../components';
import { ChatEngine } from '../chat/ChatEngine';
import { fmtDateTime } from '../../utils/dates';

export function PortalChat() {
  const navigate = useNavigate();
  const store = useStore();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];
  const history = store.chatSessions.filter((s) => s.customerId === customer.id);

  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 0.75 }}>Chat with us</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700 }}>
        Ask the ECIC assistant anything about complaints, applications, products, the portal or privacy. If your
        question is urgent or needs a person, we will put you through to an agent — and can raise a case from the
        conversation so nothing is lost.
      </Typography>

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard sx={{ p: 0 }}>
            <Box sx={{ mx: -2.5, my: -2.25 }}>
              <ChatEngine customerId={customer.id} />
            </Box>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Try asking">
            <Stack gap={1}>
              {[
                'How do I submit a complaint?',
                'What documents are required?',
                'What is the status of my application?',
                'How do I submit a lead?',
                'How can I contact ECIC?',
                'How does ECIC protect my personal information?',
              ].map((q) => (
                <Box key={q} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                  <Typography variant="body2">{q}</Typography>
                </Box>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Prefer to read?">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Our FAQ library covers the same ground in more detail, and is available at any time.
            </Typography>
            <Button fullWidth variant="outlined" startIcon={<FaqIcon />} onClick={() => navigate('/portal/faqs')}>
              Browse the FAQs
            </Button>
          </SectionCard>

          {history.length > 0 && (
            <SectionCard title="Your previous conversations">
              <Stack gap={1}>
                {history.map((s) => (
                  <Box key={s.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {fmtDateTime(s.startedAt)}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {s.messages.length} messages · {s.stage}
                      {s.createdCaseId && ` · case ${store.complaints.find((c) => c.id === s.createdCaseId)?.reference} raised`}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          )}

          <SectionCard title="Other ways to reach us">
            <Stack gap={0.75}>
              <Typography variant="body2"><strong>Telephone</strong> +27 12 471 3000</Typography>
              <Typography variant="body2"><strong>Email</strong> info@ecic.demo.co.za</Typography>
              <Typography variant="body2"><strong>Hours</strong> weekdays 08:00–16:30 SAST</Typography>
              <Typography variant="caption" sx={{ mt: 1 }}>
                The portal, FAQ library and chatbot are available at all times. Live agents are available during
                business hours.
              </Typography>
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default PortalChat;
