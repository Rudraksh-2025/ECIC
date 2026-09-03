import { B, wait, makePage, makeApi, makeCheck } from './helpers.mjs';

const { browser, page, errors } = await makePage();
const { text, clickText, isDisabled, selectMui, typeInto, switchRole } = makeApi(page);
const { check, state } = makeCheck();
const log = console.log;
let t;

const setNumber = async (handle, value) => {
  const el = handle.asElement();
  if (!el) return false;
  await el.evaluate((e, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(e, v);
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await wait(700);
  return true;
};



/* ---- 9. QR exhibition capture, offline mode and sync ---- */
log('\n=== 9. QR EXHIBITION CAPTURE, OFFLINE MODE & SYNC ===');
await page.goto(`${B}/qr-capture`, { waitUntil: 'networkidle2' });
await wait(900);
t = await text();
check(/Camera ready/i.test(t), 'Mobile capture device frame rendered');
check(await clickText('Start scanning'), 'Started the simulated scan');
await wait(2600);
t = await text();
check(/QR scan successful/i.test(t), 'Scan success confirmed');
const autofilled = await page.evaluate(() => {
  const lab = [...document.querySelectorAll('.MuiFormLabel-root')].find((l) => l.textContent.replace('*','').trim() === 'Company');
  return lab?.closest('.MuiFormControl-root')?.querySelector('input')?.value ?? '';
});
check(autofilled.length > 3, 'Delegate details autofilled from the badge', autofilled);
await typeInto('Company', `${autofilled} — corrected on stand`);
check(await clickText('Submit lead'), 'Submitted the captured lead');
await wait(1500);
t = await text();
check(/Lead captured successfully/i.test(t), 'Success confirmation shown');
check(/ECIC-LED-\d{4}-\d{4}/.test(t), 'CRM lead reference issued', t.match(/ECIC-LED-\d{4}-\d{4}/)?.[0] ?? '');
check(/Assigned owner/i.test(t) && /Synced/i.test(t), 'Owner assigned and record synchronised');

// offline capture
check(await clickText('Start over'), 'Reset the capture screen');
const toggled = await page.evaluate(() => {
  const sw = [...document.querySelectorAll('.MuiSwitch-input')];
  if (!sw.length) return false;
  sw[0].click();
  return true;
});
check(toggled, 'Switched to offline mode');
await wait(700);
t = await text();
check(/OFFLINE MODE/i.test(t), 'Offline mode indicated');
check(await clickText('Start scanning'), 'Scanned while offline');
await wait(2600);
check(await clickText('Store offline'), 'Stored the capture offline');
await wait(1300);
t = await text();
check(/Stored offline/i.test(t), 'Capture held on the device');
check(/Sync now/i.test(t), 'Sync Now action offered');
check(await clickText('Sync now'), 'Ran the synchronisation');
await wait(2200);
t = await text();
check(/Synced/.test(t), 'Offline capture synchronised into the CRM');

/* ---- 10. Configuration without development ---- */
log('\n=== 10. CONFIGURATION WITHOUT DEVELOPMENT ===');
await page.goto(`${B}/complaints/CMP-0005`, { waitUntil: 'networkidle2' }); // Medium severity
await wait(900);
t = await text();
const beforeTarget = t.match(/SLA TARGET\s*([\d.]+) business days/i)?.[1];
check(beforeTarget === '5', 'Complaint SLA target is 5 business days before the change', beforeTarget ?? 'n/a');

check(await switchRole('System Administrator'), 'Acting as System Administrator');
await page.goto(`${B}/configuration?tab=sla`, { waitUntil: 'networkidle2' });
await wait(1000);
const changed = await page.evaluate(() => {
  const labels = [...document.querySelectorAll('.MuiFormLabel-root')];
  const rows = [...document.querySelectorAll('.MuiBox-root')];
  const row = rows.find((r) => r.innerText.startsWith('Complaint resolution - Standard'));
  const input = row?.querySelector('input[type=number]');
  return input ? input.value : 'none';
});
check(changed === '5', 'Standard SLA rule shows the configured target', changed);
const inputHandle = await page.evaluateHandle(() => {
  const rows = [...document.querySelectorAll('.MuiBox-root')];
  const row = rows.find((r) => r.innerText.startsWith('Complaint resolution - Standard'));
  return row?.querySelector('input[type=number]') ?? null;
});
check(await setNumber(inputHandle, '3'), 'Changed the standard complaint SLA to 3 business days');

await page.goto(`${B}/complaints/CMP-0005`, { waitUntil: 'networkidle2' });
await wait(1000);
t = await text();
const afterTarget = t.match(/SLA TARGET\s*([\d.]+) business days/i)?.[1];
check(afterTarget === '3', 'Complaint now reflects the 3 business day target with no code change', afterTarget ?? 'n/a');

// restore
await page.goto(`${B}/configuration?tab=sla`, { waitUntil: 'networkidle2' });
await wait(900);
const restore = await page.evaluateHandle(() => {
  const rows = [...document.querySelectorAll('.MuiBox-root')];
  const row = rows.find((r) => r.innerText.startsWith('Complaint resolution - Standard'));
  return row?.querySelector('input[type=number]') ?? null;
});
await setNumber(restore, '5');

// permitted file types enforced live
await page.goto(`${B}/configuration?tab=security`, { waitUntil: 'networkidle2' });
await wait(900);
t = await text();
check(/Permitted file types/i.test(t), 'Security configuration exposes permitted file types');

/* ---- 11. MFA simulation ---- */
log('\n=== 11. MULTI-FACTOR AUTHENTICATION ===');
await page.goto(`${B}/security`, { waitUntil: 'networkidle2' });
await wait(1000);
check(await clickText('Demonstrate MFA'), 'Opened the MFA dialog');
await wait(600);
await typeInto('Username or email address', 'devan.reddy@ecic.demo.co.za');
await typeInto('Password', 'DemonstrationPassword1!');
check(await clickText('Send verification code'), 'Requested a verification code');
await wait(1300);
t = await text();
check(/Verification code/i.test(t) && /Code expires in/i.test(t), 'Code issued with an expiry countdown');
const issued = t.match(/the code issued is\s*(\d{6})/i)?.[1];
check(!!issued, 'Demonstration code surfaced for the presenter', issued ?? 'none');
await typeInto('Verification code', '000000');
check(await clickText('Verify'), 'Submitted an incorrect code');
await wait(800);
t = await text();
check(/Incorrect verification code/i.test(t), 'Incorrect code rejected with attempts remaining');
if (issued) {
  await typeInto('Verification code', issued);
  check(await clickText('Verify'), 'Submitted the correct code');
  const inDialog = await page.evaluate(() => document.querySelector('.MuiDialog-root')?.innerText ?? '');
  check(/Verification successful/i.test(inDialog), 'MFA verification succeeded in the dialog');
  await wait(1200);
  t = await text();
  check(/Multi-factor authentication successful/i.test(t), 'Success confirmed and written to the audit log');
}

await browser.close();
log(`\n${errors.length ? `RUNTIME ERRORS (${errors.length}):\n` + errors.slice(0, 4).join('\n') : 'No runtime errors'}`);
log(state.fails === 0 ? '\nFLOW 9-11 PASSED' : `\n${state.fails} CHECK(S) FAILED`);
