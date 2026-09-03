import { Alert, AlertTitle, Box, Button, Card, CardContent, Chip, Divider, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CaseIcon from '@mui/icons-material/Gavel';
import EnquiryIcon from '@mui/icons-material/ContactSupport';
import AppIcon from '@mui/icons-material/Article';
import DocIcon from '@mui/icons-material/FolderShared';
import ChatIcon from '@mui/icons-material/Forum';
import FaqIcon from '@mui/icons-material/HelpCenter';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Grid, SectionCard, Stack, StatusChip } from '../../components';
import { useComplaintSla } from '../../hooks';
import { fmtDate, relativeTime } from '../../utils/dates';
import { zar } from '../../utils/format';
import { BRAND } from '../../theme/theme';

export function PortalHome() {
  const navigate = useNavigate();
  const store = useStore();
  const slaOf = useComplaintSla();
  const customer = store.customers.find((c) => c.id === store.session.portalCustomerId) ?? store.customers[0];

  const cases = store.complaints.filter((c) => c.customerId === customer.id);
  const openCases = cases.filter((c) => c.status !== 'Closed');
  const leads = store.leads.filter((l) => l.customerId === customer.id);
  const applications = store.applications.filter((a) => a.customerId === customer.id);
  const documents = store.documents.filter((d) => d.customerId === customer.id && d.status !== 'Blocked');
  const opportunities = store.opportunities.filter((o) => o.customerId === customer.id);

  const tiles = [
    { label: 'My cases', value: openCases.length, sub: `${cases.length} total`, icon: <CaseIcon />, to: '/portal/cases', colour: '#DC2626' },
    { label: 'My enquiries', value: leads.length, sub: `${leads.filter((l) => l.status === 'Converted').length} progressed`, icon: <EnquiryIcon />, to: '/portal/enquiries', colour: '#2563EB' },
    { label: 'My applications', value: applications.length, sub: `${applications.filter((a) => a.status === 'Approved').length} approved`, icon: <AppIcon />, to: '/portal/applications', colour: '#7C3AED' },
    { label: 'My documents', value: documents.length, sub: 'Securely stored', icon: <DocIcon />, to: '/portal/documents', colour: '#C9A227' },
  ];

  return (
    <Box>
      <Card sx={{
        mb: 3, overflow: 'hidden',
        background: `linear-gradient(120deg, ${alpha(BRAND.NAVY, .04)} 0%, ${alpha(BRAND.ACCENT, .07)} 100%)`,
      }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2.5} alignItems={{ md: 'center' }}>
            <Box>
              <Typography variant="h2" sx={{ mb: 0.75 }}>Good day, {customer.contactPerson.split(' ')[0]}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
                Welcome to the ECIC customer portal for <strong>{customer.organisation}</strong>. Track your cases and
                applications, submit an enquiry or a complaint, upload documents and get answers — at any time.
              </Typography>
              <Stack direction="row" gap={0.75} sx={{ mt: 1.5 }} flexWrap="wrap">
                <Chip size="small" label={`Customer ID ${customer.id}`} />
                <Chip size="small" label={customer.customerType} />
                <Chip size="small" label={customer.sector} />
                <StatusChip value={customer.status} />
              </Stack>
            </Box>
            <Stack gap={1.25} sx={{ minWidth: { md: 260 } }}>
              <Button size="large" variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/portal/enquiries/new')}>
                Submit an enquiry
              </Button>
              <Button size="large" variant="outlined" startIcon={<CaseIcon />} onClick={() => navigate('/portal/cases/new')}>
                Submit a complaint
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid cols={{ xs: 2, md: 4 }} gap={2} sx={{ mb: 3 }}>
        {tiles.map((t) => (
          <Card
            key={t.label}
            onClick={() => navigate(t.to)}
            sx={{
              cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 14px 32px -20px rgba(11,37,69,.45)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2.5, mb: 1.5,
                display: 'grid', placeItems: 'center',
                bgcolor: alpha(t.colour, .1), color: t.colour,
              }}>{t.icon}</Box>
              <Typography variant="h2" sx={{ lineHeight: 1.1 }}>{t.value}</Typography>
              <Typography variant="subtitle2" sx={{ color: 'text.primary', mt: 0.25 }}>{t.label}</Typography>
              <Typography variant="caption">{t.sub}</Typography>
            </CardContent>
          </Card>
        ))}
      </Grid>

      {openCases.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>You have {openCases.length} open case{openCases.length > 1 ? 's' : ''} with ECIC</AlertTitle>
          Each case shows its current status and the date by which ECIC aims to resolve it. You will be contacted on
          your preferred channel — {customer.preferredChannel} — at every stage.
        </Alert>
      )}

      <Grid cols={{ xs: 1, lg: 3 }} gap={2.5}>
        <Box sx={{ gridColumn: { lg: 'span 2' }, minWidth: 0 }}>
          <SectionCard
            title="My open cases"
            subtitle="Track the progress of every complaint you have raised with ECIC"
            action={<Button size="small" onClick={() => navigate('/portal/cases')}>View all cases</Button>}
            sx={{ mb: 2.5 }}
          >
            <Stack gap={1.25}>
              {openCases.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  You have no open cases. If something is not right, you can submit a complaint at any time.
                </Typography>
              )}
              {openCases.slice(0, 4).map((c) => {
                const sla = slaOf(c);
                return (
                  <Box
                    key={c.id} onClick={() => navigate('/portal/cases')}
                    sx={{
                      p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                      '&:hover': { borderColor: 'secondary.main' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{c.subject}</Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {c.reference} · raised {fmtDate(c.loggedDate)} · {c.category}
                        </Typography>
                      </Box>
                      <Stack gap={0.5} alignItems="flex-end">
                        <StatusChip value={c.status} />
                        <Typography variant="caption">
                          {sla.risk === 'Breached'
                            ? 'Target date passed — escalated internally'
                            : `Target resolution ${fmtDate(sla.dueDate)}`}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </SectionCard>

          <SectionCard
            title="My applications"
            subtitle="Where each application sits in the ECIC review process"
            action={<Button size="small" onClick={() => navigate('/portal/applications')}>View all</Button>}
          >
            <Stack gap={1.25}>
              {applications.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  You have no applications in progress.
                </Typography>
              )}
              {applications.slice(0, 4).map((a) => (
                <Box
                  key={a.id} onClick={() => navigate('/portal/applications')}
                  sx={{
                    p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                    border: '1px solid', borderColor: 'divider',
                    '&:hover': { borderColor: 'secondary.main' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="center" flexWrap="wrap">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{a.formType}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {a.reference} · created {fmtDate(a.createdDate)}
                        {a.signature.signed && ' · digitally signed'}
                      </Typography>
                    </Box>
                    <StatusChip value={a.status} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          </SectionCard>
        </Box>

        <Stack gap={2.5}>
          <SectionCard title="Need help right now?">
            <Stack gap={1.25}>
              <Button fullWidth variant="contained" startIcon={<ChatIcon />} onClick={() => navigate('/portal/chat')}>
                Chat with us
              </Button>
              <Button fullWidth variant="outlined" startIcon={<FaqIcon />} onClick={() => navigate('/portal/faqs')}>
                Search the FAQs
              </Button>
              <Divider />
              <Typography variant="caption">
                Telephone <strong>+27 12 471 3000</strong> · weekdays 08:00–16:30 SAST<br />
                Email <strong>info@ecic.demo.co.za</strong><br />
                The portal, FAQ library and chatbot are available at all times.
              </Typography>
            </Stack>
          </SectionCard>

          <SectionCard title="Your relationship with ECIC">
            <Stack gap={1.25}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Account status</Typography>
                <StatusChip value={customer.status} />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Cover in progress</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {zar(opportunities.filter((o) => !o.closedDate).reduce((s, o) => s + o.estimatedValue, 0), true)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Cover approved</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {zar(opportunities.filter((o) => o.stage === 'Closed Won').reduce((s, o) => s + o.estimatedValue, 0), true)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Preferred contact channel</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{customer.preferredChannel}</Typography>
              </Stack>
              <Divider />
              <Button size="small" onClick={() => navigate('/portal/profile')}>Update my details and preferences</Button>
            </Stack>
          </SectionCard>

          <SectionCard title="Recent activity">
            <Stack gap={1}>
              {[...cases, ...applications]
                .sort((a, b) => new Date('loggedDate' in b ? b.loggedDate : b.createdDate).getTime()
                  - new Date('loggedDate' in a ? a.loggedDate : a.createdDate).getTime())
                .slice(0, 5)
                .map((r) => (
                  <Box key={r.id} sx={{ p: 1.25, borderRadius: 2, bgcolor: 'surface.subtle' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {'subject' in r ? r.subject : r.formType}
                    </Typography>
                    <Typography variant="caption">
                      {r.reference} · {relativeTime('loggedDate' in r ? r.loggedDate : r.createdDate)}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          </SectionCard>
        </Stack>
      </Grid>
    </Box>
  );
}

export default PortalHome;
