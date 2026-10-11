import zodiacTypesJson from "@/data/zodiac-types.json";
import zodiacPairsJson from "@/data/zodiac-pairs.json";
import type { Faq } from "./site";
import {
  ZODIAC_IDS,
  orderZodiac,
  scoreZodiac,
  zodiacPairKey,
  type Zodiac,
  type ZodiacRelation,
  type ZodiacScore,
} from "./zodiac";

/**
 * 별자리 궁합 본문 (정적 JSON). 점수는 zodiac-rules.ts 규칙에서 계산해 합친다.
 * 서버 컴포넌트 전용 — 클라이언트에서 import 하면 JSON 이 번들에 들어간다.
 */

/** 본문 발행일. 재작성하면 함께 갱신한다. */
export const ZODIAC_CONTENT_UPDATED = new Date("2026-10-11T00:00:00+09:00");

export interface ZodiacTypeContent {
  id: Zodiac;
  nickname: string;
  tagline: string;
  intro: string;
  loveStyle: string;
  workStyle: string;
  giftAngle: string;
  keywords: string[];
  faq: Faq[];
}

export interface ZodiacPairContent {
  a: Zodiac;
  b: Zodiac;
  headline: string;
  summary: string;
  relations: { relation: ZodiacRelation; score: number; summary: string; tip: string }[];
  strengths: string[];
  conflicts: string[];
  advice: string;
  faq: Faq[];
}

export interface ZodiacPair extends ZodiacPairContent, ZodiacScore {}

const TYPES = zodiacTypesJson as unknown as Record<string, ZodiacTypeContent>;
const PAIRS = zodiacPairsJson as unknown as Record<string, ZodiacPairContent>;

export function getZodiacType(z: Zodiac): ZodiacTypeContent | null {
  return TYPES[z] ?? null;
}
export function getAllZodiacTypes(): ZodiacTypeContent[] {
  return ZODIAC_IDS.map((z) => TYPES[z]).filter(Boolean);
}

export function getZodiacPair(a: Zodiac, b: Zodiac): ZodiacPair | null {
  const c = PAIRS[zodiacPairKey(a, b)];
  if (!c) return null;
  const [x, y] = orderZodiac(a, b);
  return { ...c, ...scoreZodiac(x, y) };
}

export function getAllZodiacPairs(): ZodiacPair[] {
  const out: ZodiacPair[] = [];
  for (let i = 0; i < ZODIAC_IDS.length; i++)
    for (let j = i; j < ZODIAC_IDS.length; j++) {
      const p = getZodiacPair(ZODIAC_IDS[i], ZODIAC_IDS[j]);
      if (p) out.push(p);
    }
  return out;
}

export function zodiacRelationScore(p: ZodiacPair, r: ZodiacRelation): number {
  return p.relations.find((x) => x.relation === r)?.score ?? p.score;
}

/** 기준 별자리의 상대 순위 (본문 있는 조합만 — 링크가 404 가 되지 않게) */
export function getZodiacRanking(z: Zodiac): { other: Zodiac; score: number; pair: ZodiacPair }[] {
  return ZODIAC_IDS.map((other) => {
    const pair = getZodiacPair(z, other);
    return pair ? { other, score: pair.score, pair } : null;
  })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => y.score - x.score || ZODIAC_IDS.indexOf(x.other) - ZODIAC_IDS.indexOf(y.other));
}

export function getTopZodiacPairs(limit = 8): ZodiacPair[] {
  return getAllZodiacPairs()
    .filter((p) => p.a !== p.b)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
