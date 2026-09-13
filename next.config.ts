import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 레거시 /?id= 리다이렉트는 src/proxy.ts에서 처리 (쿼리스트링 제거를 위해) */
};

export default nextConfig;
