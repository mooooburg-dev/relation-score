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
  return [...home, ...types, ...gifts, ...pairs];
}
