"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// The warp: every arrival is a journey. On first visit the site opens with a
// hyperspace jump — stars streaking past while the NOVA/05 wordmark scales up
// out of deep space. Navigating between pages fires a shorter jump. All of it
// collapses to instant navigation under prefers-reduced-motion.

type WarpState = "idle" | "intro" | "jumping" | "fading";

const WarpContext = createContext<{ jump: (href: string) => void }>({ jump: () => {} });

export function useWarp() {
  return useContext(WarpContext);
}

/** Link that jumps to lightspeed before navigating. */
export function WarpLink({
  href,
  className = "",
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { jump } = useWarp();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        onClick?.();
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new-tab etc.
        e.preventDefault();
        jump(href);
      }}
    >
      {children}
    </Link>
  );
}

export function WarpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<WarpState>("idle");
  const stateRef = useRef<WarpState>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedRef = useRef(false);

  const set = useCallback((s: WarpState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // Hyperspace intro, once per browser session, on the home page only.
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current) return;
    if (pathname !== "/") return;
    try {
      if (sessionStorage.getItem("nova_intro_seen")) return;
      sessionStorage.setItem("nova_intro_seen", "1");
    } catch {
      return;
    }
    set("intro");
    const t1 = setTimeout(() => set("fading"), 2000);
    const t2 = setTimeout(() => set("idle"), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jump = useCallback(
    (href: string) => {
      if (href === pathname) return;
      if (reducedRef.current || stateRef.current !== "idle") {
        router.push(href);
        return;
      }
      set("jumping");
      setTimeout(() => router.push(href), 420);
      setTimeout(() => set("fading"), 700);
      setTimeout(() => set("idle"), 1150);
    },
    [pathname, router, set],
  );

  // Hyperspace streak field while the overlay is up.
  useEffect(() => {
    if (state === "idle") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    interface Streak {
      angle: number;
      dist: number;
      speed: number;
      tint: string;
    }
    const TINTS = ["244, 242, 255", "244, 242, 255", "59, 201, 219", "255, 180, 84", "240, 101, 149"];
    const streaks: Streak[] = Array.from({ length: 260 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 20 + Math.random() * Math.max(w, h) * 0.5,
      speed: 2 + Math.random() * 6,
      tint: TINTS[Math.floor(Math.random() * TINTS.length)],
    }));

    let raf = 0;
    const maxDist = Math.hypot(cx, cy) + 60;
    const step = () => {
      ctx.fillStyle = "rgba(26, 23, 53, 0.32)";
      ctx.fillRect(0, 0, w, h);
      for (const s of streaks) {
        s.speed *= 1.035; // accelerate into the jump
        const prev = s.dist;
        s.dist += s.speed;
        const x1 = cx + Math.cos(s.angle) * prev;
        const y1 = cy + Math.sin(s.angle) * prev;
        const x2 = cx + Math.cos(s.angle) * s.dist;
        const y2 = cy + Math.sin(s.angle) * s.dist;
        const a = Math.min(0.9, s.dist / (maxDist * 0.7));
        ctx.strokeStyle = `rgba(${s.tint}, ${a.toFixed(3)})`;
        ctx.lineWidth = Math.min(2.4, 0.4 + s.dist / maxDist * 2.2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (s.dist > maxDist) {
          s.dist = 10 + Math.random() * 60;
          s.speed = 2 + Math.random() * 6;
        }
      }
      raf = requestAnimationFrame(step);
    };
    ctx.fillStyle = "#1a1735";
    ctx.fillRect(0, 0, w, h);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return (
    <WarpContext.Provider value={{ jump }}>
      {children}
      {state !== "idle" && (
        <div
          className={`fixed inset-0 z-[100] bg-space ${state === "fading" ? "fade-out" : ""}`}
          onClick={() => state === "intro" && set("fading")}
          role="presentation"
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          {state === "intro" && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="warp-zoom-in text-center">
                {/* The iconic mark: the 5 tucked under the O, so it reads 05. */}
                <p
                  className="font-display text-6xl font-bold tracking-[0.16em] text-starlight sm:text-8xl"
                  style={{ textShadow: "0 0 60px rgba(255,180,84,0.5), 0 0 120px rgba(240,101,149,0.35)" }}
                  aria-label="NOVA 05"
                >
                  N
                  <span className="relative inline-block">
                    <span className="grad-text">O</span>
                    <span
                      className="grad-text absolute left-1/2 top-[96%] -translate-x-1/2 text-[0.5em] font-bold tracking-normal"
                      aria-hidden
                    >
                      5
                    </span>
                  </span>
                  VA
                </p>
                <p className="mt-16 text-xs font-semibold uppercase tracking-[0.5em] text-starlight/40 sm:mt-20">
                  One studio · every orbit
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </WarpContext.Provider>
  );
}
