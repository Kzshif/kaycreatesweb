// Building blocks every scene draws with. All text goes through these, so it
// inherits the look's fonts and stays inside the safe stage.
import React, { type CSSProperties } from 'react';
import { useLook } from '../look';
import { fitSize } from '../lib/measure';
import { STAGE } from '../shared/spec.mjs';

/** The area scenes may put text in. Never overlaps the subtitles or YouTube's buttons. */
export const Stage: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      position: 'absolute',
      left: STAGE.left,
      top: STAGE.top,
      width: STAGE.width,
      height: STAGE.height,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    {children}
  </div>
);

export const useCase = () => {
  const look = useLook();
  return (s: string) => (look.upper ? s.toUpperCase() : s);
};

/** Display-face text (headlines, figures). */
export const D: React.FC<{ children: React.ReactNode; size: number; color?: string; lh?: number; style?: CSSProperties }> = ({ children, size, color, lh = 0.98, style }) => {
  const look = useLook();
  return (
    <div
      style={{
        fontFamily: `"${look.display}"`,
        fontWeight: look.displayWeight,
        fontSize: size,
        lineHeight: lh,
        letterSpacing: `${look.tracking}em`,
        color: color ?? look.fg,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** One line of display text sized to fill `width` exactly (up to `max`). */
export const FitLine: React.FC<{ text: string; width: number; max: number; min?: number; color?: string; lh?: number; style?: CSSProperties; align?: 'left' | 'center' }> = ({
  text,
  width,
  max,
  min = 40,
  color,
  lh = 0.98,
  style,
  align = 'left',
}) => {
  const look = useLook();
  const t = look.upper ? text.toUpperCase() : text;
  const size = fitSize(t, look.display, look.displayWeight, width, max, look.tracking, min);
  return (
    <D size={size} color={color} lh={lh} style={{ whiteSpace: 'nowrap', textAlign: align, ...style }}>
      {t}
    </D>
  );
};

/** Text-face copy (labels, notes). */
export const T: React.FC<{ children: React.ReactNode; size: number; color?: string; bold?: boolean; lh?: number; style?: CSSProperties }> = ({ children, size, color, bold, lh = 1.18, style }) => {
  const look = useLook();
  return (
    <div style={{ fontFamily: `"${look.text}"`, fontWeight: bold ? look.bold : 500, fontSize: size, lineHeight: lh, color: color ?? look.fg, ...style }}>{children}</div>
  );
};

/** Small tracked capitals: kickers, tags, sources. */
export const L: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: CSSProperties }> = ({ children, size = 34, color, style }) => {
  const look = useLook();
  const mono = look.label === 'JetBrains Mono';
  return (
    <div
      style={{
        fontFamily: `"${look.label}"`,
        fontWeight: 700,
        fontSize: mono ? size * 0.92 : size,
        lineHeight: 1.15,
        letterSpacing: mono ? '0.06em' : '0.11em',
        textTransform: 'uppercase',
        color: color ?? look.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Pill: React.FC<{ children: React.ReactNode; filled?: boolean; size?: number; style?: CSSProperties }> = ({ children, filled, size = 34, style }) => {
  const look = useLook();
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        padding: `${size * 0.32}px ${size * 0.7}px`,
        borderRadius: Math.min(look.radius * 1.4, size * 1.2),
        background: filled ? look.accent : 'transparent',
        border: filled ? 'none' : `3px solid ${look.line}`,
        ...style,
      }}
    >
      <L size={size} color={filled ? look.onAccent : look.fg}>
        {children}
      </L>
    </div>
  );
};

export const Card: React.FC<{ children?: React.ReactNode; style?: CSSProperties; accent?: boolean }> = ({ children, style, accent }) => {
  const look = useLook();
  return (
    <div
      style={{
        background: accent ? look.accent : look.card,
        color: accent ? look.onAccent : look.fg,
        borderRadius: look.radius,
        border: accent ? 'none' : `2px solid ${look.line}`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Splits a line so the emphasised words can be coloured. */
export const emphasise = (line: string, emphasis: string | string[] | undefined): { text: string; hot: boolean }[] => {
  const list = (Array.isArray(emphasis) ? emphasis : emphasis ? [emphasis] : []).filter(Boolean);
  if (!list.length) return [{ text: line, hot: false }];
  const lower = line.toLowerCase();
  let best: [number, number] | null = null;
  for (const e of list) {
    const i = lower.indexOf(e.toLowerCase());
    if (i >= 0 && (!best || e.length > best[1])) best = [i, e.length];
  }
  if (!best) return [{ text: line, hot: false }];
  const [i, n] = best;
  return [
    { text: line.slice(0, i), hot: false },
    { text: line.slice(i, i + n), hot: true },
    { text: line.slice(i + n), hot: false },
  ].filter((p) => p.text);
};

/** Optional small heading above a scene. */
export const Head: React.FC<{ title?: string; style?: CSSProperties }> = ({ title, style }) => {
  const look = useLook();
  if (!title) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30, ...style }}>
      <div style={{ width: 22, height: 22, background: look.accent, borderRadius: look.radius ? 6 : 0, flexShrink: 0 }} />
      <L size={34} color={look.fg}>
        {title}
      </L>
    </div>
  );
};

/** Optional source credit at the foot of the stage: "Source: Costco annual report 2025". */
export const SourceLine: React.FC<{ text?: string }> = ({ text }) => {
  const look = useLook();
  if (!text) return null;
  return (
    <div style={{ marginTop: 22 }}>
      <L size={25} color={look.muted}>
        Source: {text}
      </L>
    </div>
  );
};
