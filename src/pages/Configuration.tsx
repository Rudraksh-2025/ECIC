import * as React from 'react';
import {
  Alert, AlertTitle, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Slider, Switch, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CodeOffIcon from '@mui/icons-material/CodeOff';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { ROLES, ROLE_LIST } from '../data/roles';
import { api } from '../services/mockApi';
import {
  ConfirmDialog, DemoScenarioPanel, Grid, KpiCard, PageHeader, SectionCard, Stack,
} from '../components';
import { toast } from '../hooks';
import { num } from '../utils/format';
import type { AnalysisFieldConfig, CampaignTemplateField, NotificationTemplate, PicklistItem, RoleId } from '../types';

const TAB_KEYS = ['complaints', 'leads', 'opportunities', 'sla', 'templates', 'campaigns', 'fields', 'approvals', 'analysis', 'security'];

export function Configuration() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const store = useStore();
  const canManage = ROLES[store.session.role].permissions.includes('config.manage');

  const initialTab = Math.max(0, TAB_KEYS.indexOf(params.get('tab') ?? 'complaints'));
  const [tab, setTab] = React.useState(initialTab);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [templateEdit, setTemplateEdit] = React.useState<NotificationTemplate | null>(null);
  const [newField, setNewField] = React.useState<{ templateId: string; label: string; type: string; required: boolean } | null>(null);
  const [newPicklist, setNewPicklist] = React.useState<{ list: string; label: string; colour: string } | null>(null);
  const [newAnalysis, setNewAnalysis] = React.useState<{ label: string; type: string; section: string; required: boolean } | null>(null);

  const cfg = store.configuration;

  const setTabAndParam = (v: number) => {
    setTab(v);
    setParams({ tab: TAB_KEYS[v] });
  };

  const guard = (fn: () => void) => {
    if (!canManage) {
      toast({
        message: 'Permission denied',
        severity: 'error',
        detail: `The ${ROLES[store.session.role].name} role may not change system configuration. Switch to System Administrator to demonstrate no-code configuration.`,
      });
      return;
    }
    fn();
  };

  /* ---------------------------------------------------------------- */
  /* Picklist editor                                                   */
  /* ---------------------------------------------------------------- */

  const PicklistEditor = ({
    listKey, title, subtitle, items,
  }: { listKey: 'complaintStatuses' | 'complaintCategories' | 'leadSources' | 'leadStatuses' | 'opportunityStages'; title: string; subtitle: string; items: PicklistItem[] }) => (
    <SectionCard
      title={title}
      subtitle={subtitle}
      action={
        <Button size="small" startIcon={<AddIcon />} onClick={() => guard(() => setNewPicklist({ list: listKey, label: '', colour: '#2563EB' }))}>
          Add value
        </Button>
      }
    >
      <Stack gap={1}>
        {items.map((item, index) => (
          <Box key={item.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.colour, flexShrink: 0 }} />
              <TextField
                size="small" value={item.label} sx={{ minWidth: 200, flex: 1 }}
                disabled={!canManage}
                onChange={(e) => guard(() => api.updateConfiguration((c) => {
                  c[listKey][index].label = e.target.value;
                }, `${title}: value renamed to "${e.target.value}"`))}
              />
              <TextField
                size="small" select value={item.colour} sx={{ width: 140 }} label="Colour"
                disabled={!canManage}
                onChange={(e) => guard(() => api.updateConfiguration((c) => {
                  c[listKey][index].colour = e.target.value;
                }, `${title}: "${item.label}" colour changed`))}
              >
                {['#0B2545', '#0E7C7B', '#2563EB', '#7C3AED', '#C9A227', '#DC2626', '#059669', '#D97706', '#64748B'].map((col) => (
                  <MenuItem key={col} value={col}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: col }} />
                      <Typography variant="caption">{col}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    size="small" checked={item.active} disabled={!canManage || item.system}
                    onChange={(e) => guard(() => api.updateConfiguration((c) => {
                      c[listKey][index].active = e.target.checked;
                    }, `${title}: "${item.label}" ${e.target.checked ? 'activated' : 'deactivated'}`))}
                  />
                }
                label={<Typography variant="caption">Active</Typography>}
              />
              {item.system && <Chip size="small" label="System value" sx={{ height: 20, fontSize: '0.62rem' }} />}
              {!item.system && (
                <Tooltip title="Remove this value">
                  <span>
                    <IconButton
                      size="small" disabled={!canManage}
                      onClick={() => guard(() => {
                        api.updateConfiguration((c) => {
                          c[listKey] = c[listKey].filter((x) => x.id !== item.id);
                        }, `${title}: "${item.label}" removed`);
                        toast({ message: 'Configuration value removed', severity: 'success', detail: 'The change took effect immediately across every screen that uses this list.' });
                      })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );

  return (
    <Box>
      <PageHeader
        title="Configuration Centre"
        subtitle="Business administrators change how the CRM behaves — statuses, categories, SLA targets, mandatory fields, approval steps, templates and security rules — without development and without a deployment."
        breadcrumbs={[{ label: 'ECIC CRM', to: '/dashboard' }, { label: 'Configuration' }]}
        chips={<Chip size="small" icon={<CodeOffIcon />} label="NO CODE REQUIRED" sx={{ bgcolor: alpha('#0E7C7B', .12), color: '#0E7C7B', fontWeight: 700 }} />}
        actions={
          <Button variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={() => setResetOpen(true)}>
            Reset demo environment
          </Button>
        }
      />

      {!canManage && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          <AlertTitle>Read-only for your role</AlertTitle>
          The {ROLES[store.session.role].name} role may view but not change configuration. Switch to
          <strong> System Administrator</strong> in the header to demonstrate no-code configuration.
        </Alert>
      )}

      <DemoScenarioPanel
        scenario="The evaluator asks whether ECIC will need a developer every time a business rule changes. Change the complaint SLA from five days to three, save, then reopen a complaint — the target, due date and risk status have all changed."
        evidence={[
          'Complaint statuses, categories, lead sources and opportunity stages editable as lists',
          'SLA targets and warning thresholds that immediately change every SLA calculation',
          'Communication templates with merge fields, edited and previewed in the interface',
          'Campaign template fields — add a mandatory field and it is enforced on the next campaign',
          'Mandatory field rules, approval steps and desktop analysis fields',
          'Security settings including permitted file types, enforced live at upload',
        ]}
        requirements={[8, 15, 17, 62, 63, 81]}
        next="Change the standard complaint SLA, then open a complaint"
        nextTo="/complaints"
      />

      <Grid cols={{ xs: 2, sm: 3, md: 6 }} gap={1.75} sx={{ mb: 2.5 }}>
        <KpiCard dense label="Configurable lists" value="5" sub="Statuses, categories, sources, stages" colour="#0B2545" onClick={() => setTabAndParam(0)} />
        <KpiCard dense label="SLA rules" value={num(cfg.slaRules.length)} colour="#DC2626" onClick={() => setTabAndParam(3)} />
        <KpiCard dense label="Communication templates" value={num(cfg.notificationTemplates.length)} colour="#2563EB" onClick={() => setTabAndParam(4)} />
        <KpiCard dense label="Campaign templates" value={num(cfg.campaignTemplates.length)} colour="#D97706" onClick={() => setTabAndParam(5)} />
        <KpiCard dense label="Mandatory field rules" value={num(cfg.requiredFields.length)} colour="#7C3AED" onClick={() => setTabAndParam(6)} />
        <KpiCard dense label="Analysis fields" value={num(cfg.analysisFields.length)} colour="#0E7C7B" onClick={() => setTabAndParam(8)} />
      </Grid>

      <Tabs
        value={tab} onChange={(_, v) => setTabAndParam(v)}
        variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Complaint lifecycle" />
        <Tab label="Leads" />
        <Tab label="Opportunities" />
        <Tab label="SLA & escalation" />
        <Tab label="Communication templates" />
        <Tab label="Campaign templates" />
        <Tab label="Required fields" />
        <Tab label="Approval steps" />
        <Tab label="Desktop analysis" />
        <Tab label="Security" />
      </Tabs>

      {tab === 0 && (
        <Stack gap={2.5}>
          <PicklistEditor
            listKey="complaintStatuses" items={cfg.complaintStatuses}
            title="Complaint statuses"
            subtitle="These values generate the complaint board columns, the status filters and the status chips throughout the CRM. Changing them changes the board immediately."
          />
          <PicklistEditor
            listKey="complaintCategories" items={cfg.complaintCategories}
            title="Complaint categories"
            subtitle="Drives the category picker on the complaint form, the routing rules and the complaint category report."
          />
          <SectionCard title="Complaint sub-categories" subtitle="Sub-categories are maintained per category and drive the dependent picker on the complaint form">
            <Grid cols={{ xs: 1, md: 2 }} gap={2}>
              {Object.entries(cfg.complaintSubCategories).map(([category, subs]) => (
                <Box key={category} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 1 }}>{category}</Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap">
                    {subs.map((s) => <Chip key={s} size="small" label={s} />)}
                  </Stack>
                </Box>
              ))}
            </Grid>
          </SectionCard>
        </Stack>
      )}

      {tab === 1 && (
        <Stack gap={2.5}>
          <PicklistEditor
            listKey="leadSources" items={cfg.leadSources}
            title="Lead sources"
            subtitle="The intake channels available on the lead capture form and in lead source reporting."
          />
          <PicklistEditor
            listKey="leadStatuses" items={cfg.leadStatuses}
            title="Lead statuses"
            subtitle="The lead lifecycle. Progression rules reference these values."
          />
          <SectionCard title="Duplicate detection rules" subtitle="Matching rules and confidence weights applied live at the point of lead capture">
            <Stack gap={1}>
              {cfg.duplicateRules.map((r, index) => (
                <Box key={r.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{r.field}</Typography>
                      <Typography variant="caption">{r.matchType}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                      <Typography variant="caption">Confidence weight: {r.weight}%</Typography>
                      <Slider
                        size="small" value={r.weight} min={0} max={100} step={5} disabled={!canManage}
                        onChange={(_, v) => guard(() => api.updateConfiguration((c) => {
                          c.duplicateRules[index].weight = v as number;
                        }, `Duplicate rule "${r.field}" weight changed to ${v}%`))}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small" checked={r.active} disabled={!canManage}
                          onChange={(e) => guard(() => api.updateConfiguration((c) => {
                            c.duplicateRules[index].active = e.target.checked;
                          }, `Duplicate rule "${r.field}" ${e.target.checked ? 'enabled' : 'disabled'}`))}
                        />
                      }
                      label={<Typography variant="caption">Active</Typography>}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }} icon={false}>
              <Typography variant="caption">
                Disable the email rule and capture a lead with a duplicate email address — the duplicate panel no
                longer fires. Re-enable it and it does. No code was changed.
              </Typography>
            </Alert>
            <Button size="small" variant="outlined" sx={{ mt: 1.5 }} onClick={() => navigate('/leads/new')}>
              Test duplicate detection
            </Button>
          </SectionCard>
        </Stack>
      )}

      {tab === 2 && (
        <PicklistEditor
          listKey="opportunityStages" items={cfg.opportunityStages}
          title="Opportunity sales stages"
          subtitle="These values generate the pipeline Kanban columns, the stage filters and the pipeline-by-stage report."
        />
      )}

      {tab === 3 && (
        <Stack gap={2.5}>
          <Alert severity="info">
            <AlertTitle>The headline no-code demonstration</AlertTitle>
            Change the standard complaint SLA target below from {cfg.slaRules[2]?.targetDays} business days to 3,
            then open any Medium or Low severity complaint. The SLA target, due date, consumption percentage and risk
            status will all have changed — with no development and no deployment.
          </Alert>
          <SectionCard title="SLA rules" subtitle="Targets and warning thresholds applied across complaints, leads, applications and support">
            <Stack gap={1.5}>
              {cfg.slaRules.map((r, index) => (
                <Box key={r.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                    <Box sx={{ minWidth: 260, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{r.label}</Typography>
                      <Typography variant="caption">{r.entity} · {r.scope}</Typography>
                    </Box>
                    <TextField
                      size="small" type="number" label="Target (business days)" value={r.targetDays}
                      sx={{ width: 190 }} disabled={!canManage}
                      onChange={(e) => guard(() => {
                        const value = Number(e.target.value);
                        api.updateConfiguration((c) => { c.slaRules[index].targetDays = value; },
                          `SLA rule "${r.label}": target changed from ${r.targetDays} to ${value} business days`);
                      })}
                    />
                    <TextField
                      size="small" type="number" label="Warning at (%)" value={r.warningPercent}
                      sx={{ width: 150 }} disabled={!canManage}
                      onChange={(e) => guard(() => {
                        const value = Number(e.target.value);
                        api.updateConfiguration((c) => { c.slaRules[index].warningPercent = value; },
                          `SLA rule "${r.label}": warning threshold changed from ${r.warningPercent}% to ${value}%`);
                      })}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          size="small" checked={r.businessHoursOnly} disabled={!canManage}
                          onChange={(e) => guard(() => api.updateConfiguration((c) => {
                            c.slaRules[index].businessHoursOnly = e.target.checked;
                          }, `SLA rule "${r.label}": business hours only set to ${e.target.checked}`))}
                        />
                      }
                      label={<Typography variant="caption">Business hours only</Typography>}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" gap={1.5} sx={{ mt: 2 }} flexWrap="wrap">
              <Button variant="contained" onClick={() => navigate('/complaints')}>
                Open complaints and see the change
              </Button>
              <Button variant="outlined" onClick={() => navigate('/tasks')}>Open the SLA workspace</Button>
            </Stack>
          </SectionCard>

          <SectionCard title="Escalation rules" subtitle="What triggers an escalation and who it routes to">
            <Grid cols={{ xs: 1, md: 3 }} gap={2}>
              {[
                ['Customer dissatisfaction', 'A feedback rating of Dissatisfied or Very Dissatisfied automatically escalates the case, creates a supervisor task and recalculates SLA risk.', 'Automatic'],
                ['SLA threshold breach', `A case that consumes ${cfg.slaRules[2]?.warningPercent}% of its SLA allowance raises an SLA warning; 100% raises a breach alert on the in-app and SMS channels.`, 'Automatic'],
                ['Manual escalation', 'A case owner may escalate at any time with a reason selected from the configured list.', 'Manual'],
              ].map(([title, body, mode]) => (
                <Box key={title} sx={{ p: 1.75, borderRadius: 2.5, bgcolor: 'surface.subtle' }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{title}</Typography>
                    <Chip size="small" label={mode} sx={{ height: 19, fontSize: '0.62rem' }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{body}</Typography>
                </Box>
              ))}
            </Grid>
          </SectionCard>
        </Stack>
      )}

      {tab === 4 && (
        <SectionCard
          title="Communication templates"
          subtitle="Message content with merge fields, used for every customer and internal notification. Edit a template, then trigger the event to see the new wording."
        >
          <Stack gap={1.25}>
            {cfg.notificationTemplates.map((t) => (
              <Box key={t.id} sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" gap={1.5} alignItems="flex-start" flexWrap="wrap">
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{t.name}</Typography>
                      <Chip size="small" label={t.channel} sx={{ height: 19, fontSize: '0.62rem' }} />
                      <Chip size="small" label={t.active ? 'Active' : 'Inactive'}
                        sx={{ height: 19, fontSize: '0.62rem', bgcolor: alpha(t.active ? '#059669' : '#94A3B8', .12), color: t.active ? '#059669' : '#64748B', fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Trigger: {t.trigger}</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600 }}>{t.subject}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.4, whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                      {t.body.slice(0, 160)}{t.body.length > 160 ? '…' : ''}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" disabled={!canManage} onClick={() => guard(() => setTemplateEdit({ ...t }))}>
                    Edit template
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            <Typography variant="caption">
              Merge fields available: <code>{'{{reference}} {{contactName}} {{customer}} {{status}} {{severity}} {{channel}} {{subject}} {{assignedTo}} {{assignedTeam}} {{dueDate}} {{slaTargetDays}} {{outcome}} {{resolutionDetail}} {{correctiveAction}} {{closedDate}} {{closedBy}} {{owner}} {{backupOwner}} {{company}} {{source}} {{approver}} {{formType}} {{submittedDate}}'}</code>
            </Typography>
          </Alert>
        </SectionCard>
      )}

      {tab === 5 && (
        <Stack gap={2.5}>
          <Alert severity="info">
            <AlertTitle>Second no-code demonstration</AlertTitle>
            Add a mandatory field to a campaign template below, then create a campaign from that template — the new
            field appears on the form and is enforced on save.
          </Alert>
          {cfg.campaignTemplates.map((t, tIndex) => (
            <SectionCard
              key={t.id}
              title={t.name}
              subtitle={t.description}
              action={
                <Button size="small" startIcon={<AddIcon />} disabled={!canManage}
                  onClick={() => guard(() => setNewField({ templateId: t.id, label: '', type: 'text', required: true }))}>
                  Add field
                </Button>
              }
            >
              <Stack gap={1}>
                {t.fields.map((f, fIndex) => (
                  <Box key={f.id} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 200, flex: 1 }}>{f.label}</Typography>
                      <Chip size="small" label={f.type} sx={{ height: 20, fontSize: '0.62rem' }} />
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small" checked={f.required} disabled={!canManage}
                            onChange={(e) => guard(() => api.updateConfiguration((c) => {
                              c.campaignTemplates[tIndex].fields[fIndex].required = e.target.checked;
                            }, `Campaign template "${t.name}": field "${f.label}" is now ${e.target.checked ? 'mandatory' : 'optional'}`))}
                          />
                        }
                        label={<Typography variant="caption">Mandatory</Typography>}
                      />
                      <IconButton
                        size="small" disabled={!canManage}
                        onClick={() => guard(() => {
                          api.updateConfiguration((c) => {
                            c.campaignTemplates[tIndex].fields = c.campaignTemplates[tIndex].fields.filter((x) => x.id !== f.id);
                          }, `Campaign template "${t.name}": field "${f.label}" removed`);
                          toast({ message: 'Template field removed', severity: 'success' });
                        })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      size="small" checked={t.requiresApproval} disabled={!canManage}
                      onChange={(e) => guard(() => api.updateConfiguration((c) => {
                        c.campaignTemplates[tIndex].requiresApproval = e.target.checked;
                      }, `Campaign template "${t.name}": approval ${e.target.checked ? 'required' : 'not required'}`))}
                    />
                  }
                  label={<Typography variant="caption">Requires approval before activation</Typography>}
                />
                <Chip size="small" label={`CIM ${t.cimVersionRequired}`} />
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="outlined" onClick={() => navigate('/campaigns')}>Create a campaign from this template</Button>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      {tab === 6 && (
        <SectionCard
          title="Mandatory field rules"
          subtitle="Which fields must be completed, and at which point in the lifecycle. The complaint and lead forms validate against these rules."
        >
          <Stack gap={1}>
            {cfg.requiredFields.map((r, index) => (
              <Box key={r.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                  <Chip size="small" label={r.entity} sx={{ minWidth: 110, bgcolor: alpha('#0B2545', .07) }} />
                  <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, monospace', minWidth: 190, flex: 1 }}>{r.field}</Typography>
                  <Typography variant="caption" sx={{ minWidth: 170 }}>{r.appliesTo}</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small" checked={r.required} disabled={!canManage}
                        onChange={(e) => guard(() => api.updateConfiguration((c) => {
                          c.requiredFields[index].required = e.target.checked;
                        }, `Required field rule ${r.id}: ${r.entity}.${r.field} is now ${e.target.checked ? 'mandatory' : 'optional'}`))}
                      />
                    }
                    label={<Typography variant="caption">Mandatory</Typography>}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }} icon={false}>
            <Typography variant="caption">
              Switch off the “investigationFindings” rule and the complaint closure checklist no longer requires it —
              the pre-condition list on the complaint changes immediately.
            </Typography>
          </Alert>
        </SectionCard>
      )}

      {tab === 7 && (
        <SectionCard
          title="Approval steps"
          subtitle="Which role authorises each governed process. These steps drive the closure control on complaints, campaign approval and CIM publication."
        >
          <Stack gap={1}>
            {cfg.approvalSteps.map((s, index) => (
              <Box key={s.id} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                  <Chip size="small" label={s.process} sx={{ minWidth: 175, bgcolor: alpha('#0E7C7B', .1), color: '#0E7C7B', fontWeight: 600 }} />
                  <Typography variant="caption" sx={{ minWidth: 40 }}>Step {s.order}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 240, flex: 1 }}>{s.stepName}</Typography>
                  <TextField
                    size="small" select label="Approver role" value={s.approverRole} sx={{ width: 240 }}
                    disabled={!canManage}
                    onChange={(e) => guard(() => api.updateConfiguration((c) => {
                      c.approvalSteps[index].approverRole = e.target.value as RoleId;
                    }, `Approval step "${s.stepName}": approver role changed to ${ROLES[e.target.value as RoleId].name}`))}
                  >
                    {ROLE_LIST.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </TextField>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small" checked={s.mandatory} disabled={!canManage}
                        onChange={(e) => guard(() => api.updateConfiguration((c) => {
                          c.approvalSteps[index].mandatory = e.target.checked;
                        }, `Approval step "${s.stepName}" is now ${e.target.checked ? 'mandatory' : 'optional'}`))}
                      />
                    }
                    label={<Typography variant="caption">Mandatory</Typography>}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>
      )}

      {tab === 8 && (
        <SectionCard
          title="Desktop analysis fields"
          subtitle="The structured qualification form applied to every lead. Adding a field here adds it to the analysis form on every lead."
          action={
            <Button size="small" startIcon={<AddIcon />} disabled={!canManage}
              onClick={() => guard(() => setNewAnalysis({ label: '', type: 'checkbox', section: 'Qualification criteria', required: false }))}>
              Add analysis field
            </Button>
          }
        >
          {Array.from(new Set(cfg.analysisFields.map((f) => f.section))).map((section) => (
            <Box key={section} sx={{ mb: 2.5 }}>
              <Typography variant="overline" color="text.secondary">{section}</Typography>
              <Stack gap={1} sx={{ mt: 0.75 }}>
                {cfg.analysisFields.filter((f) => f.section === section).map((f) => {
                  const index = cfg.analysisFields.findIndex((x) => x.id === f.id);
                  return (
                    <Box key={f.id} sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 240, flex: 1 }}>{f.label}</Typography>
                        <Chip size="small" label={f.type} sx={{ height: 20, fontSize: '0.62rem' }} />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small" checked={f.required} disabled={!canManage}
                              onChange={(e) => guard(() => api.updateConfiguration((c) => {
                                c.analysisFields[index].required = e.target.checked;
                              }, `Desktop analysis field "${f.label}" is now ${e.target.checked ? 'mandatory' : 'optional'}`))}
                            />
                          }
                          label={<Typography variant="caption">Mandatory</Typography>}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              size="small" checked={f.active} disabled={!canManage}
                              onChange={(e) => guard(() => api.updateConfiguration((c) => {
                                c.analysisFields[index].active = e.target.checked;
                              }, `Desktop analysis field "${f.label}" ${e.target.checked ? 'activated' : 'deactivated'}`))}
                            />
                          }
                          label={<Typography variant="caption">Active</Typography>}
                        />
                        <IconButton
                          size="small" disabled={!canManage}
                          onClick={() => guard(() => {
                            api.updateConfiguration((c) => {
                              c.analysisFields = c.analysisFields.filter((x) => x.id !== f.id);
                            }, `Desktop analysis field "${f.label}" removed`);
                            toast({ message: 'Analysis field removed', severity: 'success', detail: 'The lead desktop analysis form updated immediately.' });
                          })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}
          <Button variant="outlined" onClick={() => navigate('/leads')}>Open a lead to see the analysis form</Button>
        </SectionCard>
      )}

      {tab === 9 && (
        <Stack gap={2.5}>
          <SectionCard title="Security configuration" subtitle="Enforced live in this demonstration — changing the permitted file types immediately changes what the document upload accepts">
            <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
              {([
                ['mfaRequiredInternal', 'MFA required — internal users'],
                ['mfaRequiredPortal', 'MFA required — portal users'],
                ['ssoEnabled', 'Single sign-on enabled'],
                ['captchaOnPublicForms', 'CAPTCHA on public forms'],
                ['maskPiiByDefault', 'Mask personal information by default'],
              ] as const).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={cfg.security[key]} disabled={!canManage}
                      onChange={(e) => guard(() => api.updateConfiguration((c) => {
                        (c.security[key] as boolean) = e.target.checked;
                      }, `Security setting "${label}" set to ${e.target.checked}`))}
                    />
                  }
                  label={<Typography variant="body2">{label}</Typography>}
                />
              ))}
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid cols={{ xs: 1, sm: 2, md: 3 }} gap={2}>
              <TextField
                size="small" type="number" label="Session timeout (minutes)" value={cfg.security.sessionTimeoutMinutes}
                disabled={!canManage}
                onChange={(e) => guard(() => api.updateConfiguration((c) => {
                  c.security.sessionTimeoutMinutes = Number(e.target.value);
                }, `Session timeout changed to ${e.target.value} minutes`))}
              />
              <TextField
                size="small" type="number" label="Maximum file size (MB)" value={cfg.security.maxFileSizeMb}
                disabled={!canManage}
                onChange={(e) => guard(() => api.updateConfiguration((c) => {
                  c.security.maxFileSizeMb = Number(e.target.value);
                }, `Maximum upload size changed to ${e.target.value} MB`))}
              />
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" color="text.secondary">Permitted file types</Typography>
            <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
              {['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'msg', 'csv', 'zip', 'txt'].map((ext) => {
                const enabled = cfg.security.allowedFileTypes.includes(ext);
                return (
                  <Chip
                    key={ext} label={`.${ext}`} size="small"
                    onClick={() => guard(() => {
                      api.updateConfiguration((c) => {
                        c.security.allowedFileTypes = enabled
                          ? c.security.allowedFileTypes.filter((t) => t !== ext)
                          : [...c.security.allowedFileTypes, ext];
                      }, `Permitted file types: ".${ext}" ${enabled ? 'removed' : 'added'}`);
                      toast({
                        message: `.${ext} ${enabled ? 'no longer permitted' : 'now permitted'}`,
                        severity: 'success',
                        detail: 'Try uploading a document — the rule is enforced immediately.',
                      });
                    })}
                    sx={{
                      cursor: canManage ? 'pointer' : 'default', fontWeight: 700,
                      bgcolor: alpha(enabled ? '#059669' : '#94A3B8', .12),
                      color: enabled ? '#059669' : '#64748B',
                    }}
                  />
                );
              })}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <TextField
              fullWidth multiline minRows={2} size="small" label="Password policy" value={cfg.security.passwordPolicy}
              disabled={!canManage}
              onChange={(e) => guard(() => api.updateConfiguration((c) => {
                c.security.passwordPolicy = e.target.value;
              }, 'Password policy amended'))}
            />
            <Stack direction="row" gap={1.5} sx={{ mt: 2 }} flexWrap="wrap">
              <Button variant="contained" onClick={() => navigate('/documents')}>Test the upload rules</Button>
              <Button variant="outlined" onClick={() => navigate('/security')}>Open the Security Centre</Button>
            </Stack>
          </SectionCard>
        </Stack>
      )}

      {/* ---------------------------- Dialogs ---------------------------- */}

      <Dialog open={!!templateEdit} onClose={() => setTemplateEdit(null)} fullWidth maxWidth="md">
        <DialogTitle>Edit communication template</DialogTitle>
        <DialogContent dividers>
          {templateEdit && (
            <Stack gap={2}>
              <Grid cols={{ xs: 1, sm: 3 }} gap={2}>
                <TextField label="Template name" value={templateEdit.name} onChange={(e) => setTemplateEdit({ ...templateEdit, name: e.target.value })} />
                <TextField select label="Channel" value={templateEdit.channel} onChange={(e) => setTemplateEdit({ ...templateEdit, channel: e.target.value as NotificationTemplate['channel'] })}>
                  {['Email', 'SMS', 'In-App'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <FormControlLabel
                  control={<Switch checked={templateEdit.active} onChange={(e) => setTemplateEdit({ ...templateEdit, active: e.target.checked })} />}
                  label={<Typography variant="body2">Active</Typography>}
                />
              </Grid>
              <TextField label="Subject" value={templateEdit.subject} onChange={(e) => setTemplateEdit({ ...templateEdit, subject: e.target.value })} fullWidth />
              <TextField
                label="Message body" value={templateEdit.body} multiline minRows={9} fullWidth
                onChange={(e) => setTemplateEdit({ ...templateEdit, body: e.target.value })}
                helperText="Merge fields in double braces are replaced with record values when the notification is issued."
              />
              <Alert severity="info" icon={false}>
                <Typography variant="caption">
                  Trigger: {templateEdit.trigger}. After saving, perform the corresponding action in the CRM and open
                  the Notification Centre — the new wording appears in the issued message.
                </Typography>
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setTemplateEdit(null)}>Cancel</Button>
          <Button
            variant="contained" startIcon={<SaveIcon />}
            onClick={() => {
              if (!templateEdit) return;
              api.updateConfiguration((c) => {
                const i = c.notificationTemplates.findIndex((t) => t.id === templateEdit.id);
                if (i >= 0) c.notificationTemplates[i] = templateEdit;
              }, `Communication template "${templateEdit.name}" amended; subject: ${templateEdit.subject}`);
              setTemplateEdit(null);
              toast({
                message: 'Template saved',
                severity: 'success',
                detail: 'The next notification of this type will use the new content. No deployment was required.',
                action: { label: 'Open notifications', to: '/notifications' },
              });
            }}
          >
            Save template
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!newField} onClose={() => setNewField(null)} fullWidth maxWidth="xs">
        <DialogTitle>Add a field to the campaign template</DialogTitle>
        <DialogContent>
          {newField && (
            <Stack gap={2} sx={{ pt: 1 }}>
              <TextField label="Field label" value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} autoFocus fullWidth />
              <TextField select label="Field type" value={newField.type} onChange={(e) => setNewField({ ...newField, type: e.target.value })} fullWidth>
                {['text', 'number', 'date', 'textarea'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <FormControlLabel
                control={<Checkbox checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />}
                label={<Typography variant="body2">Mandatory — campaigns cannot be saved without it</Typography>}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setNewField(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!newField?.label}
            onClick={() => {
              if (!newField) return;
              const field: CampaignTemplateField = {
                id: newField.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                label: newField.label,
                type: newField.type as CampaignTemplateField['type'],
                required: newField.required,
              };
              api.updateConfiguration((c) => {
                const t = c.campaignTemplates.find((x) => x.id === newField.templateId);
                t?.fields.push(field);
              }, `Campaign template field "${newField.label}" added (${newField.required ? 'mandatory' : 'optional'})`);
              setNewField(null);
              toast({
                message: 'Template field added',
                severity: 'success',
                detail: 'Create a campaign from this template — the field is on the form and enforced on save.',
                action: { label: 'Create campaign', to: '/campaigns' },
              });
            }}
          >
            Add field
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!newPicklist} onClose={() => setNewPicklist(null)} fullWidth maxWidth="xs">
        <DialogTitle>Add configuration value</DialogTitle>
        <DialogContent>
          {newPicklist && (
            <Stack gap={2} sx={{ pt: 1 }}>
              <TextField label="Value label" value={newPicklist.label} onChange={(e) => setNewPicklist({ ...newPicklist, label: e.target.value })} autoFocus fullWidth />
              <TextField select label="Colour" value={newPicklist.colour} onChange={(e) => setNewPicklist({ ...newPicklist, colour: e.target.value })} fullWidth>
                {['#0B2545', '#0E7C7B', '#2563EB', '#7C3AED', '#C9A227', '#DC2626', '#059669', '#D97706', '#64748B'].map((col) => (
                  <MenuItem key={col} value={col}>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: col }} />
                      <Typography variant="caption">{col}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setNewPicklist(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!newPicklist?.label}
            onClick={() => {
              if (!newPicklist) return;
              const item: PicklistItem = {
                id: newPicklist.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                label: newPicklist.label, colour: newPicklist.colour, active: true,
              };
              api.updateConfiguration((c) => {
                const key = newPicklist.list as 'complaintStatuses';
                c[key] = [...c[key], item];
              }, `Configuration list "${newPicklist.list}": value "${newPicklist.label}" added`);
              setNewPicklist(null);
              toast({
                message: 'Configuration value added',
                severity: 'success',
                detail: 'The new value is immediately available on forms, filters and boards across the CRM.',
              });
            }}
          >
            Add value
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!newAnalysis} onClose={() => setNewAnalysis(null)} fullWidth maxWidth="xs">
        <DialogTitle>Add a desktop analysis field</DialogTitle>
        <DialogContent>
          {newAnalysis && (
            <Stack gap={2} sx={{ pt: 1 }}>
              <TextField label="Field label" value={newAnalysis.label} onChange={(e) => setNewAnalysis({ ...newAnalysis, label: e.target.value })} autoFocus fullWidth />
              <TextField select label="Field type" value={newAnalysis.type} onChange={(e) => setNewAnalysis({ ...newAnalysis, type: e.target.value })} fullWidth>
                {['checkbox', 'text', 'textarea', 'select'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField select label="Section" value={newAnalysis.section} onChange={(e) => setNewAnalysis({ ...newAnalysis, section: e.target.value })} fullWidth>
                {['Qualification criteria', 'Risk assessment', 'Commercial'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <FormControlLabel
                control={<Checkbox checked={newAnalysis.required} onChange={(e) => setNewAnalysis({ ...newAnalysis, required: e.target.checked })} />}
                label={<Typography variant="body2">Mandatory</Typography>}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setNewAnalysis(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={!newAnalysis?.label}
            onClick={() => {
              if (!newAnalysis) return;
              const field: AnalysisFieldConfig = {
                id: `af_${newAnalysis.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
                label: newAnalysis.label,
                type: newAnalysis.type as AnalysisFieldConfig['type'],
                required: newAnalysis.required,
                active: true,
                section: newAnalysis.section,
                ...(newAnalysis.type === 'select' ? { options: ['Yes', 'No', 'Not applicable'] } : {}),
              };
              api.updateConfiguration((c) => { c.analysisFields.push(field); },
                `Desktop analysis field "${newAnalysis.label}" added to section "${newAnalysis.section}"`);
              setNewAnalysis(null);
              toast({
                message: 'Analysis field added',
                severity: 'success',
                detail: 'Open any lead and start the desktop analysis — the new field is there.',
                action: { label: 'Open leads', to: '/leads' },
              });
            }}
          >
            Add field
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={resetOpen}
        title="Reset the demonstration environment?"
        message="This restores the original seed data and clears every change made during this session: complaints, leads, opportunities, applications, documents, notifications, tasks, configuration changes, saved reports, offline captures, demo progress and the audit log."
        confirmLabel="Reset everything"
        confirmColor="error"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          store.resetDemo();
          setResetOpen(false);
          navigate('/dashboard');
          window.setTimeout(() => window.location.reload(), 80);
        }}
      />
    </Box>
  );
}

export default Configuration;
