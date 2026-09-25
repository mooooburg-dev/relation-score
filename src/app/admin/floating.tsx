"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * 어드민 우측 하단 플로팅 버튼 두 개.
 *
 * 대시보드가 길어서 아래로 내려가면 상단 네비가 안 보인다. 스크롤 위치와 무관하게
 * 최신 데이터를 받고(새로고침) 맨 위로 돌아갈(위로가기) 수단을 띄워 둔다.
 *
 * 위로가기는 scrollY > 300 에서만 나타나므로, 새로고침은 그 상태를 같이 보고
 * 겹치지 않게 위로 비켜선다.
 */

const TOP_THRESHOLD = 300;

export default function AdminFloating() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > TOP_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const base =
    "fixed right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95";

  return (
    <>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        aria-label="대시보드 새로고침"
        title="지금 새로고침"
        className={`${base} bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 ${
          scrolled ? "bottom-[5.25rem]" : "bottom-6"
        }`}
      >
        <svg
          className={`h-5 w-5 ${isPending ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h5M20 20v-5h-5M20 9A8 8 0 0 0 5.6 6.6M4 15a8 8 0 0 0 14.4 2.4"
          />
        </svg>
      </button>

      {scrolled && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="맨 위로 이동"
          title="맨 위로"
          className={`${base} bottom-6 bg-foreground text-background hover:opacity-90`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </>
  );
}
