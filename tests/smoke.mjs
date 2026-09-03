import puppeteer from 'puppeteer-core';

const ROUTES = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
let failures = 0;

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!t.includes('favicon') && !t.includes('Download the React DevTools')) errors.push(`CONSOLE: ${t}`);
    }
  });
  try {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise((r) => setTimeout(r, 900));
    const text = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\s+/g, ' ').trim());
    const len = await page.evaluate(() => document.body.innerText.length);
    const status = errors.length ? 'FAIL' : len > 200 ? 'OK  ' : 'THIN';
    if (errors.length || len <= 200) failures += 1;
    console.log(`${status} ${route.padEnd(28)} ${len} chars | ${text.slice(0, 78)}`);
    errors.slice(0, 3).forEach((e) => console.log(`      ${e.slice(0, 260)}`));
  } catch (e) {
    failures += 1;
    console.log(`FAIL ${route.padEnd(28)} navigation error: ${e.message.slice(0, 160)}`);
  }
  await page.close();
}
await browser.close();
console.log(failures === 0 ? '\nALL ROUTES CLEAN' : `\n${failures} ROUTE(S) NEED ATTENTION`);
