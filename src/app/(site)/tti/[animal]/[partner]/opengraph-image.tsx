import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import {
  allTtiPairs,
  isTti,
  ttiInfo,
  ttiName,
  ttiScoreEmoji,
  ttiScoreLabel,
} from "@/lib/tti";
import { getTtiPair } from "@/lib/tti-content";

export const alt = "띠 궁합 점수";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 텍스트는 가운데 560px 안에 둔다 (네이버 캐러셀 정사각형 크롭 대응) */
export function generateStaticParams() {
  return allTtiPairs()
    .filter(([a, b]) => getTtiPair(a, b))
    .map(([animal, partner]) => ({ animal, partner }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ animal: string; partner: string }>;
}) {
  const { animal, partner } = await params;
  const pair = isTti(animal) && isTti(partner) ? getTtiPair(animal, partner) : null;
  const a = pair ? ttiInfo(pair.a) : null;
  const b = pair ? ttiInfo(pair.b) : null;
  const names = pair ? `${ttiName(pair.a)} × ${ttiName(pair.b)}` : "띠 궁합";
  const score = pair?.score ?? 0;
  const label = pair ? ttiScoreLabel(score) : "";
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
        <div style={{ display: "flex", fontSize: 80, lineHeight: 1, gap: 24 }}>
          <span>{a?.emoji ?? ""}</span>
          <span>{b?.emoji ?? ""}</span>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, marginTop: 16 }}>
          {names}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 8,
            fontSize: 140,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {score}
          <span style={{ fontSize: 48, marginLeft: 12, marginBottom: 16, opacity: 0.8 }}>
            점 {ttiScoreEmoji(score)}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 20, opacity: 0.95 }}>{label}</div>
        {basis && (
          <div style={{ display: "flex", fontSize: 30, marginTop: 6, opacity: 0.8 }}>{basis}</div>
        )}
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, opacity: 0.7 }}>
          몇점이야? · score.drawyourmind.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }]
        : [],
    },
  );
}
