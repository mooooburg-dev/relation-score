import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { TTI_LIST } from "@/lib/tti";

export const alt = "띠 궁합표 - 12띠 궁합 점수";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "띠 궁합표";
const SUBTITLE = "12띠 78가지 조합 궁합 점수";
const FOOTER = "몇점이야? · score.drawyourmind.com";

/**
 * /tti 는 metadata 에서 openGraph 를 덮어써 상위 OG 이미지가 빠지므로 따로 둔다.
 * 네이버 캐러셀의 정사각형 크롭에 대비해 텍스트는 가운데 560px 안에 둔다.
 */
export default async function OgImage() {
  const fontData = await loadKoreanFont(`${TITLE}${SUBTITLE}${FOOTER}`);
  const rows = [TTI_LIST.slice(0, 6), TTI_LIST.slice(6)];

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
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 14, fontSize: 64, lineHeight: 1.15 }}>
            {row.map((t) => (
              <span key={t.id}>{t.emoji}</span>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1.1, marginTop: 20 }}>
          {TITLE}
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 8, opacity: 0.9 }}>{SUBTITLE}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 36, opacity: 0.7 }}>{FOOTER}</div>
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
