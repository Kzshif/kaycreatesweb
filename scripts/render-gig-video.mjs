import { chromium } from "playwright-core";
import { mkdirSync, copyFileSync, readdirSync } from "fs";
import { execFileSync } from "child_process";

const FPS = 24;
const OUT = "/tmp/claude-0/-home-user-kaycreatesweb/50c354ce-870e-5da0-bbb1-75396a7a94d0/scratchpad/video5";
const FF = "/home/user/kaycreatesweb/node_modules/@ffmpeg-installer/linux-x64/ffmpeg";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// Freeze all page motion so every frame is deterministic.
const freeze = () =>
  page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; } html { scroll-behavior: auto !important; }",
  });

const targetY = (finder, offset) =>
  page.evaluate(
    ([finder, offset]) => {
      let el = null;
      if (finder.sel) el = document.querySelector(finder.sel);
      if (finder.text)
        el = [...document.querySelectorAll(finder.tag || "h2")].find((e) => e.textContent.includes(finder.text));
      if (!el) return window.scrollY;
      return Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    },
    [finder, offset]
  );

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function scene(name, path, steps) {
  const dir = `${OUT}/${name}`;
  mkdirSync(dir, { recursive: true });
  await page.goto(`http://localhost:3002${path}`, { waitUntil: "networkidle" });
  await freeze();
  await page.waitForTimeout(600);
  let frame = 0;
  const shot = async () => {
    await page.screenshot({ path: `${dir}/${String(frame).padStart(5, "0")}.jpeg`, type: "jpeg", quality: 85 });
    frame++;
  };
  const holdFrames = async (n) => {
    await shot();
    const src = `${dir}/${String(frame - 1).padStart(5, "0")}.jpeg`;
    for (let i = 1; i < n; i++) {
      copyFileSync(src, `${dir}/${String(frame).padStart(5, "0")}.jpeg`);
      frame++;
    }
  };
  for (const s of steps) {
    if (s.hold) await holdFrames(Math.round(s.hold * FPS));
    if (s.to !== undefined || s.finder) {
      const from = await page.evaluate(() => window.scrollY);
      const to = s.finder ? await targetY(s.finder, s.offset ?? 100) : s.to;
      const n = Math.round(s.dur * FPS);
      for (let i = 1; i <= n; i++) {
        const y = Math.round(from + (to - from) * ease(i / n));
        await page.evaluate((y) => window.scrollTo(0, y), y);
        await shot();
      }
    }
  }
  const dur = frame / FPS;
  execFileSync(FF, [
    "-y", "-framerate", String(FPS), "-i", `${dir}/%05d.jpeg`,
    "-vf", `fade=t=in:st=0:d=0.6:color=0x0f2417,fade=t=out:st=${(dur - 0.6).toFixed(2)}:d=0.6:color=0x0f2417`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", `${OUT}/${name}.mp4`,
  ]);
  console.log(name, dur.toFixed(1) + "s", frame, "frames");
}

// Studio: hero → pitch → featured work → concept builds (no pricing)
await scene("01-studio", "/studio", [
  { hold: 2.6 },
  { finder: { text: "Most small-business sites", tag: "h2" }, offset: 130, dur: 4.5 },
  { hold: 2.8 },
  { finder: { sel: "#work" }, offset: 60, dur: 4.5 },
  { hold: 3.0 },
  { finder: { text: "Concept builds", tag: "h3" }, offset: 110, dur: 4.0 },
  { hold: 2.8 },
]);

await scene("02-kiln", "/studio/work/the-kiln", [
  { hold: 2.6 },
  { finder: { sel: "#menu" }, offset: 90, dur: 4.0 },
  { hold: 2.6 },
]);

await scene("03-kennet", "/studio/work/kennet-ridge", [
  { hold: 2.6 },
  { finder: { sel: "#services" }, offset: 90, dur: 4.0 },
  { hold: 2.4 },
]);

await scene("04-nine", "/studio/work/studio-nine", [
  { hold: 2.6 },
  { finder: { text: "Consultation first", tag: "h2" }, offset: 170, dur: 4.0 },
  { hold: 2.4 },
]);

await scene("05-contact", "/studio", [
  { finder: { sel: "#contact" }, offset: 60, dur: 0.05 },
  { hold: 3.4 },
]);

await browser.close();

// Stitch the scene clips together.
const list = `${OUT}/list.txt`;
const clips = readdirSync(OUT).filter((f) => f.endsWith(".mp4")).sort();
(await import("fs")).writeFileSync(list, clips.map((c) => `file '${OUT}/${c}'`).join("\n"));
execFileSync(FF, ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", `${OUT}/nova05-gig-final.mp4`]);
console.log("stitched");
