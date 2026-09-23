const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const routes = [
    '/', '/courses', '/courses/1', '/login', '/register', '/verify', '/about', '/contact', '/dashboard', '/instructor', '/admin'
  ];

  for (const route of routes) {
    const url = 'https://kemix-academy.vercel.app' + route;
    try {
      page.on('pageerror', (err) => console.log('PAGE ERROR at', route, ':', err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') console.log('CONSOLE ERROR at', route, ':', msg.text());
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(3000);
      console.log('OK', route, '->', await page.title());
    } catch (e) {
      console.log('FAIL', route, e.message);
    }
  }

  await browser.close();
})();
