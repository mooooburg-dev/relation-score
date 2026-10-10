/**
 * 띠 궁합 규칙 엔진.
 *
 * 점수는 AI 가 아니라 이 파일의 전통 규칙(합·충·원진·형·해 + 오행)으로 정한다.
 *  - 같은 조합이 페이지마다 다른 점수로 나오는 일이 없다 (AI 생성 점수는 재생성마다 흔들린다)
 *  - "왜 이 점수인지"를 근거로 보여줄 수 있다 — 검색 유입 사용자가 가장 먼저 찾는 정보다
 * 본문(scripts/generate-tti.mjs)은 이 결과를 입력으로 받아 점수와 어긋나지 않게 쓴다.
 *
 * 클라이언트(띠 계산기)도 import 하므로 JSON 데이터나 서버 모듈을 import 하지 말 것.
 * 본문 데이터 접근은 tti-content.ts 에 있다.
 *
 * ⚠ 규칙·가중치(tti-rules.ts)를 바꾸면 점수가 바뀐다. 생성 스크립트도 같은 파일을 쓰므로
 *   둘이 어긋날 일은 없지만, 이미 생성된 본문(tti-pairs.json)은 옛 점수 기준으로 쓰여 있다
 *   — 바꿨다면 `npm run tti-content -- pairs --force` 로 재생성할 것.
 */
export {
  TTI_LIST,
  scoreTti,
  ttiOf,
  type Element,
  type Tti,
  type TtiInfo,
  type TtiRelationKind,
  type TtiScore,
  type TtiFactor,
} from "./tti-rules";
import { TTI_LIST, ttiOf, type Tti, type TtiInfo } from "./tti-rules";

export const TTI_IDS = TTI_LIST.map((t) => t.id) as Tti[];

const BY_ID = new Map<string, TtiInfo>(TTI_LIST.map((t) => [t.id, t]));

export function isTti(v: string): v is Tti {
  return BY_ID.has(v);
}
export function ttiInfo(t: Tti): TtiInfo {
  return BY_ID.get(t)!;
}
/** "쥐띠" */
export function ttiName(t: Tti): string {
  return `${ttiInfo(t).ko}띠`;
}

/** 관계 유형. MBTI 와 달리 결혼·부모자식 수요("띠 궁합 결혼", "부모 자식 띠 궁합")가 크다 */
export const TTI_RELATIONS = [
  { value: "연인", emoji: "💕" },
  { value: "부부", emoji: "💍" },
  { value: "친구", emoji: "🤝" },
  { value: "직장동료", emoji: "💼" },
  { value: "부모자식", emoji: "👨‍👩‍👧" },
] as const;
export type TtiRelation = (typeof TTI_RELATIONS)[number]["value"];

// ---- 경로 ----
// 조합의 정식 순서는 알파벳이 아니라 지지 순서(자축인묘…)다. "쥐띠 소띠"가 "소띠 쥐띠"보다
// 자연스럽고, 검색어도 그 순서가 많다.

export function ttiIndex(t: Tti): number {
  return ttiInfo(t).index;
}
export function orderPair(a: Tti, b: Tti): [Tti, Tti] {
  return ttiIndex(a) <= ttiIndex(b) ? [a, b] : [b, a];
}
export function ttiPairKey(a: Tti, b: Tti): string {
  return orderPair(a, b).join("-");
}
export function ttiTypePath(t: Tti): string {
  return `/tti/${t}`;
}
export function ttiPairPath(a: Tti, b: Tti): string {
  const [x, y] = orderPair(a, b);
  return `/tti/${x}/${y}`;
}
export const TTI_INDEX_PATH = "/tti";

/** 78개 조합 (같은 띠끼리 포함), 지지 순서 */
export function allTtiPairs(): [Tti, Tti][] {
  const out: [Tti, Tti][] = [];
  for (let i = 0; i < TTI_IDS.length; i++)
    for (let j = i; j < TTI_IDS.length; j++) out.push([TTI_IDS[i], TTI_IDS[j]]);
  return out;
}

// ---- 출생연도 ----

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
/** 천간 → 색 (갑을=푸른, 병정=붉은, 무기=황금, 경신=흰, 임계=검은) */
const STEM_COLOR = ["푸른", "푸른", "붉은", "붉은", "황금", "황금", "흰", "흰", "검은", "검은"];

export interface BirthYear {
  year: number;
  /** "갑자년" */
  ganji: string;
  /** "푸른 쥐" */
  color: string;
}

export function yearInfo(year: number): BirthYear {
  const t = ttiOf(year);
  const info = ttiInfo(t);
  const stem = (((year - 4) % 10) + 10) % 10;
  return {
    year,
    ganji: `${STEMS[stem]}${info.branch}년`,
    color: `${STEM_COLOR[stem]} ${info.animal}`,
  };
}

export const YEAR_MIN = 1940;
/** 올해까지. 빌드 시점 기준 — 해가 바뀌면 다음 빌드에서 자연히 늘어난다 */
export const YEAR_MAX = new Date().getFullYear();

/** 그 띠의 출생연도 (오래된 순) */
export function birthYears(t: Tti, from = YEAR_MIN, to = YEAR_MAX): BirthYear[] {
  const out: BirthYear[] = [];
  for (let y = from; y <= to; y++) if (ttiOf(y) === t) out.push(yearInfo(y));
  return out;
}

/** "96년생" */
export function shortYear(y: number): string {
  return `${String(y % 100).padStart(2, "0")}년생`;
}

// ---- 점수 라벨 ----
// MBTI(58~89 분포)와 구간이 달라 따로 둔다. 규칙 점수 분포는 대략 40~95.

export function ttiScoreLabel(score: number): string {
  if (score >= 88) return "천생연분";
  if (score >= 80) return "잘 맞는 궁합";
  if (score >= 70) return "무난한 궁합";
  if (score >= 60) return "맞춰가는 궁합";
  if (score >= 50) return "조심할 궁합";
  return "부딪히는 궁합";
}
export function ttiScoreEmoji(score: number): string {
  return score >= 80 ? "🔥" : score >= 60 ? "💛" : "💧";
}
