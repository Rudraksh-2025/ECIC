import { B, wait, makePage, makeApi, makeCheck } from './helpers.mjs';

const { browser, page, errors } = await makePage();
const { text, clickText, selectMui, typeInto, switchRole } = makeApi(page);
const { check, state } = makeCheck();
const log = console.log;
let t;

/* ---- 12. Reporting: standard reports, builder, export ---- */
log('\n=== 12. REPORTING, REPORT BUILDER & EXPORT ===');
await page.goto(`${B}/reports`, { waitUntil: 'networkidle2' });
await wait(900);
t = await text();
check(/Complaint reports/i.test(t) && /Audit reports/i.test(t), 'Report categories rendered');
check((t.match(/report/gi) ?? []).length > 10, 'Report catalogue populated');

await page.goto(`${B}/reports/RPT-C1`, { waitUntil: 'networkidle2' });
await wait(1100);
t = await text();
check(/Complaint SLA Performance/i.test(t), 'Opened the Complaint SLA Performance report');
check(/Generated \d/i.test(t), 'Report carries a generation timestamp');
check(/SLA met|SLA breached/i.test(t), 'Report KPIs computed');
check(/Grouped by/i.test(t), 'Grouping applied');

// change grouping live
const grouped = await selectMui('Group by', 'Business unit');
check(!!grouped, 'Grouping changed by the user', grouped || '');
await wait(700);
t = await text();
check(/Grouped by Business unit/i.test(t), 'Report regrouped without a page reload');

// export
await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/ecic-dl' }).catch(() => {});
check(await clickText('Export Excel'), 'Triggered the Excel export');
await wait(1200);
t = await text();
check(/Report exported/i.test(t), 'Export confirmed to the user');

// report builder
await page.goto(`${B}/reports`, { waitUntil: 'networkidle2' });
await wait(800);
check(await clickText('Customise report'), 'Opened the no-code report builder');
await wait(600);
await typeInto('Report name', 'Complaints by business unit — flow test');
await selectMui('Data set', 'Complaints');
await wait(400);
await selectMui('Group by', 'Business unit');
check(await clickText('Save and run report'), 'Saved and ran the custom report');
await wait(1600);
t = await text();
check(/Complaints by business unit/i.test(t), 'Custom report opened');
check(/User-defined report|Report data/i.test(t), 'Custom report renders data');

/* ---- 13. Document security: scan, block, automatic linking ---- */
log('\n=== 13. DOCUMENT SECURITY & AUTOMATIC LINKING ===');
await page.goto(`${B}/complaints/CMP-0005`, { waitUntil: 'networkidle2' });
await wait(900);
check(await clickText('Documents ('), 'Opened the documents tab on the case');
await wait(400);
check(await clickText('Upload document'), 'Opened the upload dialog');
await wait(600);
t = await text();
check(/Permitted file types/i.test(t), 'Upload rules stated from configuration');
await selectMui('Select a file', 'buyer_statement_final.pdf.exe');
check(await clickText('Upload'), 'Uploaded the malicious sample');
await wait(3000);
t = await text();
check(/Upload rejected/i.test(t), 'Malicious file rejected');
check(/double extension/i.test(t), 'Rejection reason explains the rule breached');
check(/quarantined/i.test(t), 'File quarantined rather than stored');
check(await clickText('Done'), 'Closed the upload dialog');

await wait(400);
check(await clickText('Upload document'), 'Reopened the upload dialog');
await wait(600);
await selectMui('Select a file', 'Audited_Annual_Financial_Statements');
check(await clickText('Upload'), 'Uploaded a permitted file');
await wait(3200);
t = await text();
check(/Uploaded, scanned and linked/i.test(t), 'Clean file scanned and stored');
check(await clickText('Done'), 'Closed the dialog');
await wait(900);
t = await text();
check(/Audited_Annual_Financial_Statements/i.test(t), 'Document appears against the case automatically');

/* ---- 14. Customer portal submission with CAPTCHA ---- */
log('\n=== 14. CUSTOMER PORTAL SUBMISSION & CAPTCHA ===');
await page.goto(`${B}/portal/cases/new`, { waitUntil: 'networkidle2' });
await wait(900);
t = await text();
check(/I am not a robot/i.test(t), 'CAPTCHA verification present on the public form');
check(/DEMO \/ SIMULATED CAPTCHA/i.test(t), 'CAPTCHA honestly labelled as simulated');
await typeInto('What is your complaint about?', 'Portal flow test — premium invoice raised twice');
await typeInto('Describe what happened', 'We received two invoices for the same quarterly premium and both were debited by our bank on the same day.');
await selectMui('Which area does this relate to?', 'Premium & Billing');
check(await clickText('Submit complaint'), 'Attempted submission without verification');
await wait(700);
t = await text();
check(/could not be submitted|verification check|consent/i.test(t), 'Submission blocked pending CAPTCHA and consent');

const boxes = await page.evaluate(() => {
  const cbs = [...document.querySelectorAll('input[type=checkbox]')];
  cbs.forEach((c) => { if (!c.checked) c.click(); });
  return cbs.length;
});
check(boxes >= 2, 'Completed the verification and consent checks', `${boxes} checkbox(es)`);
await wait(400);
check(await clickText('Submit complaint'), 'Submitted the complaint');
await wait(1600);
t = await text();
check(/Your complaint has been received/i.test(t), 'Portal confirmation screen shown');
const portalRef = t.match(/ECIC-CMP-\d{4}-\d{4}/)?.[0];
check(!!portalRef, 'Portal complaint issued a case reference', portalRef ?? 'none');
check(/Target resolution date/i.test(t), 'Target resolution date communicated to the customer');

/* ---- 15. Audit trail of this session ---- */
log('\n=== 15. AUDIT TRAIL ===');
check(await switchRole('Complaints Supervisor'), 'Acting as Complaints Supervisor');
await page.goto(`${B}/audit`, { waitUntil: 'networkidle2' });
await wait(1100);
t = await text();
check(/READ-ONLY REGISTER/i.test(t), 'Audit register marked read-only');
const noEdit = await page.evaluate(() => ![...document.querySelectorAll('button')]
  .some((b) => /^(edit|delete|remove)$/i.test(b.innerText.trim())));
check(noEdit, 'No edit or delete action exists in the audit interface');
if (portalRef) {
  await typeInto('Search action, entity, reference, user or value…', portalRef);
  await wait(900);
  t = await text();
  check(new RegExp(portalRef).test(t), 'This session’s portal complaint is traceable in the audit log');
  check(/Complaint created/i.test(t), 'Creation event recorded with before and after values');
}

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 4).join('\n') : 'No runtime errors'}`);
log(state.fails === 0 ? '\nFLOW 12-15 PASSED' : `\n${state.fails} CHECK(S) FAILED`);
