import type { MetadataRoute } from "next";

const SITE_URL = "https://score.drawyourmind.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/analyze 만 막는다 — OG 이미지(/api/og)와 결과 조회는 공유 미리보기에
      // 필요하므로 열어 둔다. 크롤러가 예의를 안 지켜도 API 쪽에서 UA 로 끊는다.
      disallow: ["/admin", "/go", "/api/analyze"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
