/**
 * 커플 기념일 계산 (순수 함수 — 계산기·공유 페이지·내 운세 카드 공용).
 *
 * 한국 커플 관행은 사귄 날을 1일로 센다(includeStart). 그래서 100일은 "사귄 날 + 99일"이다.
 * 0일부터 세는 사람도 있어 옵션으로 둔다. 주년은 날수가 아니라 같은 날짜로 센다(윤년 2/29 는 2/28).
 */
import { addDays, kstToday, ymdKey, type Ymd } from "./daily";
import { decodeShare, encodeShare } from "./name-match";

export interface Milestone {
  key: string;
  label: string;
  date: Ymd;
  kind: "days" | "years";
  /** 선물 묶음 */
  gift: GiftKind;
}

export type GiftKind = "early" | "mid" | "year" | "big";

const DAY_MILESTONES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000];

function daysBetween(a: Ymd, b: Ymd): number {
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** 오늘이 몇 일째인지 (사귄 날 포함이면 당일 = 1일) */
export function dayCount(start: Ymd, today: Ymd = kstToday(), includeStart = true): number {
  return daysBetween(start, today) + (includeStart ? 1 : 0);
}

function giftForDays(n: number): GiftKind {
  if (n <= 100) return "early";
  if (n < 1000) return n % 500 === 0 ? "big" : "mid";
  return "big";
}

/** 주년 날짜 — 2/29 시작이면 평년엔 2/28 */
function yearDate(start: Ymd, years: number): Ymd {
  const y = start.y + years;
  const last = new Date(Date.UTC(y, start.m, 0)).getUTCDate();
  return { y, m: start.m, d: Math.min(start.d, last) };
}

/** 사귄 날부터 10주년까지의 기념일 (날짜순) */
export function milestones(start: Ymd, includeStart = true): Milestone[] {
  const offset = includeStart ? -1 : 0;
  const out: Milestone[] = DAY_MILESTONES.map((n) => ({
    key: `d${n}`,
    label: `${n}일`,
    date: addDays(start, n + offset),
    kind: "days" as const,
    gift: giftForDays(n),
  }));
  for (let y = 1; y <= 10; y++) {
    out.push({
      key: `y${y}`,
      label: `${y}주년`,
      date: yearDate(start, y),
      kind: "years",
      gift: y === 1 ? "year" : "big",
    });
  }
  return out.sort((a, b) => ymdKey(a.date).localeCompare(ymdKey(b.date)));
}

/** 오늘 포함 앞으로의 기념일 */
export function upcoming(start: Ymd, today: Ymd = kstToday(), includeStart = true, limit = 6): Milestone[] {
  const t = ymdKey(today);
  return milestones(start, includeStart)
    .filter((m) => ymdKey(m.date) >= t)
    .slice(0, limit);
}

export function daysUntil(date: Ymd, today: Ymd = kstToday()): number {
  return daysBetween(today, date);
}

export function dLabel(days: number): string {
  return days === 0 ? "D-DAY" : days > 0 ? `D-${days}` : `D+${-days}`;
}

export function isValidStart(s: Ymd, today: Ymd = kstToday()): boolean {
  if (!Number.isInteger(s.y) || s.y < 1950 || s.m < 1 || s.m > 12 || s.d < 1) return false;
  if (s.d > new Date(Date.UTC(s.y, s.m, 0)).getUTCDate()) return false;
  return ymdKey(s) <= ymdKey(today);
}

export const GIFT_LABEL: Record<GiftKind, string> = {
  early: "100일",
  mid: "100일 단위",
  year: "1주년",
  big: "500일·1000일·주년",
};

/** 기념일 종류별 선물 카탈로그 id (gifts.json — 브랜드명 없음) */
export const ANNIV_GIFTS: Record<GiftKind, string[]> = {
  early: ["event-couple-keyring", "event-flower", "event-handmade-choco"],
  mid: ["anniv-couple-mug", "anniv-photobook", "event-flower"],
  year: ["event-couple-ring", "anniv-photobook", "event-flower"],
  big: ["event-couple-ring", "event-couple-pajama", "anniv-photobook"],
};

// ---- 공유 코드 (사귄 날을 URL 에 그대로 남기지 않는다) ----

const pad = (n: number) => String(n).padStart(2, "0");

export function anniversarySharePath(start: Ymd, includeStart: boolean): string {
  return `/anniversary/r/${encodeShare([`${start.y}${pad(start.m)}${pad(start.d)}`, includeStart ? "1" : "0"])}`;
}
export function decodeAnniversaryShare(code: string): { start: Ymd; includeStart: boolean } | null {
  const p = decodeShare(code, 2);
  const m = p && /^(\d{4})(\d{2})(\d{2})$/.exec(p[0]);
  if (!p || !m || (p[1] !== "0" && p[1] !== "1")) return null;
  const start = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return isValidStart(start) ? { start, includeStart: p[1] === "1" } : null;
}

// ---- 캘린더(.ics) ----

/** 기념일 목록을 iCalendar 텍스트로 (종일 일정) */
export function toIcs(list: Milestone[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ymd = (t: Ymd) => `${t.y}${pad(t.m)}${pad(t.d)}`;
  const events = list.map((m) => {
    const end = addDays(m.date, 1);
    return [
      "BEGIN:VEVENT",
      `UID:${ymd(m.date)}-${m.key}@score.drawyourmind.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(m.date)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:💑 우리 ${m.label}`,
      "BEGIN:VALARM",
      "TRIGGER:-P3D",
      "ACTION:DISPLAY",
      `DESCRIPTION:우리 ${m.label}까지 3일 남았어 — 선물 준비!`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//몇점이야?//anniversary//KO", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}
