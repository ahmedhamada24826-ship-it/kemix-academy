const { chromium } = require("@playwright/test");
const fs = require("fs");
function env(n) {
  const x = fs
    .readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .find((v) => v.startsWith(n + "="));
  return x ? x.slice(n.length + 1).replace(/^"|"$/g, "") : "";
}
const courseId = "f6b535af-afb8-4086-9e17-30c3e2d59c98";
const studentEmail = env("E2E_STUDENT_EMAIL") || "execution.student@example.com";
const studentPassword = env("E2E_STUDENT_PASSWORD") || "StudentPass123!";
(async () => {
  const b = await chromium.launch({ headless: true });
  const admin = await b.newContext();
  const p = await admin.newPage();
  const out = { steps: [], events: [] };
  for (const page of [p]) {
    page.on("request", (r) => {
      if (r.url().includes("/api/"))
        out.events.push({
          type: "request",
          method: r.method(),
          url: r.url(),
          body: r.postData(),
        });
    });
    page.on("response", async (r) => {
      if (r.url().includes("/api/")) {
        let x = "";
        try {
          x = (await r.text()).slice(0, 900);
        } catch {}
        out.events.push({
          type: "response",
          status: r.status(),
          url: r.url(),
          body: x,
        });
      }
    });
  }
  try {
    await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await p.locator('input[type="email"]').fill(env("INITIAL_ADMIN_EMAIL"));
    await p
      .locator('input[type="password"]')
      .fill(env("INITIAL_ADMIN_PASSWORD"));
    await Promise.all([
      p.waitForURL(/dashboard/),
      p.getByRole("button", { name: "تسجيل الدخول" }).click(),
    ]);
    await p.goto(`http://localhost:3000/admin/courses/${courseId}`, {
      waitUntil: "networkidle",
    });
    await p.getByText("بيانات وإعدادات الكورس", { exact: true }).waitFor();
    const coursePublish = p.getByRole("button", {
      name: "نشر الكورس للعامة",
      exact: true,
    });
    if (await coursePublish.count()) {
      const r = p.waitForResponse((x) =>
        x.url().endsWith(`/api/courses/${courseId}/publish`),
      );
      await coursePublish.click();
      out.steps.push({ name: "course-publish", status: (await r).status() });
    }
    const lessonPublish = p
      .getByRole("button", { name: "نشر", exact: true })
      .first();
    if (await lessonPublish.count()) {
      const r = p.waitForResponse(
        (x) =>
          x.url().includes("/api/lessons/") && x.request().method() === "PATCH",
      );
      await lessonPublish.click();
      out.steps.push({ name: "lesson-publish", status: (await r).status() });
    }
    await p.getByRole("button", { name: "إضافة اختبار" }).click();
    const qd = p.locator('[role="dialog"]').last();
    await qd
      .getByPlaceholder("مثال: تقييم الوحدة الأولى في التحليل الإحصائي")
      .fill(`Execution Quiz ${Date.now()}`);
    const create = p.waitForResponse(
      (x) =>
        x.url().endsWith(`/api/courses/${courseId}/quizzes`) &&
        x.request().method() === "POST",
    );
    await qd.getByRole("button", { name: "إنشاء الاختبار" }).click();
    const cr = await create;
    out.steps.push({ name: "quiz-create", status: cr.status() });
    await p
      .getByText(/Execution Quiz/)
      .first()
      .waitFor();
    const addQ = p.getByRole("button", { name: "إضافة سؤال" }).last();
    await addQ.click();
    const aq = p.locator('[role="dialog"]').last();
    await aq.locator("textarea").fill("What is the correct answer?");
    const opts = aq.locator('input:not([type="radio"])');
    await opts.nth(1).fill("Correct");
    await opts.nth(2).fill("Incorrect");
    const addQR = p.waitForResponse(
      (x) => x.url().includes("/questions") && x.request().method() === "POST",
    );
    await aq.getByRole("button", { name: "إضافة السؤال" }).click();
    out.steps.push({ name: "question-create", status: (await addQR).status() });
    const publishQuiz = p
      .getByRole("button", { name: "نشر الاختبار", exact: true })
      .last();
    const pqr = p.waitForResponse(
      (x) =>
        x.url().includes("/api/quizzes/") && x.request().method() === "PATCH",
    );
    await publishQuiz.click();
    out.steps.push({ name: "quiz-publish", status: (await pqr).status() });
    const student = await b.newContext();
    const s = await student.newPage();
    s.on("request", (r) => {
      if (r.url().includes("/api/"))
        out.events.push({
          type: "student-request",
          method: r.method(),
          url: r.url(),
          body: r.postData(),
        });
    });
    s.on("response", async (r) => {
      if (r.url().includes("/api/")) {
        let x = "";
        try {
          x = (await r.text()).slice(0, 900);
        } catch {}
        out.events.push({
          type: "student-response",
          status: r.status(),
          url: r.url(),
          body: x,
        });
      }
    });
    await s.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await s.locator('input[type="email"]').fill(studentEmail);
    await s.locator('input[type="password"]').fill(studentPassword);
    const login = s.waitForResponse((x) => x.url().endsWith("/api/auth/login"));
    await s.getByRole("button", { name: "تسجيل الدخول" }).click();
    const loginResponse = await login;
    if (loginResponse.status() !== 200) {
      await s.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
      await s.locator('input[type="text"]').fill("Execution Student");
      await s.locator('input[type="email"]').fill(studentEmail);
      await s.locator('input[type="password"]').fill(studentPassword);
      const reg = s.waitForResponse((x) => x.url().endsWith("/api/auth/register"));
      await s.getByRole("button", { name: "إنشاء الحساب وبدء التعلم" }).click();
      out.steps.push({ name: "student-register", status: (await reg).status() });
    } else {
      out.steps.push({ name: "student-login", status: loginResponse.status() });
    }
    await s.goto(`http://localhost:3000/courses/${courseId}`, {
      waitUntil: "networkidle",
    });
    const enroll = s.waitForResponse(
      (x) =>
        x.url().endsWith("/api/enrollments") && x.request().method() === "POST",
    );
    await s.getByRole("button", { name: "التحق بالكورس مجاناً" }).click();
    out.steps.push({ name: "student-enroll", status: (await enroll).status() });
    await s.goto(`http://localhost:3000/learn/${courseId}`, {
      waitUntil: "networkidle",
    });
    await s.waitForTimeout(1500);
    out.steps.push({
      name: "lesson-open",
      lessonVisible: await s.getByText(/Browser Lesson Edited/).count(),
    });
    const complete = s.getByRole("button", { name: /تحديد كمكتملة/ });
    if (await complete.count()) {
      const pr = s.waitForResponse(
        (x) =>
          x.url().includes("/api/lessons/") && x.url().endsWith("/progress"),
      );
      await complete.click();
      out.steps.push({ name: "lesson-complete", status: (await pr).status() });
      await s.reload({ waitUntil: "networkidle" });
      out.steps.push({
        name: "progress-refresh",
        completedText: await s.getByText(/تم الإكمال/).count(),
      });
    }
    const quizTab = s.getByText(/الاختبار/).first();
    if (await quizTab.count()) {
      await quizTab.click();
      out.steps.push({
        name: "quiz-visible",
        startText: await s
          .getByText("بدء محاولة الاختبار الآن", { exact: true })
          .count(),
        timerText: await s.getByText(/الوقت المتبقي/).count(),
      });
    }
  } catch (e) {
    out.error = { message: e.message, stack: e.stack };
    process.exitCode = 1;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await b.close();
  }
})();
