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

/**
 * 일별 추이 — 세로 막대.
 *
 * 플롯 영역을 값 라벨·날짜 라벨과 분리된 고정 높이 박스로 둔다. 예전에는 한 칼럼 안에
 * 라벨과 막대를 함께 쌓고 막대 높이를 칼럼 기준 %로 줬는데, 최댓값 막대(100%)에 라벨
 * 높이가 더해져 칼럼을 넘치는 바람에 큰 막대만 기준선 아래로 삐져나왔다.
 * 이제 막대 높이는 px로 계산하고 BAR_MAX + VALUE_H 가 정확히 PLOT_H 가 된다.
 */

const PLOT_H = 96; // 플롯 영역 높이
const VALUE_H = 16; // 막대 위 값 라벨이 쓰는 높이
const BAR_MAX = PLOT_H - VALUE_H; // 최댓값 막대의 높이
const BAR_MIN = 3; // 1건짜리도 보이도록
const ZERO_H = 2; // 0건인 날의 자리 표시

export function ColumnChart({
  data,
  labelEvery = 3,
}: {
  data: { date: string; count: number }[];
  labelEvery?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const last = data.length - 1;
  const barHeight = (count: number) =>
    count === 0 ? ZERO_H : Math.max(BAR_MIN, Math.round((count / max) * BAR_MAX));

  return (
    <div>
      {/* 막대는 이 박스의 border-b(기준선) 위에 정확히 선다 */}
      <div
        className="flex items-end gap-[2px] border-b border-black/10"
        style={{ height: PLOT_H }}
      >
        {data.map((d) => (
          <div
            key={d.date}
            title={`${shortDate(d.date)} · ${d.count}건`}
            className="group flex h-full flex-1 flex-col justify-end"
          >
            <span
              className="text-center text-[10px] tabular-nums text-foreground/40"
              style={{ height: VALUE_H, lineHeight: `${VALUE_H}px` }}
            >
              {d.count > 0 ? d.count : ""}
            </span>
            <div
              className="rounded-t bg-primary transition group-hover:opacity-80"
              style={{
                height: barHeight(d.count),
                opacity: d.count === 0 ? 0.15 : 1,
              }}
            />
          </div>
        ))}
      </div>

      {/* 날짜 라벨은 기준선 아래 별도 행 — 위 칼럼과 같은 flex-1·gap 이라 자리가 맞는다 */}
      <div className="flex gap-[2px] pt-1">
        {data.map((d, i) => (
          <span
            key={d.date}
            className="flex-1 text-center text-[9px] text-foreground/35"
          >
            {(last - i) % labelEvery === 0 ? shortDate(d.date) : ""}
          </span>
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
