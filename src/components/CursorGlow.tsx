"use client";

import { useEffect, useRef } from "react";

// A soft spotlight that trails the cursor across the page — the modern
// AI-landing touch. Screen-blended so it lifts the twilight background
// without washing out content. No-op on touch devices and reduced motion.

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;

    let x = innerWidth / 2;
    let y = innerHeight / 3;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.background = `radial-gradient(480px circle at ${x}px ${y}px, rgba(240,101,149,0.10), rgba(255,180,84,0.05) 45%, transparent 70%)`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{ mixBlendMode: "screen" }}
      aria-hidden
    />
  );
}
