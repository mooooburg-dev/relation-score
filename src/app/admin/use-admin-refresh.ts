"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * 어드민 화면 갱신 공용 훅.
 *
 * router.refresh()는 서버 컴포넌트만 다시 실행한다. Supabase 읽기뿐이라 AI 호출은
 * 일어나지 않고, 스크롤 위치와 펼쳐둔 <details> 상태도 그대로 유지된다.
 *
 * 마지막 새로고침 시각은 모듈 스코프에 둔다. 헤더 컨트롤과 플로팅 버튼이 서로 다른
 * 컴포넌트라, 공유하지 않으면 플로팅으로 막 갱신한 직후 탭을 옮겼다 돌아왔을 때
 * 포커스 스로틀이 걸리지 않고 한 번 더 새로고침된다.
 */

let lastRefreshAt = 0;

export function msSinceRefresh(): number {
  return Date.now() - lastRefreshAt;
}

export function useAdminRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    lastRefreshAt = Date.now();
    startTransition(() => router.refresh());
  }, [router]);

  return { refresh, isPending };
}
