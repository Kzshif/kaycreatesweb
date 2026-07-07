import { ImageResponse } from "next/og";

export const alt = "nova05 — the AI receptionist for UK clinics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded share/preview image used by social platforms and AI search.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(900px 500px at 15% 0%, rgba(62,240,224,0.22), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(139,123,255,0.28), transparent 60%), #05070f",
          color: "#eef2ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3ef0e0, #8b7bff)",
              color: "#05070f",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            n
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>nova05</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Your front desk, never off the clock.
          </div>
          <div style={{ fontSize: 32, color: "#9fb0c9", maxWidth: 880 }}>
            The AI receptionist for UK dental, GP, physio &amp; veterinary practices —
            answers every call 24/7. From £79/month.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 24, color: "#7af6ea" }}>
          Built in Newbury, UK
        </div>
      </div>
    ),
    { ...size },
  );
}
