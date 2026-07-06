// The embeddable widget: a single self-contained script customers paste into
// their site. No dependencies, no iframe — it injects its own styles, renders
// a chat bubble, and streams NDJSON from /api/widget/chat.
//
//   <script src="https://your-app.example.com/widget.js" data-bot="pk_…" async></script>

export const runtime = "nodejs";
export const dynamic = "force-static";

const WIDGET_JS = String.raw`(function () {
  if (window.__kcwLoaded) return;
  window.__kcwLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.querySelectorAll('script[src*="widget.js"]');
    return s[s.length - 1];
  })();
  if (!script) return;
  var BASE = new URL(script.src).origin;
  var BOT = script.getAttribute("data-bot") || "demo";

  var vid;
  try {
    vid = localStorage.getItem("kcw_vid");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("kcw_vid", vid);
    }
  } catch (e) { vid = "v_anon"; }

  var cfg = { name: "Assistant", welcome: "Hi! How can I help?", color: "#3b5bdb" };
  var history = [];
  var busy = false;
  var open = false;

  fetch(BASE + "/api/widget/config?bot=" + encodeURIComponent(BOT))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j) cfg = j; init(); })
    .catch(function () { init(); });

  function el(tag, css, parent) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (parent) parent.appendChild(e);
    return e;
  }

  var panel, msgs, input, bubble;

  function init() {
    var Z = "2147483000";
    bubble = el("button", "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;z-index:" + Z + ";box-shadow:0 8px 24px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .15s;background:" + cfg.color, document.body);
    bubble.setAttribute("aria-label", "Open chat");
    bubble.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 12c0 4.4-4 8-9 8-1.1 0-2.2-.17-3.2-.5L3 21l1.6-4.2C3.6 15.4 3 13.8 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" fill="#fff"/></svg>';
    bubble.onmouseenter = function () { bubble.style.transform = "scale(1.07)"; };
    bubble.onmouseleave = function () { bubble.style.transform = "scale(1)"; };
    bubble.onclick = toggle;

    panel = el("div", "position:fixed;bottom:90px;right:20px;width:min(370px,calc(100vw - 32px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;z-index:" + Z + ';font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;color:#1a1c24', document.body);

    var head = el("div", "padding:14px 16px;color:#fff;display:flex;align-items:center;gap:10px;background:" + cfg.color, panel);
    var avatar = el("div", "width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:700", head);
    avatar.textContent = (cfg.name || "A").charAt(0).toUpperCase();
    var title = el("div", "flex:1;line-height:1.25", head);
    title.innerHTML = '<div style="font-weight:700">' + esc(cfg.name) + '</div><div style="font-size:11px;opacity:.85">Typically replies instantly</div>';
    var close = el("button", "background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px;line-height:1", head);
    close.innerHTML = "&times;";
    close.setAttribute("aria-label", "Close chat");
    close.onclick = toggle;

    msgs = el("div", "flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f7f7f9", panel);

    var form = el("form", "display:flex;gap:8px;padding:12px;border-top:1px solid rgba(0,0,0,.08);background:#fff", panel);
    input = el("input", "flex:1;border:1px solid rgba(0,0,0,.15);border-radius:999px;padding:10px 14px;font-size:14px;outline:none", form);
    input.placeholder = "Type a message…";
    var sendBtn = el("button", "border:none;border-radius:999px;padding:0 16px;color:#fff;font-weight:700;cursor:pointer;background:" + cfg.color, form);
    sendBtn.textContent = "Send";
    form.onsubmit = function (e) { e.preventDefault(); send(input.value); };

    var brand = el("div", "text-align:center;font-size:10px;padding:0 0 8px;background:#fff;color:rgba(0,0,0,.4)", panel);
    brand.innerHTML = 'Powered by <a href="' + BASE + '" target="_blank" rel="noopener" style="color:inherit;font-weight:600">NovaWebStudio</a>';

    addMsg("assistant", cfg.welcome);

    // Public API so the host page can open the widget and ask on the visitor's behalf.
    window.__novaOpen = function () { if (!open) toggle(); };
    window.__novaAsk = function (text) {
      if (!open) toggle();
      setTimeout(function () { send(String(text || "")); }, 150);
    };
  }

  function toggle() {
    open = !open;
    panel.style.display = open ? "flex" : "none";
    if (open) input.focus();
  }

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function addMsg(role, text) {
    var mine = role === "user";
    var b = el("div", "max-width:82%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;line-height:1.45;word-wrap:break-word;" + (mine
      ? "align-self:flex-end;color:#fff;border-bottom-right-radius:4px;background:" + cfg.color
      : "align-self:flex-start;background:#fff;border:1px solid rgba(0,0,0,.07);border-bottom-left-radius:4px"), msgs);
    b.textContent = text;
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  function addChip(label) {
    var c = el("div", "align-self:flex-start;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.06);color:rgba(0,0,0,.6)", msgs);
    c.textContent = label;
    msgs.scrollTop = msgs.scrollHeight;
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true;
    input.value = "";
    addMsg("user", text);
    history.push({ role: "user", content: text });

    var bubbleEl = addMsg("assistant", "…");
    var acc = "";

    fetch(BASE + "/api/widget/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botKey: BOT, visitorId: vid, messages: history }),
    }).then(function (res) {
      if (!res.ok || !res.body) throw new Error("offline");
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = "";
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          buf += dec.decode(r.value, { stream: true });
          var lines = buf.split("\n");
          buf = lines.pop() || "";
          for (var i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            var evt;
            try { evt = JSON.parse(lines[i]); } catch (e) { continue; }
            if (evt.type === "text") {
              acc += evt.text;
              bubbleEl.textContent = acc;
              msgs.scrollTop = msgs.scrollHeight;
            } else if (evt.type === "tool" && evt.label) {
              addChip(evt.label);
            }
          }
          return pump();
        });
      }
      return pump();
    }).catch(function () {
      acc = acc || "Sorry — I'm having trouble connecting right now. Please try again in a moment.";
      bubbleEl.textContent = acc;
    }).then(function () {
      history.push({ role: "assistant", content: acc });
      busy = false;
    });
  }
})();
`;

export async function GET() {
  return new Response(WIDGET_JS, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
