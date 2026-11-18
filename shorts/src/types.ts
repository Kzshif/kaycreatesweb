export type LookSpec = { accent: string; inverted: boolean };

export type SceneData = {
  type: string;
  variant: string;
  /** first frame of the scene, in the whole video */
  from: number;
  duration: number;
  /** frames, relative to the scene start, at which each step appears. cues[0] is always 0. */
  cues: number[];
  /** how the scene arrives: 'tear', 'whip' or 'fold' (null for the first scene) */
  enter: string | null;
  /** a source to credit on a slip while the scene is up */
  source: string | null;
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
  /** what lies under the captions: pencil, coins, inkpad, scissors, clips */
  deck: string;
  scenes: SceneData[];
  captions: CaptionPage[];
  /** path inside public/, or null for a silent preview */
  audio: string | null;
  loopFrames: number;
  /** the mid-video pattern break */
  patternBreak: { frame: number; kind: string; frames: number } | null;
  handle: string | null;
  cta: string | null;
  /** the desk, drawn once per video (paths inside public/); null draws it live */
  backdrop: string | null;
  backdropAlt: string | null;
  /** when true, each frame reports where its text is */
  probe: boolean;
  /** 'backdrop' renders only the desk, for baking */
  only?: 'backdrop';
};

/** What every scene component receives. `frame` is counted from the scene's own start. */
export type SceneProps = { scene: SceneData; frame: number; seed: number };
