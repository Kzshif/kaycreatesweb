// The look engine: turns the five look choices in a storyboard into concrete
// colours, fonts, corner radii and motion settings used by every scene.
import React, { createContext, useContext } from 'react';
import { ACCENTS, GROUNDS, MOTIONS, SHAPES, TYPE_VOICES } from './shared/spec.mjs';
import type { LookSpec } from './types';

type SpringCfg = { damping: number; stiffness: number; mass: number };

export type Look = {
  spec: LookSpec;
  dark: boolean;
  bg: string;
  bg2: string;
  fg: string;
  muted: string;
  line: string;
  card: string;
  /** neutral ramp for de-emphasised marks, quiet -> strong */
  n: [string, string, string];
  pattern: string;
  accent: string;
  onAccent: string;
  display: string;
  displayWeight: number;
  upper: boolean;
  tracking: number;
  text: string;
  bold: number;
  label: string;
  caption: string;
  captionWeight: number;
  radius: number;
  spring: SpringCfg;
  enter: 'pop' | 'rise' | 'drop' | 'wipe';
  cut: 'flash' | 'fade' | 'zoom' | 'shutter';
  travel: number;
  captions: string;
};

const CAPTION_FACE: Record<string, [string, number]> = {
  grotesk: ['Archivo', 800],
  editorial: ['DM Sans', 800],
  tech: ['Space Grotesk', 700],
  poster: ['Inter', 800],
  quirky: ['Bricolage Grotesque', 800],
  soft: ['Inter', 800],
  wide: ['Inter', 800],
};

export const resolveLook = (spec: LookSpec): Look => {
  const g = GROUNDS[spec.ground] ?? GROUNDS.ink;
  const a = ACCENTS[spec.accent] ?? ACCENTS.lime;
  const v = TYPE_VOICES[spec.type] ?? TYPE_VOICES.grotesk;
  const m = MOTIONS[spec.motion] ?? MOTIONS.snap;
  const dark = g.mode === 'dark';
  const [caption, captionWeight] = CAPTION_FACE[spec.type] ?? CAPTION_FACE.grotesk;
  return {
    spec,
    dark,
    bg: g.bg,
    bg2: g.bg2,
    fg: g.fg,
    muted: g.muted,
    line: g.line,
    card: g.card,
    n: g.n,
    pattern: g.pattern,
    accent: dark ? a.dark : a.light,
    onAccent: dark ? a.onDark : a.onLight,
    display: v.display,
    displayWeight: v.displayWeight,
    upper: v.upper,
    tracking: v.tracking,
    text: v.text,
    bold: v.text === 'Bricolage Grotesque' ? 800 : 700,
    label: v.label,
    caption,
    captionWeight,
    radius: SHAPES[spec.shape] ?? 20,
    spring: m.spring,
    enter: m.enter,
    cut: m.cut,
    travel: m.travel,
    captions: spec.captions,
  };
};

const LookContext = createContext<Look | null>(null);

export const LookProvider: React.FC<{ look: Look; children: React.ReactNode }> = ({ look, children }) => (
  <LookContext.Provider value={look}>{children}</LookContext.Provider>
);

export const useLook = (): Look => {
  const look = useContext(LookContext);
  if (!look) throw new Error('useLook() outside <LookProvider>');
  return look;
};
