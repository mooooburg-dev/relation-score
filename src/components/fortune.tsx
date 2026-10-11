import Link from "next/link";
import { TTI_IDS, ttiInfo, ttiName, ttiScoreEmoji, type Tti } from "@/lib/tti";
import { fortuneLabel, fortunePath, fortuneRanking } from "@/lib/fortune";
import { getFortune } from "@/lib/fortune-content";

/** 12띠 운세 링크 그리드 */
export function FortuneGrid({ year, current }: { year: number; current?: Tti }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {TTI_IDS.map((t) => (
        <li key={t}>
          <Link
            href={fortunePath(year, t)}
            className={`flex flex-col items-center rounded-xl border-2 py-1.5 text-sm font-bold transition ${
              t === current
                ? "border-primary bg-primary/10 text-primary"
                : "border-foreground/10 bg-background hover:border-primary/50"
            }`}
          >
            <span aria-hidden>{ttiInfo(t).emoji}</span>
            <span>{ttiName(t)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 그 해 띠별 총운 순위 (본문이 있는 띠만 링크) */
export function FortuneRankingList({ year, limit }: { year: number; limit?: number }) {
  const items = fortuneRanking(year).slice(0, limit ?? 12);
  return (
    <ol className="flex flex-col gap-1.5">
      {items.map((r, i) => {
        const f = getFortune(year, r.tti);
        const row = (
          <>
            <span className="w-5 shrink-0 text-right text-xs font-bold text-foreground/40">
              {i + 1}
            </span>
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-bold">
              <span aria-hidden>{ttiInfo(r.tti).emoji}</span>
              {ttiName(r.tti)}
            </span>
            <span className="flex-1 truncate text-xs text-foreground/60">
              {f?.headline ?? fortuneLabel(r.score)}
            </span>
            <span className="shrink-0 text-sm font-extrabold text-primary">
              {ttiScoreEmoji(r.score)} {r.score}
            </span>
          </>
        );
        return (
          <li key={r.tti}>
            {f ? (
              <Link
                href={fortunePath(year, r.tti)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background"
              >
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-2 py-1.5">{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function FortuneDisclaimer() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-foreground/40">
      신년운세는 그 해의 띠(태세)와 내 띠의 지지 관계(합·충·원진·형·해)와 오행을 바탕으로
      계산한 참고용 콘텐츠야. 한 해는 결국 내가 만들어가는 거야.
    </p>
  );
}
