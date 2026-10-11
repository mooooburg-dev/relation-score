/**
 * 별자리 궁합 헬퍼 (경로·이름·순서·라벨).
 * 점수 규칙은 zodiac-rules.ts, 본문 데이터는 zodiac-content.ts.
 * 클라이언트(별자리 계산기)도 import 하므로 JSON 을 import 하지 말 것.
 */
export {
  ZODIAC_LIST,
  scoreZodiac,
  zodiacOf,
  type Zodiac,
  type ZodiacFactor,
  type ZodiacInfo,
  type ZodiacRelationKind,
  type ZodiacScore,
} from "./zodiac-rules";
import { ZODIAC_LIST, type Zodiac, type ZodiacInfo } from "./zodiac-rules";

export const ZODIAC_IDS = ZODIAC_LIST.map((z) => z.id) as Zodiac[];
const BY_ID = new Map<string, ZodiacInfo>(ZODIAC_LIST.map((z) => [z.id, z]));

export function isZodiac(v: string): v is Zodiac {
  return BY_ID.has(v);
}
export function zodiacInfo(z: Zodiac): ZodiacInfo {
  return BY_ID.get(z)!;
}
/** "양자리" */
export function zodiacName(z: Zodiac): string {
  return zodiacInfo(z).ko;
}
/** "3월 21일 ~ 4월 19일" */
export function zodiacDates(z: Zodiac): string {
  const [sm, sd, em, ed] = zodiacInfo(z).dates;
  return `${sm}월 ${sd}일 ~ ${em}월 ${ed}일`;
}

export const ELEMENT_EMOJI: Record<string, string> = { 불: "🔥", 흙: "🌿", 공기: "💨", 물: "💧" };

/** 관계 유형. 별자리는 연애 수요가 커서 썸을 넣고 부모자식은 뺐다 */
export const ZODIAC_RELATIONS = [
  { value: "연인", emoji: "💕" },
  { value: "썸", emoji: "🔥" },
  { value: "부부", emoji: "💍" },
  { value: "친구", emoji: "🤝" },
  { value: "직장동료", emoji: "💼" },
] as const;
export type ZodiacRelation = (typeof ZODIAC_RELATIONS)[number]["value"];

// ---- 경로 — 조합의 정식 순서는 황도 순서(양자리 → 물고기자리) ----

export const ZODIAC_INDEX_PATH = "/zodiac";

export function orderZodiac(a: Zodiac, b: Zodiac): [Zodiac, Zodiac] {
  return zodiacInfo(a).index <= zodiacInfo(b).index ? [a, b] : [b, a];
}
export function zodiacPairKey(a: Zodiac, b: Zodiac): string {
  return orderZodiac(a, b).join("-");
}
export function zodiacTypePath(z: Zodiac): string {
  return `/zodiac/${z}`;
}
export function zodiacPairPath(a: Zodiac, b: Zodiac): string {
  const [x, y] = orderZodiac(a, b);
  return `/zodiac/${x}/${y}`;
}
export function allZodiacPairs(): [Zodiac, Zodiac][] {
  const out: [Zodiac, Zodiac][] = [];
  for (let i = 0; i < ZODIAC_IDS.length; i++)
    for (let j = i; j < ZODIAC_IDS.length; j++) out.push([ZODIAC_IDS[i], ZODIAC_IDS[j]]);
  return out;
}

// ---- 라벨 (분포 50~96) ----

export function zodiacScoreLabel(score: number): string {
  if (score >= 90) return "운명적 케미";
  if (score >= 80) return "잘 맞는 궁합";
  if (score >= 70) return "끌리는 궁합";
  if (score >= 60) return "맞춰가는 궁합";
  return "긴장감 있는 궁합";
}
export function zodiacScoreEmoji(score: number): string {
  return score >= 80 ? "🔥" : score >= 60 ? "💛" : "💧";
}
