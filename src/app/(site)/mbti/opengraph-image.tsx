import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";

export const alt = "MBTI 궁합표 - 16가지 유형별 궁합 순위";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "MBTI 궁합표";
const SUBTITLE = "16가지 유형별 궁합 순위";
const FOOTER = "몇점이야? · score.drawyourmind.com";

/**
 * /mbti 는 metadata 에서 openGraph 를 덮어써 상위 OG 이미지가 빠지므로 따로 둔다.
 * 유형 OG 이미지와 마찬가지로 텍스트는 가운데 560px 안에 둔다.
 */
export default async function OgImage() {
  const fontData = await loadKoreanFont(TITLE + SUBTITLE + FOOTER);

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
        <div style={{ display: "flex", fontSize: 120 }}>🔮</div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 800, marginTop: 8 }}>
          {TITLE}
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 8, opacity: 0.9 }}>
          {SUBTITLE}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, opacity: 0.7 }}>
          {FOOTER}
        </div>
      </div>
    ),
    {
      ...size,
      emoji: "twemoji",
      fonts: fontData
        ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }]
        : [],
    },
  );
}
