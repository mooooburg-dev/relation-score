import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE } from "./cookies";

/**
 * 어드민 인증.
 *
 * - ADMIN_PASSWORD 미설정이면 무조건 거부 (fail closed).
 *   `undefined === undefined` 로 통과해 어드민이 열려버리는 사고를 막는다.
 * - 쿠키에는 비밀번호 원문이 아니라 거기서 파생한 HMAC 토큰을 넣는다.
 * - 비교는 상수 시간(timingSafeEqual).
 */

export {
  ADMIN_COOKIE,
  ADMIN_HINT_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
} from "./cookies";

/** ADMIN_PASSWORD 에서 결정론적 세션 토큰 파생. env 미설정 시 null */
export function adminSessionToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw)
    .update("relation-score-admin-session")
    .digest("hex");
}

/** 길이를 노출하지 않는 상수 시간 문자열 비교 */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** 입력 비밀번호가 ADMIN_PASSWORD 와 일치하는지. env 미설정 시 false */
export function checkAdminPassword(password: unknown): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  if (typeof password !== "string" || password.length === 0) return false;
  return safeEqual(password, pw);
}

/** 쿠키 기반 어드민 세션 검사 */
export async function verifyAdmin(): Promise<boolean> {
  const token = adminSessionToken();
  if (!token) return false;
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  return safeEqual(value, token);
}

/** ADMIN_PASSWORD 설정 여부 (로그인 화면 안내용) */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}
