import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { ZODIAC_IDS, isZodiac, zodiacInfo, zodiacName } from "@/lib/zodiac";

export const alt = "별자리 오늘의 운세";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ZODIAC_IDS.map((sign) => ({ sign }));
}

/** 점수·날짜 없이 고정 — 캐시된 미리보기가 지난 점수를 보여주지 않게. 텍스트는 가운데 560px 안 */
export default async function OgImage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const name = isZodiac(sign) ? zodiacName(sign) : "별자리";
  const symbol = isZodiac(sign) ? zodiacInfo(sign).symbol : "☀️";
  const text = `${name} 오늘의 운세 매일 업데이트 몇점이야? · score.drawyourmind.com`;
  const fontData = await loadKoreanFont(text);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)", fontFamily: fontData ? "NotoKR" : "sans-serif", color: "white", padding: 60 }}>
        <div style={{ display: "flex", fontSize: 110, lineHeight: 1 }}>{symbol}</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, marginTop: 16 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>오늘의 운세</div>
        <div style={{ display: "flex", fontSize: 32, marginTop: 12, opacity: 0.85 }}>매일 업데이트</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 28, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
