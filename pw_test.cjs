const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.url()} :: ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.url().includes('SuperAdminDashboard') && res.status() >= 400) {
      failedRequests.push(`HTTP ${res.status()} ${res.url()}`);
    }
  });

  console.log('--- Test 1: /kaa/super-admin (unauthenticated, should gate to 404/login) ---');
  await page.goto('http://localhost:8080/kaa/super-admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Final URL:', page.url());
  console.log('Console errors:', consoleErrors.length);
  consoleErrors.forEach((e) => console.log('  ERR:', e));
  console.log('Failed requests:', failedRequests.length);
  failedRequests.forEach((e) => console.log('  FAIL:', e));

  // Now test the legacy /super-admin redirect chain (does it hit 404 route or loop?)
  console.log('\n--- Test 2: /super-admin (legacy redirect should -> /kaa/super-admin) ---');
  const resp = await page.goto('http://localhost:8080/super-admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('Final URL:', page.url());
  console.log('Status:', resp && resp.status());
  console.log('Console errors so far:', consoleErrors.length);
  consoleErrors.slice(consoleErrors.length - 5).forEach((e) => console.log('  ERR:', e));

  // Verify the module itself is fetchable (the thing the error complains about)
  console.log('\n--- Test 3: direct module fetch /src/pages/SuperAdminDashboard.tsx ---');
  const modResp = await page.goto('http://localhost:8080/src/pages/SuperAdminDashboard.tsx', { waitUntil: 'domcontentloaded' });
  console.log('Module status:', modResp && modResp.status(), '| content-type:', modResp && modResp.headers()['content-type']);

  await browser.close();
  console.log('\nDONE');
})();
