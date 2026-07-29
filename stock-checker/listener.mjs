#!/usr/bin/env node
// Alert listener — auto-opens alert links in your browser the moment they
// arrive on your ntfy topic. Pair it with checker.mjs (which publishes the
// alerts): checker spots the drop -> ntfy delivers it -> this opens the page
// in Chrome instantly, so your reaction time is "page already loading" instead
// of "grab phone, tap notification".
//
// It only opens a real browser tab — you queue, browse and buy manually from
// there. No automated purchasing.
//
// Run:  node listener.mjs                      (topic from uk-watches.json/config.json)
//       node listener.mjs --topic mytopic      (explicit topic)
//       node listener.mjs --filter queue,pokemon center
//                                              (only auto-open alerts whose text
//                                               matches one of these; others are
//                                               logged but not opened)
//
// Uses ntfy's JSON stream API (https://docs.ntfy.sh/subscribe/api/).
// Requires Node 18+. On ChromeOS/Linux it opens links with xdg-open, which
// lands in Chrome. Override with OPEN_CMD env var if needed.

import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ----------------------------------------------------------------------------
// Config: topic from --topic, else from uk-watches.json / config.json
// ----------------------------------------------------------------------------
const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

let topic = argValue("--topic");
if (!topic) {
  for (const f of ["uk-watches.json", "config.json", "preorders.json"]) {
    const p = resolve(__dirname, f);
    if (!existsSync(p)) continue;
    try {
      const t = JSON.parse(readFileSync(p, "utf8"))?.notify?.ntfyTopic;
      if (t) {
        topic = t;
        console.log(`Using ntfy topic from ${f}`);
        break;
      }
    } catch {
      /* ignore unparsable config */
    }
  }
}
if (!topic) {
  console.error(
    "No ntfy topic found. Pass --topic <name> or set notify.ntfyTopic in " +
      "uk-watches.json / config.json.",
  );
  process.exit(1);
}

const filterTerms = (argValue("--filter") || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const streamUrl = topic.includes("://")
  ? `${topic}/json`
  : `https://ntfy.sh/${topic}/json`;

const OPEN_CMD = process.env.OPEN_CMD || "xdg-open";

// ----------------------------------------------------------------------------
// Opening links (with a small cooldown so one drop doesn't open 10 tabs)
// ----------------------------------------------------------------------------
const recentlyOpened = new Map(); // url -> timestamp
const COOLDOWN_MS = 5 * 60 * 1000;

function openUrl(url) {
  const last = recentlyOpened.get(url);
  if (last && Date.now() - last < COOLDOWN_MS) {
    console.log(`  (already opened recently, skipping: ${url})`);
    return;
  }
  recentlyOpened.set(url, Date.now());
  console.log(`  >>> OPENING ${url}`);
  const child = spawn(OPEN_CMD, [url], { stdio: "ignore", detached: true });
  child.on("error", (e) =>
    console.error(`  ! could not run ${OPEN_CMD}: ${e.message}`),
  );
  child.unref();
}

// Pull the best link out of an ntfy message: the Click action if set
// (checker.mjs always sets it), else the first URL found in the text.
function extractUrl(msg) {
  if (msg.click) return msg.click;
  const inText = /(https?:\/\/[^\s)>"']+)/.exec(
    `${msg.title || ""} ${msg.message || ""}`,
  );
  return inText ? inText[1] : null;
}

function matchesFilter(msg) {
  if (filterTerms.length === 0) return true;
  const hay = `${msg.title || ""} ${msg.message || ""}`.toLowerCase();
  return filterTerms.some((t) => hay.includes(t));
}

// ----------------------------------------------------------------------------
// Stream loop with auto-reconnect
// ----------------------------------------------------------------------------
const seenIds = new Set();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listenOnce() {
  console.log(`Listening on ${streamUrl} ...`);
  const res = await fetch(streamUrl, {
    headers: { Accept: "application/x-ndjson" },
  });
  if (!res.ok || !res.body) throw new Error(`stream returned ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) throw new Error("stream ended");
    buf += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;

      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.event !== "message") continue; // skip keepalives/open events
      if (msg.id && seenIds.has(msg.id)) continue;
      if (msg.id) seenIds.add(msg.id);

      const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
      console.log(`[${stamp}] ALERT: ${msg.title || "(no title)"}`);

      if (!matchesFilter(msg)) {
        console.log("  (does not match --filter, not opening)");
        continue;
      }
      const url = extractUrl(msg);
      if (url) openUrl(url);
      else console.log("  (no link in this alert)");
    }
  }
}

async function main() {
  console.log(
    "Alert listener started — links from incoming alerts will open in your " +
      "browser automatically. Ctrl-C to stop.",
  );
  if (filterTerms.length) {
    console.log(`Only auto-opening alerts matching: ${filterTerms.join(", ")}`);
  }
  for (;;) {
    try {
      await listenOnce();
    } catch (err) {
      console.log(`Stream dropped (${err.message}) — reconnecting in 5s...`);
      await sleep(5000);
    }
  }
}

main();
