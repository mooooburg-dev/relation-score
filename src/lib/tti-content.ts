import ttiTypesJson from "@/data/tti-types.json";
import ttiPairsJson from "@/data/tti-pairs.json";
import type { Faq } from "./site";
import {
  TTI_IDS,
  orderPair,
  scoreTti,
  ttiPairKey,
  type Tti,
  type TtiRelation,
  type TtiScore,
} from "./tti";

/**
 * 띠 궁합 본문 데이터 (scripts/generate-tti.mjs 가 생성해 커밋한다).
 * 서버 컴포넌트 전용 — 클라이언트에서 import 하면 JSON 이 번들에 들어간다.
 */

/** 본문 데이터 갱신일. 데이터를 재생성하면 함께 갱신한다. */
export const TTI_CONTENT_UPDATED = new Date("2026-10-11T00:00:00+09:00");

export interface TtiTypeContent {
  id: Tti;
  nickname: string;
  tagline: string;
  intro: string;
  loveStyle: string;
  workStyle: string;
  giftAngle: string;
  keywords: string[];
  faq: Faq[];
}

export interface TtiPairRelation {
  relation: TtiRelation;
  score: number;
  summary: string;
  tip: string;
}

export interface TtiPairContent {
  a: Tti;
  b: Tti;
  headline: string;
  summary: string;
  relations: TtiPairRelation[];
  strengths: string[];
  conflicts: string[];
  advice: string;
  faq: Faq[];
}

/** 본문 + 규칙 점수 */
export interface TtiPair extends TtiPairContent, TtiScore {}

const TYPES = ttiTypesJson as unknown as Record<string, TtiTypeContent>;
const PAIRS = ttiPairsJson as unknown as Record<string, TtiPairContent>;

export function getTtiType(t: Tti): TtiTypeContent | null {
  return TYPES[t] ?? null;
}

export function getTtiPair(a: Tti, b: Tti): TtiPair | null {
  const content = PAIRS[ttiPairKey(a, b)];
  if (!content) return null;
  const [x, y] = orderPair(a, b);
  return { ...content, ...scoreTti(x, y) };
}

/** 본문이 생성된 조합 전부 (지지 순서) */
export function getAllTtiPairs(): TtiPair[] {
  const out: TtiPair[] = [];
  for (let i = 0; i < TTI_IDS.length; i++)
    for (let j = i; j < TTI_IDS.length; j++) {
      const p = getTtiPair(TTI_IDS[i], TTI_IDS[j]);
      if (p) out.push(p);
    }
  return out;
}

/** 본문이 생성된 띠 전부 (지지 순서) */
export function getAllTtiTypes(): TtiTypeContent[] {
  return TTI_IDS.map((t) => TYPES[t]).filter(Boolean);
}

export function ttiRelationScore(pair: TtiPair, relation: TtiRelation): number {
  return pair.relations.find((r) => r.relation === relation)?.score ?? pair.score;
}

/**
 * 특정 띠 기준 상대 띠 순위. 점수는 규칙 점수라 본문이 없어도 계산되지만,
 * 링크가 404 가 되면 안 되므로 본문이 있는 조합만 돌려준다.
 */
export function getTtiRanking(t: Tti): { other: Tti; score: number; pair: TtiPair }[] {
  return TTI_IDS.map((other) => {
    const pair = getTtiPair(t, other);
    return pair ? { other, score: pair.score, pair } : null;
  })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => y.score - x.score || TTI_IDS.indexOf(x.other) - TTI_IDS.indexOf(y.other));
}

/** 점수 상위 조합 (같은 띠 제외) */
export function getTopTtiPairs(limit = 8): TtiPair[] {
  return getAllTtiPairs()
    .filter((p) => p.a !== p.b)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
