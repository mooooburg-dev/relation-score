import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { ZODIAC_IDS, isZodiac, zodiacDates, zodiacInfo, zodiacName } from "@/lib/zodiac";
import { getZodiacRanking, getZodiacType } from "@/lib/zodiac-content";

export const alt = "별자리 궁합 순위";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 텍스트는 가운데 560px 안에 둔다 (네이버 캐러셀 정사각형 크롭 대응) */
export function generateStaticParams() {
  return ZODIAC_IDS.filter((z) => getZodiacType(z)).map((sign) => ({ sign }));
}

export default async function OgImage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const z = isZodiac(sign) ? sign : null;
  const content = z ? getZodiacType(z) : null;
  const top = z ? getZodiacRanking(z).filter((r) => r.other !== z).slice(0, 3) : [];
  const title = z ? zodiacName(z) : "별자리";
  const sub = z ? `${zodiacDates(z)} · ${content?.nickname ?? ""}` : "궁합 순위";
  const chips = top.map((r) => `${zodiacName(r.other).replace("자리", "")} ${r.score}점`);
  const text = `${title} 궁합 ${sub} ${chips.join("")} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 100, lineHeight: 1 }}>{z ? zodiacInfo(z).symbol : ""}</div>
        <div style={{ display: "flex", fontSize: 32, opacity: 0.85, marginTop: 16 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.1 }}>{title} 궁합</div>
        <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{ display: "flex", fontSize: 28, padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}
            >
              {c}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
