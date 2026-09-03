import puppeteer from 'puppeteer-core';

export const B = 'http://localhost:5173';
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function makePage() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
  return { browser, page, errors };
}

export function makeApi(page) {
  const text = () => page.evaluate(() => document.body.innerText);
  const clickText = async (label, tag = 'button') => {
    const handle = await page.evaluateHandle((l, t) => {
      const els = [...document.querySelectorAll(t)].filter((e) => !e.disabled);
      const target = l.toLowerCase();
      // Prefer an exact label match, and prefer controls inside an open dialog.
      const inDialog = (e) => !!e.closest('.MuiDialog-root');
      const exact = els.filter((e) => e.innerText.trim().toLowerCase() === target);
      const partial = els.filter((e) => e.innerText.trim().toLowerCase().includes(target));
      const pick = (list) => list.find(inDialog) ?? list[0];
      return pick(exact) ?? pick(partial) ?? null;
    }, label, tag);
    const el = handle.asElement();
    if (!el) return false;
    await el.click();
    await wait(450);
    return true;
  };
  const isDisabled = (label) => page.evaluate((l) => {
    const el = [...document.querySelectorAll('button')].find((e) => e.innerText.trim().toLowerCase().includes(l.toLowerCase()));
    return el ? el.disabled : null;
  }, label);
  const selectMui = async (labelText, optionText) => {
    const handle = await page.evaluateHandle((lt) => {
      const labels = [...document.querySelectorAll('.MuiFormLabel-root')].reverse();
      const lab = labels.find((l) => l.textContent.replace('*', '').trim().toLowerCase() === lt.toLowerCase());
      const root = lab?.closest('.MuiFormControl-root');
      return root?.querySelector('[role="combobox"], .MuiSelect-select') ?? null;
    }, labelText);
    const el = handle.asElement();
    if (!el) return false;
    await el.click();
    await wait(400);
    const optHandle = await page.evaluateHandle((ot) => {
      const opts = [...document.querySelectorAll('li[role="option"]')];
      return opts.find((x) => x.innerText.trim().toLowerCase().includes(ot.toLowerCase())) ?? null;
    }, optionText);
    const opt = optHandle.asElement();
    if (!opt) { await page.keyboard.press('Escape'); await wait(300); return null; }
    const picked = await opt.evaluate((e) => e.innerText.trim());
    await opt.click();
    // Wait for the menu to close so subsequent clicks are not intercepted by the backdrop.
    for (let i = 0; i < 20; i += 1) {
      const open = await page.evaluate(() => !!document.querySelector('.MuiPopover-root'));
      if (!open) break;
      await wait(100);
    }
    await wait(150);
    return picked;
  };
  const typeInto = async (labelText, value) => {
    const handle = await page.evaluateHandle((lt) => {
      const labels = [...document.querySelectorAll('.MuiFormLabel-root')].reverse();
      const lab = labels.find((l) => l.textContent.replace('*', '').trim().toLowerCase() === lt.toLowerCase());
      const root = lab?.closest('.MuiFormControl-root');
      if (!root) return null;
      return root.querySelector('textarea:not([aria-hidden="true"]):not([readonly])')
        ?? root.querySelector('input:not([type=hidden])') ?? null;
    }, labelText);
    const el = handle.asElement();
    if (!el) return false;
    await el.click();
    await wait(80);
    const len = await el.evaluate((e) => { e.setSelectionRange(0, e.value.length); return e.value.length; });
    if (len > 0) await page.keyboard.press('Backspace');
    await wait(80);
    await page.keyboard.type(value, { delay: 1 });
    await wait(220);
    return true;
  };
  /** Switch the demonstration role through the Users & Roles screen. */
  const switchRole = async (roleName) => {
    await page.goto(`${B}/users`, { waitUntil: 'networkidle2' });
    await wait(800);
    const handle = await page.evaluateHandle((rn) => {
      const target = `act as ${rn}`.toLowerCase();
      return [...document.querySelectorAll('button')]
        .find((b) => b.innerText.trim().toLowerCase() === target) ?? null;
    }, roleName);
    const el = handle.asElement();
    if (!el) {
      const already = await page.evaluate((rn) => document.body.innerText.includes(rn), roleName);
      return already ? 'already' : false;
    }
    await el.click();
    await wait(900);
    const active = await page.evaluate(() => document.body.innerText.match(/Acting as: ([^\n]+)/)?.[1]?.trim() ?? '');
    return active === roleName;
  };

  return { text, clickText, isDisabled, selectMui, typeInto, switchRole };
}

export function makeCheck() {
  const state = { fails: 0 };
  const check = (ok, label, extra = '') => {
    if (!ok) state.fails += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? ` — ${extra}` : ''}`);
  };
  return { check, state };
}
