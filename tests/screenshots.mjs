import { B, wait, makePage } from './helpers.mjs';
const OUT = process.argv[2];
const { browser, page } = await makePage();
const shots = [
  ['dashboard', '/dashboard', 1600, 1000],
  ['complaints', '/complaints', 1600, 1000],
  ['complaint-detail', '/complaints/CMP-0001', 1600, 1000],
  ['leads', '/leads', 1600, 1000],
  ['opportunities', '/opportunities', 1600, 1000],
  ['qr-capture', '/qr-capture', 1600, 1000],
  ['qr-phone', '/qr-capture', 390, 844],
  ['security', '/security', 1600, 1000],
  ['bid-demo', '/bid-demo', 1600, 1000],
  ['coverage', '/coverage', 1600, 1000],
  ['portal', '/portal', 1600, 1000],
  ['report', '/reports/RPT-C1', 1600, 1000],
];
for (const [name, route, w, h] of shots) {
  await page.setViewport({ width: w, height: h });
  await page.goto(`${B}${route}`, { waitUntil: 'networkidle2' });
  await wait(1400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}
await browser.close();
process.exit(0);
