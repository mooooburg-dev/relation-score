import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import {
  MBTI_LIST,
  getRanking,
  getType,
  ko,
  normalizeMbti,
} from "@/lib/mbti";

/**
 * 본문에 싣는 "유형별 궁합표" 이미지.
 *
 * opengraph-image 는 URL 에 빌드 해시가 붙어 본문 <img> 로 쓸 수 없어 따로 둔다.
 * 본문에 실제 <img> 가 있어야 네이버 웹문서 결과에 썸네일이 붙고,
 * 궁합표 형태라 이미지 검색에서도 잡힌다.
 */
export const dynamic = "force-static";
export const contentType = "image/png";

const SIZE = { width: 1000, height: 1150 };

export function generateStaticParams() {
  return MBTI_LIST.map((t) => ({ type: t.toLowerCase() }));
}

/** 점수 구간별 셀 색상 */
function cellStyle(score: number) {
  if (score >= 85) return { bg: "#7F77DD", fg: "#ffffff", sub: "rgba(255,255,255,0.75)" };
  if (score >= 78) return { bg: "#A8A2E8", fg: "#ffffff", sub: "rgba(255,255,255,0.8)" };
  if (score >= 70) return { bg: "#D5D2F4", fg: "#3B357A", sub: "rgba(59,53,122,0.65)" };
  if (score >= 62) return { bg: "#ECEBFA", fg: "#4A4590", sub: "rgba(74,69,144,0.6)" };
  return { bg: "#F5F5F7", fg: "#6B6B76", sub: "rgba(107,107,118,0.7)" };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const t = normalizeMbti(type);
  if (!t) return new Response("Not found", { status: 404 });

  const content = getType(t);
  const ranking = getRanking(t);

  const heading = `${t} 궁합표`;
  const sub = `${ko(t)} · ${content?.nickname ?? ""}`;
  const footer = "몇점이야? · score.drawyourmind.com";

  // 서브셋 폰트라 렌더에 쓰는 글자를 모두 넘겨야 한다.
  // MBTI 알파벳과 숫자를 빠뜨리면 그 글자만 폴백 폰트로 떨어져 굵기가 들쭉날쭉해진다.
  const text =
    heading +
    sub +
    footer +
    MBTI_LIST.join("") +
    ranking.map((r) => ko(r.other)).join("") +
    "0123456789점";
  const fontData = await loadKoreanFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          fontFamily: fontData ? "NotoKR" : "sans-serif",
          padding: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#7F77DD", fontWeight: 800 }}>
            {sub}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              color: "#1E1B33",
              marginTop: 4,
            }}
          >
            {heading}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {ranking.map((r) => {
            const c = cellStyle(r.score);
            return (
              <div
                key={r.other}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 214,
                  height: 176,
                  borderRadius: 24,
                  background: c.bg,
                  padding: 20,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{ display: "flex", fontSize: 40, fontWeight: 800, color: c.fg }}
                  >
                    {r.other}
                  </div>
                  <div style={{ display: "flex", fontSize: 24, color: c.sub }}>
                    {ko(r.other)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div
                    style={{ display: "flex", fontSize: 52, fontWeight: 800, color: c.fg }}
                  >
                    {r.score}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 22,
                      color: c.sub,
                      paddingBottom: 10,
                    }}
                  >
                    점
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#9A97B8",
            marginTop: "auto",
            paddingTop: 20,
          }}
        >
          {footer}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: fontData
        ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }]
        : [],
    },
  );
}
