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
(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext();
  const p = await c.newPage();
  const out = { steps: [], events: [] };
  p.on("request", (r) => {
    if (r.url().includes("/api/"))
      out.events.push({
        type: "request",
        method: r.method(),
        url: r.url(),
        body: r.postData(),
      });
  });
  p.on("response", async (r) => {
    if (r.url().includes("/api/")) {
      let x = "";
      try {
        x = (await r.text()).slice(0, 1200);
      } catch {}
      out.events.push({
        type: "response",
        status: r.status(),
        url: r.url(),
        body: x,
      });
    }
  });
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
    const edit = p.locator('button[title="تعديل الدرس"]').first();
    await edit.click();
    const d = p.locator('[role="dialog"]').last();
    await d.locator("input").first().fill("Browser Lesson Edited");
    await d.locator("textarea").fill("Edited content persisted from browser");
    const save = p.waitForResponse(
      (r) =>
        r.url().includes("/api/lessons/") && r.request().method() === "PATCH",
    );
    await d.getByRole("button", { name: "حفظ الدرس" }).click();
    const sr = await save;
    out.steps.push({
      name: "lesson-edit",
      status: sr.status(),
      body: await sr.json(),
    });
    await p
      .getByText(/Browser Lesson Edited/)
      .first()
      .waitFor();
    const publish = p.getByRole("button", { name: "نشر", exact: true }).first();
    const pub = p.waitForResponse(
      (r) =>
        r.url().includes("/api/lessons/") && r.request().method() === "PATCH",
    );
    await publish.click();
    const pr = await pub;
    out.steps.push({
      name: "lesson-publish",
      status: pr.status(),
      body: await pr.json(),
    });
    await edit.click();
    const ed = p.locator('[role="dialog"]').last();
    const pdf = Buffer.from("%PDF-1.4\n% browser verification\n", "utf8");
    const intent = p.waitForResponse((r) =>
      r.url().endsWith("/api/files/upload-intent"),
    );
    const register = p.waitForResponse((r) =>
      r.url().endsWith("/api/files/register"),
    );
    await ed
      .locator('input[type="file"]')
      .last()
      .setInputFiles({
        name: "lesson-verification.pdf",
        mimeType: "application/pdf",
        buffer: pdf,
      });
    const ir = await intent,
      rr = await register;
    out.steps.push({ name: "lesson-file-intent", status: ir.status() });
    out.steps.push({
      name: "lesson-file-register",
      status: rr.status(),
      body: await rr.json(),
    });
    await ed.getByRole("button", { name: "إلغاء" }).click();
    const qbtn = p.getByRole("button", { name: "إضافة سؤال" }).first();
    await qbtn.click();
    const qd = p.locator('[role="dialog"]').last();
    await qd.locator("textarea").fill("Which option is correct?");
    const qinputs = qd.locator('input:not([type="radio"])');
    await qinputs.nth(1).fill("Correct answer");
    await qinputs.nth(2).fill("Wrong answer");
    const qresp = p.waitForResponse(
      (r) =>
        r.url().includes("/api/quizzes/") &&
        r.url().endsWith("/questions") &&
        r.request().method() === "POST",
    );
    await qd.getByRole("button", { name: "إضافة السؤال" }).click();
    const qr = await qresp;
    out.steps.push({
      name: "quiz-question",
      status: qr.status(),
      body: await qr.json(),
    });
    await p.reload({ waitUntil: "networkidle" });
    out.steps.push({
      name: "refresh-state",
      lessonEdited: await p.getByText(/Browser Lesson Edited/).count(),
      questionVisible: await p.getByText(/Which option is correct/).count(),
    });
  } catch (e) {
    out.error = { message: e.message, stack: e.stack };
    process.exitCode = 1;
  } finally {
    console.log(JSON.stringify(out, null, 2));
    await b.close();
  }
})();
