"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { daysUntil, ddayLabel, eventPath, upcomingEvent, type SeasonEvent } from "@/lib/events";
import { track } from "@/lib/visitor";

/**
 * 다가오는 시즌 이벤트 배너 (45일 이내 가장 가까운 것).
 * 홈처럼 정적 생성된 페이지에서도 D-day 가 맞도록 날짜는 브라우저에서 계산한다.
 */
export default function EventBanner() {
  const [ev, setEv] = useState<{ e: SeasonEvent; d: number } | null>(null);

  useEffect(() => {
    const e = upcomingEvent();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 날짜로 한 번 계산
    if (e) setEv({ e, d: daysUntil(e) });
  }, []);

  if (!ev) return null;
  return (
    <Link
      href={eventPath(ev.e.slug)}
      onClick={() => track("event_banner_click", { event: ev.e.slug })}
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-[#5b54b8] px-4 py-3 text-white shadow-md"
    >
      <span className="text-2xl" aria-hidden>
        {ev.e.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold opacity-80">
          {ev.e.name} {ddayLabel(ev.d)}
        </span>
        <span className="block truncate text-sm font-extrabold">{ev.e.hook}</span>
      </span>
      <span className="shrink-0 text-sm font-bold">→</span>
    </Link>
  );
}
