import { createHmac, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE, ADMIN_HINT_COOKIE } from "./cookies";

/**
 * 이 요청이 운영자 본인인가 — 통계 제외 판정.
 *
 * 왜 필요한가: 운영자가 화면을 고치며 누른 클릭·돌린 분석이 통계에 섞이면
 * 숫자가 부풀어 판단을 흐린다. 하루 30건대 규모에서는 본인 테스트 몇 건이
 * 그대로 추세로 보인다.
 *
 * 두 쿠키를 모두 본다:
 *  - rs_admin      세션 토큰(httpOnly). 이게 유효하면 확실한 운영자다.
 *  - rs_admin_hint 마커. 로그아웃해도 브라우저에 남아 있으면 여전히 본인 기기다.
 *
 * 마커만 지운 채로 로그인해 있어도 세션 쪽에서 걸리고, 세션이 만료돼도 마커에서
 * 걸린다. 위조해봐야 "내 기록이 통계에서 빠진다" 뿐이라 악용 여지가 없다.
 *
 * Route Handler 에서 NextRequest.cookies 로 넘겨 쓴다 — cookies() 를 쓰면
 * 정적 페이지가 동적으로 떨어지는 구간이 생길 수 있어 요청 객체에서 직접 읽는다.
 */

function sessionToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw)
    .update("relation-score-admin-session")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** 표준 Request 든 NextRequest 든 Cookie 헤더 하나만 있으면 된다 */
export function isOperatorRequest(req: Request): boolean {
  const jar = parseCookies(req.headers.get("cookie"));

  if (jar[ADMIN_HINT_COOKIE]) return true;

  const token = sessionToken();
  const value = jar[ADMIN_COOKIE];
  if (!token || !value) return false;
  return safeEqual(value, token);
}

/** 값에 '=' 가 들어갈 수 있으므로 첫 구분자만 쪼갠다 */
function parseCookies(raw: string | null): Record<string, string> {
  const jar: Record<string, string> = {};
  if (!raw) return jar;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 1) continue;
    jar[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return jar;
}
