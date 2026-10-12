import { Card, SectionTitle } from "@/components/seo";
import { dailyEmoji, weekdayOf, ymdKey, type DayPoint, type Ymd } from "@/lib/daily";

/**
 * 이번 주(월~일) 운세 흐름 막대 + 이번 달 좋은 날.
 * 미리 계획할 수 있는 정보라 "그날 다시 와서 확인할" 이유가 된다. 훅이 없어 서버·클라이언트 공용.
 */
export function WeekFlow({
  week,
  today,
  monthBest,
  title = "이번 주 운세 흐름",
}: {
  week: DayPoint[];
  today: Ymd;
  monthBest?: DayPoint[];
  title?: string;
}) {
  const todayKey = ymdKey(today);
  const best = week.reduce((a, b) => (b.score > a.score ? b : a), week[0]);
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex h-32 items-end justify-between gap-1.5">
        {week.map((p) => {
          const k = ymdKey(p.date);
          const isToday = k === todayKey;
          const isBest = k === ymdKey(best.date);
          // 40~96 → 막대 높이 15~100%
          const h = 15 + ((p.score - 40) / 56) * 85;
          return (
            <div key={k} className="flex flex-1 flex-col items-center gap-1">
              <span className={`text-[11px] font-bold tabular-nums ${isBest ? "text-primary" : "text-foreground/50"}`}>
                {p.score}
              </span>
              <div
                className={`w-full rounded-t-lg ${isBest ? "bg-primary" : isToday ? "bg-primary/50" : "bg-primary/20"}`}
                style={{ height: `${h}%` }}
              />
              <span className={`text-xs ${isToday ? "font-extrabold text-primary" : "text-foreground/55"}`}>
                {weekdayOf(p.date)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-foreground/60">
        이번 주 최고의 날은 <b className="text-primary">{best.date.m}/{best.date.d}({weekdayOf(best.date)})</b>{" "}
        {best.score}점 {dailyEmoji(best.score)}
      </p>
      {monthBest && monthBest.length > 0 && (
        <div className="mt-4 border-t border-foreground/5 pt-3">
          <p className="mb-2 text-sm font-bold">이번 달 남은 좋은 날</p>
          <ul className="flex gap-2">
            {monthBest.map((p) => (
              <li key={ymdKey(p.date)} className="flex-1 rounded-xl bg-background py-2 text-center">
                <span className="block text-sm font-extrabold">
                  {p.date.m}/{p.date.d}({weekdayOf(p.date)})
                </span>
                <span className="text-xs font-bold text-primary">{p.score}점</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
