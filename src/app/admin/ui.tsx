import type { ReactNode } from "react";

/** 어드민 공용 표시 조각. 단일 시리즈 막대만 쓰므로 범례 없이 직접 라벨을 단다. */

export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${className}`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        {hint && <span className="text-xs text-foreground/40">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs text-foreground/40">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground/50">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-xs text-foreground/40">{children}</p>;
}

/** 일별 추이 — 세로 막대. 값이 0인 날도 자리를 비워두지 않는다 */
export function ColumnChart({
  data,
  labelEvery = 3,
}: {
  data: { date: string; count: number }[];
  labelEvery?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const last = data.length - 1;

  return (
    <div>
      <div className="flex h-28 items-end gap-[2px]">
        {data.map((d, i) => (
          <div
            key={d.date}
            title={`${shortDate(d.date)} · ${d.count}건`}
            className="group flex h-full flex-1 flex-col justify-end"
          >
            <span className="mb-1 text-center text-[10px] tabular-nums text-foreground/40">
              {d.count > 0 ? d.count : ""}
            </span>
            <div
              className="rounded-t bg-primary transition group-hover:opacity-80"
              style={{
                height: d.count === 0 ? 2 : `${(d.count / max) * 100}%`,
                opacity: d.count === 0 ? 0.15 : 1,
              }}
            />
            <span className="mt-1 h-3 text-center text-[9px] text-foreground/35">
              {(last - i) % labelEvery === 0 ? shortDate(d.date) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 순위/분포 — 가로 막대. 값은 항상 막대 옆에 직접 붙인다 */
export function BarList({
  items,
  suffix = "건",
}: {
  items: { label: ReactNode; key: string; count: number; note?: ReactNode }[];
  suffix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <Empty>아직 데이터가 없어</Empty>;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 truncate text-foreground/70">
            {item.label}
          </span>
          <span className="flex h-4 min-w-0 flex-1 items-center">
            <span
              className="h-2.5 rounded-r bg-primary"
              style={{
                width: `${(item.count / max) * 100}%`,
                minWidth: item.count > 0 ? 4 : 0,
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right tabular-nums text-foreground/60">
            {item.count.toLocaleString()}
            {suffix}
          </span>
          {item.note !== undefined && (
            <span className="w-16 shrink-0 text-right tabular-nums text-foreground/40">
              {item.note}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 'YYYY-MM-DD' → 'M/D' */
export function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}/${Number(d)}`;
}

const KST_TIME = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const KST_YEAR = new Intl.DateTimeFormat("en", {
  timeZone: "Asia/Seoul",
  year: "numeric",
});

/** timestamptz → KST 'MM. DD. HH:mm'. 올해가 아니면 연도를 앞에 붙인다 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const year = KST_YEAR.format(d);
  const prefix = year === KST_YEAR.format(new Date()) ? "" : `${year.slice(2)}. `;
  return prefix + KST_TIME.format(d);
}

export function ScorePill({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-foreground/30">–</span>;
  const tone =
    score >= 80
      ? "bg-primary text-white"
      : score >= 50
        ? "bg-primary/15 text-primary"
        : "bg-black/5 text-foreground/50";
  return (
    <span
      className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${tone}`}
    >
      {score}
    </span>
  );
}
