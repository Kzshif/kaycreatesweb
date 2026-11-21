// Gameplay shorts: the user's own gameplay footage cut into an opinion short. The footage sits in
// a band across the middle (or fills the frame), with a blurred copy behind it, the hook as a
// title that stays up for the whole video, big word-by-word captions, and one stamp moment.
// Everything on top of the footage is drawn in code: no logos, no faces.
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Materials, headStyle } from '../paper/kit';
import type { CaptionPage } from '../types';

export type Clip = { start: number; end: number; zoom?: number; fx?: number; fy?: number };

export type GameplayProps = {
  id: string;
  durationInFrames: number;
  fps: number;
  /** the gameplay file, a path inside public/ (null draws a placeholder for layout checks) */
  footage: string | null;
  /** the parts of the footage to use, in order, in seconds of the source */
  clips: Clip[];
  layout: 'band' | 'full';
  /** the hook, one or two short lines, shown for the whole video */
  title: string[];
  /** a word of the title to box in red */
  hl: string | null;
  captions: CaptionPage[];
  /** the moment the verdict stamp comes down */
  stamp: { frame: number; text: string } | null;
  /** voice-over, a path inside public/ */
  audio: string | null;
  /** how loud the game's own sound plays under the voice (0-1) */
  gameVolume: number;
  /** sound effects (paths inside public/) and the frames they play on */
  sfx: { src: string; frame: number; volume?: number }[];
  handle: string | null;
  accent: string;
  /** frames of picture and music before the voice and subtitles begin */
  lead?: number;
  /** the channel's mark, e.g. GTA6ISOVERRATED: white type, the last word on a red block */
  watermark?: string | null;
  /** a small series label above the title, e.g. "OVERHYPED #1" */
  tag?: string | null;
  /** a licensed music bed under the voice (path inside public/) */
  music?: string | null;
  musicVolume?: number;
};

const W = 1080;
const H = 1920;
const BAND_TOP = 560;
const BAND_H = Math.round((W * 9) / 16);
const RED = '#E8202A';

const stroke = (px: number): React.CSSProperties => ({ WebkitTextStroke: `${px}px #0A0A0A`, paintOrder: 'stroke fill' });

/** Clip i starts on this frame of the short: clips play back to back. */
const starts = (clips: Clip[], fps: number) => {
  const out: number[] = [];
  let at = 0;
  for (const c of clips) {
    out.push(at);
    at += Math.max(1, Math.round((c.end - c.start) * fps));
  }
  return { out, total: at };
};

const Footage: React.FC<{ src: string | null; clip: Clip; fps: number; volume: number; blur?: boolean; local: number; len: number }> = ({ src, clip, fps, volume, blur, local, len }) => {
  // a slow push in across the clip, plus the clip's own punch-in
  const push = 1 + 0.06 * (local / Math.max(1, len));
  const z = (clip.zoom || 1) * push;
  const at = `${((clip.fx ?? 0.5) * 100).toFixed(1)}% ${((clip.fy ?? 0.5) * 100).toFixed(1)}%`;
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: at,
    transform: `scale(${z.toFixed(4)})`,
    transformOrigin: at,
    filter: blur ? 'blur(36px) brightness(0.5) saturate(1.2)' : 'brightness(0.78) saturate(1.1)',
  };
  if (!src) {
    // placeholder for layout checks: a moving gradient with a grid
    const hue = (local * 2) % 360;
    return <div style={{ ...style, background: `linear-gradient(${local}deg, hsl(${hue} 60% 35%), hsl(${(hue + 80) % 360} 60% 20%))` }} />;
  }
  return <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(clip.start * fps)} volume={blur ? 0 : volume} muted={blur || volume <= 0} style={style} />;
};

const Title: React.FC<{ lines: string[]; hl: string | null; frame: number; tag?: string | null; r?: number }> = ({ lines, hl, frame, tag, r = 1 }) => {
  const k = interpolate(frame * r, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const size = lines.some((l) => l.length > 16) ? 74 : 88;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: tag ? 236 : 250, textAlign: 'center', transform: `scale(${1.25 - 0.25 * k})`, opacity: k }}>
      {tag ? (
        <div style={{ display: 'inline-block', background: RED, borderRadius: 8, padding: '4px 16px 6px', marginBottom: 14, transform: 'rotate(-2deg)', boxShadow: '0 4px 0 #0A0A0A' }}>
          <span style={{ ...headStyle(40, '#FFFFFF'), letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tag}</span>
        </div>
      ) : null}
      {lines.map((l, i) => (
        <div key={i} style={{ ...headStyle(size, '#FFFFFF'), ...stroke(12), textTransform: 'uppercase', lineHeight: 1.04, letterSpacing: '-0.01em' }}>
          {l.split(' ').map((w, j) => {
            const on = hl && w.replace(/[^A-Za-z0-9$]/g, '').toLowerCase() === hl.replace(/[^A-Za-z0-9$]/g, '').toLowerCase();
            return (
              <span key={j} style={on ? { background: RED, padding: '0 14px', margin: '0 4px', borderRadius: 8, WebkitTextStroke: '0px', display: 'inline-block', transform: 'rotate(-2deg)' } : undefined}>
                {w}{' '}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Captions: React.FC<{ pages: CaptionPage[]; frame: number; layout: 'band' | 'full'; r?: number }> = ({ pages, frame, layout, r = 1 }) => {
  const page = pages.find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;
  const top = layout === 'band' ? BAND_TOP + BAND_H + 70 : 1180;
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top, textAlign: 'center' }}>
      {page.words.map((w, i) => {
        const on = frame >= w.from && frame < (page.words[i + 1]?.from ?? page.to);
        const pop = on ? interpolate((frame - w.from) * r, [0, 3, 6], [1.18, 1.06, 1], { extrapolateRight: 'clamp' }) : 1;
        const shown = frame >= w.from;
        return (
          <span key={i} style={{ ...headStyle(104, on ? '#FFE135' : '#FFFFFF'), ...stroke(14), textShadow: '0 6px 18px rgba(0,0,0,0.65)', display: 'inline-block', margin: '0 12px', textTransform: 'uppercase', lineHeight: 1.05, transform: `scale(${pop})`, opacity: shown ? 1 : 1 }}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/** The channel's mark: GTA6IS in white, OVERRATED on a red block. Type only, drawn in code. */
export const Watermark: React.FC<{ text: string; size?: number; style?: React.CSSProperties }> = ({ text, size = 40, style }) => {
  const m = /^(.*?)(OVERRATED|OVERHYPED|MID)$/i.exec(text.replace(/\s+/g, ''));
  const head = m ? m[1] : text;
  const tail = m ? m[2] : '';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      <span style={{ ...headStyle(size, '#FFFFFF'), ...stroke(Math.max(4, size / 7)), textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1 }}>
        {/* digits in yellow, so GTA6 never reads as GTAG at phone size */}
        {head.split(/(\d+)/).map((part, i) => (/^\d+$/.test(part) ? <span key={i} style={{ color: '#FFE135' }}>{part}</span> : <span key={i}>{part}</span>))}
      </span>
      {tail ? (
        <span style={{ ...headStyle(size, '#FFFFFF'), textTransform: 'uppercase', lineHeight: 1, background: RED, borderRadius: size / 6, padding: `${size * 0.1}px ${size * 0.22}px ${size * 0.14}px`, marginLeft: size * 0.08, boxShadow: `0 ${size / 10}px 0 #0A0A0A`, transform: 'rotate(-2deg)', display: 'inline-block' }}>{tail}</span>
      ) : null}
    </div>
  );
};

const Stamp: React.FC<{ text: string; local: number; r?: number }> = ({ text, local, r = 1 }) => {
  if (local < 0) return null;
  const s = interpolate(local * r, [0, 5, 8], [2.6, 0.94, 1], { extrapolateRight: 'clamp' });
  const o = interpolate(local * r, [0, 2], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: BAND_TOP + BAND_H / 2 - 110, display: 'flex', justifyContent: 'center', opacity: o, transform: `rotate(-11deg) scale(${s})` }}>
      <div style={{ border: `14px solid ${RED}`, borderRadius: 18, padding: '6px 34px 12px', background: 'rgba(10,10,10,0.35)' }}>
        <div style={{ ...headStyle(150, RED), textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{text}</div>
      </div>
    </div>
  );
};

export const Gameplay: React.FC<GameplayProps> = (p) => {
  const frame = useCurrentFrame();
  const { out, total } = starts(p.clips, p.fps);
  // clips loop if the voice runs longer than the footage chosen
  const t = total > 0 ? frame % total : 0;
  let ci = 0;
  for (let i = 0; i < out.length; i++) if (t >= out[i]) ci = i;
  const clip = p.clips[ci] || { start: 0, end: 1 };
  const local = t - (out[ci] || 0);
  const len = Math.max(1, Math.round((clip.end - clip.start) * p.fps));
  const r = 30 / (p.fps || 30);
  const cut = local * r < 3 ? 1 - (local * r) / 3 : 0;
  const sl = p.stamp ? frame - p.stamp.frame : -1;
  const st = sl * r;
  const shake = sl >= 0 && st < 10 ? Math.sin(st * 2.7) * (10 - st) * 2.2 : 0;
  const flash = sl >= 0 && st < 4 ? 0.55 * (1 - st / 4) : 0;
  const band = p.layout === 'band';
  return (
    <Materials>
      <AbsoluteFill style={{ background: '#0A0A0A', overflow: 'hidden' }}>
        <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
          {/* behind: the same footage, blurred, filling the frame */}
          {band ? (
            <AbsoluteFill>
              <Sequence key={`b${ci}-${Math.floor(frame / Math.max(1, total))}`} from={frame - local} durationInFrames={len} layout="none">
                <Footage src={p.footage} clip={clip} fps={p.fps} volume={0} blur local={local} len={len} />
              </Sequence>
            </AbsoluteFill>
          ) : null}
          {/* the footage itself */}
          <div style={band ? { position: 'absolute', left: 0, top: BAND_TOP, width: W, height: BAND_H, overflow: 'hidden', boxShadow: '0 0 0 6px #0A0A0A, 0 30px 80px rgba(0,0,0,0.6)' } : { position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <Sequence key={`f${ci}-${Math.floor(frame / Math.max(1, total))}`} from={frame - local} durationInFrames={len} layout="none">
              <Footage src={p.footage} clip={clip} fps={p.fps} volume={p.gameVolume} local={local} len={len} />
            </Sequence>
            {cut > 0 ? <AbsoluteFill style={{ background: '#FFFFFF', opacity: cut * 0.35 }} /> : null}
          </div>
          {!band ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 26%, rgba(0,0,0,0.2) 48%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.75) 100%)' }} /> : null}
          <Stamp text={p.stamp?.text || ''} local={p.stamp ? sl : -1} r={r} />
        </AbsoluteFill>
        <Title lines={p.title} hl={p.hl} frame={frame} tag={p.tag} r={r} />
        <Captions pages={p.captions} frame={frame} layout={p.layout} r={r} />
        {p.watermark ? (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1458, display: 'flex', justifyContent: 'center', opacity: 0.92 }}>
            <Watermark text={p.watermark} size={46} />
          </div>
        ) : null}
        {flash > 0 ? <AbsoluteFill style={{ background: RED, opacity: flash, mixBlendMode: 'screen' }} /> : null}
        {p.audio ? (
          <Sequence from={p.lead ?? 0} layout="none">
            <Audio src={staticFile(p.audio)} />
          </Sequence>
        ) : null}
        {p.music ? <Audio src={staticFile(p.music)} volume={(f) => interpolate(f, [0, 0.8 * (p.fps || 30)], [0, p.musicVolume ?? 0.16], { extrapolateRight: 'clamp' })} loop /> : null}
        {p.sfx.map((s, i) => (
          <Sequence key={i} from={s.frame} layout="none">
            <Audio src={staticFile(s.src)} volume={s.volume ?? 0.8} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </Materials>
  );
};

export type ThumbProps = { image: string | null; lines: string[]; hl: string | null; stamp: string | null; watermark: string | null; fx?: number; fy?: number; zoom?: number };

/** A vertical thumbnail: one bright frame of the gameplay, the hook huge, the verdict stamped across it. */
export const GameplayThumb: React.FC<ThumbProps> = (p) => {
  const at = `${((p.fx ?? 0.45) * 100).toFixed(1)}% ${((p.fy ?? 0.3) * 100).toFixed(1)}%`;
  const size = p.lines.some((l) => l.length > 14) ? 112 : 136;
  return (
    <Materials>
      <AbsoluteFill style={{ background: '#0A0A0A', overflow: 'hidden' }}>
        {p.image ? <Img src={staticFile(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: at, transform: `scale(${p.zoom ?? 1.25})`, transformOrigin: at, filter: 'brightness(0.95) saturate(1.35) contrast(1.08)' }} /> : null}
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 34%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.7) 100%)' }} />
        <div style={{ position: 'absolute', left: 50, right: 50, top: 300, textAlign: 'center' }}>
          {p.lines.map((l, i) => (
            <div key={i} style={{ ...headStyle(size, '#FFFFFF'), ...stroke(16), textTransform: 'uppercase', lineHeight: 1.02, letterSpacing: '-0.015em' }}>
              {l.split(' ').map((w, j) => {
                const on = p.hl && w.replace(/[^A-Za-z0-9$]/g, '').toLowerCase() === p.hl.replace(/[^A-Za-z0-9$]/g, '').toLowerCase();
                return (
                  <span key={j} style={on ? { background: RED, padding: '0 18px', margin: '0 6px', borderRadius: 12, WebkitTextStroke: '0px', display: 'inline-block', transform: 'rotate(-2deg)', boxShadow: '0 8px 0 #0A0A0A' } : undefined}>
                    {w}{' '}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        {p.stamp ? (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', transform: 'rotate(-10deg)' }}>
            <div style={{ border: `16px solid ${RED}`, borderRadius: 20, padding: '8px 36px 14px', background: 'rgba(10,10,10,0.45)' }}>
              <div style={{ ...headStyle(150, RED), textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1 }}>{p.stamp}</div>
            </div>
          </div>
        ) : null}
        {p.watermark ? (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center' }}>
            <Watermark text={p.watermark} size={54} />
          </div>
        ) : null}
      </AbsoluteFill>
    </Materials>
  );
};
