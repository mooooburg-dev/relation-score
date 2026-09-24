import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { getAllPairs, getPair, ko, pairSlug, parsePairSlug, scoreEmoji } from "@/lib/mbti";

export const alt = "MBTI 궁합 점수";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPairs().map((p) => ({ slug: pairSlug(p.a, p.b) }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parsed = parsePairSlug(slug);
  const pair = parsed ? getPair(parsed[0], parsed[1]) : null;
  const a = pair?.a ?? "MBTI";
  const b = pair?.b ?? "궁합";
  const score = pair?.overall ?? 0;
  const headline = pair?.headline ?? "MBTI 궁합 점수";
  const sub = pair ? `${ko(pair.a)} × ${ko(pair.b)} 궁합` : "MBTI 궁합";
  const text = `${sub}${a} × ${b} 궁합 ${score}점 ${headline} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 40, opacity: 0.85 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, marginTop: 8 }}>
          {a} × {b}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            marginTop: 20,
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {score}
          <span style={{ fontSize: 48, marginLeft: 12, marginBottom: 18, opacity: 0.8 }}>
            점 {scoreEmoji(score)}
          </span>
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 24, opacity: 0.95 }}>
          {headline}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 40, opacity: 0.7 }}>
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
