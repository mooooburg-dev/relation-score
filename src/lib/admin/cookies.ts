/**
 * 어드민 쿠키 이름만 담는 모듈.
 *
 * auth.ts 는 next/headers·crypto 를 쓰는 서버 전용이라 클라이언트 컴포넌트가
 * import 할 수 없다. 공개 화면의 어드민 버튼(components/admin-entry.tsx)이
 * 마커 쿠키 이름을 알아야 해서, 이름만 서버 의존 없는 파일로 떼어 둔다.
 */

/** 세션 토큰. httpOnly — JS 가 읽을 수 없다. */
export const ADMIN_COOKIE = "rs_admin";

/**
 * "이 브라우저는 운영자 것" 마커. httpOnly 가 아니라 JS 가 읽는다.
 *
 * 권한이 아니라 힌트다. 위조해도 /admin 은 verifyAdmin() 이 httpOnly 쿠키로
 * 막으므로 로그인 화면만 보인다.
 */
export const ADMIN_HINT_COOKIE = "rs_admin_hint";

export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일
