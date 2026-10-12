import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/og";
import { EVENTS, getEvent } from "@/lib/events";

export const alt = "시즌 이벤트 연애운";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

/** D-day·점수 없이 고정 — 캐시된 미리보기가 지난 숫자를 보여주지 않게. 텍스트는 가운데 560px 안 */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const ev = getEvent((await params).slug);
  const name = ev?.name ?? "기념일";
  const sub = "연애운 좋은 띠·별자리 순위";
  const text = `${name} ${sub} 선물 추천 몇점이야? · score.drawyourmind.com ${ev?.month}월 ${ev?.day}일`;
  const fontData = await loadKoreanFont(text);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7F77DD 0%, #5b54b8 100%)", fontFamily: fontData ? "NotoKR" : "sans-serif", color: "white", padding: 60 }}>
        <div style={{ display: "flex", fontSize: 120, lineHeight: 1 }}>{ev?.emoji ?? "🎉"}</div>
        <div style={{ display: "flex", fontSize: 100, fontWeight: 800, marginTop: 16 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 8, opacity: 0.9 }}>{ev ? `${ev.month}월 ${ev.day}일` : ""}</div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 8 }}>{sub}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 28, opacity: 0.7 }}>몇점이야? · score.drawyourmind.com</div>
      </div>
    ),
    { ...size, fonts: fontData ? [{ name: "NotoKR", data: fontData, weight: 800, style: "normal" }] : [] },
  );
}
