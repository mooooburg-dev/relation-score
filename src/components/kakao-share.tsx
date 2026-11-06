"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/visitor";

/**
 * 카카오톡 공유 버튼.
 *
 * sendScrap 을 쓴다 — 카카오가 공유할 페이지의 OG 태그(제목·설명·이미지)를 직접 읽어 카드를 만든다.
 * 그래서 공유 결과 페이지마다 이미 만들어 둔 동적 OG 이미지가 그대로 카톡 미리보기가 된다.
 *
 * - 키(NEXT_PUBLIC_KAKAO_JS_KEY)가 없거나 SDK 로드에 실패하면 버튼을 그리지 않는다(기존 공유 버튼만 남는다)
 * - JavaScript 키는 공개용이다. 카카오 콘솔에 등록한 도메인(score.drawyourmind.com, localhost:3000)에서만 동작한다
 * - SDK 는 버튼이 있는 페이지에서만, 한 번만 불러온다. SRI 로 파일이 바뀌지 않았는지 확인한다
 */

const KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js";
const SDK_INTEGRITY = "sha384-BGX7Wb16GmRFagri4bLJV2DgipVZaU2AI812GZtHtHzzDQJnfHasDXN5houxv45w";

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: { sendScrap: (opts: { requestUrl: string }) => void };
}
declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let loading: Promise<KakaoSdk | null> | null = null;

function loadSdk(): Promise<KakaoSdk | null> {
  if (!KEY) return Promise.resolve(null);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const ready = () => {
      const k = window.Kakao;
      if (!k) return resolve(null);
      try {
        if (!k.isInitialized()) k.init(KEY);
        resolve(k);
      } catch {
        resolve(null);
      }
    };
    if (window.Kakao) return ready();
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.integrity = SDK_INTEGRITY;
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = ready;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return loading;
}

export default function KakaoShareButton({
  path,
  where,
  label = "카카오톡으로 공유",
  className = "",
}: {
  /** 공유할 우리 사이트 경로 (/name/r/… 등) — 그 페이지의 OG 가 카드가 된다 */
  path: string;
  /** GA 구분용 (name·birthday·event·today …) */
  where: string;
  label?: string;
  className?: string;
}) {
  const [sdk, setSdk] = useState<KakaoSdk | null>(null);

  useEffect(() => {
    let alive = true;
    void loadSdk().then((k) => {
      if (alive) setSdk(k);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!sdk) return null;

  return (
    <button
      type="button"
      onClick={() => {
        try {
          sdk.Share.sendScrap({ requestUrl: `${location.origin}${path}` });
          track("kakao_share", { where });
        } catch {
          // 카카오톡이 없는 환경 등 — 조용히 넘어간다
        }
      }}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 text-base font-bold text-[#191919] shadow-md transition active:scale-[0.98] ${className}`}
    >
      <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 10.99c0 2.85 1.87 5.35 4.69 6.76-.15.53-.97 3.42-1 3.64 0 0-.02.17.09.24.11.06.24.01.24.01.31-.04 3.6-2.36 4.17-2.76.58.08 1.19.13 1.81.13 5.52 0 10-3.58 10-7.99C22 6.58 17.52 3 12 3z" />
      </svg>
      {label}
    </button>
  );
}
