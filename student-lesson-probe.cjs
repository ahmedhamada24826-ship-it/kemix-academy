const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await p
    .locator('input[type="email"]')
    .fill("execution.1790065979754@example.com");
  await p.locator('input[type="password"]').fill("StudentPass123!");
  await Promise.all([
    p.waitForURL(/dashboard/),
    p.getByRole("button", { name: "تسجيل الدخول" }).click(),
  ]);
  const r = await p.evaluate(async () => {
    const x = await fetch("/api/lessons/ed231051-d55a-40b3-bad6-7e08a85bda89");
    return { status: x.status, body: await x.json() };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
