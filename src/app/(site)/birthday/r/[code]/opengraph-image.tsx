import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { birthdayLabel, birthdayMatch, decodeBirthdayShare } from "@/lib/birthday-match";
import { YEAR_MAX, ttiInfo, ttiName } from "@/lib/tti";
import { zodiacInfo, zodiacName } from "@/lib/zodiac";

export const alt = "생일 궁합 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 공유 미리보기. 생년월일은 그리지 않는다 (띠·별자리·점수만). 텍스트는 가운데 560px 안 */
export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const dates = decodeBirthdayShare((await params).code, YEAR_MAX);
  const r = dates ? birthdayMatch(dates[0], dates[1]) : null;
  const tti = r ? `${ttiName(r.ttiA)} × ${ttiName(r.ttiB)}` : "";
  const zod = r ? `${zodiacName(r.zodiacA)} × ${zodiacName(r.zodiacB)}` : "";
  const label = r ? birthdayLabel(r.score) : "";
  const text = `생일 궁합 ${r?.score ?? 0}점 ${tti} ${zod} ${label} 몇점이야? · score.drawyourmind.com`;
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
        <div style={{ display: "flex", fontSize: 64, gap: 16, lineHeight: 1 }}>
          {r ? (
            <>
              <span>{ttiInfo(r.ttiA).emoji}</span>
              <span>{zodiacInfo(r.zodiacA).symbol}</span>
              <span>🎂</span>
              <span>{ttiInfo(r.ttiB).emoji}</span>
              <span>{zodiacInfo(r.zodiacB).symbol}</span>
            </>
          ) : (
            <span>🎂</span>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, marginTop: 16 }}>생일 궁합</div>
        <div style={{ display: "flex", alignItems: "flex-end", fontSize: 140, fontWeight: 800, lineHeight: 1 }}>
          {r?.score ?? 0}
          <span style={{ fontSize: 48, marginLeft: 10, marginBottom: 14, opacity: 0.8 }}>점</span>
        </div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 12 }}>{label}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 8, opacity: 0.85 }}>{tti}</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>{zod}</div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 24, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
