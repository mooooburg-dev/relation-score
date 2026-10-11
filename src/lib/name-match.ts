/**
 * 이름 궁합 (획수 궁합).
 *
 * 예전부터 학교에서 하던 방식 그대로다.
 *  1) 두 이름을 한 글자씩 번갈아 쓴다 (내 이름 첫 글자, 상대 첫 글자, 내 둘째 글자 …)
 *  2) 글자마다 자모 획수를 더해 숫자로 바꾼다
 *  3) 이웃한 두 숫자를 더한 일의 자리만 남기는 걸 두 자리가 될 때까지 반복한다
 *  4) 남은 두 자리가 궁합 퍼센트
 * 누구 이름을 먼저 쓰느냐에 따라 결과가 달라서 "내가 → 상대", "상대 → 내가" 를 따로 본다.
 *
 * 순수 함수만 두고 JSON 을 import 하지 않는다 — 클라이언트 계산기와 서버 공유 페이지가 함께 쓴다.
 */

// 획수표는 이 테스트에서 가장 흔히 쓰는 값이다 (사이트마다 ㄹ·ㅊ 등이 한 획씩 다른 경우가 있다)
const INITIAL = [
  2, 4, 2, 3, 6, 5, 4, 4, 8, 2, 4, 1, 3, 6, 4, 3, 4, 4, 3,
]; // ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
const MEDIAL = [
  2, 3, 3, 4, 2, 3, 3, 4, 2, 4, 5, 3, 3, 2, 4, 5, 3, 3, 1, 2, 1,
]; // ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
const FINAL = [
  0, 2, 4, 4, 2, 5, 5, 3, 5, 7, 9, 9, 7, 9, 9, 8, 4, 4, 6, 2, 4, 1, 3, 4, 3, 4, 4, 3,
]; // (없음) ㄱ ㄲ ㄳ ㄴ ㄵ ㄶ ㄷ ㄹ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅁ ㅂ ㅄ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ

export const NAME_MIN = 1;
export const NAME_MAX = 5;

const HANGUL_RE = /^[가-힣]+$/;

/** 완성형 한글 1~5글자만 받는다 */
export function isValidName(name: string): boolean {
  return HANGUL_RE.test(name) && name.length >= NAME_MIN && name.length <= NAME_MAX;
}

/** 글자 하나의 획수 */
export function strokes(ch: string): number {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return 0;
  const i = Math.floor(code / 588);
  const m = Math.floor((code % 588) / 28);
  const f = code % 28;
  return INITIAL[i] + MEDIAL[m] + FINAL[f];
}

/** 두 이름을 한 글자씩 번갈아 섞는다. 길이가 다르면 남는 글자를 뒤에 붙인다 */
export function interleave(first: string, second: string): string[] {
  const a = [...first];
  const b = [...second];
  const out: string[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

export interface NameMatch {
  /** 섞인 글자 순서 */
  letters: string[];
  /** 피라미드: 첫 줄은 글자별 획수, 마지막 줄은 두 자리 */
  rows: number[][];
  /** 0~99 */
  score: number;
}

/** first 를 먼저 쓴 궁합 ("first → second" 의 마음) */
export function nameMatch(first: string, second: string): NameMatch {
  const letters = interleave(first, second);
  const rows: number[][] = [letters.map((c) => strokes(c) % 10)];
  // 글자가 2개뿐이면(한 글자 이름 둘) 첫 줄이 곧 결과다
  while (rows[rows.length - 1].length > 2) {
    const prev = rows[rows.length - 1];
    rows.push(prev.slice(1).map((v, i) => (prev[i] + v) % 10));
  }
  const last = rows[rows.length - 1];
  const score = last.length === 2 ? last[0] * 10 + last[1] : last[0] * 10;
  return { letters, rows, score };
}

export function nameMatchLabel(score: number): string {
  if (score >= 90) return "천생연분";
  if (score >= 75) return "잘 맞는 사이";
  if (score >= 55) return "통하는 사이";
  if (score >= 35) return "알아가는 사이";
  return "노력이 필요한 사이";
}

export function nameMatchEmoji(score: number): string {
  return score >= 75 ? "💘" : score >= 55 ? "💕" : score >= 35 ? "💛" : "🤍";
}

// ---- 공유 코드 ----
// 이름을 URL·GA 페이지 경로에 그대로 남기지 않으려고 base64url 로 감싼다 (암호화는 아니다).

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

export function encodeShare(parts: string[]): string {
  return toBase64Url(parts.join("|"));
}
export function decodeShare(code: string, count: number): string[] | null {
  if (code.length > 120) return null;
  const s = fromBase64Url(code);
  const parts = s?.split("|");
  return parts && parts.length === count ? parts : null;
}

export function nameSharePath(me: string, other: string): string {
  return `/name/r/${encodeShare([me, other])}`;
}
export function decodeNameShare(code: string): [string, string] | null {
  const p = decodeShare(code, 2);
  return p && isValidName(p[0]) && isValidName(p[1]) ? [p[0], p[1]] : null;
}
