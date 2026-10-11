import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import {
  allZodiacPairs,
  isZodiac,
  zodiacInfo,
  zodiacName,
  zodiacScoreEmoji,
  zodiacScoreLabel,
} from "@/lib/zodiac";
import { getZodiacPair } from "@/lib/zodiac-content";

export const alt = "별자리 궁합 점수";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 텍스트는 가운데 560px 안에 둔다 (네이버 캐러셀 정사각형 크롭 대응) */
export function generateStaticParams() {
  return allZodiacPairs()
    .filter(([a, b]) => getZodiacPair(a, b))
    .map(([sign, partner]) => ({ sign, partner }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ sign: string; partner: string }>;
}) {
  const { sign, partner } = await params;
  const pair = isZodiac(sign) && isZodiac(partner) ? getZodiacPair(sign, partner) : null;
  const names = pair ? `${zodiacName(pair.a)} × ${zodiacName(pair.b)}` : "별자리 궁합";
  const score = pair?.score ?? 0;
  const label = pair ? zodiacScoreLabel(score) : "";
  const basis = pair?.factors[0]?.name ?? "";
  const text = `${names} 궁합 ${score}점 ${label} ${basis} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 76, lineHeight: 1, gap: 24 }}>
          <span>{pair ? zodiacInfo(pair.a).symbol : ""}</span>
          <span>{pair ? zodiacInfo(pair.b).symbol : ""}</span>
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, marginTop: 16 }}>{names}</div>
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: 8, fontSize: 140, fontWeight: 800, lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: 48, marginLeft: 12, marginBottom: 16, opacity: 0.8 }}>점 {zodiacScoreEmoji(score)}</span>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 20, opacity: 0.95 }}>{label}</div>
        {basis && <div style={{ display: "flex", fontSize: 30, marginTop: 6, opacity: 0.8 }}>{basis}</div>}
        <div style={{ display: "flex", fontSize: 28, marginTop: 28, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
