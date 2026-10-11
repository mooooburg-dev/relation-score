import fortune2027 from "@/data/fortune-2027.json";
import type { Faq } from "./site";
import type { Tti } from "./tti";
import { TTI_IDS } from "./tti";
import { fortuneScore, isFortuneYear, type FortuneScore, type FortuneYear } from "./fortune";

/**
 * 띠별 신년운세 본문 (src/data/fortune-<year>.json, 커밋된 정적 데이터).
 * 점수는 본문에 없다 — fortune.ts 규칙에서 계산해 합친다(분야별 점수만 본문에 있다).
 * 서버 컴포넌트 전용.
 */

/** 해마다 본문 발행일. 새 해 데이터를 넣으면 같이 추가한다. */
export const FORTUNE_PUBLISHED: Record<FortuneYear, Date> = {
  2027: new Date("2026-10-11T00:00:00+09:00"),
};

export const FORTUNE_FIELDS = ["연애", "재물", "일", "인간관계"] as const;
export type FortuneField = (typeof FORTUNE_FIELDS)[number];

export const FIELD_EMOJI: Record<FortuneField, string> = {
  연애: "💕",
  재물: "💰",
  일: "💼",
  인간관계: "🤝",
};

export interface FortuneContent {
  tti: Tti;
  headline: string;
  summary: string;
  fields: { field: FortuneField; score: number; text: string; tip: string }[];
  months: { month: number; text: string }[];
  births: { year: number; text: string }[];
  lucky: string;
  advice: string;
  faq: Faq[];
}

export interface Fortune extends FortuneContent, FortuneScore {}

const DATA: Record<FortuneYear, Record<string, FortuneContent>> = {
  2027: fortune2027 as unknown as Record<string, FortuneContent>,
};

export function getFortune(year: number, t: Tti): Fortune | null {
  if (!isFortuneYear(year)) return null;
  const c = DATA[year][t];
  return c ? { ...c, ...fortuneScore(year, t) } : null;
}

/** 본문이 있는 띠 (지지 순서) */
export function getFortuneTtis(year: number): Tti[] {
  return TTI_IDS.filter((t) => getFortune(year, t));
}
