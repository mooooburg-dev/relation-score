import type { MetadataRoute } from "next";
import { MBTI_LIST, SITE_URL, getAllPairs, pairPath, typePath } from "@/lib/mbti";

// 콘텐츠 갱신일 (데이터 재생성 시 갱신)
const CONTENT_UPDATED = new Date("2026-09-14");

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: CONTENT_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mbti`, lastModified: CONTENT_UPDATED, changeFrequency: "weekly", priority: 0.9 },
  ];
  const types: MetadataRoute.Sitemap = MBTI_LIST.map((t) => ({
    url: `${SITE_URL}${typePath(t)}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const pairs: MetadataRoute.Sitemap = getAllPairs().map((p) => ({
    url: `${SITE_URL}${pairPath(p.a, p.b)}`,
    lastModified: CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...home, ...types, ...pairs];
}
