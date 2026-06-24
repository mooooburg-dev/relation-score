"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * AdSense 디스플레이 광고 단위.
 * 게시자 ID(NEXT_PUBLIC_ADSENSE_CLIENT)나 slot이 없으면 아무것도 렌더하지 않음
 * → 로컬/미설정 환경에서 깨지지 않음.
 */
export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: {
  slot?: string;
  format?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense 스크립트 미로딩(로컬 등) 시 무시
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <ins
      key={slot}
      className={`adsbygoogle ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
