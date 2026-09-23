const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', (req) => console.log('REQUEST FAILED:', req.url(), req.failure && req.failure().errorText));

  await page.goto('https://kemix-academy.vercel.app', { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(7000);

  console.log('FINAL URL:', page.url());
  console.log('TITLE:', await page.title());
  const bodyText = await page.locator('body').innerText();
  console.log('BODY SNIPPET:', bodyText.slice(0, 300));

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
