import Script from "next/script";
import CursorGlow from "@/components/CursorGlow";
import Starfield from "@/components/Starfield";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WarpProvider } from "@/components/Warp";

// Every marketing page lives in Deep Space: one persistent starfield, the
// floating nav, the warp between pages, and the live demo widget in the corner.

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <WarpProvider>
      <div className="relative min-h-screen overflow-x-clip bg-space text-starlight">
        <div className="pointer-events-none fixed inset-0">
          <Starfield />
          {/* Nebula glow pools */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(1000px 600px at 80% -10%, rgba(240,101,149,0.1), transparent 60%), radial-gradient(900px 500px at -10% 40%, rgba(59,201,219,0.07), transparent 55%), radial-gradient(700px 500px at 60% 110%, rgba(255,180,84,0.07), transparent 60%)",
            }}
          />
        </div>
        <CursorGlow />
        <SiteHeader />
        <div className="relative">{children}</div>
        <SiteFooter />
        {/* Dogfood: every marketing page runs the actual embeddable widget. */}
        <Script src="/widget.js" data-bot="demo" strategy="lazyOnload" />
      </div>
    </WarpProvider>
  );
}
