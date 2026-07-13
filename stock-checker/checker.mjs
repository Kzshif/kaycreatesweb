#!/usr/bin/env node
// Pokémon stock checker — a polite restock / pre-order alert monitor for UK retailers.
//
// What it does:
//   - Polls a list of product pages you configure.
//   - Detects "in stock" vs "out of stock" (or "pre-order live") from the page.
//   - Alerts you (console + Discord and/or Telegram) only when something
//     flips into a buyable state, so you don't get spammed.
//
// What it deliberately does NOT do:
//   - It does not add to basket, log in, or check out. It only watches and
//     tells you. You buy manually, like everyone else — you just find out
//     first. Automated purchasing violates every major retailer's terms and
//     is a fast way to get your account and card banned.
//
// Run:  node checker.mjs                 (uses ./config.json, plain HTTP fetch)
//       node checker.mjs --once          (single pass, then exit — good for cron)
//       node checker.mjs --config FILE   (use a different config, e.g. preorders.json)
//       node checker.mjs --browser       (render pages with Playwright/Chromium)
//
// Requires Node 18+ (uses the built-in fetch). Plain mode needs no install.
// --browser mode needs Playwright:  npm install playwright && npx playwright install chromium

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------------------
const args = process.argv.slice(2);
const runOnce = args.includes("--once");
const useBrowserGlobal = args.includes("--browser");
const configFlagIndex = args.indexOf("--config");
const configPath =
  configFlagIndex !== -1 && args[configFlagIndex + 1]
    ? resolve(args[configFlagIndex + 1])
    : resolve(__dirname, "config.json");

if (!existsSync(configPath)) {
  console.error(
    `No config found at ${configPath}\n` +
      `Copy config.example.json to config.json (or preorders.example.json to ` +
      `preorders.json) and edit it first.`,
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const statePath = resolve(__dirname, config.stateFile || "state.json");

// ----------------------------------------------------------------------------
// Detection presets — sensible defaults per watch mode, overridable per watch.
// ----------------------------------------------------------------------------
const PRESETS = {
  restock: {
    in: ["add to basket", "add to cart", "add to trolley", "buy now"],
    out: [
      "out of stock",
      "sold out",
      "currently unavailable",
      "temporarily out of stock",
      "notify me when available",
      "email when available",
    ],
  },
  preorder: {
    // A pre-order is "live" once the page lets you commit to buy.
    in: ["pre-order", "pre order", "add to basket", "add to cart", "reserve"],
    // Still just teasing, not yet orderable.
    out: [
      "coming soon",
      "register interest",
      "notify me",
      "not yet available",
      "sold out",
    ],
  },
};

// ----------------------------------------------------------------------------
// State (last-known status per watch, so we only alert on transitions)
// ----------------------------------------------------------------------------
function loadState() {
  if (!existsSync(statePath)) return {};
  try {
    return JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}
function saveState(state) {
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn(`Could not write state file: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
    "image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function modeOf(watch) {
  return watch.mode === "preorder" ? "preorder" : "restock";
}

// Effective phrase lists: explicit config wins, else the mode preset.
function phrasesFor(watch) {
  const preset = PRESETS[modeOf(watch)];
  return {
    in: watch.inStockText ?? preset.in,
    out: watch.outOfStockText ?? preset.out,
  };
}

// Decide status from HTML. Returns "in", "out", or "unknown".
// Out-of-stock markers take priority (most reliable), then in-stock markers.
function detectStatus(html, watch) {
  const haystack = html.toLowerCase();
  const { in: inPhrases, out: outPhrases } = phrasesFor(watch);

  if (outPhrases.some((p) => p && haystack.includes(p.toLowerCase()))) {
    return "out";
  }
  if (inPhrases.some((p) => p && haystack.includes(p.toLowerCase()))) {
    return "in";
  }
  return "unknown";
}

// Human labels that respect the watch mode.
function liveLabel(watch) {
  return modeOf(watch) === "preorder" ? "PRE-ORDER LIVE" : "IN STOCK";
}
function liveEmoji(watch) {
  return modeOf(watch) === "preorder" ? "🟣" : "🟢";
}

// ----------------------------------------------------------------------------
// Fetchers — plain HTTP by default, optional Playwright browser rendering.
// ----------------------------------------------------------------------------
async function fetchPageHttp(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } finally {
    clearTimeout(timer);
  }
}

// Lazily launched shared browser, so we pay startup once per run, not per watch.
function createBrowserFetcher() {
  let browser = null;
  let playwright = null;

  async function ensure() {
    if (browser) return;
    try {
      playwright = await import("playwright");
    } catch {
      throw new Error(
        "Playwright is not installed. Run:\n" +
          "  npm install playwright && npx playwright install chromium",
      );
    }
    browser = await playwright.chromium.launch({ headless: true });
  }

  return {
    async fetchPage(url, timeoutMs) {
      await ensure();
      const context = await browser.newContext({
        userAgent: DEFAULT_HEADERS["User-Agent"],
        locale: "en-GB",
      });
      const page = await context.newPage();
      try {
        const res = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: timeoutMs,
        });
        const html = await page.content();
        return { ok: res ? res.ok() : true, status: res ? res.status() : 0, html };
      } finally {
        await context.close();
      }
    },
    async close() {
      if (browser) await browser.close();
    },
  };
}

// ----------------------------------------------------------------------------
// Notifications
// ----------------------------------------------------------------------------
async function notifyDiscord(webhookUrl, watch) {
  const body = {
    username: "Pokémon Restock",
    embeds: [
      {
        title: `${liveEmoji(watch)} ${liveLabel(watch)}: ${watch.name}`,
        description: watch.url,
        color: modeOf(watch) === "preorder" ? 0x9b59b6 : 0x2ecc71,
        fields: watch.store ? [{ name: "Store", value: watch.store }] : [],
        timestamp: new Date().toISOString(),
      },
    ],
  };
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
}

async function notifyTelegram(token, chatId, watch) {
  const text =
    `${liveEmoji(watch)} *${liveLabel(watch)}*\n${watch.name}` +
    (watch.store ? `\n_${watch.store}_` : "") +
    `\n${watch.url}`;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) throw new Error(`Telegram API returned ${res.status}`);
}

async function sendAlerts(notify, watch) {
  const jobs = [];
  if (notify?.discordWebhookUrl) {
    jobs.push(
      notifyDiscord(notify.discordWebhookUrl, watch).catch((e) =>
        console.warn(`  ! Discord alert failed: ${e.message}`),
      ),
    );
  }
  if (notify?.telegramBotToken && notify?.telegramChatId) {
    jobs.push(
      notifyTelegram(notify.telegramBotToken, notify.telegramChatId, watch).catch(
        (e) => console.warn(`  ! Telegram alert failed: ${e.message}`),
      ),
    );
  }
  await Promise.all(jobs);
}

// ----------------------------------------------------------------------------
// One pass over all watches
// ----------------------------------------------------------------------------
async function runPass(state, fetchers) {
  const watches = config.watches || [];
  const perRequestDelayMs = config.perRequestDelayMs ?? 2500;
  const timeoutMs = config.requestTimeoutMs ?? 15000;

  for (const watch of watches) {
    if (watch.enabled === false) continue;
    const key = watch.id || watch.url;

    // A watch can force browser rendering with "browser": true even in plain mode.
    const useBrowser = useBrowserGlobal || watch.browser === true;
    const fetcher = useBrowser ? fetchers.browser : fetchers.http;

    try {
      const { ok, status, html } = await fetcher.fetchPage(watch.url, timeoutMs);

      if (!ok && status) {
        console.log(`[${nowStamp()}] ${watch.name}: HTTP ${status} (skipped)`);
      } else {
        const current = detectStatus(html, watch);
        const previous = state[key]?.status ?? "unknown";

        const label =
          current === "in"
            ? liveLabel(watch)
            : current === "out"
              ? "out"
              : "unknown";
        console.log(
          `[${nowStamp()}] ${watch.name}: ${label}` +
            (useBrowser ? " (browser)" : ""),
        );

        if (current === "in" && previous !== "in") {
          console.log(`  >>> ${liveLabel(watch)} — sending alerts`);
          await sendAlerts(config.notify, watch);
        }

        state[key] = { status: current, checkedAt: nowStamp() };
      }
    } catch (err) {
      console.log(`[${nowStamp()}] ${watch.name}: error — ${err.message}`);
    }

    saveState(state);
    if (perRequestDelayMs > 0) await sleep(perRequestDelayMs);
  }
}

// ----------------------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------------------
async function main() {
  const state = loadState();
  const intervalSec = config.intervalSeconds ?? 300;
  const jitterSec = config.jitterSeconds ?? 60;

  const fetchers = {
    http: { fetchPage: fetchPageHttp },
    browser: createBrowserFetcher(),
  };

  const active = (config.watches || []).filter((w) => w.enabled !== false);
  const needsBrowser =
    useBrowserGlobal || active.some((w) => w.browser === true);
  console.log(
    `Pokémon checker started — ${active.length} active watch(es)` +
      `${needsBrowser ? " (browser rendering on)" : ""}.`,
  );

  try {
    if (runOnce) {
      await runPass(state, fetchers);
      console.log("Single pass complete (--once).");
      return;
    }

    console.log(
      `Polling every ~${intervalSec}s (±${jitterSec}s jitter). Ctrl-C to stop.\n`,
    );
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await runPass(state, fetchers);
      const jitter = Math.floor((Math.random() * 2 - 1) * jitterSec * 1000);
      const waitMs = Math.max(30000, intervalSec * 1000 + jitter);
      console.log(`\n--- next check in ${Math.round(waitMs / 1000)}s ---\n`);
      await sleep(waitMs);
    }
  } finally {
    await fetchers.browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
