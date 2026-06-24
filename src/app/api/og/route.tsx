import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";

// 결과별 동적 OG 이미지: /api/og?score=95&mm=INFJ&om=ENTP&rel=연인&tag=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = Math.max(
    0,
    Math.min(100, Math.round(Number(searchParams.get("score")) || 0)),
  );
  const mm = (searchParams.get("mm") || "").slice(0, 8);
  const om = (searchParams.get("om") || "").slice(0, 8);
  const rel = (searchParams.get("rel") || "").slice(0, 12);
  const tag = (searchParams.get("tag") || "").slice(0, 38);
  const emoji = score >= 80 ? "🔥" : score >= 50 ? "💜" : "💧";

  const fontText = `${mm} × ${om} ${rel} 궁합 ${score}점 ${tag} 몇점이야? · score.drawyourmind.com`;
  const fontData = await loadKoreanFont(fontText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)",
          fontFamily: fontData ? "NotoKR" : "sans-serif",
          padding: "60px",
        }}
      >
        {rel && (
          <div
            style={{
              display: "flex",
              fontSize: 40,
              color: "rgba(255,255,255,0.85)",
              marginBottom: 16,
            }}
          >
            {rel} 궁합
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 8,
          }}
        >
          {mm} × {om}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <span
            style={{ fontSize: 220, fontWeight: 800, color: "#fff", lineHeight: 1 }}
          >
            {score}
          </span>
          <span
            style={{ fontSize: 64, color: "#fff", marginLeft: 10, marginBottom: 28 }}
          >
            점 {emoji}
          </span>
        </div>
        {tag && (
          <div
            style={{
              display: "flex",
              fontSize: 38,
              color: "rgba(255,255,255,0.95)",
              marginTop: 16,
              maxWidth: 1000,
              textAlign: "center",
            }}
          >
            {tag}
          </div>
        )}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            marginTop: 44,
          }}
        >
          몇점이야? · score.drawyourmind.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
      fonts: fontData
        ? [{ name: "NotoKR", data: fontData, weight: 800 as const, style: "normal" as const }]
        : undefined,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    },
  );
}
