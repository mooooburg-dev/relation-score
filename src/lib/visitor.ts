/**
 * 재방문용 "나를 기억하기" — 전부 이 브라우저의 localStorage 에만 둔다(서버로 보내지 않는다).
 *
 *  - 프로필: 내 생일(→ 띠·별자리). 다시 오면 홈·오늘의 운세에 내 운세가 바로 뜬다
 *  - 출석: 오늘의 운세를 연속으로 확인한 날 수
 *  - 기록: 최근 본 궁합 결과 링크 (최대 10개)
 *
 * 사생활 보호 모드·저장 차단이면 localStorage 접근이 throw 할 수 있어 모든 읽기·쓰기를 감싼다.
 * 저장이 안 되면 그냥 "처음 온 사람"처럼 동작한다.
 * 클라이언트 컴포넌트에서만 import 할 것.
 */
import { ttiOf, type Tti } from "./tti-rules";
import { zodiacOf, type Zodiac } from "./zodiac-rules";
import { addDays, kstToday, ymdKey } from "./daily";

const KEY_PROFILE = "rs_profile";
const KEY_STREAK = "rs_streak";
const KEY_HISTORY = "rs_history";
/** 같은 탭 안의 다른 컴포넌트에 변경을 알린다 (storage 이벤트는 다른 탭에만 온다) */
export const VISITOR_EVENT = "rs-visitor-change";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(VISITOR_EVENT));
  } catch {
    // 저장이 막혀 있으면 기억하지 않는다
  }
}

// ---- 프로필 ----

export interface Profile {
  y: number;
  m: number;
  d: number;
  /** 1~2월생이 설·입춘 전에 태어나 전년도 띠인 경우 */
  early?: boolean;
}

export function getProfile(): Profile | null {
  const p = read<Profile>(KEY_PROFILE);
  return p && p.y > 1900 && p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= 31 ? p : null;
}
export function saveProfile(p: Profile) {
  write(KEY_PROFILE, p);
  track("profile_save");
}
export function clearProfile() {
  write(KEY_PROFILE, null);
}
export function profileTti(p: Profile): Tti {
  return ttiOf(p.early ? p.y - 1 : p.y);
}
export function profileZodiac(p: Profile): Zodiac {
  return zodiacOf(p.m, p.d);
}

// ---- 출석 ----

export interface Streak {
  /** 마지막으로 확인한 KST 날짜 */
  last: string;
  count: number;
  best: number;
}

export function getStreak(): Streak | null {
  return read<Streak>(KEY_STREAK);
}

/**
 * 오늘 출석을 찍는다. 어제 찍었으면 +1, 그보다 오래됐으면 1부터 다시, 오늘 이미 찍었으면 그대로.
 * 오늘 처음 찍은 경우에만 GA 이벤트를 보낸다(재방문 지표).
 */
export function touchStreak(): Streak {
  const today = ymdKey(kstToday());
  const yesterday = ymdKey(addDays(kstToday(), -1));
  const prev = getStreak();
  if (prev?.last === today) return prev;
  const count = prev?.last === yesterday ? prev.count + 1 : 1;
  const next = { last: today, count, best: Math.max(count, prev?.best ?? 0) };
  write(KEY_STREAK, next);
  track("daily_checkin", { streak: count, returning: prev ? 1 : 0 });
  return next;
}

// ---- 최근 본 궁합 ----

export interface HistoryItem {
  kind: "name" | "birthday" | "mbti";
  label: string;
  path: string;
  at: number;
}

export function getHistory(): HistoryItem[] {
  const h = read<HistoryItem[]>(KEY_HISTORY);
  return Array.isArray(h) ? h.filter((x) => x && typeof x.path === "string").slice(0, 10) : [];
}
export function addHistory(item: Omit<HistoryItem, "at">) {
  const rest = getHistory().filter((x) => x.path !== item.path);
  write(KEY_HISTORY, [{ ...item, at: Date.now() }, ...rest].slice(0, 10));
}
export function clearHistory() {
  write(KEY_HISTORY, null);
}

// ---- GA 이벤트 ----

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 커스텀 이벤트. GA 가 없거나 막혀 있으면 아무것도 안 한다 */
export function track(name: string, params: Record<string, string | number> = {}) {
  try {
    window.gtag?.("event", name, params);
  } catch {
    // 무시
  }
}
