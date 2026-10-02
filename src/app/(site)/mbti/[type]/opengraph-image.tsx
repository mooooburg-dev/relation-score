import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { MBTI_LIST, getRanking, getType, ko, normalizeMbti } from "@/lib/mbti";

export const alt = "MBTI 궁합 순위";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 네이버 이미지 캐러셀 등은 1200×630 을 가운데 정사각형(약 630px 폭)으로 잘라 쓴다.
 * 모든 텍스트를 가운데 560px 안에 두어 잘려도 읽히게 한다.
 */
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
  const nickname = t ? `${ko(t)} · ${content?.nickname ?? ""}` : "궁합 순위";
  const text = `${title} 궁합 순위 ${nickname} ${top.map((r) => `${r.other} ${r.score}점`).join("")} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", gap: 14, marginTop: 32 }}>
          {top.map((r) => (
            <div
              key={r.other}
              style={{
                display: "flex",
                fontSize: 28,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              {`${r.other} ${r.score}점`}
            </div>
          ))}
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
