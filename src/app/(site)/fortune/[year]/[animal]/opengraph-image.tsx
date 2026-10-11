import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { isTti, ttiInfo, ttiName, ttiScoreEmoji } from "@/lib/tti";
import { FORTUNE_YEARS, fortuneLabel, isFortuneYear, samjae, yearLabel } from "@/lib/fortune";
import { getFortune, getFortuneTtis } from "@/lib/fortune-content";

export const alt = "띠별 신년운세 점수";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 텍스트는 가운데 560px 안에 둔다 (네이버 캐러셀 정사각형 크롭 대응) */
export function generateStaticParams() {
  return FORTUNE_YEARS.flatMap((y) =>
    getFortuneTtis(y).map((animal) => ({ year: String(y), animal })),
  );
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ year: string; animal: string }>;
}) {
  const p = await params;
  const year = Number(p.year);
  const f = isFortuneYear(year) && isTti(p.animal) ? getFortune(year, p.animal) : null;
  const name = f ? ttiName(f.tti) : "띠별";
  const score = f?.score ?? 0;
  const label = f ? fortuneLabel(score) : "";
  const sj = f ? samjae(year, f.tti) : null;
  const sub = `${yearLabel(year).ganji}${sj ? ` · ${sj}` : ""}`;
  const text = `${year}년 ${name} 운세 ${score}점 ${label} ${sub} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 90, lineHeight: 1 }}>
          {f ? ttiInfo(f.tti).emoji : ""}
        </div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85, marginTop: 12 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.15 }}>
          {year}년 {name} 운세
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 8,
            fontSize: 130,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {score}
          <span style={{ fontSize: 46, marginLeft: 12, marginBottom: 14, opacity: 0.8 }}>
            점 {ttiScoreEmoji(score)}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 16, opacity: 0.95 }}>{label}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 28, opacity: 0.7 }}>
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
