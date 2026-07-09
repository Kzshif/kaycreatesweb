"use client";

import { useRef } from "react";

// Lovable-style 3D tilt: cards lean toward the cursor with a moving glare.
// Pure transform — no layout shift — and inert under prefers-reduced-motion.

export default function Tilt({
  children,
  max = 10,
  className = "",
}: {
  children: React.ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * max;
    const ry = (px - 0.5) * max;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    const g = glareRef.current;
    if (g) {
      g.style.opacity = "1";
      g.style.background = `radial-gradient(420px circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.10), transparent 55%)`;
    }
  }

  function leave() {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    const g = glareRef.current;
    if (g) g.style.opacity = "0";
  }

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
        aria-hidden
      />
    </div>
  );
}
