// Scene type: map. Country shapes come from Natural Earth (public domain) via
// the world-atlas package, projected and drawn here as dots or flat shapes.
import React, { useMemo } from 'react';
import { geoAlbersUsa, geoBounds, geoCentroid, geoContains, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { spring } from 'remotion';
import { feature } from 'topojson-client';
import world110 from 'world-atlas/countries-110m.json';
import world50 from 'world-atlas/countries-50m.json';
import { D, Head, SourceLine, Stage, T } from '../components/ui';
import { clamp, tween, useScene } from '../lib/anim';
import { STAGE } from '../shared/spec.mjs';
import type { SceneProps } from '../types';

type Pin = { lat: number; lon: number; label?: string };
type MapProps = { title?: string; region: string; highlight?: string[]; pins?: Pin[]; stat?: { figure: string; label: string }; source?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Feat = any;

const ALIAS: Record<string, string> = { usa: 'United States of America', us: 'United States of America', 'united states': 'United States of America', uk: 'United Kingdom', britain: 'United Kingdom', korea: 'South Korea' };
const canon = (name: string) => ALIAS[name.toLowerCase()] ?? name;

const features = (topo: Feat): Feat[] => (feature(topo, topo.objects.countries) as Feat).features;
let f110: Feat[] | null = null;
let f50: Feat[] | null = null;
const low = () => (f110 ??= features(world110));
const high = () => (f50 ??= features(world50));
const named = (list: Feat[], name: string) => list.filter((f) => f.properties.name === name);

type Built = { shapes: { d: string; name: string }[]; dots: { x: number; y: number; name: string }[]; projection: GeoProjection; h: number };
const cache = new Map<string, Built>();

function build(region: string, w: number, mode: string): Built {
  const key = `${region}|${w}|${mode}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let feats: Feat[];
  let projection: GeoProjection;
  let h: number;
  if (region === 'usa') {
    feats = named(high(), 'United States of America');
    h = 520;
    projection = geoAlbersUsa().fitSize([w, h], { type: 'FeatureCollection', features: feats } as Feat);
  } else if (region === 'uk') {
    feats = [...named(high(), 'United Kingdom'), ...named(high(), 'Ireland')];
    h = 700;
    projection = geoMercator().fitSize([w, h], { type: 'FeatureCollection', features: feats } as Feat);
  } else if (region === 'europe') {
    feats = high().filter((f) => {
      const [lon, lat] = geoCentroid(f);
      return lon > -25 && lon < 42 && lat > 34 && lat < 72 && f.properties.name !== 'Russia';
    });
    h = 700;
    projection = geoMercator().fitSize([w, h], { type: 'MultiPoint', coordinates: [[-10.5, 35.5], [31, 35.5], [31, 60.5], [-10.5, 60.5]] } as Feat);
  } else {
    feats = low().filter((f) => f.properties.name !== 'Antarctica');
    h = 450;
    projection = geoNaturalEarth1().fitSize([w, h], { type: 'FeatureCollection', features: feats } as Feat);
  }
  const path = geoPath(projection);
  const shapes = feats.map((f) => ({ d: path(f) ?? '', name: f.properties.name as string })).filter((x) => x.d);
  const dots: Built['dots'] = [];
  if (mode === 'dots') {
    const step = region === 'world' ? 14.5 : 15;
    const bounds = feats.map((f) => geoBounds(f));
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const ll = projection.invert?.([x, y]);
        if (!ll) continue;
        for (let i = 0; i < feats.length; i++) {
          const [[w0, s0], [e0, n0]] = bounds[i];
          const inLon = w0 <= e0 ? ll[0] >= w0 && ll[0] <= e0 : ll[0] >= w0 || ll[0] <= e0; // a box may cross the date line
          if (!inLon || ll[1] < s0 || ll[1] > n0) continue;
          if (geoContains(feats[i], ll)) {
            dots.push({ x, y, name: feats[i].properties.name });
            break;
          }
        }
      }
    }
  }
  const built = { shapes, dots, projection, h };
  cache.set(key, built);
  return built;
}

export const WorldMap: React.FC<SceneProps> = ({ scene }) => {
  const s = useScene(scene);
  const { look, frame, fps } = s;
  const p = scene.props as MapProps;
  const W = STAGE.width;
  const region = ['usa', 'uk', 'europe'].includes(p.region) ? p.region : 'world';
  const mode = scene.variant === 'outline' ? 'outline' : 'dots';
  const map = useMemo(() => build(region, W, mode), [region, W, mode]);
  const hotNames = new Set((p.highlight || []).map(canon));
  const pins = p.pins || [];
  const hasMarks = pins.length > 0 || hotNames.size > 0;
  const markCue = 1;
  const statCue = hasMarks ? 2 : 1;
  const wave = tween(frame, 0, 16, (x) => x);
  const hotWave = hasMarks ? tween(frame, s.at(markCue), 14, (x) => x) : 0;

  return (
    <Stage style={{ justifyContent: 'center' }}>
      <Head title={p.title} />
      <div style={{ position: 'relative', width: W, height: map.h }}>
        <svg width={W} height={map.h} style={{ position: 'absolute', overflow: 'hidden' }}>
          {mode === 'dots'
            ? map.dots.map((d, i) => {
                const shown = d.x / W <= wave * 1.1;
                if (!shown) return null;
                const hot = hotNames.has(d.name) && (d.x + d.y) / (W + map.h) <= hotWave * 1.15;
                return <circle key={i} cx={d.x} cy={d.y} r={hot ? 5.6 : 4.4} fill={hot ? look.accent : look.n[0]} />;
              })
            : map.shapes.map((sh, i) => {
                const hot = hotNames.has(sh.name);
                return <path key={i} d={sh.d} fill={hot ? look.accent : look.n[0]} fillOpacity={hot ? clamp(hotWave) * 1 + (1 - clamp(hotWave)) * 0 : 1} stroke={look.bg} strokeWidth={2} strokeLinejoin="round" opacity={clamp(wave * 1.4)} />;
              })}
          {mode !== 'dots'
            ? map.shapes
                .filter((sh) => hotNames.has(sh.name) && hotWave < 1)
                .map((sh, i) => <path key={`n${i}`} d={sh.d} fill={look.n[0]} fillOpacity={1 - clamp(hotWave)} stroke="none" />)
            : null}
          {pins.map((pin, i) => {
            const xy = map.projection([pin.lon, pin.lat]);
            if (!xy) return null;
            const pr = spring({ frame: frame - s.at(markCue) - i * 3, fps, config: look.spring });
            const pulse = ((frame - s.at(markCue) - i * 3) % 36) / 36;
            if (frame < s.at(markCue) + i * 3) return null;
            return (
              <g key={`p${i}`}>
                <circle cx={xy[0]} cy={xy[1]} r={14 + pulse * 30} fill="none" stroke={look.accent} strokeWidth={4} opacity={1 - pulse} />
                <circle cx={xy[0]} cy={xy[1]} r={13 * pr} fill={look.accent} stroke={look.bg} strokeWidth={5} />
              </g>
            );
          })}
        </svg>
        {pins.map((pin, i) => {
          const xy = map.projection([pin.lon, pin.lat]);
          if (!xy || !pin.label) return null;
          const left = xy[0] > W * 0.58;
          return (
            <div key={i} style={{ position: 'absolute', top: xy[1] - 26, ...(left ? { right: W - xy[0] + 26 } : { left: xy[0] + 26 }), visibility: frame >= s.at(markCue) + i * 3 ? 'visible' : 'hidden' }}>
              <div style={{ background: look.bg, border: `3px solid ${look.accent}`, borderRadius: Math.min(look.radius, 14), padding: '4px 14px' }}>
                <T size={32} bold style={{ whiteSpace: 'nowrap' }}>
                  {pin.label}
                </T>
              </div>
            </div>
          );
        })}
      </div>
      {p.stat ? (
        <div style={{ marginTop: 34, ...s.enter(statCue) }}>
          <D size={210} lh={0.94} style={{ whiteSpace: 'nowrap' }}>
            {p.stat.figure}
          </D>
          <T size={52} bold style={{ marginTop: 8 }} lh={1.1}>
            {p.stat.label}
          </T>
        </div>
      ) : null}
      <SourceLine text={p.source} />
    </Stage>
  );
};
