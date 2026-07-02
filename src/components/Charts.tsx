"use client";

import { useState } from "react";

// Hand-rolled SVG charts, no chart library. Palette validated for CVD
// separation, chroma, and surface contrast (dataviz validator):
//   conversations #3b5bdb · leads #e8590c

export const SERIES = [
  { key: "conversations" as const, label: "Conversations", color: "#3b5bdb" },
  { key: "leads" as const, label: "Leads", color: "#e8590c" },
];

export interface DayPoint {
  day: string; // YYYY-MM-DD
  conversations: number;
  leads: number;
}

const W = 640;
const H = 220;
const PAD = { top: 14, right: 10, bottom: 26, left: 30 };

function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Two-series line chart with crosshair + tooltip (change over time). */
export function ActivityChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(4, ...data.map((d) => Math.max(d.conversations, d.leads)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const xFor = (i: number) =>
    PAD.left + (data.length === 1 ? plotW / 2 : (plotW * i) / (data.length - 1));
  const yFor = (v: number) => PAD.top + plotH * (1 - v / max);

  const ticks = [0, Math.ceil(max / 2), max];
  const path = (key: (typeof SERIES)[number]["key"]) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(d[key]).toFixed(1)}`).join(" ");

  return (
    <div className="relative">
      {/* Legend — identity by color chip; text stays in ink */}
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Conversations and leads per day"
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="rgba(18,20,29,0.08)"
              strokeWidth="1"
            />
            <text x={PAD.left - 6} y={yFor(t) + 3.5} textAnchor="end" fontSize="10" fill="rgba(18,20,29,0.45)">
              {t}
            </text>
          </g>
        ))}

        {/* Soft area under the conversations line */}
        <path
          d={`${path("conversations")} L${xFor(data.length - 1)},${yFor(0)} L${xFor(0)},${yFor(0)} Z`}
          fill="rgba(59,91,219,0.07)"
        />
        {SERIES.map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
        ))}

        {/* Markers on hover + sparse x labels */}
        {data.map((d, i) => {
          const showLabel = i % Math.ceil(data.length / 7) === 0 || i === data.length - 1;
          return (
            <g key={d.day}>
              {showLabel && (
                <text x={xFor(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="rgba(18,20,29,0.45)">
                  {dayLabel(d.day)}
                </text>
              )}
              {hover === i && (
                <>
                  <line
                    x1={xFor(i)}
                    x2={xFor(i)}
                    y1={PAD.top}
                    y2={PAD.top + plotH}
                    stroke="rgba(18,20,29,0.2)"
                    strokeDasharray="3 3"
                  />
                  {SERIES.map((s) => (
                    <circle
                      key={s.key}
                      cx={xFor(i)}
                      cy={yFor(d[s.key])}
                      r="4"
                      fill={s.color}
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  ))}
                </>
              )}
              {/* Full-height hover target, larger than the mark */}
              <rect
                x={xFor(i) - plotW / (2 * Math.max(1, data.length - 1))}
                y={PAD.top}
                width={plotW / Math.max(1, data.length - 1)}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${(xFor(hover) / W) * 100}%`,
            top: 24,
            transform: hover > data.length / 2 ? "translateX(-105%)" : "translateX(8px)",
          }}
        >
          <p className="mb-1 font-semibold text-ink">{dayLabel(data[hover].day)}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-3 text-ink/70">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
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

/** Score dial for SEO audits (0-100). */
export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? "#0ca678" : score >= 55 ? "#e8590c" : "#d6336c";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`SEO score ${score} of 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(18,20,29,0.08)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="700" fill="#12141d">
        {score}
      </text>
    </svg>
  );
}
