// A ten-second motion and sound test of the Paper Money identity, made from the same kit as the
// style board and real figures from pilot 001. It shows what stills cannot: paper moving on twos
// while type and numbers glide, arrivals with weight, a page tearing away, coins stacking to the
// spoken figure, the mid-video pattern break, a camera whip, a stamp, and the caption highlighter.
import { Audio } from '@remotion/media';
import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame } from 'remotion';
import { BRIGHT, SHADOW, rgba, tokens } from '../shared/paper.mjs';
import { Captions, type CapPage } from '../paper/Captions';
import { Camera, Cut, Desk, Headline, Label, Layer, Light, LookProvider, Materials, Numeral, Scraps, Slip, airborne, clamp, drift, fit, glide, hash, jit, lerp, measure, onTwos, ramp, settle, sheet, thump, useLook, wobble } from '../paper/kit';
import { Coin, CoinStack, stackBox, stackHeight, type Fall } from '../paper/money';
import { Probe } from '../paper/Probe';
import { InkPad, Offcuts, Pencil, Specks, Stamp, StampTool } from '../paper/things';
import { EARNED, FEES, motionPlan } from './motion-plan.mjs';

export type MotionCues = { billion: number; just: number; walk: number; s2: number; earned: number; earnedEnd: number; s3: number; half: number };
export type MotionProps = { durationInFrames: number; captions: CapPage[]; cues: MotionCues; audio: string | null; probe?: boolean };

const TEAR = 11;
const WHIP = 7;
/** A short, dying shake of the camera when something heavy lands. */
const shake = (frame: number, at: number, amp = 13, dur = 9): { x: number; y: number } => {
  const k = frame - at;
  if (k < 0 || k >= dur) return { x: 0, y: 0 };
  const fall = (1 - k / dur) ** 2;
  return { x: jit(at, k, amp) * fall, y: jit(at, k + 40, amp) * fall };
};
/** A piece of paper dropping onto the desk, on twos: where it is and how far above the desk. */
const drop = (frame: number, at: number, seed: number, from: [number, number, number] = [0, -240, -14]) => {
  const f = onTwos(frame);
  const p = thump(f, at, 9, 0.1);
  const wb = f > at + 12 ? wobble(seed, frame, 0.7) : { x: 0, y: 0, r: 0 };
  return { x: from[0] * (1 - p) + wb.x, y: from[1] * (1 - p) + wb.y, r: from[2] * (1 - p) + wb.r, lift: 0.2 + airborne(f, at, 6) * 1.1, on: f >= at };
};

// ------------------------------------------------------------------ hook
const Hook: React.FC<{ cues: MotionCues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const t = useLook();
  const plan = motionPlan(cues);
  const size = fit(['$5.3'], 'numeral', 700, 400);
  const numTop = 392;
  const headTop = numTop + size * 0.86 + 2;
  const slam = thump(frame, 0, 9, 0.12);
  const slip = drop(frame, plan.slipAt, 3, [-30, -170, -16]);
  const inA = settle(ramp(frame, cues.billion - 3, 8));
  const inB = settle(ramp(frame, cues.just - 3, 8));
  const under = glide(ramp(frame, cues.walk - 1, 9));
  const coins = [
    { x: 826, y: 706, r: 96, rot: 18 },
    { x: 930, y: 878, r: 70, rot: -24 },
    { x: 742, y: 1316, r: 78, rot: 40 },
    { x: 888, y: 1402, r: 62, rot: -12 },
  ];
  return (
    <>
      <Layer depth={1}>
        {slip.on ? <Slip text="Shoppers paid" size={26} seed={4} tape rot={-2 + slip.r} lift={slip.lift * 0.6} style={{ left: 86 + slip.x, top: 314 + slip.y }} /> : null}
        <div style={{ position: 'absolute', left: 72, top: numTop, transform: `scale(${(1.12 - 0.12 * slam).toFixed(4)}) rotate(${(-2.5 * (1 - slam)).toFixed(2)}deg)`, transformOrigin: '0% 62%' }}>
          <Numeral text="$5.3" size={size} />
        </div>
        <div style={{ position: 'absolute', left: 80, top: headTop + 46 * (1 - inA), opacity: inA }}>
          <Headline lines={['billion']} width={700} max={196} />
        </div>
        <div style={{ position: 'absolute', left: 84, top: headTop + 186 + 36 * (1 - inB), opacity: inB }}>
          <Headline lines={['just to walk in']} width={760} max={92} />
          <svg width={420} height={30} style={{ position: 'absolute', left: measure('just to ', 'headline', 92) - 6, top: 86, overflow: 'visible' }}>
            <path d="M0 14 C 60 4, 130 22, 200 12 S 300 8, 336 16" fill="none" stroke={t.accent} strokeWidth={11} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - under} />
          </svg>
        </div>
      </Layer>
      <Layer depth={1.5}>
        {coins.map((c, i) => {
          const d = drop(frame, plan.hookCoins[i], 40 + i, [jit(40, i, 60), -340, jit(41, i, 40)]);
          return d.on ? <Coin key={i} r={c.r} seed={41 + i} lift={d.lift * 0.5} style={{ left: c.x + d.x, top: c.y + d.y, transform: `rotate(${c.rot + d.r}deg)` }} /> : null;
        })}
      </Layer>
      <Layer depth={1}>
        <Slip text="Source: Costco results, fiscal 2025" size={21} seed={7} tape rot={-1.4} style={{ left: 86, top: 1410 }} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------ coin chart
const Chart: React.FC<{ cues: MotionCues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const t = useLook();
  const plan = motionPlan(cues);
  const cw = 226;
  const th = 24;
  const base = 968;
  const f2 = onTwos(frame);
  const stacks = [
    { label: 'Fees', total: FEES.value, count: FEES.coins, cx: 292, seed: 71, run: plan.left },
    { label: 'Earned', total: EARNED.value, count: EARNED.coins, cx: 664, seed: 72, run: plan.right },
  ];
  return (
    <>
      <Layer depth={0.5}>
        <Cut w={900} h={96} d={sheet(900, 96, { seed: 73, edges: 'ctct', rough: 4, m: 10 }).d} core={sheet(900, 96, { seed: 73, edges: 'ctct', rough: 4, m: 10 }).core} color={t.inverted ? '#2A2620' : t.card} dark={t.inverted} seed={73} lift={0.1} style={{ left: 40, top: base - 34, transform: 'rotate(-0.6deg)' }} />
      </Layer>
      <Layer depth={1}>
        {stacks.map((s) => {
          const box = stackBox(s.count, cw, th);
          const landAt = (i: number) => s.run.start + i * s.run.every + 5;
          // each coin is dealt onto the stack from the side over two steps (so it never crosses the
          // figure above), then sits; the count follows the coins that have landed
          const side = s.cx < 480 ? -1 : 1;
          const fall = (i: number): Fall => {
            const k = landAt(i) - f2;
            if (k > 5.01) return { show: false };
            if (k > 0) return { dx: side * (k / 5) * 200, dy: 10 + (k / 5) * 34, rot: side * k * 2.4 + jit(s.seed, i, 3) };
            return {};
          };
          const done = clamp((frame - s.run.start - 5) / (s.count * s.run.every));
          const started = frame >= s.run.start;
          const size = 96;
          const text = `$${(s.total * done).toFixed(1)}bn`;
          const nw = measure(`$${s.total.toFixed(1)}bn`, 'numeral', size);
          const top = base - stackHeight(s.count, cw, th);
          const pop = settle(ramp(frame, s.run.start - 2, 7));
          return (
            <React.Fragment key={s.label}>
              <CoinStack count={s.count} w={cw} th={th} seed={s.seed} fall={fall} style={{ left: s.cx - box.W / 2, top: base - box.foot }} />
              {started ? (
                <div style={{ position: 'absolute', left: s.cx - nw / 2, top: top - size * 0.86 - 30 + 24 * (1 - pop), opacity: pop }}>
                  <Numeral text={text} size={size} />
                </div>
              ) : null}
              <Label size={26} color={t.type} style={{ position: 'absolute', left: s.cx - measure(s.label.toUpperCase(), 'label', 26) / 2, top: base + 12 }}>
                {s.label}
              </Label>
            </React.Fragment>
          );
        })}
        <Slip text="1 coin = $500 million" size={22} seed={74} rot={1.6} style={{ left: 92, top: 1312 }} />
        <Slip text="Source: Costco results, fiscal 2025" size={21} seed={7} tape rot={-1.4} style={{ left: 86, top: 1410 }} />
      </Layer>
      <Layer depth={1.2}>
        <Pencil length={470} style={{ left: 480, top: 1380, transform: 'rotate(14deg)' }} />
        <Offcuts seed={75} n={6} spread={[300, 150]} style={{ left: 560, top: 1250 }} />
      </Layer>
    </>
  );
};

// ----------------------------------------------------------------- stamp
const Verdict: React.FC<{ cues: MotionCues }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const plan = motionPlan(cues);
  const size = fit(['51%'], 'numeral', 690, 400);
  const n = Math.round(51 * glide(ramp(frame, plan.countFrom, plan.countEnd - plan.countFrom)));
  const head = settle(ramp(frame, plan.countFrom + 8, 9));
  const at = plan.stampAt;
  const f2 = onTwos(frame);
  // the stamp comes down in three steps, sits for a beat, then is lifted clear
  const down = glide(ramp(f2, at - 7.5, 7.5));
  const up = glide(ramp(f2, at + 5, 12));
  const k = frame < at + 5 ? down : 1 - up;
  const tool = { x: lerp(792, 500, k), y: lerp(300, 548, k), rot: lerp(15, -9, k), lift: lerp(1.15, 0.05, k), scale: lerp(1, 1.04, k) };
  const pressed = frame >= at;
  const squeeze = 1 + 0.07 * (1 - settle(ramp(frame, at, 4)));
  return (
    <>
      <Layer depth={0.5}>
        <Cut w={640} h={520} d={sheet(640, 520, { seed: 81, edges: 'tttt', rough: 5, m: 12 }).d} core={sheet(640, 520, { seed: 81, edges: 'tttt', rough: 5, m: 12 }).core} color={tokens('green').card} seed={81} lift={0.1} style={{ left: -60, top: 520, transform: 'rotate(-5deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Slip text="Fees as a share of what it earned" size={22} seed={82} tape rot={-1.5} style={{ left: 86, top: 316 }} />
        <div style={{ position: 'absolute', left: 70, top: 392 }}>
          <Numeral text={`${n}%`} size={size} />
        </div>
        <div style={{ position: 'absolute', left: 84, top: 856 + 30 * (1 - head), opacity: head }}>
          <Headline lines={['of what Costco earned']} width={800} max={84} />
        </div>
        {pressed ? (
          <>
            <Specks seed={83} n={16} spread={[560, 250]} style={{ left: 300, top: 600 }} />
            <div style={{ position: 'absolute', left: 318, top: 624, width: 540, transform: `scale(${squeeze.toFixed(3)})`, transformOrigin: '50% 50%' }}>
              <Stamp lines={['About half']} sub="Costco · fiscal 2025" width={540} rot={-9} seed={84} style={{ left: 0, top: 0 }} />
            </div>
          </>
        ) : null}
      </Layer>
      <Layer depth={1.6}>
        <StampTool size={270} lift={tool.lift} style={{ left: tool.x, top: tool.y, transform: `rotate(${tool.rot.toFixed(1)}deg) scale(${tool.scale.toFixed(3)})` }} />
      </Layer>
      <Layer depth={1.25}>
        <InkPad w={330} seed={85} style={{ left: 548, top: 1296, transform: 'rotate(7deg)' }} />
      </Layer>
      <Layer depth={1}>
        <Slip text="Source: Costco results, fiscal 2025" size={21} seed={7} tape rot={-1.4} style={{ left: 86, top: 1410 }} />
      </Layer>
    </>
  );
};

// ------------------------------------------------------------ transitions
/** Everything left of a ragged, slightly leaning line at x: the part of a page not yet torn away. */
const tornLeft = (x: number, seed: number, extra = 0): string => {
  const pts: string[] = ['-80 -80'];
  for (let y = -80; y <= 2000; y += 20) pts.push(`${(x + extra + (y - 960) * 0.11 + Math.sin(y / 95 + seed) * 20 + jit(seed, y, 11 + extra * 0.4)).toFixed(1)} ${y}`);
  pts.push('-80 2000');
  return `M${pts.join('L')}Z`;
};

const Series: React.FC = () => {
  const t = useLook();
  return (
    <div style={{ position: 'absolute', left: 78, top: 244, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 17, height: 17, background: t.accent, transform: 'rotate(-4deg)' }} />
      <Label size={25} color={t.type}>
        No. 001 · Costco
      </Label>
    </div>
  );
};

export const Motion: React.FC<MotionProps> = ({ captions, cues, audio, probe }) => {
  const frame = useCurrentFrame();
  const plan = motionPlan(cues);
  // the pattern break: for a quarter of a second the whole desk is printed in negative and the camera punches in
  const broke = frame >= plan.breakAt && frame < plan.breakAt + 8;
  const punch = frame >= plan.breakAt ? 0.05 * (1 - settle(ramp(frame, plan.breakAt, 16))) : 0;
  const d = drift(frame, 3);
  const s = [shake(frame, plan.slamAt, 15, 9), shake(frame, plan.breakAt, 6, 8), shake(frame, plan.stampAt, 14, 9)].reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }), { x: 0, y: 0 });
  const tear = ramp(onTwos(frame), cues.s2, TEAR);
  const tearX = lerp(1240, -220, tear ** 1.15);
  const whip = ramp(frame, cues.s3, WHIP);
  const showHook = frame < cues.s2 + TEAR;
  const showChart = frame >= cues.s2 && frame < cues.s3 + WHIP;
  const showVerdict = frame >= cues.s3;
  const whipping = whip > 0 && whip < 1;
  return (
    <Materials>
      <LookProvider value={tokens('green', broke)}>
        <AbsoluteFill id="short-root" style={{ overflow: 'hidden' }}>
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <filter id="whip" x="-20%" y="0" width="140%" height="100%">
              <feGaussianBlur stdDeviation="38 0" />
            </filter>
          </svg>
          <Desk />
          <Camera seed={3} cam={{ x: d.x + s.x, y: d.y + s.y, zoom: d.zoom + punch }}>
            <Layer depth={0.35}>
              <Scraps seed={12} />
            </Layer>
            {showVerdict ? (
              <AbsoluteFill style={{ transform: `translateX(${(1300 * (1 - glide(whip))).toFixed(1)}px)`, filter: whipping ? 'url(#whip)' : undefined }}>
                <Verdict cues={cues} />
              </AbsoluteFill>
            ) : null}
            {showChart ? (
              <AbsoluteFill style={{ transform: `translateX(${(-1300 * glide(whip)).toFixed(1)}px)`, filter: whipping ? 'url(#whip)' : undefined }}>
                <Chart cues={cues} />
              </AbsoluteFill>
            ) : null}
            {showHook ? (
              tear > 0 ? (
                <>
                  {/* the page being torn off: its ragged white core shows along the tear, and it casts a shadow on what is underneath */}
                  <AbsoluteFill style={{ filter: `drop-shadow(16px 4px 14px ${rgba(SHADOW, 0.4)})` }}>
                    <AbsoluteFill style={{ clipPath: `path('${tornLeft(tearX, 5, 16)}')`, background: BRIGHT }} />
                  </AbsoluteFill>
                  <AbsoluteFill style={{ clipPath: `path('${tornLeft(tearX, 5)}')` }}>
                    <Desk />
                    <Layer depth={0.35}>
                      <Scraps seed={12} />
                    </Layer>
                    <Hook cues={cues} />
                  </AbsoluteFill>
                </>
              ) : (
                <Hook cues={cues} />
              )
            ) : null}
          </Camera>
          <Light />
          <Series />
          <Captions pages={captions} />
          {audio ? <Audio src={staticFile(audio)} /> : null}
          {probe ? <Probe /> : null}
        </AbsoluteFill>
      </LookProvider>
    </Materials>
  );
};
