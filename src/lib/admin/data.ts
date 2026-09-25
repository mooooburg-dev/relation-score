import {
  supabaseAdmin,
  SCORE_TABLE,
  type AnalysisInputs,
  type AnalysisResult,
} from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin/auth";
import { RELATIONS } from "@/lib/mbti";

/**
 * 어드민 데이터 접근 계층. service_role 키를 쓰므로 서버에서만 import 할 것.
 *
 * 인증 검사를 여기(데이터 진입점)에 둔다. layout에서만 막으면 page가 layout과
 * 병렬로 렌더되면서 쿼리가 먼저 나가는 구멍이 생긴다.
 */

export class AdminAuthError extends Error {
  constructor() {
    super("어드민 인증이 필요해");
    this.name = "AdminAuthError";
  }
}

async function requireAdmin() {
  if (!(await verifyAdmin())) throw new AdminAuthError();
}

export interface AnalysisRow {
  id: string;
  created_at: string;
  relation: string;
  score: number | null;
  inputs: AnalysisInputs;
  result: AnalysisResult;
  model: string | null;
  view_count: number;
  seq: number;
  ip: string | null;
  user_agent: string | null;
}

/** 집계용 경량 행 (AI 본문·IP·UA 제외) */
type StatRow = Pick<
  AnalysisRow,
  "created_at" | "relation" | "score" | "inputs" | "view_count" | "model"
>;

const KST_DATE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** timestamptz → KST 기준 'YYYY-MM-DD' */
export function kstDate(iso: string | Date): string {
  return KST_DATE.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** 오늘로부터 n일 전의 KST 날짜 문자열 */
function kstDateBefore(days: number): string {
  return kstDate(new Date(Date.now() - days * 86_400_000));
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export interface DashboardStats {
  total: number;
  today: number;
  last7: number;
  prev7: number;
  avgScore: number;
  totalViews: number;
  daily: { date: string; count: number }[];
  byRelation: { relation: string; count: number; avgScore: number }[];
  scoreBuckets: { label: string; count: number }[];
  topMbti: { mbti: string; count: number }[];
  topPairs: { pair: string; count: number; avgScore: number }[];
  models: { model: string; count: number }[];
  truncated: boolean;
}

const DAILY_DAYS = 14;
const BUCKET_LABELS = ["0-19", "20-39", "40-59", "60-79", "80-100"];
// 집계는 전량을 메모리에서 돌린다. 수만 행까지는 RPC를 새로 파는 것보다 단순하다.
const STAT_LIMIT = 20_000;

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();

  const { data, error, count } = await supabaseAdmin
    .from(SCORE_TABLE)
    .select("created_at, relation, score, inputs, view_count, model", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(STAT_LIMIT);

  if (error) throw new Error(`분석 통계 조회 실패: ${error.message}`);
  const rows = (data ?? []) as StatRow[];
  // total은 count(전체) 기준. rows는 STAT_LIMIT에서 잘릴 수 있다
  const total = count ?? rows.length;

  const today = kstDate(new Date());
  const d7 = kstDateBefore(6); // 오늘 포함 7일
  const d14 = kstDateBefore(13);

  // 최근 14일 버킷 (분석이 없는 날도 0으로 채워 그래프가 끊기지 않게)
  const daily = new Map<string, number>();
  for (let i = DAILY_DAYS - 1; i >= 0; i--) daily.set(kstDateBefore(i), 0);

  const relCount = new Map<string, number>();
  const relScores = new Map<string, number[]>();
  const mbtiCount = new Map<string, number>();
  const pairScores = new Map<string, number[]>();
  const pairCount = new Map<string, number>();
  const modelCount = new Map<string, number>();
  const buckets = new Array(BUCKET_LABELS.length).fill(0) as number[];

  let todayCount = 0;
  let last7 = 0;
  let prev7 = 0;
  let totalViews = 0;
  const scores: number[] = [];

  const bump = <K>(map: Map<K, number>, key: K) =>
    map.set(key, (map.get(key) ?? 0) + 1);
  const push = <K>(map: Map<K, number[]>, key: K, v: number | null) => {
    const arr = map.get(key) ?? [];
    if (v !== null) arr.push(v);
    map.set(key, arr);
  };

  for (const row of rows) {
    const day = kstDate(row.created_at);
    if (daily.has(day)) daily.set(day, (daily.get(day) ?? 0) + 1);
    if (day === today) todayCount++;
    if (day >= d7) last7++;
    else if (day >= d14) prev7++;

    totalViews += row.view_count ?? 0;
    bump(modelCount, row.model ?? "(없음)");

    const score = typeof row.score === "number" ? row.score : null;
    if (score !== null) {
      scores.push(score);
      buckets[Math.min(BUCKET_LABELS.length - 1, Math.floor(score / 20))]++;
    }

    const rel = row.relation || "(없음)";
    bump(relCount, rel);
    push(relScores, rel, score);

    const my = row.inputs?.myMbti?.toUpperCase();
    const other = row.inputs?.otherMbti?.toUpperCase();
    if (my) bump(mbtiCount, my);
    if (other) bump(mbtiCount, other);
    if (my && other) {
      // 방향은 무시하고 조합 단위로 묶는다 (INFP×ENFP == ENFP×INFP)
      const key = [my, other].sort().join(" × ");
      bump(pairCount, key);
      push(pairScores, key, score);
    }
  }

  // 아직 한 번도 안 쓰인 관계 유형도 0으로 노출한다 (안 쓰이는 게 정보다)
  for (const r of RELATIONS) {
    if (!relCount.has(r.value)) {
      relCount.set(r.value, 0);
      relScores.set(r.value, []);
    }
  }

  const rank = <T extends { count: number }>(list: T[], key: (t: T) => string) =>
    list.sort((a, b) => b.count - a.count || key(a).localeCompare(key(b)));

  return {
    total,
    today: todayCount,
    last7,
    prev7,
    avgScore: avg(scores),
    totalViews,
    daily: [...daily.entries()].map(([date, count]) => ({ date, count })),
    byRelation: rank(
      [...relCount.entries()].map(([relation, count]) => ({
        relation,
        count,
        avgScore: avg(relScores.get(relation) ?? []),
      })),
      (r) => r.relation,
    ),
    scoreBuckets: BUCKET_LABELS.map((label, i) => ({
      label,
      count: buckets[i],
    })),
    topMbti: rank(
      [...mbtiCount.entries()].map(([mbti, count]) => ({ mbti, count })),
      (m) => m.mbti,
    ).slice(0, 10),
    topPairs: rank(
      [...pairCount.entries()].map(([pair, count]) => ({
        pair,
        count,
        avgScore: avg(pairScores.get(pair) ?? []),
      })),
      (p) => p.pair,
    ).slice(0, 10),
    models: rank(
      [...modelCount.entries()].map(([model, count]) => ({ model, count })),
      (m) => m.model,
    ),
    truncated: rows.length >= STAT_LIMIT,
  };
}

export type SortKey = "recent" | "score_desc" | "score_asc" | "views";

export interface ListParams {
  relation?: string;
  mbti?: string;
  minScore?: number;
  maxScore?: number;
  days?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface ListResult {
  rows: AnalysisRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const PER_PAGE = 20;

export async function listAnalyses(params: ListParams): Promise<ListResult> {
  await requireAdmin();

  const perPage = params.perPage ?? PER_PAGE;
  const page = Math.max(1, params.page ?? 1);

  let query = supabaseAdmin.from(SCORE_TABLE).select("*", { count: "exact" });

  if (params.relation) query = query.eq("relation", params.relation);
  if (params.mbti) {
    const m = params.mbti.toUpperCase();
    // 내 쪽/상대 쪽 어디에 있든 잡는다
    query = query.or(`inputs->>myMbti.eq.${m},inputs->>otherMbti.eq.${m}`);
  }
  if (typeof params.minScore === "number")
    query = query.gte("score", params.minScore);
  if (typeof params.maxScore === "number")
    query = query.lte("score", params.maxScore);
  if (params.days) {
    const since = new Date(Date.now() - params.days * 86_400_000).toISOString();
    query = query.gte("created_at", since);
  }

  switch (params.sort) {
    case "score_desc":
      query = query.order("score", { ascending: false, nullsFirst: false });
      break;
    case "score_asc":
      query = query.order("score", { ascending: true, nullsFirst: false });
      break;
    case "views":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  // 정렬 키가 같은 행들의 순서를 고정 (페이지 경계에서 행이 새거나 중복되지 않게)
  query = query.order("seq", { ascending: false });

  const from = (page - 1) * perPage;
  const { data, error, count } = await query.range(from, from + perPage - 1);
  if (error) throw new Error(`분석 목록 조회 실패: ${error.message}`);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as AnalysisRow[],
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** 대시보드 하단 '최근 분석' */
export async function getRecentAnalyses(limit = 5): Promise<AnalysisRow[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from(SCORE_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`최근 분석 조회 실패: ${error.message}`);
  return (data ?? []) as AnalysisRow[];
}

// ---- 선물 클릭 ----

export interface GiftClickRow {
  id: number;
  created_at: string;
  gift_id: string;
  mbti: string | null;
  surface: string;
  relation: string | null;
  entry: string | null;
}

export interface GiftClickStats {
  total: number;
  today: number;
  last7: number;
  /** 어느 게이트를 타고 들어와 눌렀나 (직접 진입 포함) */
  byEntry: { key: string; label: string; count: number }[];
  /** 선물 페이지의 어느 자리에서 눌렀나 */
  bySurface: { key: string; label: string; count: number }[];
  byGift: { key: string; label: string; count: number }[];
  byMbti: { key: string; label: string; count: number }[];
  recent: GiftClickRow[];
}

const ENTRY_LABEL: Record<string, string> = {
  type: "유형 페이지",
  pair: "궁합 페이지",
  result: "결과 화면",
};
const SURFACE_LABEL: Record<string, string> = {
  list: "본문 목록",
  relation: "관계 섹션",
};

function tally<T>(
  rows: T[],
  key: keyof T,
  label: (v: string | null) => string,
): { key: string; label: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = label((r[key] as string | null) ?? null);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([label, count]) => ({ key: label, label, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 선물 클릭 집계.
 *
 * 쿠팡 subId 는 채널 귀속 때문에 'scoregift' 단일이라 파트너스 리포트로는
 * 화면 구분이 안 된다. /go/gift/[id] 가 남긴 이 기록이 유일한 구분 근거다.
 */
export async function getGiftClickStats(): Promise<GiftClickStats> {
  await requireAdmin();

  const { data } = await supabaseAdmin
    .from("gift_clicks")
    .select("id, created_at, gift_id, mbti, surface, relation, entry")
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = (data ?? []) as GiftClickRow[];
  const today = kstDate(new Date());
  const weekAgo = kstDateBefore(6);

  return {
    total: rows.length,
    today: rows.filter((r) => kstDate(r.created_at) === today).length,
    last7: rows.filter((r) => kstDate(r.created_at) >= weekAgo).length,
    byEntry: tally(rows, "entry", (v) => (v ? (ENTRY_LABEL[v] ?? v) : "직접 진입")),
    bySurface: tally(rows, "surface", (v) => (v ? (SURFACE_LABEL[v] ?? v) : "-")),
    byGift: tally(rows, "gift_id", (v) => v ?? "-").slice(0, 10),
    byMbti: tally(rows, "mbti", (v) => v ?? "-").slice(0, 10),
    recent: rows.slice(0, 20),
  };
}
