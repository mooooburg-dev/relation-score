import {
  supabaseAdmin,
  SCORE_TABLE,
  type AnalysisInputs,
  type AnalysisResult,
} from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin/auth";
import { RELATIONS } from "@/lib/mbti";
import { botLabel, isBotUa } from "@/lib/bot";

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
  /** 통계에서 빠진 봇·크롤러 기록 수 (API 차단 이전에 쌓인 것) */
  botExcluded: number;
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
    .eq("is_admin", false) // 운영자 본인 활동 제외
    .eq("is_bot", false) // 봇·크롤러 제외
    .order("created_at", { ascending: false })
    .limit(STAT_LIMIT);

  if (error) throw new Error(`분석 통계 조회 실패: ${error.message}`);

  // 얼마나 빠졌는지는 보여준다 — 소리 없이 줄어든 숫자만큼 혼란스러운 것도 없다
  const { count: botCount } = await supabaseAdmin
    .from(SCORE_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false)
    .eq("is_bot", true);
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
    botExcluded: botCount ?? 0,
  };
}

export type SortKey = "recent" | "score_desc" | "score_asc" | "views";

export interface ListParams {
  /** 봇·크롤러 기록까지 포함할지 (기본: 제외) */
  includeBots?: boolean;
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

type ScoreQuery = ReturnType<
  ReturnType<typeof supabaseAdmin.from>["select"]
>;

/** 개별 목록과 사용자 묶음 보기가 같은 필터를 쓰도록 한 군데에 모아 둔다 */
function applyListFilters<Q extends ScoreQuery>(query: Q, params: ListParams): Q {
  let q = query.eq("is_admin", false) as Q; // 운영자 본인 활동 제외
  // 봇은 기본으로 뺀다. 과거에 쌓인 크롤러 기록을 확인하고 싶을 때만 켠다
  if (!params.includeBots) q = q.eq("is_bot", false) as Q;

  if (params.relation) q = q.eq("relation", params.relation) as Q;
  if (params.mbti) {
    const m = params.mbti.toUpperCase();
    // 내 쪽/상대 쪽 어디에 있든 잡는다
    q = q.or(`inputs->>myMbti.eq.${m},inputs->>otherMbti.eq.${m}`) as Q;
  }
  if (typeof params.minScore === "number")
    q = q.gte("score", params.minScore) as Q;
  if (typeof params.maxScore === "number")
    q = q.lte("score", params.maxScore) as Q;
  if (params.days) {
    const since = new Date(Date.now() - params.days * 86_400_000).toISOString();
    q = q.gte("created_at", since) as Q;
  }
  return q;
}

export async function listAnalyses(params: ListParams): Promise<ListResult> {
  await requireAdmin();

  const perPage = params.perPage ?? PER_PAGE;
  const page = Math.max(1, params.page ?? 1);

  let query = applyListFilters(
    supabaseAdmin.from(SCORE_TABLE).select("*", { count: "exact" }),
    params,
  );

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

/**
 * 사용자 묶음 보기.
 *
 * 로그인이 없는 서비스라 "같은 사용자"를 정확히 알 방법은 없다. IP + User-Agent 조합을
 * 대리 키로 쓴다 — 같은 IP라도 기기가 다르면 나누고, 기기가 같으면 한 사람으로 본다.
 * 통신사 NAT 뒤에서는 남남이 묶일 수 있고 IP가 바뀌면 같은 사람이 갈라지므로,
 * 정확한 신원이 아니라 "한 번에 여러 번 돌려본 흐름"을 보는 용도다.
 *
 * GROUP BY 를 supabase-js 로 직접 못 쓰므로 필터에 걸린 행을 받아 메모리에서 묶는다.
 * 규모가 커지면 RPC(SQL 함수)로 옮겨야 한다 — 그때까지는 이게 단순하고 충분하다.
 */

export type GroupSortKey = "count" | "recent";

export interface AnalysisGroup {
  key: string;
  ip: string | null;
  userAgent: string | null;
  isBot: boolean;
  count: number;
  firstAt: string;
  lastAt: string;
  avgScore: number;
  views: number;
  /** 많이 쓴 순 관계 유형 */
  relations: { relation: string; count: number }[];
  /** 자주 등장한 MBTI (나·상대 합산) */
  mbtis: string[];
  rows: AnalysisRow[];
}

export interface GroupListResult {
  groups: AnalysisGroup[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  /** 묶는 데 사용한 행 수 */
  scanned: number;
  /** 상한에 걸려 일부만 묶었는지 */
  truncated: boolean;
}

export const GROUPS_PER_PAGE = 10;
const GROUP_SCAN_LIMIT = 5_000;

/** User-Agent → 사람이 읽는 기기 이름 */
export function deviceLabel(ua: string | null): string {
  if (!ua) return "기기 미상";
  if (isBotUa(ua)) return botLabel(ua);

  const os = /iPhone/i.test(ua)
    ? "iPhone"
    : /iPad/i.test(ua)
      ? "iPad"
      : /Android/i.test(ua)
        ? "Android"
        : /Macintosh|Mac OS X/i.test(ua)
          ? "Mac"
          : /Windows/i.test(ua)
            ? "Windows"
            : /Linux/i.test(ua)
              ? "Linux"
              : "기타";

  // 국내 유입은 인앱 브라우저 비중이 커서 먼저 가려낸다
  const browser = /KAKAOTALK/i.test(ua)
    ? "카카오톡"
    : /NAVER\(inapp/i.test(ua)
      ? "네이버앱"
      : /Instagram/i.test(ua)
        ? "인스타그램"
        : /FBAN|FBAV/i.test(ua)
          ? "페이스북"
          : /DaumApps/i.test(ua)
            ? "다음앱"
            : /SamsungBrowser/i.test(ua)
              ? "삼성인터넷"
              : /Whale/i.test(ua)
                ? "웨일"
                : /Edg\//i.test(ua)
                  ? "Edge"
                  : /FxiOS|Firefox/i.test(ua)
                    ? "Firefox"
                    : /CriOS|Chrome/i.test(ua)
                      ? "Chrome"
                      : /Safari/i.test(ua)
                        ? "Safari"
                        : "기타";

  return `${os} · ${browser}`;
}

export async function listAnalysisGroups(
  params: ListParams & { groupSort?: GroupSortKey },
): Promise<GroupListResult> {
  await requireAdmin();

  const perPage = params.perPage ?? GROUPS_PER_PAGE;
  const page = Math.max(1, params.page ?? 1);

  const { data, error } = await applyListFilters(
    supabaseAdmin.from(SCORE_TABLE).select("*"),
    params,
  )
    .order("created_at", { ascending: false })
    .limit(GROUP_SCAN_LIMIT);

  if (error) throw new Error(`사용자 묶음 조회 실패: ${error.message}`);
  const rows = (data ?? []) as AnalysisRow[];

  const byKey = new Map<string, AnalysisRow[]>();
  for (const row of rows) {
    // IP·UA 가 없는 행끼리 한 덩어리가 되지 않도록 행 id 를 섞어 각자 떨어뜨린다
    const key =
      row.ip || row.user_agent
        ? `${row.ip ?? "-"}\u0000${row.user_agent ?? "-"}`
        : `unknown\u0000${row.id}`;
    const list = byKey.get(key);
    if (list) list.push(row);
    else byKey.set(key, [row]);
  }

  const groups: AnalysisGroup[] = [...byKey.entries()].map(([key, list]) => {
    // rows 는 created_at 내림차순으로 들어온다
    const scores = list
      .map((r) => r.score)
      .filter((v): v is number => typeof v === "number");

    const relCount = new Map<string, number>();
    const mbtiCount = new Map<string, number>();
    for (const r of list) {
      const rel = r.relation || "(없음)";
      relCount.set(rel, (relCount.get(rel) ?? 0) + 1);
      for (const m of [r.inputs?.myMbti, r.inputs?.otherMbti]) {
        const up = m?.toUpperCase();
        if (up) mbtiCount.set(up, (mbtiCount.get(up) ?? 0) + 1);
      }
    }

    return {
      key,
      ip: list[0].ip,
      userAgent: list[0].user_agent,
      isBot: isBotUa(list[0].user_agent),
      count: list.length,
      firstAt: list[list.length - 1].created_at,
      lastAt: list[0].created_at,
      avgScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
      views: list.reduce((sum, r) => sum + (r.view_count ?? 0), 0),
      relations: [...relCount.entries()]
        .map(([relation, count]) => ({ relation, count }))
        .sort((a, b) => b.count - a.count || a.relation.localeCompare(b.relation)),
      mbtis: [...mbtiCount.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 4)
        .map(([m]) => m),
      rows: list,
    };
  });

  groups.sort((a, b) =>
    params.groupSort === "recent"
      ? b.lastAt.localeCompare(a.lastAt)
      : b.count - a.count || b.lastAt.localeCompare(a.lastAt),
  );

  const from = (page - 1) * perPage;
  return {
    groups: groups.slice(from, from + perPage),
    total: groups.length,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(groups.length / perPage)),
    scanned: rows.length,
    truncated: rows.length >= GROUP_SCAN_LIMIT,
  };
}

/** 대시보드 하단 '최근 분석' */
export async function getRecentAnalyses(limit = 5): Promise<AnalysisRow[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from(SCORE_TABLE)
    .select("*")
    .eq("is_admin", false) // 운영자 본인 활동 제외
    .eq("is_bot", false) // 봇·크롤러 제외
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
  tti: "띠 궁합 페이지",
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
    .eq("is_admin", false) // 운영자 본인 클릭 제외
    .eq("is_bot", false) // 봇 클릭 제외
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

// ---- 패밀리 사이트 전환 (골드박스투데이 등) ----

export interface OutboundRow {
  id: number;
  created_at: string;
  site: string;
  vertical: string | null;
  campaign: string | null;
  content: string | null;
  source_path: string | null;
}

export interface OutboundStats {
  /** outbound_clicks 테이블을 못 읽으면 이유. 정상이면 null */
  error: string | null;
  total: number;
  today: number;
  last7: number;
  prev7: number;
  daily: { date: string; count: number }[];
  bySite: { key: string; label: string; count: number }[];
  byVertical: { key: string; label: string; count: number }[];
  byPage: { key: string; label: string; count: number }[];
  /** utm_campaign = 클릭 자리 (family_tti-pair-cta 는 본문 중간, family_tti-pair 는 하단 카드) */
  byCampaign: { key: string; label: string; count: number }[];
  recent: OutboundRow[];
}

const SITE_LABEL: Record<string, string> = {
  goldbox: "🎁 골드박스투데이",
  ratebox: "🏦 금리박스",
  paybox: "💸 월급박스",
};
const VERTICAL_LABEL: Record<string, string> = {
  mbti: "MBTI 궁합 페이지",
  tti: "띠 궁합 페이지",
  gift: "선물 페이지",
  result: "분석 결과",
  shared: "공유 결과",
  home: "홈",
  footer: "푸터",
};

/**
 * 패밀리 사이트로 나간 클릭 집계 (/go/out 기록).
 * site/vertical 로 좁힐 수 있다 — 띠 궁합 어드민은 vertical=tti 만 본다.
 *
 * 마이그레이션(20261011-outbound-clicks.sql) 적용 전이면 테이블이 없어 에러가 난다.
 * 어드민 전체가 깨지지 않도록 throw 하지 않고 error 로 돌려준다.
 */
export async function getOutboundStats(
  filter: { site?: string; vertical?: string } = {},
): Promise<OutboundStats> {
  await requireAdmin();

  let q = supabaseAdmin
    .from("outbound_clicks")
    .select("id, created_at, site, vertical, campaign, content, source_path")
    .eq("is_admin", false)
    .eq("is_bot", false);
  if (filter.site) q = q.eq("site", filter.site);
  if (filter.vertical) q = q.eq("vertical", filter.vertical);

  const { data, error } = await q.order("created_at", { ascending: false }).limit(5000);

  const daily = new Map<string, number>();
  for (let i = DAILY_DAYS - 1; i >= 0; i--) daily.set(kstDateBefore(i), 0);

  if (error) {
    return {
      error: error.message,
      total: 0,
      today: 0,
      last7: 0,
      prev7: 0,
      daily: [...daily.entries()].map(([date, count]) => ({ date, count })),
      bySite: [],
      byVertical: [],
      byPage: [],
      byCampaign: [],
      recent: [],
    };
  }

  const rows = (data ?? []) as OutboundRow[];
  const today = kstDate(new Date());
  const d7 = kstDateBefore(6);
  const d14 = kstDateBefore(13);
  let todayCount = 0;
  let last7 = 0;
  let prev7 = 0;
  for (const r of rows) {
    const day = kstDate(r.created_at);
    if (daily.has(day)) daily.set(day, (daily.get(day) ?? 0) + 1);
    if (day === today) todayCount++;
    if (day >= d7) last7++;
    else if (day >= d14) prev7++;
  }

  return {
    error: null,
    total: rows.length,
    today: todayCount,
    last7,
    prev7,
    daily: [...daily.entries()].map(([date, count]) => ({ date, count })),
    bySite: tally(rows, "site", (v) => (v ? (SITE_LABEL[v] ?? v) : "-")),
    byVertical: tally(rows, "vertical", (v) => (v ? (VERTICAL_LABEL[v] ?? v) : "(구분 없음)")),
    byPage: tally(rows, "source_path", (v) => v ?? "(알 수 없음)").slice(0, 10),
    byCampaign: tally(rows, "campaign", (v) => v ?? "-").slice(0, 10),
    recent: rows.slice(0, 20),
  };
}

// ---- 띠 선물 클릭 ----

export interface TtiGiftClickStats {
  error: string | null;
  total: number;
  last7: number;
  byTti: { key: string; label: string; count: number }[];
  byGift: { key: string; label: string; count: number }[];
}

/**
 * /tti/* 의 선물 버튼 클릭 (gift_clicks.entry = 'tti').
 * tti 컬럼은 20261011-gift-clicks-tti.sql 로 추가된다. 적용 전이면 error 로 알린다.
 */
export async function getTtiGiftClickStats(
  ttiLabel: (t: string) => string,
): Promise<TtiGiftClickStats> {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("gift_clicks")
    .select("created_at, gift_id, tti")
    .eq("entry", "tti")
    .eq("is_admin", false)
    .eq("is_bot", false)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return { error: error.message, total: 0, last7: 0, byTti: [], byGift: [] };
  }
  const rows = (data ?? []) as { created_at: string; gift_id: string; tti: string | null }[];
  const weekAgo = kstDateBefore(6);
  return {
    error: null,
    total: rows.length,
    last7: rows.filter((r) => kstDate(r.created_at) >= weekAgo).length,
    byTti: tally(rows, "tti", (v) => (v ? ttiLabel(v) : "-")),
    byGift: tally(rows, "gift_id", (v) => v ?? "-").slice(0, 10),
  };
}

// ---- 쿠팡 파트너스 API 공용 장부 ----

export interface LedgerBucket {
  key: string;
  scope: string;
  bucket: string;
  windowSeconds: number;
  used: number;
  max: number;
  note: string | null;
}

export interface LedgerStatus {
  error: string | null;
  buckets: LedgerBucket[];
}

/**
 * 딥링크 배치(scripts/gen-coupang-links.mjs)가 거치는 계정 공용 장부를 읽는다.
 *
 * 파트너스 API 한도는 계정 단위라 골드박스·랭킹박스·프라이스갭과 함께 쓴다.
 * 배치를 돌리기 전에 "지금 계정이 얼마나 달아올라 있는지" 어드민에서 보려는 것 —
 * 스크립트의 reportHeadroom 과 같은 계산(닫힌 윈도는 0으로 본다)이다.
 * 읽기 전용이다. 여기서는 절대 cp_try_consume_quota 를 부르지 않는다.
 */
export async function getCoupangLedger(): Promise<LedgerStatus> {
  await requireAdmin();

  const wanted = [
    ["account", "all"],
    ["account", "deeplink"],
    ["score", "coupang-deeplink"],
  ];

  const [{ data: pol, error: pe }, { data: rows, error: qe }] = await Promise.all([
    supabaseAdmin
      .from("cp_api_policy")
      .select("scope,bucket,window_seconds,max_count,note"),
    supabaseAdmin
      .from("cp_api_quota")
      .select("bucket,window_start,count")
      .gte("window_start", new Date(Date.now() - 86_400_000).toISOString()),
  ]);

  if (pe || qe || !pol || !rows) {
    return { error: (pe ?? qe)?.message ?? "장부를 읽지 못했어", buckets: [] };
  }

  const now = Date.now();
  const current = new Map<string, { window_start: string; count: number }>();
  for (const r of rows as { bucket: string; window_start: string; count: number }[]) {
    const w = Number(r.bucket.split(":").pop());
    if (!Number.isFinite(w)) continue;
    if (new Date(r.window_start).getTime() + w * 1000 <= now) continue; // 닫힌 윈도
    const cur = current.get(r.bucket);
    if (!cur || new Date(r.window_start) > new Date(cur.window_start)) current.set(r.bucket, r);
  }

  type PolicyRow = {
    scope: string;
    bucket: string;
    window_seconds: number;
    max_count: number;
    note: string | null;
  };
  const buckets: LedgerBucket[] = [];
  for (const [scope, bucket] of wanted) {
    for (const rule of (pol as PolicyRow[])
      .filter((p) => p.scope === scope && p.bucket === bucket)
      .sort((a, b) => a.window_seconds - b.window_seconds)) {
      const key = `${scope}:${bucket}:${rule.window_seconds}`;
      buckets.push({
        key,
        scope,
        bucket,
        windowSeconds: rule.window_seconds,
        used: current.get(key)?.count ?? 0,
        max: rule.max_count,
        note: rule.note,
      });
    }
  }
  return { error: null, buckets };
}
