import {
  Alert, AlertTitle, Box, Button, Chip, Divider, IconButton, LinearProgress,
  Switch, FormControlLabel, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PlayIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TimerIcon from '@mui/icons-material/Timer';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import {
  Grid, KpiCard, PageHeader, SectionCard, Stack,
} from '../components';
import { toast } from '../hooks';
import { DEMO_STEPS, PHASE_FOUR_AREAS, REQUIREMENTS } from '../data/requirements';
import { num } from '../utils/format';

const AREA_COLOUR: Record<string, string> = {
  'Implementation Approach': '#0B2545',
  'Ease of Use': '#0E7C7B',
  Reporting: '#2563EB',
  Security: '#DC2626',
};

export function BidDemo() {
  const navigate = useNavigate();
  const store = useStore();
  const setSession = useStore((s) => s.setSession);
  const { demoStep, completedSteps, presentationMode } = store.session;

  const current = DEMO_STEPS.find((s) => s.id === demoStep) ?? DEMO_STEPS[0];
  const progress = (completedSteps.length / DEMO_STEPS.length) * 100;
  const totalMinutes = DEMO_STEPS.reduce((s, x) => s + x.durationMinutes, 0);
  const remainingMinutes = DEMO_STEPS.filter((s) => !completedSteps.includes(s.id))
    .reduce((s, x) => s + x.durationMinutes, 0);

  const goTo = (id: number) => setSession({ demoStep: Math.min(DEMO_STEPS.length, Math.max(1, id)) });

  const toggleComplete = (id: number) => {
    const next = completedSteps.includes(id)
      ? completedSteps.filter((x) => x !== id)
      : [...completedSteps, id];
    setSession({ completedSteps: next });
  };

  const openStep = (step: typeof current) => {
    if (!completedSteps.includes(step.id)) {
      setSession({ completedSteps: [...completedSteps, step.id], demoStep: step.id });
    } else {
      setSession({ demoStep: step.id });
    }
    navigate(step.route);
  };

  const finished = completedSteps.length === DEMO_STEPS.length;

  return (
    <Box>
      <PageHeader
        title="Bid Demo Mode"
        subtitle="A guided eighteen-step presentation sequence for the ECIC Phase Four demonstration, with the objective, talking points, requirement evidence and expected outcome for every step."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Bid Demo Mode' }]}
        chips={
          <Chip
            size="small" icon={<TimerIcon />}
            label={`≈ ${totalMinutes} minutes total · ${remainingMinutes} remaining`}
            sx={{ bgcolor: alpha('#0B2545', .08), fontWeight: 700 }}
          />
        }
        actions={
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={presentationMode}
                  onChange={(e) => {
                    setSession({ presentationMode: e.target.checked });
                    toast({
                      message: e.target.checked ? 'Presentation mode on' : 'Presentation mode off',
                      severity: 'info',
                      detail: e.target.checked
                        ? 'Navigation is collapsed and the content area widened for projection. Use the menu button to navigate.'
                        : 'The full navigation has returned.',
                    });
                  }}
                />
              }
              label={<Typography variant="body2">Presentation mode</Typography>}
            />
            <Button
              variant="outlined" startIcon={<RestartAltIcon />}
              onClick={() => {
                setSession({ demoStep: 1, completedSteps: [] });
                toast({ message: 'Demo progress reset', severity: 'info', detail: 'The presenter checklist has been cleared. Record data is unchanged.' });
              }}
            >
              Reset progress
            </Button>
            <Button variant="contained" startIcon={<PlayIcon />} onClick={() => openStep(current)}>
              Open step {current.id}
            </Button>
          </>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }} icon={<SlideshowIcon />}>
        <AlertTitle>How to run this demonstration</AlertTitle>
        Work down the sequence below. Each step names what to demonstrate, what to say, which Annexure C requirements
        it evidences and what the evaluator should see. Selecting <strong>Open this step</strong> marks it complete and
        navigates to the screen. Presentation mode collapses the navigation and widens the content area for projection.
      </Alert>

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Demo steps" value={`${completedSteps.length} / ${DEMO_STEPS.length}`} sub="Completed" colour="#0B2545" />
        <KpiCard dense label="Estimated duration" value={`${totalMinutes} min`} sub={`${remainingMinutes} min remaining`} colour="#2563EB" />
        <KpiCard dense label="Requirements evidenced" value={num(new Set(DEMO_STEPS.flatMap((s) => s.requirements)).size)} sub={`of ${REQUIREMENTS.length} total`} colour="#0E7C7B" />
        {PHASE_FOUR_AREAS.map((a) => (
          <KpiCard
            key={a.area} dense label={a.area} value={`${a.points} pts`}
            sub={`${DEMO_STEPS.filter((s) => s.phaseFourArea === a.area).length} demo steps`}
            colour={AREA_COLOUR[a.area]}
            onClick={() => navigate(a.route)}
          />
        ))}
      </Grid>

      <SectionCard sx={{ mb: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1 }} flexWrap="wrap">
          <Typography variant="h5">Presenter progress</Typography>
          <Typography variant="subtitle1">{completedSteps.length} / {DEMO_STEPS.length}</Typography>
        </Stack>
        <LinearProgress
          variant="determinate" value={progress}
          sx={{
            height: 10, bgcolor: alpha('#0B2545', .08),
            '& .MuiLinearProgress-bar': { bgcolor: finished ? '#059669' : '#0E7C7B' },
          }}
        />
        <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1.75 }}>
          {DEMO_STEPS.map((s) => {
            const done = completedSteps.includes(s.id);
            const isCurrent = s.id === demoStep;
            return (
              <Tooltip key={s.id} title={`${s.id}. ${s.title}`}>
                <Box
                  onClick={() => goTo(s.id)}
                  sx={{
                    width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center',
                    cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                    bgcolor: done ? alpha('#059669', .16) : isCurrent ? alpha('#0E7C7B', .18) : 'surface.sunken',
                    color: done ? '#059669' : isCurrent ? '#0E7C7B' : 'text.secondary',
                    border: isCurrent ? '2px solid #0E7C7B' : '2px solid transparent',
                  }}
                >
                  {s.id}
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </SectionCard>

      {/* Current step, presented large */}
      <SectionCard
        sx={{
          mb: 2.5, borderColor: alpha(AREA_COLOUR[current.phaseFourArea], .4),
          background: `linear-gradient(135deg, ${alpha(AREA_COLOUR[current.phaseFourArea], .05)} 0%, transparent 60%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start" flexWrap="wrap">
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" gap={1.25} alignItems="center" flexWrap="wrap" sx={{ mb: 1 }}>
              <Chip
                label={`STEP ${current.id} OF ${DEMO_STEPS.length}`} size="small"
                sx={{ bgcolor: AREA_COLOUR[current.phaseFourArea], color: '#fff', fontWeight: 700 }}
              />
              <Chip label={current.phaseFourArea} size="small" sx={{ bgcolor: alpha(AREA_COLOUR[current.phaseFourArea], .12), color: AREA_COLOUR[current.phaseFourArea], fontWeight: 700 }} />
              <Chip label={`≈ ${current.durationMinutes} min`} size="small" />
            </Stack>
            <Typography variant="h2" sx={{ mb: 1 }}>{current.title}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 900 }}>{current.objective}</Typography>
          </Box>
          <Stack direction="row" gap={1}>
            <IconButton onClick={() => goTo(current.id - 1)} disabled={current.id === 1} aria-label="Previous step">
              <ArrowBackIcon />
            </IconButton>
            <Button variant="contained" size="large" startIcon={<PlayIcon />} onClick={() => openStep(current)}>
              Open this step
            </Button>
            <IconButton onClick={() => goTo(current.id + 1)} disabled={current.id === DEMO_STEPS.length} aria-label="Next step">
              <ArrowForwardIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Grid cols={{ xs: 1, md: 3 }} gap={3}>
          <Box>
            <Typography variant="overline" color="text.secondary">Presenter talking points</Typography>
            <Stack gap={1} sx={{ mt: 0.75 }}>
              {current.talkingPoints.map((t, i) => (
                <Stack key={t} direction="row" gap={1.25} alignItems="flex-start">
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: '2px',
                    bgcolor: alpha(AREA_COLOUR[current.phaseFourArea], .12),
                    color: AREA_COLOUR[current.phaseFourArea],
                    display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700,
                  }}>{i + 1}</Box>
                  <Typography variant="body2">{t}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Annexure C requirements demonstrated</Typography>
            <Stack gap={0.75} sx={{ mt: 0.75 }}>
              {current.requirements.map((id) => {
                const req = REQUIREMENTS.find((r) => r.id === id);
                return (
                  <Box
                    key={id}
                    onClick={() => navigate(`/coverage?req=${id}`)}
                    sx={{
                      p: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: 'surface.subtle',
                      '&:hover': { bgcolor: alpha('#0B2545', .06) },
                    }}
                  >
                    <Stack direction="row" gap={1} alignItems="flex-start">
                      <Chip size="small" label={`#${id}`} sx={{ height: 20, fontWeight: 700, fontSize: '0.62rem', flexShrink: 0 }} />
                      <Typography variant="caption">{req?.requirement}</Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">Expected outcome</Typography>
            <Alert severity="success" sx={{ mt: 0.75 }} icon={false}>
              <Typography variant="body2">{current.expectedOutcome}</Typography>
            </Alert>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" color="text.secondary">Completion check</Typography>
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={
                <Switch
                  checked={completedSteps.includes(current.id)}
                  onChange={() => toggleComplete(current.id)}
                />
              }
              label={
                <Typography variant="body2">
                  {completedSteps.includes(current.id) ? 'Demonstrated' : 'Mark as demonstrated'}
                </Typography>
              }
            />
            <Stack direction="row" gap={1} sx={{ mt: 1.5 }} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={() => goTo(current.id - 1)} disabled={current.id === 1}>Previous</Button>
              <Button size="small" variant="outlined" onClick={() => goTo(current.id + 1)} disabled={current.id === DEMO_STEPS.length}>Next step</Button>
            </Stack>
          </Box>
        </Grid>
      </SectionCard>

      {/* Full sequence */}
      <SectionCard title="Full demonstration sequence" subtitle="Eighteen steps covering all four Phase Four scoring areas" sx={{ mb: 2.5 }}>
        <Stack gap={1.25}>
          {DEMO_STEPS.map((s) => {
            const done = completedSteps.includes(s.id);
            const isCurrent = s.id === demoStep;
            return (
              <Box
                key={s.id}
                sx={{
                  p: 1.75, borderRadius: 2.5,
                  border: '1px solid', borderColor: isCurrent ? AREA_COLOUR[s.phaseFourArea] : 'divider',
                  bgcolor: done ? alpha('#059669', .03) : isCurrent ? alpha(AREA_COLOUR[s.phaseFourArea], .03) : 'transparent',
                }}
              >
                <Stack direction="row" gap={1.75} alignItems="flex-start" flexWrap="wrap">
                  <IconButton size="small" onClick={() => toggleComplete(s.id)} sx={{ mt: -0.5 }} aria-label="Toggle step completion">
                    {done
                      ? <CheckCircleIcon sx={{ color: 'success.main' }} />
                      : <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />}
                  </IconButton>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                        {s.id}. {s.title}
                      </Typography>
                      <Chip size="small" label={s.phaseFourArea}
                        sx={{ height: 19, fontSize: '0.6rem', bgcolor: alpha(AREA_COLOUR[s.phaseFourArea], .1), color: AREA_COLOUR[s.phaseFourArea], fontWeight: 700 }} />
                      <Chip size="small" label={`${s.durationMinutes} min`} sx={{ height: 19, fontSize: '0.6rem' }} />
                      <Chip size="small" label={`${s.requirements.length} requirements`} sx={{ height: 19, fontSize: '0.6rem' }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.objective}</Typography>
                  </Box>
                  <Stack direction="row" gap={0.75}>
                    <Button size="small" onClick={() => goTo(s.id)}>Brief</Button>
                    <Button size="small" variant="contained" onClick={() => openStep(s)}>Open</Button>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </SectionCard>

      {/* Coverage summary */}
      <SectionCard
        title="Phase Four demo coverage — presenter checklist"
        subtitle="This is a coverage checklist for the presenter, not an awarded score. It records which evidence areas the demonstration has covered."
      >
        {finished && (
          <Alert severity="success" sx={{ mb: 2.5 }}>
            <AlertTitle>Demonstration sequence complete</AlertTitle>
            All eighteen steps have been marked as demonstrated. Every Phase Four evidence area below has been covered
            during this presentation.
          </Alert>
        )}
        <Grid cols={{ xs: 1, sm: 2, lg: 4 }} gap={2}>
          {PHASE_FOUR_AREAS.map((area) => {
            const steps = DEMO_STEPS.filter((s) => s.phaseFourArea === area.area);
            const done = steps.filter((s) => completedSteps.includes(s.id)).length;
            const areaProgress = steps.length ? (done / steps.length) * 100 : 0;
            return (
              <Box
                key={area.area}
                sx={{
                  p: 2, borderRadius: 2.5, display: 'flex', flexDirection: 'column',
                  border: '1px solid', borderColor: alpha(AREA_COLOUR[area.area], .3),
                }}
              >
                <Typography variant="overline" sx={{ color: AREA_COLOUR[area.area] }}>{area.area}</Typography>
                <Typography variant="h2" sx={{ my: 0.5 }}>
                  {area.points}
                  <Typography component="span" variant="h5" color="text.secondary"> points available</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{area.description}</Typography>
                <LinearProgress
                  variant="determinate" value={areaProgress}
                  sx={{
                    height: 8, mb: 1.5, bgcolor: alpha(AREA_COLOUR[area.area], .1),
                    '& .MuiLinearProgress-bar': { bgcolor: AREA_COLOUR[area.area] },
                  }}
                />
                <Typography variant="caption" sx={{ mb: 1.5 }}>
                  {done} of {steps.length} demo step(s) covered · {area.evidence.length} evidence areas
                </Typography>
                <Divider sx={{ mb: 1.25 }} />
                <Stack gap={0.5} sx={{ flex: 1 }}>
                  {area.evidence.map((e) => (
                    <Stack key={e} direction="row" gap={0.75} alignItems="flex-start">
                      <CheckCircleIcon sx={{ fontSize: 13, color: AREA_COLOUR[area.area], mt: '3px', flexShrink: 0 }} />
                      <Typography variant="caption">{e}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate(area.route)}>
                  Open the evidence
                </Button>
              </Box>
            );
          })}
        </Grid>
        <Divider sx={{ my: 2.5 }} />
        <Alert severity="warning" icon={false}>
          <Typography variant="body2">
            <strong>This is a demo coverage checklist, not a score.</strong> The points shown are the marks available
            under the Phase Four evaluation criteria. Ticking an area records only that the presenter has demonstrated
            the corresponding evidence — the award of marks rests entirely with the ECIC evaluation panel.
          </Typography>
        </Alert>
      </SectionCard>
    </Box>
  );
}

export default BidDemo;
