"use client";

// The AI core: a breathing gradient orb with spinning rings and orbiting
// motes — the glowing "brain" behind the hero chat. Pure CSS/SVG, no canvas,
// no assets; stills gracefully under prefers-reduced-motion.

export default function AiCore({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="core-wrap relative h-[420px] w-[420px]">
        {/* soft outer glow */}
        <div
          className="core-breathe absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(168,85,247,0.4), rgba(99,102,241,0.25) 45%, rgba(34,211,238,0.1) 70%, transparent 75%)",
            filter: "blur(18px)",
          }}
        />
        {/* the orb */}
        <div
          className="core-breathe absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(216,180,254,0.95), rgba(168,85,247,0.85) 30%, rgba(99,102,241,0.85) 62%, rgba(40,26,90,0.9) 100%)",
            boxShadow:
              "0 0 60px rgba(168,85,247,0.5), 0 0 140px rgba(34,211,238,0.25), inset -18px -22px 48px rgba(11,8,18,0.55)",
          }}
        />
        {/* spinning rings with motes */}
        <div className="core-ring absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stellar/30">
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-stellar shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
        </div>
        <div className="core-ring-rev absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-nebula/25">
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-nebula shadow-[0_0_10px_rgba(99,102,241,0.9)]" />
          <span className="absolute -top-1 left-[12%] h-1.5 w-1.5 rounded-full bg-nova shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
        </div>
        <div
          className="core-ring-slow absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          style={{ transform: "translate(-50%, -50%) rotateX(68deg)" }}
        />
      </div>
    </div>
  );
}
