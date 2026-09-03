import { B, wait, makePage, makeApi, makeCheck } from './helpers.mjs';

const { browser, page, errors } = await makePage();
const { text, clickText, isDisabled, selectMui, typeInto, switchRole } = makeApi(page);
const { check, state } = makeCheck();
const log = console.log;
let t;

/* ---- 6. Desktop analysis and lead-to-opportunity conversion ---- */
log('\n=== 6. DESKTOP ANALYSIS & LEAD-TO-OPPORTUNITY CONVERSION ===');
check(await switchRole('BDU Officer'), 'Acting as BDU Officer');
await page.goto(`${B}/leads/LED-0011`, { waitUntil: 'networkidle2' }); // Assigned, no analysis
await wait(900);
t = await text();
check(/Assigned/.test(t), 'Opened an assigned lead');
check((await isDisabled('Convert to opportunity')) === true, 'Conversion blocked before qualification');

check(await clickText('Desktop analysis'), 'Opened the desktop analysis form');
await wait(600);
t = await text();
check(/Qualification criteria/i.test(t) && /Risk assessment/i.test(t), 'Configured analysis sections rendered');
check(/maintained in Configuration/i.test(t), 'Analysis fields stated as configuration');
await selectMui('Buyer credit rating', 'BBB');
await selectMui('Country risk category', '3');
await selectMui('Decision', 'Proceed');
await typeInto('Analyst notes', 'Desktop analysis supports progression: buyer country within limits, exporter has a demonstrable track record and local content is met.');
check(await clickText('Save analysis'), 'Saved the desktop analysis');
await wait(1300);
t = await text();
check(/Qualified/.test(t), 'Lead moved to Qualified');
check(/Analysis decision: Proceed/i.test(t) || /Proceed/.test(t), 'Analysis decision recorded');

check((await isDisabled('Convert to opportunity')) === false, 'Conversion enabled once qualified');
check(await clickText('Convert to opportunity'), 'Opened the conversion wizard');
await wait(600);
t = await text();
check(/Nothing is re-keyed/i.test(t), 'Wizard states what carries across');
check(/Campaign attribution/i.test(t) && /Originating lead/i.test(t), 'Campaign attribution and originating lead carried across');
check(await clickText('Continue'), 'Advanced to opportunity details');
await wait(400);
check(await clickText('Continue'), 'Advanced to products');
await wait(400);
t = await text();
check(/Total product value/i.test(t), 'Product lines shown with a rolled-up value');
check(await clickText('Add product line'), 'Multi-product opportunity supported');
await wait(300);
check(await clickText('Continue'), 'Advanced to confirmation');
await wait(400);
check(await clickText('Convert lead'), 'Executed the conversion');
await wait(1600);
t = await text();
const oppRef = t.match(/ECIC-OPP-\d{4}-\d{4}/)?.[0];
check(!!oppRef, 'Opportunity created with generated reference', oppRef ?? 'none');
check(/Originating lead/i.test(t), 'Originating lead relationship retained on the opportunity');
const oppUrl = page.url();

/* ---- 7. Opportunity pipeline, stage timing and closed-lost control ---- */
log('\n=== 7. OPPORTUNITY PIPELINE & CLOSED-LOST CONTROL ===');
check(await clickText('Stage timing'), 'Opened the stage timing tab');
await wait(400);
t = await text();
check(/Current stage|portfolio average/i.test(t), 'Time in stage measured against the portfolio average');

check(await clickText('Move to Proposal'), 'Moved the opportunity to the next stage');
await wait(500);
check(await clickText('Move opportunity'), 'Confirmed the stage move');
await wait(1200);
t = await text();
check(/Proposal \/ Solution/.test(t), 'Stage advanced to Proposal / Solution');
check(/Best Case/i.test(t), 'Forecast category recalculated');

check(await clickText('Close lost'), 'Opened the closed-lost dialog');
await wait(500);
check(await clickText('Close as lost'), 'Attempted to close without a reason');
await wait(400);
t = await text();
check(/closed-lost reason is mandatory/i.test(t), 'Closed-lost reason is mandatory');
await selectMui('Closed-lost reason', 'Competitor');
await typeInto('Supporting detail', 'The exporter placed the cover with a private credit insurer offering a lower premium rate.');
check(await clickText('Close as lost'), 'Closed the opportunity as lost with a reason');
await wait(1400);
t = await text();
check(/Closed lost/i.test(t), 'Opportunity closed lost');
check(/read-only|protected from amendment/i.test(t), 'Closed opportunity is protected from amendment');
const editableAfterClose = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.innerText.includes('Move to')));
check(!editableAfterClose, 'Stage actions removed on a closed opportunity');

/* ---- 8. Underwriting handover and segregation ---- */
log('\n=== 8. UNDERWRITING HANDOVER & SEGREGATION ===');
await page.goto(`${B}/opportunities/OPP-0011`, { waitUntil: 'networkidle2' });
await wait(900);
check(await clickText('Hand over to underwriting'), 'BDU can hand over to underwriting');
await wait(500);
await selectMui('Underwriting unit', 'Medium/Long-Term');
await selectMui('Assign to underwriter', 'Fatima');
check(await clickText('Hand over'), 'Handover executed');
await wait(1300);
t = await text();
check(/In Underwriting Queue/i.test(t), 'Opportunity moved into the underwriting queue');
check((await isDisabled('Update underwriting status')) === true, 'BDU Officer cannot update the underwriting status (SoD)');

check(await switchRole('Underwriting User'), 'Acting as Underwriting User');
await page.goto(`${B}/opportunities/OPP-0011`, { waitUntil: 'networkidle2' });
await wait(900);
check((await isDisabled('Update underwriting status')) === false, 'Underwriting User may update the status');
check(await clickText('Update underwriting status'), 'Opened the underwriting status dialog');
await wait(500);
await selectMui('Underwriting status', 'Under Review');
await typeInto('Note to the Business Development Unit', 'Accepted into review. Buyer credit assessment under way; no further information required at this stage.');
check(await clickText('Update status'), 'Underwriting status updated');
await wait(1200);
t = await text();
check(/Under Review/i.test(t), 'Status change visible to the Business Development Unit');

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 4).join('\n') : 'No runtime errors'}`);
log(state.fails === 0 ? '\nFLOW 6-8 PASSED' : `\n${state.fails} CHECK(S) FAILED`);
