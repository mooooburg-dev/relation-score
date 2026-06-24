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
 *
 * - 기본: 반응형 광고 (data-ad-format + full-width-responsive)
 * - fixedWidth/fixedHeight 지정 시: 고정 크기 광고 (반응형 속성 제거)
 *   → 하단 고정 배너처럼 커지면 안 되는 자리에 사용
 */
export default function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  fixedWidth,
  fixedHeight,
  className = "",
  style,
}: {
  slot?: string;
  format?: string;
  responsive?: boolean;
  fixedWidth?: number;
  fixedHeight?: number;
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

  const isFixed = fixedWidth != null && fixedHeight != null;

  if (isFixed) {
    return (
      <ins
        key={slot}
        className={`adsbygoogle ${className}`}
        style={{
          display: "inline-block",
          width: fixedWidth,
          height: fixedHeight,
          ...style,
        }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
      />
    );
  }

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
