import type { MetadataRoute } from "next";
import { lastmodFor } from "@/lib/lastmod";
import {
  MBTI_LIST,
  SITE_URL,
  getAllPairs,
  giftPath,
  pairPath,
  typePath,
} from "@/lib/mbti";
import { TTI_INDEX_PATH, ttiPairPath, ttiTypePath } from "@/lib/tti";
import { getAllTtiPairs, getAllTtiTypes } from "@/lib/tti-content";
import { FORTUNE_YEARS, fortuneIndexPath, fortunePath } from "@/lib/fortune";
import { getFortuneTtis } from "@/lib/fortune-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: lastmodFor("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/mbti`,
      lastModified: lastmodFor("/mbti"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}${TTI_INDEX_PATH}`,
      lastModified: lastmodFor(TTI_INDEX_PATH),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/gift`,
      lastModified: lastmodFor("/gift"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
  const types: MetadataRoute.Sitemap = MBTI_LIST.map((t) => ({
    url: `${SITE_URL}${typePath(t)}`,
    lastModified: lastmodFor(typePath(t)),
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const gifts: MetadataRoute.Sitemap = MBTI_LIST.map((t) => ({
    url: `${SITE_URL}${giftPath(t)}`,
    lastModified: lastmodFor(giftPath(t)),
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const pairs: MetadataRoute.Sitemap = getAllPairs().map((p) => ({
    url: `${SITE_URL}${pairPath(p.a, p.b)}`,
    lastModified: lastmodFor(pairPath(p.a, p.b)),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const ttiTypes: MetadataRoute.Sitemap = getAllTtiTypes().map((t) => ({
    url: `${SITE_URL}${ttiTypePath(t.id)}`,
    lastModified: lastmodFor(ttiTypePath(t.id)),
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const ttiPairs: MetadataRoute.Sitemap = getAllTtiPairs().map((p) => ({
    url: `${SITE_URL}${ttiPairPath(p.a, p.b)}`,
    lastModified: lastmodFor(ttiPairPath(p.a, p.b)),
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  // 신년운세는 시즌(11~1월) 검색이라 인덱스·띠별 모두 weekly 로 둔다
  const fortunes: MetadataRoute.Sitemap = FORTUNE_YEARS.flatMap((y) => {
    const ttis = getFortuneTtis(y);
    if (!ttis.length) return [];
    return [
      {
        url: `${SITE_URL}${fortuneIndexPath(y)}`,
        lastModified: lastmodFor(fortuneIndexPath(y)),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      ...ttis.map((t) => ({
        url: `${SITE_URL}${fortunePath(y, t)}`,
        lastModified: lastmodFor(fortunePath(y, t)),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  });
  return [...home, ...fortunes, ...types, ...gifts, ...pairs, ...ttiTypes, ...ttiPairs];
}
