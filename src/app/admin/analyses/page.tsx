import Link from "next/link";
import {
  listAnalyses,
  listAnalysisGroups,
  GROUPS_PER_PAGE,
  PER_PAGE,
  type GroupSortKey,
  type SortKey,
} from "@/lib/admin/data";
import { verifyAdmin } from "@/lib/admin/auth";
import { MBTI_LIST, RELATIONS } from "@/lib/mbti";
import { Empty, Panel } from "../ui";
import { Row } from "./row";
import { GroupCard } from "./group-card";

type Search = Record<string, string | string[] | undefined>;

const VIEWS = [
  { value: "list", label: "분석 하나씩" },
  { value: "user", label: "사용자별 묶기" },
] as const;
type ViewKey = (typeof VIEWS)[number]["value"];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "score_desc", label: "점수 높은순" },
  { value: "score_asc", label: "점수 낮은순" },
  { value: "views", label: "조회 많은순" },
];

const GROUP_SORTS: { value: GroupSortKey; label: string }[] = [
  { value: "count", label: "많이 돌린 순" },
  { value: "recent", label: "최근 활동순" },
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

  const view: ViewKey =
    VIEWS.find((v) => v.value === one(sp.view))?.value ?? "list";
  const grouped = view === "user";

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
  const groupSort = (GROUP_SORTS.find((s) => s.value === one(sp.gsort))?.value ??
    "count") as GroupSortKey;
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const filters = {
    relation: relation || undefined,
    mbti: mbti || undefined,
    minScore: min,
    maxScore: max,
    days,
    page,
  };

  const list = grouped ? null : await listAnalyses({ ...filters, sort });
  const groupList = grouped
    ? await listAnalysisGroups({ ...filters, groupSort })
    : null;

  const total = grouped ? groupList!.total : list!.total;
  const totalPages = grouped ? groupList!.totalPages : list!.totalPages;
  const perPage = grouped ? GROUPS_PER_PAGE : PER_PAGE;

  // 링크는 현재 필터를 그대로 들고 다닌다. 보기 모드를 바꿀 땐 페이지를 1로 되돌린다
  const href = ({ to = view, p = page }: { to?: ViewKey; p?: number } = {}) => {
    const g = to === "user";
    const q = new URLSearchParams();
    if (g) q.set("view", "user");
    if (relation) q.set("relation", relation);
    if (mbti) q.set("mbti", mbti);
    if (min !== undefined) q.set("min", String(min));
    if (max !== undefined) q.set("max", String(max));
    if (days) q.set("days", String(days));
    if (!g && sort !== "recent") q.set("sort", sort);
    if (g && groupSort !== "count") q.set("gsort", groupSort);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/analyses?${s}` : "/admin/analyses";
  };

  const filtered =
    Boolean(relation || mbti || days) || min !== undefined || max !== undefined;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const unit = grouped ? "명" : "건";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">분석 목록</h1>
        {/* 보기 전환은 필터와 성격이 달라 '적용' 없이 바로 넘어가게 링크로 둔다 */}
        <nav className="flex gap-1 rounded-lg bg-black/[0.04] p-0.5">
          {VIEWS.map((v) => (
            <Link
              key={v.value}
              href={href({ to: v.value, p: 1 })}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                v.value === view
                  ? "bg-white text-primary shadow-sm"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 서버 렌더만으로 동작하도록 GET form을 쓴다 */}
      <form
        method="get"
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
      >
        {/* 필터를 적용해도 보기 모드가 유지되도록 같이 실어 보낸다 */}
        {grouped && <input type="hidden" name="view" value="user" />}

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

        {/* 정렬 기준은 보기 모드마다 다르다. 안 쓰는 쪽은 아예 전송하지 않는다 */}
        {grouped ? (
          <select name="gsort" defaultValue={groupSort} className={inputClass}>
            {GROUP_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        ) : (
          <select name="sort" defaultValue={sort} className={inputClass}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          적용
        </button>
        {filtered && (
          <Link
            href={`/admin/analyses${grouped ? "?view=user" : ""}`}
            className="rounded-lg px-2 py-1.5 text-xs text-foreground/50 hover:bg-black/5"
          >
            초기화
          </Link>
        )}
        <span className="ml-auto text-xs tabular-nums text-foreground/40">
          {total.toLocaleString()}
          {unit} 중 {from}–{to}
        </span>
      </form>

      {grouped ? (
        <Panel
          title="사용자별 묶음"
          hint={`IP + 기기 기준 · ${groupList!.scanned.toLocaleString()}건을 묶음`}
        >
          <p className="mb-3 text-[11px] leading-relaxed text-foreground/40">
            로그인이 없어서 IP와 기기(User-Agent)가 같으면 한 사람으로 본다. 같은
            와이파이·통신사를 쓰는 남남이 묶이거나, IP가 바뀌면 같은 사람이 갈라질 수
            있으니 신원이 아니라 &ldquo;한 번에 여러 번 돌려본 흐름&rdquo;으로 읽어야 한다.
            {groupList!.truncated && " 최근 5,000건까지만 묶는다."}
          </p>
          {groupList!.groups.length === 0 ? (
            <Empty>조건에 맞는 분석이 없어</Empty>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1">
              <ul className="flex min-w-[760px] flex-col divide-y divide-black/5">
                {groupList!.groups.map((g) => (
                  <GroupCard key={g.key} group={g} />
                ))}
              </ul>
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="결과" hint="행을 누르면 AI 응답 원문이 펼쳐져">
          {list!.rows.length === 0 ? (
            <Empty>조건에 맞는 분석이 없어</Empty>
          ) : (
            // 좁은 화면에서는 표가 찌그러지는 대신 가로로 스크롤되게 둔다
            <div className="-mx-1 overflow-x-auto px-1">
              <ul className="flex min-w-[760px] flex-col divide-y divide-black/5">
                {list!.rows.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 text-xs">
          {page > 1 && (
            <Link
              href={href({ p: page - 1 })}
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
              href={href({ p: page + 1 })}
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
