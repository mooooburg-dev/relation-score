"use client";

import { useEffect } from "react";

/**
 * 게이트 출처(`?from=`)를 /go 링크에 옮겨 붙인다.
 *
 * 선물 페이지는 정적 생성이라 서버에서 searchParams 를 읽을 수 없다 — 읽는 순간
 * 16개 페이지가 전부 동적 렌더로 떨어진다. 그래서 클릭 대상 링크에만
 * 클라이언트에서 f= 를 덧붙인다.
 *
 * 별도 파일인 이유: gift.tsx 에는 gifts.json 을 읽는 서버 컴포넌트가 함께 있어서,
 * 거기에 "use client" 를 걸면 pairs.json(878KB)까지 클라이언트 번들에 딸려온다.
 */

const ENTRIES = ["type", "pair", "result"];

export default function GiftEntryTagger() {
  useEffect(() => {
    const from = new URLSearchParams(location.search).get("from");
    if (!from || !ENTRIES.includes(from)) return;
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-gift-go]")) {
      const u = new URL(a.href, location.origin);
      u.searchParams.set("f", from);
      a.href = u.pathname + u.search;
    }
  }, []);
  return null;
}
