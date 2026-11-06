import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { dayCount, daysUntil, decodeAnniversaryShare, dLabel, upcoming } from "@/lib/anniversary";
import { kstToday } from "@/lib/daily";

export const alt = "커플 기념일";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 카톡 미리보기. 사귄 날짜는 그리지 않는다 (D-day 만). 텍스트는 가운데 560px 안 */
export default async function OgImage({ params }: { params: Promise<{ code: string }> }) {
  const r = decodeAnniversaryShare((await params).code);
  const today = kstToday();
  const n = r ? dayCount(r.start, today, r.includeStart) : 0;
  const next = r ? upcoming(r.start, today, r.includeStart, 1)[0] : undefined;
  const sub = next ? `${next.label}까지 ${dLabel(daysUntil(next.date, today))}` : "커플 기념일 계산기";
  const fontData = await loadKoreanFont(`우리 D+${n} 사귄 지 일째 ${sub} 몇점이야? · score.drawyourmind.com`);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)", fontFamily: fontData ? "NotoKR" : "sans-serif", color: "white", padding: 60 }}>
        <div style={{ display: "flex", fontSize: 90, lineHeight: 1 }}>💑</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 16, opacity: 0.9 }}>우리</div>
        <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1 }}>D+{n}</div>
        <div style={{ display: "flex", fontSize: 42, marginTop: 20 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
