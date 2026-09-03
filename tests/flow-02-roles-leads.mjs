import { B, wait, makePage, makeApi, makeCheck } from './helpers.mjs';

const { browser, page, errors } = await makePage();
const { text, clickText, isDisabled, selectMui, typeInto, switchRole } = makeApi(page);
const { check, state } = makeCheck();
const log = console.log;

/* ---- 3. Role switching and segregation of duties ---- */
log('\n=== 3. ROLE SWITCHING & SEGREGATION OF DUTIES ===');
await page.goto(`${B}/dashboard`, { waitUntil: 'networkidle2' });
await wait(800);
const supervisorNav = await page.evaluate(() => document.querySelector('nav')?.innerText ?? '');
check(/Audit Log/.test(supervisorNav), 'Supervisor sees the Audit Log module');

check(await switchRole('Complaints Specialist'), 'Switched role to Complaints Specialist');
await page.goto(`${B}/dashboard`, { waitUntil: 'networkidle2' });
await wait(700);
const specialistNav = await page.evaluate(() => document.querySelector('nav')?.innerText ?? '');
check(!/Audit Log/.test(specialistNav), 'Specialist no longer sees the Audit Log module');
check(!/Users & Roles|Configuration/.test(specialistNav), 'Specialist cannot see administration modules');

// find a resolved complaint and confirm the specialist cannot close it
await page.goto(`${B}/complaints/CMP-0003`, { waitUntil: 'networkidle2' });
await wait(900);
check((await isDisabled('Close complaint')) === true, 'Specialist blocked from closing a resolved complaint (SoD)');
let t = await text();
check(/may investigate and update this case but may not authorise its closure/i.test(t), 'SoD explanation shown to the specialist');

/* ---- 4. Dissatisfaction auto-escalation ---- */
log('\n=== 4. DISSATISFACTION TRIGGERS AUTOMATIC ESCALATION ===');
check(await switchRole('Complaints Supervisor'), 'Switched role to Complaints Supervisor');
await page.goto(`${B}/complaints/CMP-0004`, { waitUntil: 'networkidle2' });
await wait(900);
check(await clickText('Investigation & resolution'), 'Opened the investigation tab');
check(await clickText('Capture customer feedback'), 'Opened the customer feedback dialog');
await selectMui('Feedback rating', 'Very Dissatisfied');
await wait(400);
t = await text();
check(/Dissatisfaction rule will trigger/i.test(t), 'Dissatisfaction warning surfaced before recording');
await typeInto('Customer comment', 'The delay has cost us a tender opportunity and the outcome does not address our complaint.');
check(await clickText('Record feedback'), 'Recorded the negative feedback');
await wait(1400);
t = await text();
check(/Escalated case — supervisor attention required/i.test(t), 'Escalation banner appeared automatically');
check(/Customer dissatisfaction recorded on the resolution outcome/i.test(t), 'Escalation reason recorded as dissatisfaction');
check(/Adele van Wyk/i.test(t), 'Escalated to the Complaints Supervisor');
const escTasks = await page.evaluate(() => (document.body.innerText.match(/Dissatisfaction review/g) ?? []).length);
check(escTasks > 0, 'Escalation task created on the case');

/* ---- 5. Lead duplicate detection ---- */
log('\n=== 5. LEAD DUPLICATE DETECTION ===');
check(await switchRole('BDU Officer'), 'Switched role to BDU Officer');
await page.goto(`${B}/leads/new`, { waitUntil: 'networkidle2' });
await wait(800);
t = await text();
check(/No duplicates detected/i.test(t), 'Duplicate panel starts clean');
await typeInto('Email address', 'grace.mabaso@highveldsteel.demo.africa');
await wait(900);
t = await text();
check(/Possible duplicate leads/i.test(t), 'Duplicate detection fires on a matching email address');
check(/Exact match \(case-insensitive\)/i.test(t), 'Matching rule and its basis are shown');
check(/% match/i.test(t), 'Confidence weight displayed');
check(/Merge/i.test(t) && /Open/i.test(t) && /Continue anyway/i.test(t), 'Review, open, merge and continue options offered');

await typeInto('Contact name', 'Automated Flow Tester');
await typeInto('Company', 'Flow Test Exporters (Pty) Ltd');
await typeInto('Email address', 'flow.tester@flowtestexporters.demo.africa');
await wait(900);
t = await text();
check(/No duplicates detected/i.test(t), 'Duplicate panel clears for a unique email address');

check(!!(await selectMui('Sector', 'Manufacturing')), 'Sector selectable');
check(!!(await selectMui('Product interest', 'Export Credit Insurance (Short-Term)')), 'Product interest selectable');
check(!!(await selectMui('Primary owner', 'Thabo')), 'Primary owner selectable');
await clickText('Save lead');
await wait(700);
t = await text();
check(/backup owner must be recorded/i.test(t), 'Backup owner enforced when a primary owner is set');
check(!!(await selectMui('Backup owner', 'Lerato')), 'Backup owner selectable');
check(await clickText('Save lead'), 'Save lead clicked');
await wait(1600);
t = await text();
const leadRef = t.match(/ECIC-LED-\d{4}-\d{4}/)?.[0];
if (!leadRef) log('  VALIDATION PANEL: ' + (t.match(/Validation status[\s\S]{0,320}/)?.[0].replace(/\n+/g, ' | ') ?? 'n/a'));
check(!!leadRef, 'Lead created with generated reference', leadRef ?? 'none');
check(/Primary owner/i.test(t) && /Backup owner/i.test(t), 'Lead shows both primary and backup owner');

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 4).join('\n') : 'No runtime errors'}`);
log(state.fails === 0 ? '\nFLOW 3-5 PASSED' : `\n${state.fails} CHECK(S) FAILED`);
