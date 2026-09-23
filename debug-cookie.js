const { chromium } = require('@playwright/test');
const fs = require('fs');
function env(n) {
  const x = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((v) => v.startsWith(n + '='));
  return x ? x.slice(n.length + 1).replace(/^"|"$/g, '') : '';
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(env('INITIAL_ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(env('INITIAL_ADMIN_PASSWORD'));
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForTimeout(3000);
  console.log('COOKIE AFTER LOGIN:', await page.evaluate(() => document.cookie));
  const me = await page.evaluate(async () => {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    return { status: r.status, text: await r.text() };
  });
  console.log('ME AFTER LOGIN:', me);
  await browser.close();
})();
