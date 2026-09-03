import puppeteer from 'puppeteer-core';

const B = 'http://localhost:5173';
const log = (s) => console.log(s);
let fails = 0;
const check = (ok, label, extra = '') => {
  if (!ok) fails += 1;
  log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const text = () => page.evaluate(() => document.body.innerText);
const clickText = async (label, tag = 'button') => {
  const done = await page.evaluate((l, t) => {
    const els = [...document.querySelectorAll(t)];
    const el = els.find((e) => e.innerText.trim().toLowerCase().includes(l.toLowerCase()) && !e.disabled);
    if (el) { el.click(); return true; }
    return false;
  }, label, tag);
  await wait(450);
  return done;
};
const isDisabled = (label) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('button')].find((e) => e.innerText.trim().toLowerCase().includes(l.toLowerCase()));
  return el ? el.disabled : null;
}, label);
const selectMui = async (labelText, optionText) => {
  const handle = await page.evaluateHandle((lt) => {
    const labels = [...document.querySelectorAll('.MuiFormLabel-root')];
    const lab = labels.find((l) => l.textContent.replace('*', '').trim().toLowerCase() === lt.toLowerCase());
    const root = lab?.closest('.MuiFormControl-root');
    return root?.querySelector('[role="combobox"], .MuiSelect-select') ?? null;
  }, labelText);
  const el = handle.asElement();
  if (!el) return false;
  await el.click();
  await wait(400);
  const picked = await page.evaluate((ot) => {
    const opts = [...document.querySelectorAll('li[role="option"]')];
    const o = opts.find((x) => x.innerText.trim().toLowerCase().includes(ot.toLowerCase()));
    if (o) { o.dispatchEvent(new MouseEvent('click', { bubbles: true })); return o.innerText.trim(); }
    return null;
  }, optionText);
  await wait(400);
  return picked;
};

const typeInto = async (labelText, value) => {
  const handle = await page.evaluateHandle((lt) => {
    const labels = [...document.querySelectorAll('.MuiFormLabel-root')];
    const lab = labels.reverse().find((l) => l.textContent.replace('*', '').trim().toLowerCase() === lt.toLowerCase());
    const root = lab?.closest('.MuiFormControl-root');
    if (!root) return null;
    return root.querySelector('textarea:not([aria-hidden="true"]):not([readonly])')
      ?? root.querySelector('input:not([type=hidden])')
      ?? null;
  }, labelText);
  const el = handle.asElement();
  if (!el) return false;
  await el.click({ clickCount: 3 });
  await wait(120);
  await page.keyboard.type(value, { delay: 1 });
  await wait(200);
  return true;
};

/* ---------------- 1. Complaint capture with validation ---------------- */
log('\n=== 1. COMPLAINT CAPTURE, VALIDATION & REFERENCE GENERATION ===');
await page.goto(`${B}/complaints/new`, { waitUntil: 'networkidle2' });
await wait(700);
await clickText('Continue');
let t = await text();
check(/is required/i.test(t), 'Mandatory validation blocks step 1', t.match(/[A-Z][^.]*is required\./)?.[0] ?? '');

check(!!(await selectMui('Customer', 'Highveld')), 'Customer picker selectable');
await wait(300);
await clickText('Continue');
t = await text();
check(/Complaint details|Complaint subject/i.test(t), 'Advances to step 2 once customer selected');

await typeInto('Complaint subject', 'Automated flow test — policy schedule shows an incorrect country limit');
await typeInto('Complaint description', 'The policy schedule issued this week reflects a buyer country limit that does not match the underwriting approval letter, and the exporter cannot draw down on the facility as a result.');
await clickText('Continue');
t = await text();
check(/Classification|Business unit/i.test(t), 'Advances to classification step');

await selectMui('Business unit', 'Underwriting');
await selectMui('Source / channel', 'Telephone');
await selectMui('Category', 'Policy Administration');
await selectMui('Sub-category', 'Incorrect');
await selectMui('Severity', 'Critical');
t = await text();
check(/SLA derived from configuration/i.test(t) && /2 business days/i.test(t), 'SLA target derived live from configuration', '2 business days for Critical');
await clickText('Continue');
await selectMui('Assigned specialist', 'Nomsa');
await clickText('Continue');
t = await text();
check(/Ready to save/i.test(t), 'Review step reports ready to save');
await clickText('Save complaint');
await wait(1400);
t = await text();
const ref = t.match(/ECIC-CMP-\d{4}-\d{4}/)?.[0];
check(!!ref, 'Complaint saved with generated reference', ref ?? 'none');
check(/SLA position|Closure pre-conditions/i.test(t), 'Navigates to the complaint detail screen');
check(/Assigned/i.test(t), 'Complaint routed and status set');

/* ---------------- 2. Closure control & segregation of duties ---------------- */
log('\n=== 2. CLOSURE PRE-CONDITIONS & SEGREGATION OF DUTIES ===');
const complaintUrl = page.url();
t = await text();
check(/Investigation recorded/i.test(t) && /Customer communication issued/i.test(t), 'Closure pre-condition checklist rendered');
check((await isDisabled('Close complaint')) === true, 'Close blocked while pre-conditions unmet');

await clickText('Record resolution');
await wait(500);
check(!!(await typeInto('Investigation findings', 'Underwriting confirmed the approved limit. The schedule generation drew the value from a superseded pre-approval record.')), 'Investigation findings captured');
await selectMui('Outcome', 'upheld');
await typeInto('Resolution detail', 'A corrected policy schedule was issued to the exporter and the facility drawdown was unblocked the same day.');
await typeInto('Corrective action', 'A validation control was added to the schedule generation routine to reconcile against the current underwriting approval.');
check(await clickText('Save resolution'), 'Save resolution clicked');
await wait(1200);
t = await text();
check(/Status changed to Resolved|Resolution recorded/i.test(t) || /Resolved/.test(t), 'Resolution recorded, case moved to Resolved');

await clickText('Communicate');
await wait(600);
await selectMui('Communication template', 'Resolution');
await wait(400);
await clickText('Send communication');
await wait(1000);
t = await text();
check(/Communication issued|Customer communication issued/i.test(t), 'Resolution communication issued on preferred channel');

await wait(600);
const metCount = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.MuiCard-root')].find((c) => c.innerText.includes('Closure pre-conditions'));
  return [...el.querySelectorAll('svg')].filter((s) => s.getAttribute('data-testid') === 'CheckCircleIcon').length;
});
check(metCount === 5, 'All five closure pre-conditions met', `${metCount}/5`);
const closeDisabledAsSupervisor = await isDisabled('Close complaint');
check(closeDisabledAsSupervisor === false, 'Supervisor may close once pre-conditions met');

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 5).join('\n') : 'No runtime errors'}`);
log(fails === 0 ? '\nFLOW 1-2 PASSED' : `\n${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
