"use client";

import { useState } from "react";

/**
 * 결과 공유. 모바일은 네이티브 공유 시트, 아니면 링크 복사.
 * (ScoreApp 의 공유 버튼과 같은 방식)
 */
export default function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 사용자가 공유 시트를 닫은 경우 등 — 조용히 넘어간다
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
    >
      {copied ? "링크 복사했어! ✅" : "결과 공유하기 🔗"}
    </button>
  );
}
