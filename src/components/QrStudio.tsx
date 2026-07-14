"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// The free QR Studio: brand-colored QR codes rendered in the browser, with an
// optional NOVA star in the centre (error correction H leaves ~30% headroom,
// so the star never breaks scanning). No signup, no server round-trip.

const INKS = [
  { name: "Deep space", value: "#08070f" },
  { name: "Nebula", value: "#a61e4d" },
  { name: "Stellar", value: "#0b7285" },
  { name: "Cosmic blue", value: "#3b5bdb" },
];

export default function QrStudio() {
  const [text, setText] = useState("https://novawebstudio05.netlify.app");
  const [ink, setInk] = useState(INKS[0].value);
  const [star, setStar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const value = text.trim() || "https://novawebstudio05.netlify.app";
    try {
      await QRCode.toCanvas(canvas, value, {
        width: 560,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: ink, light: "#ffffff" },
      });
      setError(null);
      if (star) drawStar(canvas, ink);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draw that — try shorter text.");
    }
  }, [text, ink, star]);

  useEffect(() => {
    const t = setTimeout(render, 150);
    return () => clearTimeout(t);
  }, [render]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "nova05-qr.png";
    a.click();
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(300px,380px)]">
      <div className="glass space-y-6 p-7">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-starlight/80">
            Where should it point?
          </span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://yourbusiness.com — or any text, phone, WiFi…"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-starlight placeholder:text-starlight/30 focus:border-nova/60 focus:outline-none"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold text-starlight/80">Ink</span>
          <div className="flex flex-wrap items-center gap-2">
            {INKS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setInk(c.value)}
                title={c.name}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  ink === c.value ? "scale-110 border-nova" : "border-white/20"
                }`}
                style={{ background: c.value }}
                aria-label={c.name}
              />
            ))}
            <label className="ml-1 flex cursor-pointer items-center gap-2 text-xs text-starlight/60">
              <input
                type="color"
                value={ink}
                onChange={(e) => setInk(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-full border-2 border-white/20 bg-transparent"
                aria-label="Custom color"
              />
              custom
            </label>
          </div>
          <p className="mt-2 text-xs text-starlight/40">
            Keep the ink dark — scanners read dark-on-light.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-starlight/80">
          <input
            type="checkbox"
            checked={star}
            onChange={(e) => setStar(e.target.checked)}
            className="h-4 w-4 accent-[#a855f7]"
          />
          Nova star in the centre
        </label>

        {error && <p className="text-sm text-nebula">{error}</p>}

        <button type="button" onClick={download} className="btn-nova w-full justify-center">
          Download PNG — free ↓
        </button>
        <p className="text-center text-xs text-starlight/40">
          No signup. No watermark. Print it as big as you like.
        </p>
      </div>

      <div className="glass grid place-items-center p-6">
        <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-2xl">
          <canvas ref={canvasRef} className="block h-auto w-full max-w-[300px]" aria-label="Your QR code" />
        </div>
      </div>
    </div>
  );
}

/** Stamp the four-point nova star into the centre (EC level H tolerates it). */
function drawStar(canvas: HTMLCanvasElement, ink: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = canvas.width;
  const r = s * 0.11; // star halo radius — well under H's 30% budget
  const cx = s / 2;
  const cy = s / 2;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, "#a855f7");
  grad.addColorStop(1, "#22d3ee");
  ctx.fillStyle = grad;
  const p = r * 0.78;
  const q = p * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx, cy - p);
  ctx.lineTo(cx + q, cy - q);
  ctx.lineTo(cx + p, cy);
  ctx.lineTo(cx + q, cy + q);
  ctx.lineTo(cx, cy + p);
  ctx.lineTo(cx - q, cy + q);
  ctx.lineTo(cx - p, cy);
  ctx.lineTo(cx - q, cy - q);
  ctx.closePath();
  ctx.fill();
  // tiny ink dot so the star reads against any ink color
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
