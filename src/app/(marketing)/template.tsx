"use client";

// Re-mounts on every marketing navigation: the new page scales in from
// lightspeed (see .warp-arrive; disabled under prefers-reduced-motion).
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="warp-arrive">{children}</div>;
}
