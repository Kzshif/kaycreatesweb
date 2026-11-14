// Full-frame backgrounds. Decoration only: no text ever lives here, so it is
// free to run under YouTube's buttons.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useLook } from '../look';

export const Ground: React.FC = () => {
  const look = useLook();
  const f = useCurrentFrame();
  const t = f / 30;
  const base: React.CSSProperties = { backgroundColor: look.bg };

  switch (look.pattern) {
    case 'glow': {
      const x = 28 + Math.sin(t * 0.5) * 9;
      const y = 22 + Math.cos(t * 0.4) * 7;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${x}% ${y}%, ${look.accent}2E, transparent 70%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(1100px 1000px at ${92 - x * 0.4}% ${88 - y * 0.3}%, ${look.bg2}, transparent 72%)` }} />
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${look.line} 1.6px, transparent 1.6px)`, backgroundSize: '44px 44px', opacity: 0.35 }} />
        </AbsoluteFill>
      );
    }
    case 'halftone': {
      const shift = Math.sin(t * 0.35) * 14;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${look.line} 5px, transparent 5.6px)`,
              backgroundSize: '30px 30px',
              backgroundPosition: `${shift}px ${shift * 0.6}px`,
              WebkitMaskImage: 'radial-gradient(1150px 1150px at 104% 104%, #000 8%, transparent 62%)',
              maskImage: 'radial-gradient(1150px 1150px at 104% 104%, #000 8%, transparent 62%)',
            }}
          />
          <AbsoluteFill
            style={{
              backgroundImage: `radial-gradient(${look.line} 3.4px, transparent 4px)`,
              backgroundSize: '30px 30px',
              backgroundPosition: `${-shift}px ${shift * 0.4}px`,
              WebkitMaskImage: 'radial-gradient(800px 700px at -6% -4%, #000 4%, transparent 60%)',
              maskImage: 'radial-gradient(800px 700px at -6% -4%, #000 4%, transparent 60%)',
            }}
          />
        </AbsoluteFill>
      );
    }
    case 'grid': {
      const pan = (t * 9) % 90;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${look.line} 2px, transparent 2px), linear-gradient(90deg, ${look.line} 2px, transparent 2px)`,
              backgroundSize: '90px 90px',
              backgroundPosition: `${pan}px ${pan}px`,
              opacity: 0.75,
            }}
          />
          <AbsoluteFill
            style={{
              backgroundImage: `linear-gradient(${look.bg2} 3px, transparent 3px), linear-gradient(90deg, ${look.bg2} 3px, transparent 3px)`,
              backgroundSize: '450px 450px',
              backgroundPosition: `${pan}px ${pan}px`,
            }}
          />
          <AbsoluteFill style={{ background: `radial-gradient(1200px 1500px at 50% 40%, transparent 40%, ${look.bg} 100%)` }} />
        </AbsoluteFill>
      );
    }
    case 'blobs': {
      const a = Math.sin(t * 0.4) * 60;
      const b = Math.cos(t * 0.33) * 50;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ background: `radial-gradient(760px 620px at ${12 + a / 20}% ${14 + b / 20}%, ${look.bg2}, transparent 70%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(900px 760px at ${96 - a / 18}% ${58 + b / 16}%, ${look.bg2}, transparent 68%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(700px 520px at ${30 + b / 16}% ${100 - a / 30}%, ${look.accent}1F, transparent 70%)` }} />
        </AbsoluteFill>
      );
    }
    case 'stripes': {
      const pan = (t * 14) % 120;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, ${look.bg2} 0 60px, transparent 60px 120px)`,
              backgroundPosition: `${pan}px 0`,
              opacity: 0.55,
            }}
          />
          <AbsoluteFill style={{ background: `radial-gradient(1000px 1200px at 40% 38%, transparent 30%, ${look.bg} 96%)` }} />
        </AbsoluteFill>
      );
    }
    case 'dots': {
      const pan = (t * 7) % 56;
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${look.line} 3px, transparent 3.4px)`, backgroundSize: '56px 56px', backgroundPosition: `${pan}px ${pan * 0.5}px` }} />
          <AbsoluteFill style={{ background: `radial-gradient(1000px 1300px at 46% 40%, ${look.bg} 34%, transparent 86%)` }} />
        </AbsoluteFill>
      );
    }
    case 'rules':
      return (
        <AbsoluteFill style={base}>
          <AbsoluteFill style={{ backgroundImage: `linear-gradient(${look.line} 2px, transparent 2px)`, backgroundSize: '100% 76px', backgroundPosition: '0 30px' }} />
          <div style={{ position: 'absolute', left: 38, top: 0, bottom: 0, width: 3, background: look.accent, opacity: 0.45 }} />
          <div style={{ position: 'absolute', left: 48, top: 0, bottom: 0, width: 3, background: look.accent, opacity: 0.2 }} />
        </AbsoluteFill>
      );
    case 'rings':
    default: {
      const grow = 1 + (Math.sin(t * 0.3) + 1) * 0.02;
      return (
        <AbsoluteFill style={base}>
          <svg width={1080} height={1920} style={{ position: 'absolute' }}>
            {Array.from({ length: 9 }, (_, i) => (
              <circle key={i} cx={1010} cy={250} r={(170 + i * 150) * grow} fill="none" stroke={look.line} strokeWidth={2.5} opacity={0.9 - i * 0.07} />
            ))}
          </svg>
          <AbsoluteFill style={{ background: `radial-gradient(900px 800px at 10% 96%, ${look.accent}1C, transparent 70%)` }} />
        </AbsoluteFill>
      );
    }
  }
};
