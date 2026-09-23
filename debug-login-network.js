const { chromium } = require('@playwright/test');
const fs = require('fs');
function env(n) { const x = fs.readFileSync('.env','utf8').split(/\r?\n/).find(v=>v.startsWith(n+'=')); return x ? x.slice(n.length + 1).replace(/^"|"$/g,'') : ''; }
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('response', async res => {
    if (res.url().includes('/api/auth/')) {
      console.log('RESP', res.url(), res.status(), res.headers()['set-cookie'] || 'NO_SET_COOKIE');
    }
  });
  page.on('request', req => {
    if (req.url().includes('/api/auth/')) {
      console.log('REQ', req.method(), req.url(), req.headers.cookie || 'NO_COOKIE', req.headers.origin || 'NO_ORIGIN');
    }
  });
  await page.goto('http://localhost:3000/login', { waitUntil:'domcontentloaded' });
  await page.locator('input[type="email"]').fill(env('INITIAL_ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(env('INITIAL_ADMIN_PASSWORD'));
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForTimeout(5000);
  console.log('FINAL URL', page.url());
  console.log('ALL COOKIES', await page.context().cookies());
  await browser.close();
})();
