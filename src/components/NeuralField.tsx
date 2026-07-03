"use client";

import { useEffect, useRef } from "react";

// The living network (algorithmic-art skill): a constellation of drifting
// nodes joined by proximity — a map of a thinking system. Signals fire as
// bright cyan sparks traveling along the connections; the pointer becomes a
// temporary node the network reaches toward. Seeded and deterministic per
// mount; pauses offscreen; renders a still constellation under
// prefers-reduced-motion.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean; // hubs glow brighter — the network's landmarks
}

interface Spark {
  a: number; // node indices
  b: number;
  t: number; // 0..1 along the edge
  speed: number;
}

const LINK_DIST = 150;
const POINTER_DIST = 190;

export default function NeuralField({
  seed = 20260703,
  density = 110, // nodes per ~megapixel, scaled to canvas area
  opacity = 1,
  interactive = true,
  className = "",
}: {
  seed?: number;
  density?: number;
  opacity?: number;
  interactive?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry32(seed);
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let sparks: Spark[] = [];
    const pointer = { x: -9999, y: -9999, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(36, Math.round((w * h) / 1_000_000 * density));
      nodes = Array.from({ length: count }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 0.35,
        vy: (rand() - 0.5) * 0.35,
        r: 1 + rand() * 1.4,
        hub: rand() < 0.12,
      }));
      sparks = [];
    };

    resize();

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, w, h);

      // --- edges: the map of connections -----------------------------------
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const d = Math.sqrt(d2);
          const strength = 1 - d / LINK_DIST;
          ctx.strokeStyle = `rgba(92, 124, 250, ${(0.05 + strength * 0.3).toFixed(3)})`;
          ctx.lineWidth = a.hub || b.hub ? 1 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Occasionally fire a signal down a strong connection.
          if (animate && strength > 0.45 && sparks.length < 14 && Math.random() < 0.0015) {
            sparks.push({ a: i, b: j, t: 0, speed: 0.012 + Math.random() * 0.02 });
          }
        }

        // The pointer joins the network.
        if (pointer.active) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_DIST * POINTER_DIST) {
            const strength = 1 - Math.sqrt(d2) / POINTER_DIST;
            ctx.strokeStyle = `rgba(34, 211, 238, ${(strength * 0.4).toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // --- nodes: the stations ----------------------------------------------
      for (const n of nodes) {
        if (n.hub) {
          // soft halo
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 10);
          g.addColorStop(0, "rgba(34, 211, 238, 0.5)");
          g.addColorStop(1, "rgba(34, 211, 238, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(180, 240, 255, 0.95)";
        } else {
          ctx.fillStyle = "rgba(92, 124, 250, 0.7)";
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- sparks: signals in flight -----------------------------------------
      ctx.globalCompositeOperation = "lighter";
      for (const s of sparks) {
        const a = nodes[s.a];
        const b = nodes[s.b];
        const x = a.x + (b.x - a.x) * s.t;
        const y = a.y + (b.y - a.y) * s.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, "rgba(34, 211, 238, 0.95)");
        g.addColorStop(0.4, "rgba(92, 124, 250, 0.45)");
        g.addColorStop(1, "rgba(92, 124, 250, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        // short bright tail
        const tx = a.x + (b.x - a.x) * Math.max(0, s.t - 0.08);
        const ty = a.y + (b.y - a.y) * Math.max(0, s.t - 0.08);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const step = () => {
      if (!running) return;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        // drift through the edges and re-enter on the other side
        if (n.x < -10) n.x = w + 10;
        if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10;
        if (n.y > h + 10) n.y = -10;
      }
      for (const s of sparks) s.t += s.speed;
      sparks = sparks.filter((s) => s.t < 1);
      drawFrame(true);
      raf = requestAnimationFrame(step);
    };

    if (reduced) {
      drawFrame(false);
      const onResize = () => {
        resize();
        drawFrame(false);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        running = true;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      } else {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active =
        interactive &&
        pointer.x >= 0 &&
        pointer.y >= 0 &&
        pointer.x <= rect.width &&
        pointer.y <= rect.height;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onResize = () => resize();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [seed, density, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    />
  );
}
