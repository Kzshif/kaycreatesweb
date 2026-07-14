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
              "radial-gradient(closest-side, rgba(255,180,84,0.35), rgba(240,101,149,0.22) 45%, rgba(59,201,219,0.08) 70%, transparent 75%)",
            filter: "blur(18px)",
          }}
        />
        {/* the orb */}
        <div
          className="core-breathe absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,214,150,0.95), rgba(255,180,84,0.85) 30%, rgba(240,101,149,0.8) 62%, rgba(90,60,160,0.85) 100%)",
            boxShadow:
              "0 0 60px rgba(255,180,84,0.45), 0 0 140px rgba(240,101,149,0.3), inset -18px -22px 48px rgba(26,23,53,0.55)",
          }}
        />
        {/* spinning rings with motes */}
        <div className="core-ring absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stellar/30">
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-stellar shadow-[0_0_12px_rgba(59,201,219,0.9)]" />
        </div>
        <div className="core-ring-rev absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-nebula/25">
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-nebula shadow-[0_0_10px_rgba(240,101,149,0.9)]" />
          <span className="absolute -top-1 left-[12%] h-1.5 w-1.5 rounded-full bg-nova shadow-[0_0_8px_rgba(255,180,84,0.9)]" />
        </div>
        <div
          className="core-ring-slow absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
          style={{ transform: "translate(-50%, -50%) rotateX(68deg)" }}
        />
      </div>
    </div>
  );
}
