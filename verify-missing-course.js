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
  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole('button', { name: 'تسجيل الدخول' }).click(),
  ]);

  await page.goto('http://localhost:3000/admin/courses/definitely-missing-course', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const text = await page.locator('body').innerText();
  console.log('HAS_NOT_FOUND_TEXT:', /الكورس غير موجود/i.test(text));
  console.log('SKELETON_VISIBLE:', /جاري/i.test(text) && /الكورس/i.test(text));
  console.log('SNIPPET:', text.slice(0, 500));

  await browser.close();
})();
