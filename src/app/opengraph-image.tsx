import { ImageResponse } from "next/og";

export const alt = "몇점이야? - MBTI 궁합 점수 테스트";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "몇점이야?";
const SUBTITLE = "MBTI로 보는 우리 궁합 점수";

// Google Fonts에서 사용 글자만 서브셋으로 받아 한글 렌더링
async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@800&text=${encodeURIComponent(
      text,
    )}`;
    const css = await (await fetch(url)).text();
    const src = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    );
    if (!src) return null;
    const res = await fetch(src[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const fontData = await loadKoreanFont(TITLE + SUBTITLE);

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
          gap: "28px",
          background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)",
          fontFamily: fontData ? "NotoKR" : "sans-serif",
        }}
      >
        <div style={{ fontSize: 150, display: "flex" }}>🔮</div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: "#ffffff",
            display: "flex",
          }}
        >
          {TITLE}
        </div>
        <div
          style={{
            fontSize: 46,
            color: "rgba(255,255,255,0.85)",
            display: "flex",
          }}
        >
          {SUBTITLE}
        </div>
      </div>
    ),
    {
      ...size,
      emoji: "twemoji",
      fonts: fontData
        ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }]
        : undefined,
    },
  );
}
