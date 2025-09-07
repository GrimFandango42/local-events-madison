const { chromium } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3010';
  const url = `${baseURL}/admin/health`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', req => logs.push({ type: 'requestfailed', text: `${req.method()} ${req.url()} -> ${req.failure()?.errorText}` }));

  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (!res || !res.ok()) {
      console.error('Navigation failed', res && res.status());
    }

    // Wait for heading or loading text
    await page.waitForSelector('h1:text("System Health"), text=Loading health.', { timeout: 15000 });

    // Wait for content after loading
    await page.waitForSelector('text=Server', { timeout: 15000 });

    const title = await page.textContent('h1');
    console.log('Title:', title?.trim());

    const health = await page.evaluate(async () => {
      const r = await fetch('/api/health');
      return r.json();
    });
    console.log('Health JSON ok:', !!health?.ok, 'prisma:', health?.prisma);

    await page.screenshot({ path: 'tests/outputs/health-page.png', fullPage: true });

    if (logs.length) {
      console.log('Browser logs:', JSON.stringify(logs, null, 2));
    } else {
      console.log('No browser console errors.');
    }
  } catch (e) {
    console.error('E2E error:', e && e.message || e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();