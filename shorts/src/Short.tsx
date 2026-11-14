// The one composition every video renders through: background, scenes cut to
// the narration, subtitles, voice, and a seamless loop back to frame 0.
import React, { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Easing, Freeze, Html5Audio, Sequence, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Captions } from './components/Captions';
import { Ground } from './components/Ground';
import { Probe } from './components/Probe';
import { L } from './components/ui';
import { loadFonts } from './fonts';
import { tween } from './lib/anim';
import { LookProvider, resolveLook, useLook } from './look';
import { SceneSwitch } from './scenes';
import { STAGE } from './shared/spec.mjs';
import type { SceneData, ShortProps } from './types';

/** Scene-to-scene cut, in the look's motion style. The first scene has no entrance: frame 0 is complete. */
const SceneShell: React.FC<{ scene: SceneData; first: boolean; children: React.ReactNode }> = ({ scene, first, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const origin = `${STAGE.left + STAGE.width / 2}px ${STAGE.top + STAGE.height / 2}px`;
  let style: React.CSSProperties = {};
  if (!first) {
    if (look.cut === 'flash') {
      const p = tween(frame, 0, 5);
      style = { transform: `scale(${1.035 - 0.035 * p})`, opacity: Math.min(1, 0.35 + frame * 0.4), transformOrigin: origin };
    } else if (look.cut === 'fade') {
      const p = tween(frame, 0, 7);
      const out = tween(frame, scene.duration - 4, 4, Easing.in(Easing.quad));
      style = { transform: `translateY(${(1 - p) * 20}px)`, opacity: p * (1 - out) };
    } else if (look.cut === 'zoom') {
      const p = spring({ frame, fps, config: { damping: 12, stiffness: 190, mass: 0.6 } });
      style = { transform: `scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, frame / 3), transformOrigin: origin };
    } else {
      const p = tween(frame, 0, 7, Easing.out(Easing.quad));
      style = { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
    }
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Channel handle, top-left. Only drawn once channel.json has a real handle. */
const Handle: React.FC<{ text: string }> = ({ text }) => {
  const look = useLook();
  return (
    <div style={{ position: 'absolute', left: STAGE.left, top: 1500 }}>
      <L size={24} color={look.muted}>
        {text}
      </L>
    </div>
  );
};

/** Call to action, shown over the last seconds. Visual only: the spoken last line loops into the first. */
const Cta: React.FC<{ text: string; total: number }> = ({ text, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const look = useLook();
  const start = total - Math.round(3.2 * fps);
  if (frame < start) return null;
  const p = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });
  return (
    <div style={{ position: 'absolute', left: STAGE.left, top: 1218, width: STAGE.width, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * 26}px)`, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ background: look.accent, borderRadius: Math.max(8, look.radius), padding: '9px 26px' }}>
        <L size={27} color={look.onAccent}>
          {text}
        </L>
      </div>
    </div>
  );
};

export const Short: React.FC<ShortProps> = (props) => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    loadFonts().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  const look = useMemo(() => resolveLook(props.look), [props.look]);
  const frame = useCurrentFrame();
  if (!ready) return null;

  const total = props.durationInFrames;
  const loopFrames = Math.min(props.loopFrames, Math.max(0, total - 1));
  const loopStart = total - loopFrames;
  // During the last frames the opening shot fades back in, so the cut from the
  // final frame to frame 0 is invisible when the video loops.
  const loopIn = loopFrames > 0 ? Math.min(1, Math.max(0, (frame - loopStart + 1) / loopFrames)) : 0;

  return (
    <LookProvider look={look}>
      <AbsoluteFill id="short-root" style={{ backgroundColor: look.bg, overflow: 'hidden' }}>
        <Ground />
        <AbsoluteFill style={{ opacity: 1 - loopIn }}>
          {props.scenes.map((s, i) => (
            <Sequence key={i} from={s.from} durationInFrames={s.duration} name={`${i + 1}. ${s.type}/${s.variant}`} layout="none">
              <SceneShell scene={s} first={i === 0}>
                <SceneSwitch scene={s} />
              </SceneShell>
            </Sequence>
          ))}
        </AbsoluteFill>
        {loopFrames > 0 && frame >= loopStart && props.scenes.length ? (
          <AbsoluteFill style={{ opacity: loopIn }}>
            <Freeze frame={0}>
              <SceneSwitch scene={props.scenes[0]} />
            </Freeze>
          </AbsoluteFill>
        ) : null}
        <Captions pages={props.captions} />
        {props.handle ? <Handle text={props.handle} /> : null}
        {props.cta ? <Cta text={props.cta} total={total} /> : null}
        {props.audio ? <Html5Audio src={staticFile(props.audio)} /> : null}
        {props.probe ? <Probe /> : null}
      </AbsoluteFill>
    </LookProvider>
  );
};
