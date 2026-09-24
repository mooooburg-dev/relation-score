import Link from "next/link";
import {
  listAnalyses,
  PER_PAGE,
  type AnalysisRow,
  type SortKey,
} from "@/lib/admin/data";
import { verifyAdmin } from "@/lib/admin/auth";
import { MBTI_LIST, RELATIONS } from "@/lib/mbti";
import { Empty, Panel, ScorePill, formatDateTime } from "../ui";

type Search = Record<string, string | string[] | undefined>;

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "score_desc", label: "점수 높은순" },
  { value: "score_asc", label: "점수 낮은순" },
  { value: "views", label: "조회 많은순" },
];

const PERIODS = [
  { value: "", label: "전체 기간" },
  { value: "1", label: "최근 24시간" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "90", label: "최근 90일" },
];

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** 0~100 범위의 정수만 통과. 범위를 벗어나면 필터를 걸지 않는다 */
function score(v: string): number | undefined {
  if (!/^\d{1,3}$/.test(v)) return undefined;
  const n = Number(v);
  return n >= 0 && n <= 100 ? n : undefined;
}

const inputClass =
  "rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary";

export default async function AnalysesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  // layout의 로그인 폼과 병렬 렌더되는 경우를 끊는다 (data.ts가 최종 방어선)
  if (!(await verifyAdmin())) return null;

  const sp = await searchParams;

  const relation = RELATIONS.some((r) => r.value === one(sp.relation))
    ? one(sp.relation)
    : "";
  const mbtiRaw = one(sp.mbti).toUpperCase();
  const mbti = MBTI_LIST.includes(mbtiRaw as (typeof MBTI_LIST)[number])
    ? mbtiRaw
    : "";
  const min = score(one(sp.min));
  const max = score(one(sp.max));
  const days = /^\d+$/.test(one(sp.days)) ? Number(one(sp.days)) : undefined;
  const sort = (SORTS.find((s) => s.value === one(sp.sort))?.value ??
    "recent") as SortKey;
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const { rows, total, totalPages } = await listAnalyses({
    relation: relation || undefined,
    mbti: mbti || undefined,
    minScore: min,
    maxScore: max,
    days,
    sort,
    page,
  });

  // 페이지 링크는 현재 필터를 그대로 유지한다
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (relation) q.set("relation", relation);
    if (mbti) q.set("mbti", mbti);
    if (min !== undefined) q.set("min", String(min));
    if (max !== undefined) q.set("max", String(max));
    if (days) q.set("days", String(days));
    if (sort !== "recent") q.set("sort", sort);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/analyses?${s}` : "/admin/analyses";
  };

  const filtered =
    Boolean(relation || mbti || days) || min !== undefined || max !== undefined;
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">분석 목록</h1>

      {/* 서버 렌더만으로 동작하도록 GET form을 쓴다 */}
      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
      >
        <select name="relation" defaultValue={relation} className={inputClass}>
          <option value="">전체 관계</option>
          {RELATIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.emoji} {r.value}
            </option>
          ))}
        </select>

        <select name="mbti" defaultValue={mbti} className={inputClass}>
          <option value="">전체 MBTI</option>
          {MBTI_LIST.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <span className="flex items-center gap-1 text-xs text-foreground/50">
          <input
            type="number"
            name="min"
            min={0}
            max={100}
            placeholder="0"
            defaultValue={min ?? ""}
            className={`${inputClass} w-16`}
            aria-label="최소 점수"
          />
          ~
          <input
            type="number"
            name="max"
            min={0}
            max={100}
            placeholder="100"
            defaultValue={max ?? ""}
            className={`${inputClass} w-16`}
            aria-label="최대 점수"
          />
          점
        </span>

        <select
          name="days"
          defaultValue={days ? String(days) : ""}
          className={inputClass}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sort} className={inputClass}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          적용
        </button>
        {filtered && (
          <Link
            href="/admin/analyses"
            className="rounded-lg px-2 py-1.5 text-xs text-foreground/50 hover:bg-black/5"
          >
            초기화
          </Link>
        )}
        <span className="ml-auto text-xs text-foreground/40 tabular-nums">
          {total.toLocaleString()}건 중 {from}–{to}
        </span>
      </form>

      <Panel title="결과" hint="행을 누르면 AI 응답 원문이 펼쳐져">
        {rows.length === 0 ? (
          <Empty>조건에 맞는 분석이 없어</Empty>
        ) : (
          // 좁은 화면에서는 표가 찌그러지는 대신 가로로 스크롤되게 둔다
          <div className="-mx-1 overflow-x-auto px-1">
            <ul className="flex min-w-[760px] flex-col divide-y divide-black/5">
              {rows.map((row) => (
                <Row key={row.id} row={row} />
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-black/5 hover:text-primary"
            >
              ← 이전
            </Link>
          )}
          <span className="tabular-nums text-foreground/50">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-black/5 hover:text-primary"
            >
              다음 →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Row({ row }: { row: AnalysisRow }) {
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
              {row.model} · seq {row.seq} · IP {row.ip ?? "–"}
            </p>
            <p className="break-all text-[11px] text-foreground/35">
              {row.user_agent ?? "UA 없음"}
            </p>
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
