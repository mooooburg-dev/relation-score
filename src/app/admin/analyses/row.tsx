import Link from "next/link";
import type { AnalysisRow } from "@/lib/admin/data";
import { ScorePill, formatDateTime } from "../ui";

/**
 * 분석 한 건. <details> 라 JS 없이 펼쳐진다.
 *
 * 사용자 묶음 보기에서는 IP·기기가 그룹 헤더에 이미 있으므로 hideClient 로 감춘다.
 */

export function Row({
  row,
  hideClient = false,
}: {
  row: AnalysisRow;
  hideClient?: boolean;
}) {
  const i = row.inputs ?? ({} as AnalysisRow["inputs"]);
  const r = row.result ?? ({} as AnalysisRow["result"]);
  const meta = [i.myGender, i.myAge, i.myBlood].filter(Boolean).join("·");
  const otherMeta = [i.otherGender, i.otherAge, i.otherBlood]
    .filter(Boolean)
    .join("·");

  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 py-2 text-xs hover:bg-black/[0.02]">
          <span className="w-4 text-foreground/30 transition group-open:rotate-90">
            ›
          </span>
          <ScorePill score={row.score} />
          <span className="w-32 shrink-0 font-medium">
            {i.myMbti} × {i.otherMbti}
          </span>
          <span className="w-16 shrink-0 text-foreground/50">
            {row.relation}
          </span>
          <span className="min-w-0 flex-1 truncate text-foreground/40">
            {r.tag}
          </span>
          <span className="w-12 shrink-0 text-right tabular-nums text-foreground/35">
            👁 {row.view_count}
          </span>
          <span className="w-24 shrink-0 text-right tabular-nums text-foreground/35">
            {formatDateTime(row.created_at)}
          </span>
        </summary>

        <div className="grid gap-3 border-l-2 border-primary/20 bg-black/[0.015] px-4 py-3 text-xs sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="font-bold text-foreground/70">입력</p>
            <p className="text-foreground/60">
              나: {i.myMbti}
              {meta && ` (${meta})`}
            </p>
            <p className="text-foreground/60">
              상대: {i.otherMbti}
              {otherMeta && ` (${otherMeta})`}
            </p>
            <p className="text-foreground/60">관계: {row.relation}</p>
            <p className="mt-2 font-bold text-foreground/70">세부 점수</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-foreground/60">
              <Score label="MBTI 궁합" value={r.mbti_score} />
              <Score label="소통" value={r.comm_score} />
              <Score label="감성" value={r.emotion_score} />
              <Score label="장기" value={r.longterm_score} />
            </dl>
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-bold text-foreground/70">{r.tag}</p>
            <p className="leading-relaxed text-foreground/60">{r.summary}</p>
            <p className="mt-2 break-all text-[11px] text-foreground/35">
              {row.model} · seq {row.seq}
              {!hideClient && ` · IP ${row.ip ?? "–"}`}
            </p>
            {!hideClient && (
              <p className="break-all text-[11px] text-foreground/35">
                {row.user_agent ?? "UA 없음"}
              </p>
            )}
            <Link
              href={`/r/${row.id}`}
              target="_blank"
              className="mt-1 w-fit text-[11px] font-medium text-primary hover:underline"
            >
              공유 페이지 열기 →
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}

function Score({ label, value }: { label: string; value?: number }) {
  return (
    <>
      <dt className="text-foreground/45">{label}</dt>
      <dd className="tabular-nums">{value ?? "–"}</dd>
    </>
  );
}
