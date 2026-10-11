import pool from "@/data/daily-pool.json";
import { band, hash, ymdKey, type DailyField, type DailyScore } from "./daily";

/**
 * 오늘의 운세 문장 — 점수 구간별 문장 풀(src/data/daily-pool.json, 구간마다 10개)에서
 * 날짜·대상·분야로 고정된 하나를 고른다. 같은 날 같은 띠는 몇 번 열어도 같은 문장이다.
 * 서버 전용 (풀 JSON 을 클라이언트 번들에 넣지 않는다).
 */
type Pool = Record<string, Record<string, string[]>>;
const POOL = pool as Pool;

const FIELD_CAT: Record<DailyField, string> = {
  연애: "love",
  재물: "money",
  일: "work",
  인간관계: "people",
};

function pick(cat: string, score: number, seed: string): string {
  const list = POOL[cat]?.[band(score)] ?? [];
  return list.length ? list[hash(`${seed}|${cat}`) % list.length] : "";
}

export interface DailyText {
  total: string;
  fields: Record<DailyField, string>;
  tip: string;
}

export function dailyText(key: string, s: DailyScore): DailyText {
  const seed = `${ymdKey(s.date)}|${key}`;
  return {
    total: pick("total", s.score, seed),
    fields: Object.fromEntries(
      (Object.keys(FIELD_CAT) as DailyField[]).map((f) => [f, pick(FIELD_CAT[f], s.fields[f], seed)]),
    ) as Record<DailyField, string>,
    tip: pick("tip", s.score, seed),
  };
}
