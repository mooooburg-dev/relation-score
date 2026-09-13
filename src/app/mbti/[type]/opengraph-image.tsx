import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { MBTI_LIST, getRanking, getType, normalizeMbti } from "@/lib/mbti";

export const alt = "MBTI 궁합 순위";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return MBTI_LIST.map((t) => ({ type: t.toLowerCase() }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const t = normalizeMbti(type);
  const content = t ? getType(t) : null;
  const top = t ? getRanking(t).slice(0, 3) : [];
  const title = t ?? "MBTI";
  const nickname = content?.nickname ?? "궁합 순위";
  const topText = top.map((r, i) => `${i + 1}위 ${r.other} ${r.score}점`).join("   ");
  const text = `${title} 궁합 순위 ${nickname} ${topText} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 40, opacity: 0.85 }}>{nickname}</div>
        <div style={{ display: "flex", fontSize: 140, fontWeight: 800, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, marginTop: 8 }}>
          궁합 순위
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 36, opacity: 0.95 }}>
          {topText}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 36, opacity: 0.7 }}>
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
