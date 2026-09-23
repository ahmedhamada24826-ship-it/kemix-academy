const { chromium } = require('@playwright/test');
const fs = require('fs');
function env(n) { const x = fs.readFileSync('.env','utf8').split(/\r?\n/).find(v=>v.startsWith(n+'=')); return x ? x.slice(n.length+1).replace(/^"|"$/g,'') : ''; }
(async()=>{
  const b = await chromium.launch({headless:true});
  const page = await b.newPage();
  const courseId = 'f6b535af-afb8-4086-9e17-30c3e2d59c98';
  page.on('request', req => {
    if (req.url().includes('/api/')) console.log('REQUEST', req.method(), req.url());
  });
  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      try { const text = await res.text(); console.log('RESPONSE', res.status(), res.url(), text.slice(0,200)); }
      catch (e) { console.log('RESPONSE', res.status(), res.url(), '<body read failed>'); }
    }
  });
  await page.goto('http://localhost:3000/login', { waitUntil:'domcontentloaded'});
  await page.locator('input[type="email"]').fill(env('INITIAL_ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(env('INITIAL_ADMIN_PASSWORD'));
  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole('button', { name: 'تسجيل الدخول' }).click(),
  ]);
  console.log('LOGGED IN');
  console.log('START NAV');
  await page.goto(`http://localhost:3000/admin/courses/${courseId}`, { waitUntil:'domcontentloaded'});
  await page.waitForTimeout(15000);
  console.log('AFTER WAIT URL', page.url());
  console.log('BODY', (await page.locator('body').innerText()).slice(0,1000));
  await b.close();
})();
