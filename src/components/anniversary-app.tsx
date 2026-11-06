"use client";

import { useEffect, useState } from "react";
import {
  anniversarySharePath,
  dayCount,
  daysUntil,
  dLabel,
  isValidStart,
  toIcs,
  upcoming,
  GIFT_LABEL,
  type GiftKind,
} from "@/lib/anniversary";
import { kstToday, weekdayOf, ymdKey, type Ymd } from "@/lib/daily";
import { addHistory, getAnniversary, saveAnniversary, track } from "@/lib/visitor";
import ShareButton from "@/components/share-button";

export interface GiftLite {
  id: string;
  label: string;
  priceLabel: string;
  url: string | null;
}

/**
 * 커플 기념일 계산기. 계산은 브라우저에서만 — 사귄 날은 서버로 보내지 않는다(이 기기에만 기억).
 * 선물 목록은 서버가 기념일 종류별로 골라 props 로 준다(gifts.json 을 클라이언트에 싣지 않으려고).
 */
export default function AnniversaryApp({ gifts }: { gifts: Record<GiftKind, GiftLite[]> }) {
  const [date, setDate] = useState("");
  const [includeStart, setIncludeStart] = useState(true);
  const [start, setStart] = useState<Ymd | null>(null);
  const [error, setError] = useState("");
  const [today, setToday] = useState<Ymd | null>(null);

  // 기억해 둔 사귄 날이 있으면 바로 보여준다 (재방문)
  useEffect(() => {
    const t = kstToday();
    const a = getAnniversary();
    /* eslint-disable react-hooks/set-state-in-effect -- 마운트 후 저장소·브라우저 날짜로 한 번 채운다 */
    setToday(t);
    if (a) {
      setDate(`${a.y}-${String(a.m).padStart(2, "0")}-${String(a.d).padStart(2, "0")}`);
      setIncludeStart(a.includeStart);
      setStart({ y: a.y, m: a.m, d: a.d });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    const s = { y, m, d };
    if (!today || !isValidStart(s, today)) {
      setError("사귄 날을 정확히 골라줘 (오늘 이후 날짜는 안 돼)");
      setStart(null);
      return;
    }
    setError("");
    setStart(s);
    saveAnniversary({ ...s, includeStart });
    const n = dayCount(s, today, includeStart);
    addHistory({ kind: "anniversary", label: `우리 D+${n} (${s.y}.${s.m}.${s.d}~)`, path: anniversarySharePath(s, includeStart) });
    track("anniversary_calc", { days: n });
  }

  const list = start && today ? upcoming(start, today, includeStart, 6) : [];
  const next = list[0];
  const n = start && today ? dayCount(start, today, includeStart) : 0;
  const nextGifts = next ? gifts[next.gift].filter((g) => g.url) : [];

  function downloadIcs() {
    if (!start || !today) return;
    const blob = new Blob([toIcs(upcoming(start, today, includeStart, 12))], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "우리-기념일.ics";
    a.click();
    URL.revokeObjectURL(url);
    track("anniversary_ics");
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-foreground/60">
          우리가 사귄 날
          <input
            type="date"
            value={date}
            max={today ? ymdKey(today) : undefined}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border-2 border-foreground/10 bg-white px-3 py-2.5 text-base font-bold text-foreground"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
          <input
            type="checkbox"
            checked={includeStart}
            onChange={(e) => setIncludeStart(e.target.checked)}
            className="accent-primary"
          />
          사귄 날을 1일로 세기 (보통 이렇게 세)
        </label>
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        <button type="submit" className="rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.98]">
          기념일 계산하기 💑
        </button>
      </form>

      {start && today && (
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-primary/20 bg-white p-4">
          <div className="text-center">
            <p className="text-xs font-bold text-foreground/50">
              {start.y}.{start.m}.{start.d}부터 오늘까지
            </p>
            <p className="text-5xl font-extrabold text-primary">D+{n}</p>
            <p className="mt-1 text-sm font-bold">오늘은 사귄 지 {n}일째야 💕</p>
          </div>

          {next && (
            <div className="rounded-2xl bg-primary/10 p-3 text-center">
              <p className="text-xs font-bold text-foreground/55">다음 기념일</p>
              <p className="text-xl font-extrabold">
                {next.label} · {dLabel(daysUntil(next.date, today))}
              </p>
              <p className="text-xs text-foreground/60">
                {next.date.y}년 {next.date.m}월 {next.date.d}일 ({weekdayOf(next.date)})
              </p>
            </div>
          )}

          <ul className="flex flex-col divide-y divide-foreground/5 text-sm">
            {list.map((m) => (
              <li key={m.key} className="flex items-center justify-between py-2">
                <span className="font-bold">{m.label}</span>
                <span className="text-foreground/60">
                  {m.date.y}.{m.date.m}.{m.date.d}({weekdayOf(m.date)})
                </span>
                <span className="w-16 text-right font-extrabold text-primary">{dLabel(daysUntil(m.date, today))}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={downloadIcs}
            className="rounded-2xl border-2 border-foreground/10 py-2.5 text-sm font-bold text-foreground/70"
          >
            📅 기념일 캘린더에 추가 (3일 전 알림)
          </button>

          {next && nextGifts.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-3">
              <p className="text-sm font-extrabold">🎁 {next.label} 선물 고민이라면</p>
              <p className="text-[11px] text-foreground/50">{GIFT_LABEL[next.gift]}에 많이 고르는 선물이야</p>
              <p className="mt-2 text-[10px] leading-relaxed text-foreground/35">
                표시된 금액은 선물 예산 가이드고, 실제 판매가는 링크에서 확인해. 이 페이지의 상품 링크는 쿠팡 파트너스 활동의
                일환으로, 이에 따른 일정액의 수수료를 제공받아.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {nextGifts.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{g.label}</span>
                      <span className="text-[11px] text-foreground/50">{g.priceLabel}</span>
                    </span>
                    <a
                      href={`/go/gift/${g.id}?s=list&f=anniversary`}
                      target="_blank"
                      rel="sponsored nofollow noopener noreferrer"
                      className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary"
                    >
                      보러가기
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ShareButton path={anniversarySharePath(start, includeStart)} title={`우리 D+${n}`} where="anniversary" />
          <p className="text-center text-[11px] text-foreground/40">사귄 날은 이 기기 브라우저에만 기억돼.</p>
        </div>
      )}
    </div>
  );
}
