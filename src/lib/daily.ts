/**
 * 오늘의 운세 엔진 — 띠는 그날의 일진, 별자리는 그날 달의 위치로 본다.
 *
 *  - 띠: 그날 일진(60갑자)의 지지와 내 띠를 띠 궁합 규칙(scoreTti)으로 보고, 일간(천간)의 오행이
 *    내 띠 오행을 살리는지(+4)·같은지(+2)·누르는지(-4)를 더한다. 그래서 12일이 아니라 60일 주기로 돈다.
 *  - 별자리: 서양 점성술의 데일리 운세처럼 그날 달이 지나는 별자리(약 2.5일마다 바뀜)와 내 별자리의
 *    각도를 별자리 궁합 규칙(scoreZodiac)으로 본다.
 *  - 분야별(연애·재물·일·인간관계) 점수는 총운에서 날짜·대상별로 고정된 ±8 안의 차이를 둔다.
 *
 * 같은 날·같은 띠면 서버·클라이언트 어디서 계산해도 같은 값이 나온다 (순수 함수, KST 날짜 기준).
 * JSON(문장 풀)을 import 하지 않는다 — 클라이언트(내 운세 카드)도 쓴다. 문장은 daily-content.ts.
 */
import { TTI_LIST, scoreTti, type Tti } from "./tti-rules";
import { ZODIAC_LIST, scoreZodiac, type Zodiac } from "./zodiac-rules";

export interface Ymd {
  y: number;
  m: number;
  d: number;
}

const KST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 지금의 KST 날짜 */
export function kstToday(now: Date = new Date()): Ymd {
  const [y, m, d] = KST_PARTS.format(now).split("-").map(Number);
  return { y, m, d };
}

export function ymdKey(t: Ymd): string {
  return `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
}

export function addDays(t: Ymd, n: number): Ymd {
  const dt = new Date(Date.UTC(t.y, t.m - 1, t.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
/** "10월 12일 (월)" */
export function dateLabel(t: Ymd): string {
  return `${t.m}월 ${t.d}일 (${WEEKDAY[new Date(Date.UTC(t.y, t.m - 1, t.d)).getUTCDay()]})`;
}

// ---- 일진 ----
// 1900-01-01 은 갑술일(60갑자 index 10). 2000-01-01 무오일로 검산된다.

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEM_ELEMENT = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"] as const;
type Element = (typeof STEM_ELEMENT)[number];
const GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export interface DayPillar {
  /** "기미일" */
  ganji: string;
  /** 일지(地支)에 해당하는 띠 */
  tti: Tti;
  stemElement: Element;
}

export function dayPillar(t: Ymd): DayPillar {
  const days = Math.round((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(1900, 0, 1)) / 86_400_000);
  const i = (((10 + days) % 60) + 60) % 60;
  const branch = TTI_LIST[i % 12];
  return { ganji: `${STEMS[i % 10]}${branch.branch}일`, tti: branch.id, stemElement: STEM_ELEMENT[i % 10] };
}

// ---- 달의 별자리 ----
// Meeus 저정밀식(주요 6항). 오차 약 1° — 별자리 경계(30°)를 가르기엔 충분하다. KST 정오 기준.

export function moonLongitude(t: Ymd): number {
  const rad = Math.PI / 180;
  const d = (Date.UTC(t.y, t.m - 1, t.d, 3) - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
  const L = 218.316 + 13.176396 * d;
  const M = 134.963 + 13.064993 * d;
  const D = 297.85 + 12.190749 * d;
  const Ms = 357.529 + 0.98560028 * d;
  const lon =
    L +
    6.289 * Math.sin(M * rad) -
    1.274 * Math.sin((2 * D - M) * rad) +
    0.658 * Math.sin(2 * D * rad) -
    0.186 * Math.sin(Ms * rad) -
    0.059 * Math.sin((2 * M - 2 * D) * rad) -
    0.057 * Math.sin((M - 2 * D + Ms) * rad);
  return ((lon % 360) + 360) % 360;
}

export function moonSign(t: Ymd): Zodiac {
  return ZODIAC_LIST[Math.floor(moonLongitude(t) / 30)].id;
}

// ---- 점수 ----

export type DailyField = "연애" | "재물" | "일" | "인간관계";
export const DAILY_FIELDS: DailyField[] = ["연애", "재물", "일", "인간관계"];

export interface DailyFactor {
  name: string;
  delta: number;
  desc: string;
}

export interface DailyScore {
  date: Ymd;
  score: number;
  fields: Record<DailyField, number>;
  factors: DailyFactor[];
  luckyNumber: number;
  luckyColor: string;
}

/** 문자열 → 0 이상 정수 (FNV-1a). 날짜·대상별로 고정된 "랜덤"이 필요할 때 쓴다 */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const COLORS = ["빨강", "주황", "노랑", "초록", "하늘색", "파랑", "보라", "분홍", "흰색", "검정", "베이지", "민트"];

function finish(date: Ymd, key: string, base: number, factors: DailyFactor[]): DailyScore {
  const score = clamp(base, 40, 96);
  const dk = ymdKey(date);
  const fields = Object.fromEntries(
    DAILY_FIELDS.map((f) => [f, clamp(score + (hash(`${dk}|${key}|${f}`) % 17) - 8, 32, 96)]),
  ) as Record<DailyField, number>;
  const h = hash(`${dk}|${key}|lucky`);
  return {
    date,
    score,
    fields,
    factors,
    luckyNumber: (h % 9) + 1,
    luckyColor: COLORS[Math.floor(h / 9) % COLORS.length],
  };
}

export function ttiDaily(t: Tti, date: Ymd): DailyScore {
  const p = dayPillar(date);
  const rel = scoreTti(t, p.tti);
  const mine = TTI_LIST.find((x) => x.id === t)!.element as Element;
  // 일지(지지)와의 관계 — 띠 궁합 점수 그대로라 근거도 그대로 보여준다(오행은 지지끼리의 오행)
  const factors: DailyFactor[] = rel.factors.map((f) => ({
    name: `일지 ${f.name}`,
    delta: f.delta,
    desc: f.desc,
  }));
  let adj = 0;
  if (GENERATES[p.stemElement] === mine) {
    adj = 4;
    factors.push({ name: `일간 오행 상생 (${p.stemElement}→${mine})`, delta: 4, desc: "오늘의 기운이 내 띠의 기운을 살려줘. 노력한 만큼 반응이 와." });
  } else if (p.stemElement === mine) {
    adj = 2;
    factors.push({ name: `일간 오행 비화 (${p.stemElement})`, delta: 2, desc: "오늘의 기운이 내 띠와 같은 결이라 익숙한 일에서 힘이 나." });
  } else if (CONTROLS[p.stemElement] === mine) {
    adj = -4;
    factors.push({ name: `일간 오행 상극 (${p.stemElement}→${mine})`, delta: -4, desc: "오늘의 기운이 내 띠를 누르는 편이라 무리하면 쉽게 지쳐." });
  }
  return finish(date, `tti:${t}`, rel.score + adj, factors);
}

export function zodiacDaily(z: Zodiac, date: Ymd): DailyScore {
  const moon = moonSign(date);
  const rel = scoreZodiac(z, moon);
  const moonName = ZODIAC_LIST.find((x) => x.id === moon)!.ko;
  const factors: DailyFactor[] = rel.factors.map((f, i) => ({
    name: i === 0 ? `오늘 달은 ${moonName} · ${f.name}` : f.name,
    delta: f.delta,
    desc: f.desc,
  }));
  return finish(date, `zodiac:${z}`, rel.score, factors);
}

// ---- 구간 ----

export type Band = "b5" | "b4" | "b3" | "b2" | "b1";
export function band(score: number): Band {
  if (score >= 86) return "b5";
  if (score >= 76) return "b4";
  if (score >= 64) return "b3";
  if (score >= 52) return "b2";
  return "b1";
}
export const BAND_LABEL: Record<Band, string> = {
  b5: "아주 좋은 날",
  b4: "좋은 날",
  b3: "무난한 날",
  b2: "조심할 날",
  b1: "쉬어갈 날",
};
export function dailyEmoji(score: number): string {
  return score >= 76 ? "🔥" : score >= 64 ? "☀️" : score >= 52 ? "⛅" : "🌧";
}

// ---- 경로 ----

export const TODAY_PATH = "/today";
export const todayTtiPath = (t: Tti) => `/today/tti/${t}`;
export const todayZodiacPath = (z: Zodiac) => `/today/zodiac/${z}`;
