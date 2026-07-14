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
                "radial-gradient(1100px 650px at 50% -14%, rgba(123,63,242,0.22), transparent 62%), radial-gradient(900px 500px at -10% 40%, rgba(34,211,238,0.06), transparent 55%), radial-gradient(700px 500px at 60% 110%, rgba(168,85,247,0.08), transparent 60%)",
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
