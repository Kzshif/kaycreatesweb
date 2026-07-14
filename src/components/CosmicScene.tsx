"use client";

// The ambient cartoon: a little world that keeps living behind the content —
// a planet with rings, a rocket on patrol, a drifting astronaut, passing
// comets. Nobody needs to watch it; it just makes the page feel alive.
// Pure SVG + CSS keyframes (see globals.css), pauses under reduced motion.

export default function CosmicScene() {
  return (
    <div className="cosmic-scene pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Ringed planet, bottom right, slow bob */}
      <div className="scene-bob absolute -right-16 top-[16%] opacity-70 sm:right-[4%]">
        <svg width="180" height="180" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="planetG" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#8f7bff" />
              <stop offset="60%" stopColor="#5b46c9" />
              <stop offset="100%" stopColor="#3a2c86" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="104" rx="88" ry="20" fill="none" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="3" />
          <circle cx="100" cy="100" r="52" fill="url(#planetG)" />
          <circle cx="82" cy="86" r="9" fill="#ffffff" opacity="0.12" />
          <circle cx="116" cy="112" r="6" fill="#0b0812" opacity="0.25" />
          <circle cx="104" cy="78" r="4" fill="#0b0812" opacity="0.2" />
          <ellipse cx="100" cy="104" rx="88" ry="20" fill="none" stroke="#a855f7" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 10" />
        </svg>
      </div>

      {/* Rocket on a big slow orbit across the hero */}
      <div className="scene-rocket-path absolute left-1/2 top-[36%]">
        <div className="scene-rocket">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <g transform="rotate(90 32 32)">
              <path d="M32 6 C40 16 42 28 40 40 L24 40 C22 28 24 16 32 6 Z" fill="#f4f2ff" />
              <path d="M32 6 C36 12 38 20 38 28 L26 28 C26 20 28 12 32 6 Z" fill="#c9c2ea" opacity="0.6" />
              <circle cx="32" cy="26" r="5" fill="#22d3ee" stroke="#0b0812" strokeWidth="2" />
              <path d="M24 34 L16 46 L24 44 Z" fill="#a855f7" />
              <path d="M40 34 L48 46 L40 44 Z" fill="#a855f7" />
              <path d="M28 40 L32 54 L36 40 Z" fill="#22d3ee" className="scene-flame" />
            </g>
          </svg>
        </div>
      </div>

      {/* Astronaut, drifting diagonally forever */}
      <div className="scene-astro absolute left-[6%] top-[58%] opacity-80">
        <svg width="56" height="56" viewBox="0 0 64 64">
          <g transform="rotate(-14 32 32)">
            <circle cx="32" cy="20" r="12" fill="#f4f2ff" />
            <circle cx="32" cy="20" r="8" fill="#0b0812" />
            <circle cx="30" cy="18" r="2.5" fill="#22d3ee" opacity="0.9" />
            <rect x="22" y="30" width="20" height="18" rx="7" fill="#f4f2ff" />
            <rect x="14" y="32" width="9" height="5" rx="2.5" fill="#c9c2ea" />
            <rect x="41" y="34" width="9" height="5" rx="2.5" fill="#c9c2ea" transform="rotate(18 45 36)" />
            <rect x="24" y="47" width="6" height="9" rx="3" fill="#c9c2ea" />
            <rect x="34" y="47" width="6" height="9" rx="3" fill="#c9c2ea" transform="rotate(-12 37 51)" />
            <path d="M22 34 C12 30 10 22 16 16" stroke="#a855f7" strokeWidth="1.6" fill="none" strokeDasharray="3 4" opacity="0.8" />
          </g>
        </svg>
      </div>

      {/* Comets */}
      <span className="scene-comet absolute left-[-8%] top-[22%]" />
      <span className="scene-comet scene-comet-2 absolute left-[-8%] top-[64%]" />

      {/* A satellite blinking its way along the top */}
      <div className="scene-sat absolute right-[-6%] top-[10%] opacity-70">
        <svg width="44" height="44" viewBox="0 0 48 48">
          <rect x="19" y="18" width="10" height="12" rx="2" fill="#c9c2ea" />
          <rect x="4" y="21" width="13" height="6" rx="1" fill="#22d3ee" opacity="0.85" />
          <rect x="31" y="21" width="13" height="6" rx="1" fill="#22d3ee" opacity="0.85" />
          <circle cx="24" cy="14" r="2.4" fill="#22d3ee" className="scene-blink" />
        </svg>
      </div>
    </div>
  );
}
