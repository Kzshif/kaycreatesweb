"use client";

import { useState } from "react";

// Hand-rolled SVG charts, no chart library. Palette validated for CVD
// separation, chroma, and surface contrast (see dataviz validator):
//   appointments #0d9488 · messages #c26a1a · callbacks #7c5cbf

export const SERIES = [
  { key: "appointment" as const, label: "Appointments", color: "#0d9488" },
  { key: "message" as const, label: "Messages", color: "#c26a1a" },
  { key: "callback" as const, label: "Callbacks", color: "#7c5cbf" },
];

export interface DayPoint {
  day: string; // YYYY-MM-DD
  appointment: number;
  message: number;
  callback: number;
}

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 30 };

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

/** Stacked daily-volume bars with hover tooltip and legend. */
export function VolumeChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = data.map((d) => d.appointment + d.message + d.callback);
  const maxTotal = Math.max(4, ...totals);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.min(28, slot * 0.6);
  const yFor = (v: number) => PAD.top + plotH * (1 - v / maxTotal);

  const ticks = [0, Math.ceil(maxTotal / 2), maxTotal];

  return (
    <div className="relative">
      {/* Legend — identity by color chip; text stays in ink */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Conversations per day by type">
        {/* Recessive grid + y labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="rgba(15,31,36,0.08)"
              strokeWidth="1"
            />
            <text x={PAD.left - 6} y={yFor(t) + 3.5} textAnchor="end" fontSize="10" fill="rgba(15,31,36,0.45)">
              {t}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const segs: { color: string; y: number; h: number }[] = [];
          let acc = 0;
          for (const s of SERIES) {
            const v = d[s.key];
            if (v > 0) {
              const y0 = yFor(acc + v);
              const y1 = yFor(acc);
              segs.push({ color: s.color, y: y0, h: y1 - y0 });
              acc += v;
            }
          }
          const showLabel = i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
          return (
            <g key={d.day}>
              {segs.map((seg, j) => {
                const isTop = j === segs.length - 1;
                // 2px surface gap between stacked segments
                const gap = j < segs.length - 1 ? 2 : 0;
                const h = Math.max(0, seg.h - gap);
                if (h <= 0) return null;
                return isTop ? (
                  <path key={j} d={roundedTop(x, seg.y, barW, h, 4)} fill={seg.color} />
                ) : (
                  <rect key={j} x={x} y={seg.y} width={barW} height={h} fill={seg.color} />
                );
              })}
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="rgba(15,31,36,0.45)"
                >
                  {dayLabel(d.day)}
                </text>
              )}
              {/* Full-height hover target, larger than the mark */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {hover === i && (
                <line
                  x1={x + barW / 2}
                  x2={x + barW / 2}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke="rgba(15,31,36,0.2)"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`,
            top: 24,
            transform: hover > data.length / 2 ? "translateX(-105%)" : "translateX(6px)",
          }}
        >
          <p className="mb-1 font-semibold text-ink">{dayLabel(data[hover].day)}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-3 text-ink/70">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-ink">{data[hover][s.key]}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** Horizontal single-hue bars — "why people call". */
export function IntentBars({ data }: { data: { intent: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink/45">No conversations yet this period.</p>;
  }
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.intent} className="group">
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-medium capitalize text-ink/70">{d.intent}</span>
            <span className="font-semibold text-ink">{d.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full rounded-full transition-all group-hover:opacity-80"
              style={{ width: `${(d.count / max) * 100}%`, background: "#0d9488" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
