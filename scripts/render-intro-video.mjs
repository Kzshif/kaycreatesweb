import { chromium } from "playwright-core";
import { mkdirSync } from "fs";
import { execFileSync } from "child_process";

const FPS = 24;
const OUT = "/tmp/claude-0/-home-user-kaycreatesweb/50c354ce-870e-5da0-bbb1-75396a7a94d0/scratchpad/intro";
const FF = "/home/user/kaycreatesweb/node_modules/@ffmpeg-installer/linux-x64/ffmpeg";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(
  "file:///tmp/claude-0/-home-user-kaycreatesweb/50c354ce-870e-5da0-bbb1-75396a7a94d0/scratchpad/tiktok-intro.html",
  { waitUntil: "networkidle" }
);
await page.waitForTimeout(1500);

const total = await page.evaluate(() => window.TOTAL);
const frames = Math.ceil(total * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.renderAt(t), i / FPS);
  await page.screenshot({ path: `${OUT}/${String(i).padStart(5, "0")}.jpeg`, type: "jpeg", quality: 87 });
  if (i % 100 === 0) console.log("frame", i, "/", frames);
}
await browser.close();

execFileSync(FF, [
  "-y", "-framerate", String(FPS), "-i", `${OUT}/%05d.jpeg`,
  "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
  "-movflags", "+faststart", `${OUT}/nova05-intro.mp4`,
]);
console.log("done", total + "s", frames, "frames");
