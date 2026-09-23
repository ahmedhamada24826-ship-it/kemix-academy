const { chromium } = require('@playwright/test');
const fs = require('fs');
function env(n) {
  const x = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((v) => v.startsWith(n + '='));
  return x ? x.slice(n.length + 1).replace(/^"|"$/g, '') : '';
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const r = await page.evaluate(async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmed159999923@gmail.com', password: 'A7med@hamada2-48', rememberMe: true }),
      credentials: 'include'
    });
    return { status: res.status, body: await res.text(), setCookie: res.headers.get('set-cookie') };
  });
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})();
