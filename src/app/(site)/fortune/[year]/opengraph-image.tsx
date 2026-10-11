import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { ttiInfo, ttiName } from "@/lib/tti";
import { FORTUNE_YEARS, fortuneRanking, isFortuneYear, yearLabel } from "@/lib/fortune";
import { getFortuneTtis } from "@/lib/fortune-content";

export const alt = "띠별 신년운세";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 텍스트는 가운데 560px 안에 둔다 (네이버 캐러셀 정사각형 크롭 대응) */
export function generateStaticParams() {
  return FORTUNE_YEARS.filter((y) => getFortuneTtis(y).length).map((y) => ({ year: String(y) }));
}

export default async function OgImage({ params }: { params: Promise<{ year: string }> }) {
  const n = Number((await params).year);
  const year = isFortuneYear(n) ? n : 2027;
  const { ganji, color, tti } = yearLabel(year);
  const top = fortuneRanking(year).slice(0, 3);
  const chips = top.map((r) => `${ttiInfo(r.tti).ko} ${r.score}점`);
  const sub = `${ganji} · ${color}의 해`;
  const text = `${year} 띠별 신년운세 ${sub} ${chips.join("")} ${ttiName(tti)} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 100, lineHeight: 1 }}>{ttiInfo(tti).emoji}</div>
        <div style={{ display: "flex", fontSize: 34, opacity: 0.85, marginTop: 16 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, lineHeight: 1.1 }}>
          {year} 띠별 운세
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                fontSize: 28,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, opacity: 0.7 }}>
          몇점이야? · score.drawyourmind.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [],
    },
  );
}
