"use client";

import { useEffect, useSyncExternalStore } from "react";
import { RefreshIcon } from "./icons";
import { msSinceRefresh, useAdminRefresh } from "./use-admin-refresh";

/**
 * 어드민 갱신 컨트롤 — 조회 시각 + 수동 새로고침 + 자동(1분) 토글.
 * (골드박스 TrafficRefresh / 랭킹박스 RefreshControls 패턴 이식)
 *
 * 포커스 복귀 새로고침: 다른 탭·창을 보다가 어드민으로 돌아오면 자동 토글과 무관하게
 * 항상 갱신한다. 짧은 간격의 반복 포커스는 스로틀로 억제.
 *
 * 자동 새로고침은 탭이 백그라운드면 건너뛴다(document.hidden). 안 보는 화면을
 * 1분마다 새로 그려봐야 서버 함수만 태운다.
 */

const AUTO_KEY = "rs_admin_auto_refresh";
const INTERVAL_MS = 60 * 1000;
const FOCUS_THROTTLE_MS = 15 * 1000;

function formatKstTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

// 자동 새로고침 설정은 브라우저에 기억(localStorage). storage 구독이라 탭 간에도 동기화된다.
function subscribeAuto(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export default function RefreshControls({
  generatedAt,
}: {
  generatedAt: string;
}) {
  const { refresh, isPending } = useAdminRefresh();
  const auto = useSyncExternalStore(
    subscribeAuto,
    () => localStorage.getItem(AUTO_KEY) === "1",
    () => false, // 서버 렌더에서는 항상 OFF
  );

  const toggleAuto = () => {
    localStorage.setItem(AUTO_KEY, auto ? "0" : "1");
    // 같은 탭에서는 storage 이벤트가 자동으로 발생하지 않으므로 직접 쏜다
    window.dispatchEvent(new StorageEvent("storage", { key: AUTO_KEY }));
  };

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [auto, refresh]);

  useEffect(() => {
    const onFocus = () => {
      if (document.hidden) return;
      if (msSinceRefresh() < FOCUS_THROTTLE_MS) return;
      refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className="hidden whitespace-nowrap text-[11px] tabular-nums text-foreground/35 sm:inline"
        suppressHydrationWarning
        title="이 화면을 조회한 시각 (KST)"
      >
        {formatKstTime(generatedAt)} 기준
      </span>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-black/10 px-2.5 py-1 text-xs text-foreground/50 transition hover:text-primary disabled:opacity-50"
        title="지금 새로고침"
      >
        <RefreshIcon className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        새로고침
      </button>
      <button
        type="button"
        onClick={toggleAuto}
        className={`shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs transition ${
          auto
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-black/10 text-foreground/50 hover:text-primary"
        }`}
        title="1분마다 자동 새로고침 (탭이 백그라운드면 일시정지)"
      >
        자동 1분 {auto ? "ON" : "OFF"}
      </button>
    </div>
  );
}
