import { ImageResponse } from "next/og";

export const alt = "FileFixer — Fix your files. Keep them private.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0B1220",
          position: "relative",
          padding: "70px 60px 50px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Background ambient waves matching reference */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-10%",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(6,182,212,0.12) 40%, rgba(0,0,0,0) 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "800px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(29,78,216,0.22) 0%, rgba(37,99,235,0.08) 50%, rgba(0,0,0,0) 75%)",
            filter: "blur(70px)",
          }}
        />

        {/* Center Logo Lockup (Mark + Wordmark + Tagline) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "60px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {/* SVG Logo Mark */}
            <svg
              viewBox="0 0 95 110"
              width="115"
              height="133"
              fill="none"
            >
              <defs>
                <linearGradient id="og-grad" x1="6" y1="8" x2="85" y2="103">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="35%" stopColor="#3B82F6" />
                  <stop offset="70%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <path
                d="M 59 8 L 19 8 C 11 8 6 13 6 21 L 6 82 C 6 86.5 10 88.5 14 85 L 24 74 C 21.5 68 21 61 23 54 C 26 44 34 39 45 39 L 85 39 L 85 34.5 L 59 8 Z"
                fill="url(#og-grad)"
              />
              <path
                d="M 59 8 L 59 31.5 C 59 33.5 61 34.5 63 34.5 L 85 34.5 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 42 45 L 81 45 C 83.5 45 85.5 47 85.5 49.5 L 85.5 56.5 C 85.5 59 83.5 61 81 61 L 45 61 C 41 61 38.5 57.5 40 53.5 C 41 50 40.5 46.5 42 45 Z"
                fill="url(#og-grad)"
              />
              <path
                d="M 38 69 L 84 69 L 57 103 L 32 103 C 27 103 24 98 28 92 L 38 69 Z"
                fill="url(#og-grad)"
              />
              <path
                d="M 39 47 C 34 50 30 55 28 62 C 27.5 66 26 71 23 75 L 12 87 C 7 92 6 97 8 100 C 10 102.5 14 103 17 100 L 30 88 C 33 85 37 82 41 81 C 46 80 52 78 57 68 C 57.5 67 56 66 54 67 L 47 69 C 43 70 40 68 39 64 C 38.5 60 41 56 45 54 L 49 51 C 50.5 50 49 48 47 48 L 39 47 Z"
                fill="#FFFFFF"
              />
            </svg>

            {/* Wordmark */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "90px",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  color: "#F8FAFC",
                  lineHeight: 1,
                }}
              >
                File
                <span style={{ color: "#3882F6" }}>Fixer</span>
              </div>
              <div
                style={{
                  fontSize: "21px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  marginTop: "12px",
                }}
              >
                FIX YOUR FILES. KEEP THEM PRIVATE.
              </div>
            </div>
          </div>
        </div>

        {/* 4 Feature Badges (Matching Reference Image) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "50px",
            zIndex: 10,
            width: "100%",
            borderTop: "1px solid rgba(30, 41, 59, 0.7)",
            paddingTop: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F8FAFC", fontSize: "17px", fontWeight: 600 }}>
            <span style={{ color: "#FCD34D" }}>⚡</span> Fast
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F8FAFC", fontSize: "17px", fontWeight: 600 }}>
            <span style={{ color: "#38BDF8" }}>🛡️</span> Private
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F8FAFC", fontSize: "17px", fontWeight: 600 }}>
            <span style={{ color: "#06B6D4" }}>❇️</span> Browser-based
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F8FAFC", fontSize: "17px", fontWeight: 600 }}>
            <span style={{ color: "#818CF8" }}>💻</span> Works Everywhere
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
