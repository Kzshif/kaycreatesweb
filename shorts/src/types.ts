export type LookSpec = {
  accent: string;
  ground: string;
  type: string;
  motion: string;
  captions: string;
  shape: string;
};

export type SceneData = {
  type: string;
  variant: string;
  /** first frame of the scene, in the whole video */
  from: number;
  duration: number;
  /** frames, relative to the scene start, at which each step appears. cues[0] is always 0. */
  cues: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
};

export type CaptionPage = {
  from: number;
  to: number;
  words: { t: string; from: number; to: number }[];
};

export type ShortProps = {
  id: string;
  durationInFrames: number;
  fps: number;
  look: LookSpec;
  scenes: SceneData[];
  captions: CaptionPage[];
  /** path inside public/, or null for a silent preview */
  audio: string | null;
  loopFrames: number;
  handle: string | null;
  cta: string | null;
  /** when true, each frame reports any text that sits in a YouTube button zone */
  probe: boolean;
};

export type SceneProps = {
  scene: SceneData;
};
