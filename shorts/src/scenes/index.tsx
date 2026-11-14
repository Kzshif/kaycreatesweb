// Scene registry: maps a storyboard scene type to the component that draws it.
import React from 'react';
import { Icon } from '../icons';
import { useLook } from '../look';
import { ICONS, STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';
import { Breakdown } from './Breakdown';
import { Chart } from './Chart';
import { Counter } from './Counter';
import { Flow } from './Flow';
import { Hook } from './Hook';
import { Icons } from './Icons';
import { Kinetic } from './Kinetic';
import { WorldMap } from './Map';
import { Mockup } from './Mockup';
import { Ratio } from './Ratio';
import { Split } from './Split';
import { Timeline } from './Timeline';
import { Versus } from './Versus';

/** Developer-only sheet of every icon. Not a storyboard scene type. */
const IconSheet: React.FC<SceneProps> = () => {
  const look = useLook();
  return (
    <div style={{ position: 'absolute', left: 30, top: 40, width: 1020, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14 }}>
      {(ICONS as string[]).map((n) => (
        <div key={n} style={{ textAlign: 'center' }}>
          <Icon name={n} size={128} color={look.fg} accent={look.accent} />
          <div style={{ fontFamily: '"JetBrains Mono"', fontSize: 19, color: look.muted }}>{n}</div>
        </div>
      ))}
    </div>
  );
};

export const REGISTRY: Record<string, React.FC<SceneProps>> = {
  hook: Hook,
  kinetic: Kinetic,
  flow: Flow,
  chart: Chart,
  counter: Counter,
  breakdown: Breakdown,
  split: Split,
  map: WorldMap,
  timeline: Timeline,
  mockup: Mockup,
  icons: Icons,
  ratio: Ratio,
  versus: Versus,
  _icons: IconSheet,
};

export const SceneSwitch: React.FC<SceneProps> = ({ scene }) => {
  const C = REGISTRY[scene.type];
  if (!C) throw new Error(`No scene component for type "${scene.type}"`);
  return <C scene={scene} />;
};

export const STAGE_RECT = STAGE;
