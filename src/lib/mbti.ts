import typesJson from "@/data/types.json";
import pairsJson from "@/data/pairs.json";

export const SITE_URL = "https://score.drawyourmind.com";
export const SITE_NAME = "몇점이야?";

export const MBTI_LIST = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;
export type Mbti = (typeof MBTI_LIST)[number];

/** 커뮤니티에서 흔히 쓰는 한글 표기 (검색 키워드용: "인프제 엔프피 궁합") */
export const MBTI_KO: Record<Mbti, string> = {
  ISTJ: "잇티제",
  ISFJ: "잇프제",
  INFJ: "인프제",
  INTJ: "인티제",
  ISTP: "잇팁",
  ISFP: "잇프피",
  INFP: "인프피",
  INTP: "인팁",
  ESTP: "엣팁",
  ESFP: "엣프피",
  ENFP: "엔프피",
  ENTP: "엔팁",
  ESTJ: "엣티제",
  ESFJ: "엣프제",
  ENFJ: "엔프제",
  ENTJ: "엔티제",
};
export function ko(t: Mbti): string {
  return MBTI_KO[t];
}

export const RELATIONS = [
  { value: "연인", emoji: "💕" },
  { value: "친구", emoji: "🤝" },
  { value: "직장동료", emoji: "💼" },
  { value: "가족", emoji: "👨‍👩‍👧" },
  { value: "소개팅", emoji: "☕" },
  { value: "썸", emoji: "🔥" },
] as const;
export type Relation = (typeof RELATIONS)[number]["value"];

export interface Faq {
  q: string;
  a: string;
}

export interface TypeContent {
  type: Mbti;
  nickname: string;
  tagline: string;
  intro: string;
  loveStyle: string;
  friendStyle: string;
  workStyle: string;
  keywords: string[];
  faq: Faq[];
}

export interface PairRelation {
  relation: Relation;
  score: number;
  summary: string;
  tip: string;
}

export interface PairContent {
  a: Mbti;
  b: Mbti;
  headline: string;
  overall: number;
  summary: string;
  relations: PairRelation[];
  strengths: string[];
  conflicts: string[];
  advice: string;
  faq: Faq[];
}

const TYPES = typesJson as Record<string, TypeContent>;
const PAIRS = pairsJson as Record<string, PairContent>;

export function isMbti(v: string): v is Mbti {
  return (MBTI_LIST as readonly string[]).includes(v);
}

export function normalizeMbti(v: string | undefined): Mbti | null {
  const u = (v ?? "").toUpperCase();
  return isMbti(u) ? u : null;
}

/** 조합 키는 알파벳순 정렬 (ENFP-INFJ). URL slug는 소문자. */
export function pairKey(a: Mbti, b: Mbti): string {
  return [a, b].sort().join("-");
}
export function pairSlug(a: Mbti, b: Mbti): string {
  return pairKey(a, b).toLowerCase();
}
export function pairPath(a: Mbti, b: Mbti): string {
  return `/pair/${pairSlug(a, b)}`;
}
export function typePath(t: Mbti): string {
  return `/mbti/${t.toLowerCase()}`;
}

/** slug("enfp-infj") → [ENFP, INFJ] (정렬 여부와 무관하게 파싱) */
export function parsePairSlug(slug: string): [Mbti, Mbti] | null {
  const [x, y] = slug.split("-");
  const a = normalizeMbti(x);
  const b = normalizeMbti(y);
  if (!a || !b) return null;
  return [a, b];
}

export function getType(t: Mbti): TypeContent | null {
  return TYPES[t] ?? null;
}
export function getAllTypes(): TypeContent[] {
  return MBTI_LIST.map((t) => TYPES[t]).filter(Boolean);
}

export function getPair(a: Mbti, b: Mbti): PairContent | null {
  return PAIRS[pairKey(a, b)] ?? null;
}
export function getAllPairs(): PairContent[] {
  return Object.values(PAIRS);
}

/** 특정 유형 기준 상대 유형별 점수 (relation 미지정 시 종합) 내림차순 */
export function getRanking(
  t: Mbti,
  relation?: Relation,
): { other: Mbti; score: number; pair: PairContent }[] {
  return MBTI_LIST.map((other) => {
    const pair = getPair(t, other);
    if (!pair) return null;
    const score = relation
      ? (pair.relations.find((r) => r.relation === relation)?.score ?? pair.overall)
      : pair.overall;
    return { other, score, pair };
  })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => y.score - x.score);
}

export function scoreEmoji(score: number): string {
  return score >= 80 ? "🔥" : score >= 50 ? "💜" : "💧";
}

/** 점수 라벨. 생성된 데이터 분포(대략 58~89)에 맞춰 구간 설정 */
export function scoreLabel(score: number): string {
  if (score >= 85) return "찰떡궁합";
  if (score >= 78) return "아주 잘 맞음";
  if (score >= 70) return "잘 맞는 편";
  if (score >= 62) return "무난한 편";
  if (score >= 50) return "노력하면 OK";
  return "자주 부딪힘";
}

/** 홈에 노출할 인기 조합 (종합 점수 상위) */
export function getTopPairs(limit = 8): PairContent[] {
  return getAllPairs()
    .filter((p) => p.a !== p.b)
    .sort((x, y) => y.overall - x.overall)
    .slice(0, limit);
}
