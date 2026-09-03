import { B, wait, makePage, makeApi, makeCheck } from './helpers.mjs';

const { browser, page, errors } = await makePage();
const { text, clickText, typeInto, selectMui } = makeApi(page);
const { check, state } = makeCheck();
const log = console.log;
let t;

/* ---- 16. localStorage persistence ---- */
log('\n=== 16. LOCAL PERSISTENCE ACROSS REFRESH ===');
await page.goto(`${B}/complaints/new`, { waitUntil: 'networkidle2' });
await wait(800);
await selectMui('Customer', 'Kalahari');
await clickText('Continue');
await typeInto('Complaint subject', 'Persistence check — premium allocation query');
await typeInto('Complaint description', 'Testing that a record created in this browser session survives a full page refresh via local storage persistence.');
await clickText('Continue');
await selectMui('Business unit', 'Finance');
await selectMui('Source / channel', 'Email');
await selectMui('Category', 'Premium & Billing');
await selectMui('Sub-category', 'Payment allocation');
await clickText('Continue');
await clickText('Continue');
await clickText('Save complaint');
await wait(1500);
t = await text();
const ref = t.match(/ECIC-CMP-\d{4}-\d{4}/)?.[0];
check(!!ref, 'Complaint created before refresh', ref ?? 'none');

await page.reload({ waitUntil: 'networkidle2' });
await wait(1200);
t = await text();
check(new RegExp(ref ?? 'xxx').test(t), 'Record survives a full browser refresh (localStorage)');

await page.goto(`${B}/complaints`, { waitUntil: 'networkidle2' });
await wait(1000);
await page.evaluate(() => {
  const input = document.querySelector('input[placeholder^="Search reference"]');
  if (input) input.focus();
});
await page.keyboard.type('Persistence check', { delay: 2 });
await wait(900);
t = await text();
check(/Persistence check/i.test(t), 'Record found in the complaints list after refresh');

const stored = await page.evaluate(() => {
  const raw = localStorage.getItem('ecic-crm-demo-v1');
  return raw ? Math.round(raw.length / 1024) : 0;
});
check(stored > 50, 'Demo state persisted to localStorage', `${stored} KB`);

/* ---- 17. Bid demo mode ---- */
log('\n=== 17. BID DEMO MODE ===');
await page.goto(`${B}/bid-demo`, { waitUntil: 'networkidle2' });
await wait(1000);
t = await text();
check(/STEP 1 OF 18/i.test(t), 'Guided sequence starts at step 1 of 18');
check(/Presenter talking points/i.test(t), 'Talking points provided');
check(/Annexure C requirements demonstrated/i.test(t), 'Requirement evidence listed per step');
check(/Expected outcome/i.test(t), 'Expected outcome stated');
check(/Implementation Approach\s*40/i.test(t.replace(/\n/g, ' ')), 'Phase Four areas and points shown');
check(/demo coverage checklist, not a score/i.test(t), 'Coverage honestly labelled as a checklist, not a score');
check(await clickText('Next step'), 'Advanced to the next demo step');
await wait(600);
t = await text();
check(/STEP 2 OF 18/i.test(t), 'Sequence advanced');
check(await clickText('Open this step'), 'Opened the screen for the step');
await wait(1200);
check(page.url().includes('/complaints'), 'Navigated to the step target screen', page.url().replace(B, ''));
await page.goto(`${B}/bid-demo`, { waitUntil: 'networkidle2' });
await wait(900);
t = await text();
check(/1 \/ 18|1 of 18|Presenter progress/i.test(t), 'Presenter progress recorded');

/* ---- 18. Requirement coverage matrix ---- */
log('\n=== 18. REQUIREMENT COVERAGE MATRIX ===');
await page.goto(`${B}/coverage?req=57`, { waitUntil: 'networkidle2' });
await wait(1000);
t = await text();
check(/Requirement 57/i.test(t), 'Deep link opens the requested requirement');
check(/Synchronise captured leads into the CRM/i.test(t), 'Requirement text shown');
check(/Demonstration evidence/i.test(t), 'Evidence stated for the requirement');
check(await clickText('Open the demo screen'), 'Jumped to the demonstrating screen');
await wait(1200);
check(page.url().includes('/qr-capture'), 'Navigated to the correct demo screen', page.url().replace(B, ''));

await page.goto(`${B}/coverage`, { waitUntil: 'networkidle2' });
await wait(1000);
const reqCount = await page.evaluate(() => document.body.innerText.match(/total requirements\s*(\d+)/i)?.[1]);
check(reqCount === '101', 'All 101 Annexure C requirements present', reqCount ?? 'n/a');

/* ---- 19. Chatbot and escalation ---- */
log('\n=== 19. CHATBOT & LIVE AGENT ESCALATION ===');
await page.goto(`${B}/portal/chat`, { waitUntil: 'networkidle2' });
await wait(1000);
const askedFaq = await page.evaluate(() => {
  const chip = [...document.querySelectorAll('.MuiChip-root')].find((c) => c.innerText.includes('What documents are required'));
  if (chip) { chip.click(); return true; }
  return false;
});
check(askedFaq, 'Asked the chatbot a supported question');
await wait(1800);
t = await text();
check(/audited annual financial statements/i.test(t), 'Chatbot answered from the FAQ knowledge base');

await typeInto('Type your question…', 'This is urgent, I need to speak to someone about a claim dispute');
await page.keyboard.press('Enter');
await wait(2200);
t = await text();
check(/time-sensitive|Escalate to agent/i.test(t), 'Urgent question offers escalation');
check(await clickText('Escalate to agent'), 'Escalated to a live agent');
await wait(2600);
t = await text();
check(/Bot → Triage → Human Agent|Conversation escalated/i.test(t), 'Routing indicator shown');
check(/Client Services|ECIC Agent|Nomsa/i.test(t), 'Human agent joined the conversation');
check(await clickText('Create case from chat'), 'Created a case from the conversation');
await wait(1800);
t = await text();
check(/Case ECIC-CMP-\d{4}-\d{4} created/i.test(t) || /created from this conversation/i.test(t), 'Case raised from the chat transcript');

/* ---- 20. Reset demo environment ---- */
log('\n=== 20. RESET DEMO ENVIRONMENT ===');
await page.goto(`${B}/configuration`, { waitUntil: 'networkidle2' });
await wait(1000);
check(await clickText('Reset demo environment'), 'Opened the reset confirmation');
await wait(500);
t = await text();
check(/restores the original seed data/i.test(t), 'Reset explains exactly what it clears');
check(await clickText('Reset everything'), 'Confirmed the reset');
await wait(2500);
await page.goto(`${B}/complaints`, { waitUntil: 'networkidle2' });
await wait(1200);
t = await text();
check(!new RegExp(ref ?? 'xxx').test(t), 'Session-created records cleared by the reset');
check(/Complaints \/ Case Management/i.test(t), 'Application still functional after reset');

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 4).join('\n') : 'No runtime errors'}`);
log(state.fails === 0 ? '\nFLOW 16-20 PASSED' : `\n${state.fails} CHECK(S) FAILED`);
