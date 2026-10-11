import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 레거시 /?id= 리다이렉트는 src/proxy.ts에서 처리 (쿼리스트링 제거를 위해) */
  async headers() {
    return [
      {
        // 서비스 워커는 캐시하지 않는다 — 고친 sw.js 가 바로 반영되게 (Next PWA 가이드 권장)
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
