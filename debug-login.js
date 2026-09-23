const { chromium } = require('@playwright/test');
const fs = require('fs');
function env(n) {
  const x = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((v) => v.startsWith(n + '='));
  return x ? x.slice(n.length + 1).replace(/^"|"$/g, '') : '';
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('URL after goto', page.url());
  console.log('EMAIL exists?', await page.locator('input[type="email"]').count());
  await page.locator('input[type="email"]').fill(env('INITIAL_ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(env('INITIAL_ADMIN_PASSWORD'));
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await page.waitForTimeout(4000);
  console.log('URL after click', page.url());
  console.log('BODY', (await page.locator('body').innerText()).slice(0, 800));
  await browser.close();
})();
