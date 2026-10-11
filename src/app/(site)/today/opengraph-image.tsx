import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";

export const alt = "오늘의 운세 - 띠별·별자리별";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 미리보기는 날짜·점수 없이 고정한다 — 캐시된 썸네일이 며칠 지난 점수를 보여주지 않게
const TITLE = "오늘의 운세";
const SUB = "12띠 · 12별자리 매일 업데이트";
const FOOTER = "몇점이야? · score.drawyourmind.com";

export default async function OgImage() {
  const fontData = await loadKoreanFont(`${TITLE}${SUB}${FOOTER}`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)", fontFamily: fontData ? "NotoKR" : "sans-serif", color: "white", padding: 60 }}>
        <div style={{ display: "flex", fontSize: 120, lineHeight: 1 }}>☀️</div>
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, marginTop: 16 }}>{TITLE}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 8, opacity: 0.9 }}>{SUB}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 36, opacity: 0.7 }}>{FOOTER}</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
