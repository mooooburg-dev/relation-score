import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { decodeNameShare, nameMatch, nameMatchEmoji, nameMatchLabel } from "@/lib/name-match";

export const alt = "이름 궁합 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 공유 미리보기(카톡 등). 텍스트는 가운데 560px 안에 둔다 */
export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const names = decodeNameShare((await params).code);
  const [a, b] = names ?? ["이름", "궁합"];
  const ab = names ? nameMatch(a, b).score : 0;
  const ba = names ? nameMatch(b, a).score : 0;
  const label = names ? nameMatchLabel(ab) : "";
  const text = `${a} ♥ ${b} 이름 궁합 ${ab}% ${ba}% ${label} → 몇점이야? · score.drawyourmind.com`;
  const fontData = await loadKoreanFont(text);
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
          color: "white",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", fontSize: 40, opacity: 0.85 }}>이름 궁합</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, marginTop: 8 }}>
          {a} ♥ {b}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: 150, fontWeight: 800, lineHeight: 1, marginTop: 12 }}>
          {ab}
          <span style={{ fontSize: 56, marginLeft: 8, marginBottom: 16 }}>% {nameMatchEmoji(ab)}</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 16, opacity: 0.95 }}>
          {label} · 반대로는 {ba}%
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, opacity: 0.7 }}>
          몇점이야? · score.drawyourmind.com
        </div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
