"use client";

import { useState } from "react";
import KakaoShareButton from "@/components/kakao-share";

/**
 * 결과 공유. 모바일은 네이티브 공유 시트, 아니면 링크 복사.
 * (ScoreApp 의 공유 버튼과 같은 방식)
 */
export default function ShareButton({
  path,
  title,
  where = "result",
}: {
  path: string;
  title: string;
  /** 카카오톡 공유 GA 구분 */
  where?: string;
}) {
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
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs font-semibold text-foreground/55">
        결과 보내고 친구 것도 비교해 봐 👀
      </p>
      {/* 키가 없거나 SDK 를 못 불러오면 카카오 버튼은 숨고 아래 버튼만 남는다 */}
      <KakaoShareButton path={path} where={where} />
      <button
        type="button"
        onClick={share}
        className="w-full rounded-2xl border-2 border-primary py-3 text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        {copied ? "링크 복사했어! ✅" : "링크 복사 · 다른 앱으로 공유 🔗"}
      </button>
    </div>
  );
}
