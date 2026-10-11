"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VISITOR_EVENT, clearHistory, getHistory, track, type HistoryItem } from "@/lib/visitor";

const KIND_EMOJI: Record<HistoryItem["kind"], string> = { name: "💘", birthday: "🎂", mbti: "🔮" };

/** 최근 본 궁합 (이 브라우저에만 저장). 기록이 없으면 아무것도 그리지 않는다 */
export default function RecentHistory({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getHistory());
    sync();
    window.addEventListener(VISITOR_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VISITOR_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!items.length) return null;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">최근 본 궁합</h2>
        <button type="button" onClick={() => clearHistory()} className="text-xs text-foreground/40 underline">
          기록 지우기
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.slice(0, limit).map((h) => (
          <li key={h.path}>
            <Link
              href={h.path}
              onClick={() => track("history_open", { kind: h.kind })}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-background"
            >
              <span aria-hidden>{KIND_EMOJI[h.kind]}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{h.label}</span>
              <span className="shrink-0 text-xs text-primary">다시 보기 →</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-foreground/40">이 기기 브라우저에만 저장돼.</p>
    </section>
  );
}
