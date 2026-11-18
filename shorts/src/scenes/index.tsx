// Scene type -> the component that draws it. The names match src/shared/spec.mjs.
import type React from 'react';
import type { SceneProps } from '../types';
import { Flow, Grid, Split, Words } from './ideas';
import { Count, CutNote, Slam, Stacks } from './money';
import { ProductScene, ReceiptScene, StampScene, TagScene } from './things';

export const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {
  slam: Slam,
  count: Count,
  stacks: Stacks,
  cut: CutNote,
  receipt: ReceiptScene,
  tag: TagScene,
  product: ProductScene,
  stamp: StampScene,
  flow: Flow,
  split: Split,
  words: Words,
  grid: Grid,
};
