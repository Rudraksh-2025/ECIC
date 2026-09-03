import { B, wait, makePage, makeCheck } from './helpers.mjs';
const { browser, page, errors } = await makePage();
const { check, state } = makeCheck();

const viewports = [
  { name: 'Desktop  1600x1000', w: 1600, h: 1000, expectSidebar: true, expectBottomNav: false },
  { name: 'Laptop   1280x800 ', w: 1280, h: 800, expectSidebar: true, expectBottomNav: false },
  { name: 'Tablet   900x1200 ', w: 900, h: 1200, expectSidebar: false, expectBottomNav: false },
  { name: 'Phone    390x844  ', w: 390, h: 844, expectSidebar: false, expectBottomNav: true },
];

for (const v of viewports) {
  await page.setViewport({ width: v.w, height: v.h });
  await page.goto(`${B}/complaints`, { waitUntil: 'networkidle2' });
  await wait(900);
  const r = await page.evaluate(() => ({
    sidebar: !!document.querySelector('nav[aria-label="Primary navigation"]'),
    hamburger: !!document.querySelector('button[aria-label="Open navigation"]'),
    bottomNav: !!document.querySelector('.MuiBottomNavigation-root'),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  check(r.sidebar === v.expectSidebar, `${v.name} — sidebar ${v.expectSidebar ? 'present' : 'collapsed'}`);
  check(r.bottomNav === v.expectBottomNav, `${v.name} — bottom navigation ${v.expectBottomNav ? 'present' : 'hidden'}`);
  if (!v.expectSidebar) check(r.hamburger, `${v.name} — collapsible navigation available via the menu button`);
  check(!r.overflowX, `${v.name} — no horizontal page overflow`, r.overflowX ? `${r.scrollW}px > ${r.clientW}px` : '');
}

// QR capture must look right on a phone
await page.setViewport({ width: 390, height: 844 });
await page.goto(`${B}/qr-capture`, { waitUntil: 'networkidle2' });
await wait(900);
const qr = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  hasFrame: document.body.innerText.includes('ECIC Lead Capture'),
}));
check(qr.hasFrame, 'Phone 390x844   — QR capture renders the mobile experience');
check(!qr.overflowX, 'Phone 390x844   — QR capture has no horizontal overflow');

// Portal on a phone
await page.goto(`${B}/portal`, { waitUntil: 'networkidle2' });
await wait(900);
const portal = await page.evaluate(() => ({
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  bottomNav: !!document.querySelector('.MuiBottomNavigation-root'),
}));
check(portal.bottomNav, 'Phone 390x844   — portal shows bottom navigation');
check(!portal.overflowX, 'Phone 390x844   — portal has no horizontal overflow');

// Application form stacks on a phone
await page.goto(`${B}/applications/APP-0005`, { waitUntil: 'networkidle2' });
await wait(900);
const app = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
check(!app, 'Phone 390x844   — digital application form fits the viewport');

await browser.close();
console.log(`\n${errors.length ? `RUNTIME ERRORS: ${errors.length}` : 'No runtime errors'}`);
console.log(state.fails === 0 ? '\nRESPONSIVE CHECKS PASSED' : `\n${state.fails} CHECK(S) FAILED`);
