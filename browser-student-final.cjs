const { chromium } = require("@playwright/test");
const courseId = "f6b535af-afb8-4086-9e17-30c3e2d59c98";
const studentEmail = process.env.E2E_STUDENT_EMAIL || "execution.student@example.com";
const studentPassword = process.env.E2E_STUDENT_PASSWORD || "StudentPass123!";
(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext();
  const p = await c.newPage();
  const out = { steps: [], requests: [] };
  p.on("request", (r) => {
    if (r.url().includes("/api/"))
      out.requests.push({
        method: r.method(),
        url: r.url(),
        body: r.postData(),
      });
  });
  p.on("response", async (r) => {
    if (r.url().includes("/api/")) {
      let x = "";
      try {
        x = (await r.text()).slice(0, 800);
      } catch {}
      out.requests.push({ status: r.status(), url: r.url(), body: x });
    }
  });
  try {
    await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await p
      .locator('input[type="email"]')
      .fill(studentEmail);
    await p.locator('input[type="password"]').fill(studentPassword);
    await Promise.all([
      p.waitForURL(/dashboard/),
      p.getByRole("button", { name: "تسجيل الدخول" }).click(),
    ]);
    out.steps.push({ name: "login", url: p.url() });
    await p.goto(`http://localhost:3000/learn/${courseId}`, {
      waitUntil: "networkidle",
    });
    await p.waitForTimeout(6000);
    out.steps.push({
      name: "lesson-open",
      lesson: await p.getByText(/Browser Lesson Edited/).count(),
      quiz: await p.getByText(/الاختبار/).count(),
      body: (await p.locator("body").innerText()).slice(0, 1200),
    });
    const complete = p.getByRole("button", { name: /تحديد كمكتملة/ });
    if (await complete.count()) {
      const pr = p.waitForResponse(
        (r) => r.url().includes("/progress") && r.request().method() === "POST",
      );
      await complete.click();
      out.steps.push({ name: "complete", status: (await pr).status() });
      const progress = await p.evaluate(async () => {
        const r = await fetch(
          "/api/courses/f6b535af-afb8-4086-9e17-30c3e2d59c98/progress",
        );
        return await r.json();
      });
      out.steps.push({ name: "progress-api", body: progress.data?.progress });
      await p.reload({ waitUntil: "networkidle" });
      await p.waitForTimeout(3000);
      out.steps.push({
        name: "progress-refresh",
        completed: await p.getByRole("button", { name: /تم الإكمال/ }).count(),
        body: (await p.locator("body").innerText()).slice(0, 500),
      });
    }
    const quizTab = p.getByText(/الاختبار \(1\)/).first();
    if (await quizTab.count()) {
      await quizTab.click();
      const start = p.getByRole("button", {
        name: "بدء محاولة الاختبار الآن",
        exact: true,
      });
      if (await start.count()) {
        const ar = p.waitForResponse(
          (r) =>
            r.url().includes("/attempts") && r.request().method() === "POST",
        );
        await start.click();
        const attempt = await ar;
        out.steps.push({ name: "quiz-start", status: attempt.status() });
        const option = p.locator('input[type="radio"]').first();
        if (await option.count()) await option.check();
        const submit = p.getByRole("button", {
          name: "تسليم إجابات الاختبار",
          exact: true,
        });
        const sr = p.waitForResponse(
          (r) =>
            r.url().includes("/api/quizzes/attempts/") &&
            r.request().method() === "POST",
        );
        await submit.click();
        const result = await sr;
        out.steps.push({
          name: "quiz-submit",
          status: result.status(),
          body: await result.json(),
        });
      }
    }
  } catch (e) {
    out.error = { message: e.message, stack: e.stack };
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await b.close();
  }
})();
