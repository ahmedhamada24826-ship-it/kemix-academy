import http from "http";
const data = JSON.stringify({
  title: "درس اختبار",
  slug: "درس-اختبار",
  lessonType: "VIDEO",
  videoSource: "YOUTUBE",
  unlockRule: "PREVIOUS_LESSON",
  durationSeconds: 600,
  isFreePreview: false,
  sortOrder: 10,
});

const options = {
  hostname: "localhost",
  port: 3001,
  path: "/api/sections/test-section-id/lessons",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ContentLength: Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", body);
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.write(data);
req.end();
