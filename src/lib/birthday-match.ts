/**
 * 생일 궁합 — 생년월일 두 개로 띠 궁합(연도)과 별자리 궁합(월·일)을 함께 본다.
 *
 * 새 규칙을 만들지 않고 이미 있는 두 규칙(tti-rules, zodiac-rules)을 합친다. 그래서 결과에서
 * 띠·별자리 상세 페이지로 그대로 이어지고, 점수도 그 페이지와 같다.
 *  - 띠는 양력 연도 기준이다. 1~2월생(설·입춘 전)은 전년도 띠일 수 있어 화면에서 안내한다.
 *  - 종합 점수는 두 점수의 평균(반올림).
 *
 * 순수 함수만 둔다 — 클라이언트 계산기와 서버 공유 페이지가 함께 쓴다.
 */
import { scoreTti, ttiOf, type Tti } from "./tti-rules";
import { scoreZodiac, zodiacOf, type Zodiac } from "./zodiac-rules";
import { decodeShare, encodeShare } from "./name-match";

export interface Birthdate {
  y: number;
  m: number;
  d: number;
}

export function isValidBirthdate(b: Birthdate, maxYear: number): boolean {
  if (!Number.isInteger(b.y) || !Number.isInteger(b.m) || !Number.isInteger(b.d)) return false;
  if (b.y < 1920 || b.y > maxYear || b.m < 1 || b.m > 12 || b.d < 1) return false;
  return b.d <= new Date(Date.UTC(b.y, b.m, 0)).getUTCDate();
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayOf(b: Birthdate): string {
  return WEEKDAYS[new Date(Date.UTC(b.y, b.m - 1, b.d)).getUTCDay()];
}

export interface BirthdayMatch {
  ttiA: Tti;
  ttiB: Tti;
  zodiacA: Zodiac;
  zodiacB: Zodiac;
  ttiScore: number;
  zodiacScore: number;
  score: number;
  weekdayA: string;
  weekdayB: string;
  /** 생일이 1~2월이라 띠가 전년도일 수 있는 사람 */
  ttiAmbiguous: [boolean, boolean];
}

export function birthdayMatch(a: Birthdate, b: Birthdate): BirthdayMatch {
  const ttiA = ttiOf(a.y);
  const ttiB = ttiOf(b.y);
  const zodiacA = zodiacOf(a.m, a.d);
  const zodiacB = zodiacOf(b.m, b.d);
  const ttiScore = scoreTti(ttiA, ttiB).score;
  const zodiacScore = scoreZodiac(zodiacA, zodiacB).score;
  return {
    ttiA,
    ttiB,
    zodiacA,
    zodiacB,
    ttiScore,
    zodiacScore,
    score: Math.round((ttiScore + zodiacScore) / 2),
    weekdayA: weekdayOf(a),
    weekdayB: weekdayOf(b),
    ttiAmbiguous: [a.m <= 2, b.m <= 2],
  };
}

export function birthdayLabel(score: number): string {
  if (score >= 88) return "타고난 찰떡";
  if (score >= 78) return "잘 맞는 생일";
  if (score >= 68) return "무난한 생일";
  if (score >= 58) return "맞춰가는 생일";
  return "티격태격 생일";
}

/** "3살 차이" / "동갑" — 만 나이가 아니라 출생 연도 차이로 말한다 (검색어 관행) */
export function yearGapLabel(a: Birthdate, b: Birthdate): string {
  const gap = Math.abs(a.y - b.y);
  return gap === 0 ? "동갑" : `${gap}살 차이`;
}

// ---- 공유 코드 (생년월일을 URL 에 그대로 남기지 않는다) ----

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export function formatBirthdate(b: Birthdate): string {
  return `${b.y}${pad(b.m)}${pad(b.d)}`;
}
function parseBirthdate(s: string): Birthdate | null {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

export function birthdaySharePath(a: Birthdate, b: Birthdate): string {
  return `/birthday/r/${encodeShare([formatBirthdate(a), formatBirthdate(b)])}`;
}
export function decodeBirthdayShare(code: string, maxYear: number): [Birthdate, Birthdate] | null {
  const p = decodeShare(code, 2);
  if (!p) return null;
  const a = parseBirthdate(p[0]);
  const b = parseBirthdate(p[1]);
  return a && b && isValidBirthdate(a, maxYear) && isValidBirthdate(b, maxYear) ? [a, b] : null;
}
