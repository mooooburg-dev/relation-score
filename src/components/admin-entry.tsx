"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ADMIN_HINT_COOKIE } from "@/lib/admin/cookies";

/**
 * 공개 화면 좌하단의 어드민 진입 버튼 — 운영자 브라우저에만 보인다.
 *
 * 판정을 클라이언트에서만 하는 게 핵심이다. 서버 스냅샷을 false 로 두면
 * SSG/SSR HTML 에 버튼이 아예 들어가지 않아, 일반 방문자와 검색봇은
 * 마크업에서조차 존재를 알 수 없다. 레이아웃에서 cookies() 를 읽는 방식은
 * 쓸 수 없다 — /mbti/[type] 같은 정적 페이지가 전부 동적 렌더로 떨어진다.
 *
 * 마커 쿠키를 쓰는 이유는 rs_admin 이 httpOnly 라 JS 가 못 읽기 때문이다.
 * 마커는 권한이 아니라 힌트이고, 위조해도 /admin 은 verifyAdmin() 이 막는다.
 */

const subscribeNoop = () => () => {};

/**
 * 개발 모드에서만 위로 비켜 세운다.
 *
 * Next 개발 인디케이터가 좌하단(left:20, bottom:20)에 붙어 이 버튼을 정확히 덮는다.
 * next.config 의 devIndicators.position 은 16.2.9 + Turbopack 에서 반영되지 않았다.
 * 운영 번들에는 인디케이터가 없으므로 상수 비교로 분기해 그대로 좌하단에 둔다
 * (NODE_ENV 는 빌드 타임에 치환되어 운영에서는 아래 가지가 사라진다).
 */
const DEV_OFFSET = process.env.NODE_ENV === "development";

function hasHintCookie(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${ADMIN_HINT_COOKIE}=`));
}

export default function AdminEntry() {
  // 쿠키는 세션 중 바뀌지 않으므로 구독은 두지 않는다(no-op).
  const isOperator = useSyncExternalStore(
    subscribeNoop,
    hasHintCookie,
    () => false,
  );

  // 하단 고정 배너(홈·결과 화면)와 겹치지 않게 띄운다
  const [liftUp, setLiftUp] = useState(false);
  useEffect(() => {
    if (!isOperator) return;
    const sync = () => setLiftUp(Boolean(document.querySelector("[data-bottom-banner]")));
    sync();
    const timer = setInterval(sync, 1000); // 배너는 단계 전환에 따라 나타났다 사라진다
    return () => clearInterval(timer);
  }, [isOperator]);

  if (!isOperator) return null;

  return (
    <Link
      href="/admin"
      aria-label="관리자 화면"
      title="관리자 화면 (내 브라우저에만 보임)"
      className={`fixed left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/10 bg-white/80 text-base opacity-35 shadow-sm backdrop-blur transition-all duration-200 hover:opacity-100 active:scale-95 ${
        liftUp ? "bottom-28" : DEV_OFFSET ? "bottom-20" : "bottom-6"
      }`}
    >
      <span aria-hidden>⚙️</span>
    </Link>
  );
}
