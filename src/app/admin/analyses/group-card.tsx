import { deviceLabel, type AnalysisGroup } from "@/lib/admin/data";
import { RELATIONS } from "@/lib/mbti";
import { ScorePill, formatDateTime } from "../ui";
import { Row } from "./row";

const RELATION_EMOJI = new Map<string, string>(
  RELATIONS.map((r) => [r.value as string, r.emoji as string]),
);

/** 한 사용자(= IP + 기기)의 분석 묶음. 펼치면 그 사람이 돌린 분석이 시간 역순으로 나온다 */
export function GroupCard({ group }: { group: AnalysisGroup }) {
  const single = group.count === 1;
  const span = single
    ? formatDateTime(group.lastAt)
    : `${formatDateTime(group.firstAt)} → ${formatDateTime(group.lastAt)}`;

  return (
    <li>
      <details className="group">
        <summary
          className={`flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-xs hover:bg-black/[0.02] ${
            group.isBot ? "opacity-55" : ""
          }`}
        >
          <span className="w-4 shrink-0 text-foreground/30 transition group-open:rotate-90">
            ›
          </span>
          <span className="w-40 shrink-0 truncate font-medium" title={group.ip ?? ""}>
            {group.ip ?? "IP 없음"}
          </span>
          <span
            className={`w-36 shrink-0 truncate ${
              group.isBot ? "font-medium text-amber-600" : "text-foreground/50"
            }`}
            title={group.userAgent ?? ""}
          >
            {deviceLabel(group.userAgent)}
          </span>
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-bold tabular-nums text-primary">
            {group.count}건
          </span>
          <span className="shrink-0 text-foreground/50">
            평균 <ScorePill score={group.avgScore || null} />
          </span>
          <span className="min-w-0 flex-1 truncate text-foreground/40">
            {group.relations
              .map(
                (r) =>
                  `${RELATION_EMOJI.get(r.relation) ?? ""}${r.relation}${
                    r.count > 1 ? ` ${r.count}` : ""
                  }`,
              )
              .join(" · ")}
            {group.mbtis.length > 0 && ` — ${group.mbtis.join(", ")}`}
          </span>
          <span className="shrink-0 tabular-nums text-foreground/35">{span}</span>
        </summary>

        <div className="border-l-2 border-primary/20 pl-2">
          <ul className="flex flex-col divide-y divide-black/5">
            {group.rows.map((row) => (
              <Row key={row.id} row={row} hideClient />
            ))}
          </ul>
          <p className="py-2 pl-4 text-[11px] text-foreground/30">
            {group.userAgent ?? "UA 없음"}
          </p>
        </div>
      </details>
    </li>
  );
}
