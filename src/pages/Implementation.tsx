import * as React from 'react';
import {
  Alert, AlertTitle, Avatar, Box, Button, Chip, Divider, LinearProgress, Step, StepContent,
  StepLabel, Stepper, Tab, Tabs, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import SupportIcon from '@mui/icons-material/SupportAgent';
import ShieldIcon from '@mui/icons-material/Security';
import { useNavigate } from 'react-router-dom';
import { Grid, KpiCard, LabelValue, PageHeader, SectionCard, SimulatedBadge, Stack, StatusChip } from '../components';
import { fmtDate } from '../utils/dates';
import { downloadCsv, num, pct } from '../utils/format';
import {
  CHANGE_ACTIVITIES, CONTINUITY, PROJECT_PHASES, RAID_ITEMS, SUPPORT_TIERS, TEAM_STRUCTURE, TRAINING_COURSES,
} from '../data/implementation';

export function Implementation() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState(0);

  const overallProgress = Math.round(
    PROJECT_PHASES.reduce((s, p) => s + p.progress, 0) / PROJECT_PHASES.length,
  );
  const trainingCompletion = Math.round(
    TRAINING_COURSES.reduce((s, c) => s + c.completion, 0) / TRAINING_COURSES.length,
  );
  const readiness = Math.round(
    CHANGE_ACTIVITIES.reduce((s, c) => s + c.readiness, 0) / CHANGE_ACTIVITIES.length,
  );
  const openRisks = RAID_ITEMS.filter((r) => r.type === 'Risk' && r.status !== 'Closed').length;

  return (
    <Box>
      <PageHeader
        title="Implementation & Support"
        subtitle="The delivery approach for the ECIC CRM programme: project management, training, change management, team structure, support and maintenance with defined SLAs, hypercare, business continuity and the delivery roadmap."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Implementation & Support' }]}
        chips={<SimulatedBadge label="DEMO / ILLUSTRATIVE PLAN" tooltip="Dates, names and service values are illustrative for the bid demonstration." />}
        actions={
          <Button
            variant="outlined" startIcon={<DownloadIcon />}
            onClick={() => downloadCsv('ECIC_Delivery_Plan', PROJECT_PHASES.map((p) => ({
              Phase: p.phase, Owner: p.ownerRole, 'Planned start': p.plannedStart, 'Planned end': p.plannedEnd,
              Status: p.status, 'Progress %': p.progress,
              Deliverables: p.deliverables.join(' | '),
              Milestones: p.milestones.join(' | '),
              Dependencies: p.dependencies.join(' | '),
            })))}
          >
            Export plan
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <AlertTitle>Illustrative delivery content</AlertTitle>
        Every date, name, percentage and service value on this page is <strong>DEMO / ILLUSTRATIVE</strong> and exists
        so the delivery approach can be presented within the working system. The final programme plan, named team and
        service levels are those set out in the bid response.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Delivery phases" value={num(PROJECT_PHASES.length)} sub="Mobilisation to managed support" colour="#0B2545" />
        <KpiCard dense label="Overall progress" value={pct(overallProgress)} colour="#0E7C7B" />
        <KpiCard dense label="Open risks" value={num(openRisks)} sub={`${num(RAID_ITEMS.length)} RAID items`} colour="#DC2626" onClick={() => setTab(1)} />
        <KpiCard dense label="Training completion" value={pct(trainingCompletion)} sub={`${num(TRAINING_COURSES.length)} courses`} colour="#2563EB" onClick={() => setTab(2)} />
        <KpiCard dense label="Business readiness" value={pct(readiness)} sub={`${num(CHANGE_ACTIVITIES.length)} stakeholder groups`} colour="#7C3AED" onClick={() => setTab(3)} />
        <KpiCard dense label="Support term" value="3 years" sub="Managed support and maintenance" colour="#C9A227" onClick={() => setTab(5)} />
      </Grid>

      <SectionCard>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Project management" />
          <Tab label="RAID register" />
          <Tab label="Training" />
          <Tab label="Change management" />
          <Tab label="Team structure" />
          <Tab label="Support & SLA" />
          <Tab label="Hypercare" />
          <Tab label="Business continuity" />
          <Tab label="Delivery roadmap" />
        </Tabs>

        {tab === 0 && (
          <Stack gap={2}>
            {PROJECT_PHASES.map((p) => (
              <Box key={p.id} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1">{p.phase}</Typography>
                    <Typography variant="caption">
                      {p.ownerRole} · {fmtDate(p.plannedStart)} to {fmtDate(p.plannedEnd)}
                    </Typography>
                  </Box>
                  <Stack direction="row" gap={1} alignItems="center">
                    <StatusChip value={p.status === 'Complete' ? 'Completed' : p.status === 'At Risk' ? 'Escalated' : p.status === 'In Progress' ? 'In Progress' : 'Planned'} />
                    <Chip size="small" label={`${p.progress}%`} sx={{ fontWeight: 700 }} />
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate" value={p.progress}
                  sx={{
                    my: 1.5, height: 7, bgcolor: alpha('#0B2545', .07),
                    '& .MuiLinearProgress-bar': { bgcolor: p.progress === 100 ? '#059669' : p.progress > 0 ? '#0E7C7B' : '#94A3B8' },
                  }}
                />
                <Grid cols={{ xs: 1, md: 3 }} gap={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Deliverables</Typography>
                    <Stack gap={0.4} sx={{ mt: 0.4 }}>
                      {p.deliverables.map((d) => <Typography key={d} variant="body2">• {d}</Typography>)}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Milestones</Typography>
                    <Stack gap={0.4} sx={{ mt: 0.4 }}>
                      {p.milestones.map((m) => <Typography key={m} variant="body2">• {m}</Typography>)}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Dependencies</Typography>
                    <Stack gap={0.4} sx={{ mt: 0.4 }}>
                      {p.dependencies.map((d) => <Typography key={d} variant="body2">• {d}</Typography>)}
                    </Stack>
                  </Box>
                </Grid>
              </Box>
            ))}
          </Stack>
        )}

        {tab === 1 && (
          <Stack gap={1.5}>
            {(['Risk', 'Issue', 'Assumption', 'Dependency'] as const).map((type) => {
              const items = RAID_ITEMS.filter((r) => r.type === type);
              if (items.length === 0) return null;
              return (
                <Box key={type}>
                  <Typography variant="overline" color="text.secondary">{type}s ({items.length})</Typography>
                  <Stack gap={1.25} sx={{ mt: 0.75 }}>
                    {items.map((r) => (
                      <Box key={r.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.id} — {r.description}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                              <strong>Mitigation:</strong> {r.mitigation}
                            </Typography>
                          </Box>
                          <Stack direction="row" gap={0.5} flexWrap="wrap">
                            <Chip size="small" label={`Impact: ${r.impact}`}
                              sx={{ height: 20, fontSize: '0.62rem', bgcolor: alpha(r.impact === 'High' ? '#DC2626' : r.impact === 'Medium' ? '#D97706' : '#059669', .12), color: r.impact === 'High' ? '#DC2626' : r.impact === 'Medium' ? '#D97706' : '#059669', fontWeight: 700 }} />
                            <Chip size="small" label={`Likelihood: ${r.likelihood}`} sx={{ height: 20, fontSize: '0.62rem' }} />
                            <Chip size="small" label={r.status}
                              sx={{ height: 20, fontSize: '0.62rem', bgcolor: alpha(r.status === 'Open' ? '#DC2626' : r.status === 'Monitoring' ? '#D97706' : '#059669', .12), color: r.status === 'Open' ? '#DC2626' : r.status === 'Monitoring' ? '#D97706' : '#059669', fontWeight: 700 }} />
                          </Stack>
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.75 }}>Owner: {r.owner}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}

        {tab === 2 && (
          <Stack gap={2}>
            <Alert severity="info" icon={<SchoolIcon />}>
              Role-based training with a train-the-trainer programme, so ECIC retains the capability internally after
              go-live. Completion is tracked per course and reported at the programme board.
            </Alert>
            <Stack gap={1.25}>
              {TRAINING_COURSES.map((c) => (
                <Box key={c.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{c.course}</Typography>
                      <Typography variant="caption">
                        {c.role} · {c.method} · {c.durationHours} hours · {c.audience} attendees
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={1} alignItems="center">
                      <StatusChip value={c.status === 'Complete' ? 'Completed' : c.status === 'In Progress' ? 'In Progress' : 'Planned'} />
                      <Chip size="small" label={`${c.completion}%`} sx={{ fontWeight: 700 }} />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={c.completion}
                    sx={{
                      mt: 1.25, height: 6, bgcolor: alpha('#0B2545', .07),
                      '& .MuiLinearProgress-bar': { bgcolor: c.completion === 100 ? '#059669' : c.completion > 40 ? '#0E7C7B' : '#D97706' },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Stack>
        )}

        {tab === 3 && (
          <Stack gap={2}>
            <Alert severity="info" icon={<GroupsIcon />}>
              Change management runs alongside delivery from Phase 1, not as a training exercise at the end.
              Readiness is assessed per stakeholder group and gates the go-live decision.
            </Alert>
            {CHANGE_ACTIVITIES.map((c) => (
              <Box key={c.id} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1">{c.stakeholder}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{c.description}</Typography>
                  </Box>
                  <Stack direction="row" gap={1} alignItems="center">
                    <Chip size="small" label={`${c.impact} impact`}
                      sx={{ bgcolor: alpha(c.impact === 'High' ? '#DC2626' : '#D97706', .12), color: c.impact === 'High' ? '#DC2626' : '#D97706', fontWeight: 700 }} />
                    <Chip size="small" label={`Readiness ${c.readiness}%`} sx={{ fontWeight: 700 }} />
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate" value={c.readiness}
                  sx={{
                    my: 1.5, height: 6, bgcolor: alpha('#0B2545', .07),
                    '& .MuiLinearProgress-bar': { bgcolor: c.readiness >= 75 ? '#059669' : c.readiness >= 55 ? '#D97706' : '#DC2626' },
                  }}
                />
                <Typography variant="overline" color="text.secondary">Change activities</Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
                  {c.activities.map((a) => <Chip key={a} size="small" label={a} />)}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {tab === 4 && (
          <Grid cols={{ xs: 1, md: 2, lg: 3 }} gap={2}>
            {TEAM_STRUCTURE.map((m) => (
              <Box key={m.id} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha('#0B2545', .1), color: '#0B2545', fontWeight: 700 }}>
                    {m.role.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{m.role}</Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>{m.name}</Typography>
                  </Box>
                </Stack>
                <Chip size="small" label={m.allocation} sx={{ alignSelf: 'flex-start', mb: 1.5, height: 22, fontSize: '0.65rem' }} />
                <Typography variant="overline" color="text.secondary">Responsibilities</Typography>
                <Stack gap={0.4} sx={{ mt: 0.4, flex: 1 }}>
                  {m.responsibilities.map((r) => <Typography key={r} variant="body2">• {r}</Typography>)}
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption"><strong>Designated backup:</strong> {m.backup}</Typography>
              </Box>
            ))}
          </Grid>
        )}

        {tab === 5 && (
          <Stack gap={2.5}>
            <Alert severity="info" icon={<SupportIcon />}>
              <AlertTitle>Support model</AlertTitle>
              A single service desk entry point with reactive incident management against the severity targets below,
              plus proactive preventative maintenance, a quarterly release cycle, monthly service reporting and an
              annual disaster recovery test — for the full three-year support and maintenance term.
            </Alert>
            <Stack gap={1.5}>
              {SUPPORT_TIERS.map((t) => (
                <Box key={t.severity} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                    <Stack direction="row" gap={1.5} alignItems="center">
                      <StatusChip value={t.severity} variant="solid" />
                      <Typography variant="subtitle1">{t.label}</Typography>
                    </Stack>
                    <Chip size="small" label={t.availability} sx={{ fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t.definition}</Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                    <LabelValue label="Response target" value={t.responseTarget} />
                    <LabelValue label="Resolution target" value={t.resolutionTarget} />
                    <LabelValue label="Escalation" value={t.escalation} />
                  </Grid>
                </Box>
              ))}
            </Stack>
            <SectionCard title="Escalation chain" subtitle="Five levels from the service desk through to executive escalation" dense>
              <Stepper orientation="vertical" nonLinear>
                {CONTINUITY.escalationChain.map((level) => (
                  <Step key={level} active expanded>
                    <StepLabel><Typography variant="body2" sx={{ fontWeight: 600 }}>{level}</Typography></StepLabel>
                    <StepContent><Box sx={{ height: 4 }} /></StepContent>
                  </Step>
                ))}
              </Stepper>
            </SectionCard>
          </Stack>
        )}

        {tab === 6 && (
          <Stack gap={2.5}>
            <Alert severity="info">
              <AlertTitle>Hypercare — the 30 days after go-live</AlertTitle>
              Elevated support immediately after go-live, with the delivery team retained alongside the support team
              before responsibility transitions into managed support.
            </Alert>
            <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
              {[
                ['Duration', '30 calendar days from go-live'],
                ['On-site presence', 'Functional and technical consultants on site for the first 10 business days'],
                ['Daily service review', 'Held with the ECIC programme team each morning during hypercare'],
                ['Response targets', 'One severity level higher than the standard support SLA for the hypercare period'],
                ['Defect triage', 'Twice-daily triage with the ECIC business owner during weeks 1 and 2'],
                ['Floor-walking', 'Change champions supporting complaints and BDU teams at their desks'],
                ['Exit criteria', 'No open P1 or P2 defects; SLA achieved for five consecutive business days; ECIC sign-off'],
                ['Transition', 'Formal handover report and knowledge transfer into the managed support team'],
              ].map(([title, body]) => (
                <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
                </Box>
              ))}
            </Grid>
          </Stack>
        )}

        {tab === 7 && (
          <Stack gap={2.5}>
            <Alert severity="info" icon={<ShieldIcon />}>
              <AlertTitle>Business continuity and contingency</AlertTitle>
              Continuity is addressed at two levels: continuity of the service (recovery objectives, backup and
              disaster recovery) and continuity of the delivery resource (named backups and knowledge transfer for
              every key role).
            </Alert>
            <Grid cols={{ xs: 1, sm: 2, md: 4 }} gap={2}>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">Recovery time objective</Typography>
                <Typography variant="h2">{CONTINUITY.rto}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                <Typography variant="overline" color="text.secondary">Recovery point objective</Typography>
                <Typography variant="h2">{CONTINUITY.rpo}</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'surface.subtle', gridColumn: { sm: 'span 2' } }}>
                <Typography variant="overline" color="text.secondary">Backup schedule</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>{CONTINUITY.backupSchedule}</Typography>
              </Box>
            </Grid>
            <SectionCard title="Disaster recovery testing" dense>
              <Typography variant="body2">{CONTINUITY.drTest}</Typography>
            </SectionCard>
            <SectionCard title="Resource continuity" subtitle="Every key role has a named backup and a defined knowledge transfer mechanism" dense>
              <Stack gap={1.25}>
                {CONTINUITY.resourceContinuity.map((r) => (
                  <Box key={r.role} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Grid cols={{ xs: 1, md: 4 }} gap={1.5}>
                      <LabelValue label="Role" value={r.role} />
                      <LabelValue label="Primary" value={r.primary} />
                      <LabelValue label="Backup" value={r.backup} />
                      <LabelValue label="Knowledge transfer" value={r.knowledgeTransfer} />
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
            <SectionCard title="Escalation contact chain" dense>
              <Stack gap={0.75}>
                {CONTINUITY.escalationChain.map((l) => <Typography key={l} variant="body2">• {l}</Typography>)}
              </Stack>
            </SectionCard>
          </Stack>
        )}

        {tab === 8 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2.5 }}>
              The delivery roadmap in sequence, with the current position highlighted. Managed support runs for three
              years from service commencement.
            </Alert>
            <Stepper orientation="vertical" nonLinear>
              {PROJECT_PHASES.map((p) => (
                <Step key={p.id} active expanded completed={p.status === 'Complete'}>
                  <StepLabel
                    optional={
                      <Typography variant="caption">
                        {fmtDate(p.plannedStart)} – {fmtDate(p.plannedEnd)} · {p.ownerRole} · {p.progress}% complete
                      </Typography>
                    }
                  >
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{p.phase}</Typography>
                      <StatusChip value={p.status === 'Complete' ? 'Completed' : p.status === 'In Progress' ? 'In Progress' : p.status === 'At Risk' ? 'Escalated' : 'Planned'} />
                    </Stack>
                  </StepLabel>
                  <StepContent>
                    <LinearProgress
                      variant="determinate" value={p.progress}
                      sx={{
                        mb: 1.25, height: 6, maxWidth: 460, bgcolor: alpha('#0B2545', .07),
                        '& .MuiLinearProgress-bar': { bgcolor: p.progress === 100 ? '#059669' : '#0E7C7B' },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Key milestones: {p.milestones.join(' · ')}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
      </SectionCard>

      <Box sx={{ mt: 2.5 }}>
        <SectionCard
          title="How this supports the Phase Four implementation approach criterion"
          subtitle="Forty of the one hundred available points"
        >
          <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
            {[
              ['Project management', 'Nine-phase plan with deliverables, owners, dates, progress, milestones, dependencies and a RAID register.', 0],
              ['Training plan', 'Twelve role-based courses with delivery method, duration, audience and completion tracking, plus train-the-trainer.', 2],
              ['Change management', 'Seven stakeholder groups with impact assessment, change activities and readiness scoring that gates go-live.', 3],
              ['Team structure', 'Nine named delivery roles with allocation, responsibilities and a designated backup for each.', 4],
              ['Support & SLA', 'P1–P4 severity model with response and resolution targets, availability and a five-level escalation chain.', 5],
              ['Contingency & continuity', 'RTO, RPO, backup schedule, DR testing and resource continuity with named backups.', 7],
            ].map(([title, body, tabIndex]) => (
              <Box
                key={title as string}
                onClick={() => setTab(tabIndex as number)}
                sx={{
                  p: 1.75, borderRadius: 2.5, cursor: 'pointer', bgcolor: 'surface.subtle',
                  border: '1px solid transparent', '&:hover': { borderColor: 'secondary.main' },
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{body}</Typography>
              </Box>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Button variant="contained" onClick={() => navigate('/bid-demo')}>Open Bid Demo Mode</Button>
            <Button variant="outlined" onClick={() => navigate('/coverage')}>Requirement coverage matrix</Button>
            <Button variant="outlined" onClick={() => navigate('/configuration')}>Configuration without development</Button>
          </Stack>
        </SectionCard>
      </Box>
    </Box>
  );
}

export default Implementation;
