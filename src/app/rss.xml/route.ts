import { lastmodFor } from "@/lib/lastmod";
import {
  CONTENT_UPDATED,
  SITE_NAME,
  SITE_URL,
  getAllPairs,
  getAllTypes,
  ko,
  pairPath,
  typePath,
} from "@/lib/mbti";
import { TTI_INDEX_PATH, ttiInfo, ttiName, ttiPairPath, ttiScoreLabel, ttiTypePath } from "@/lib/tti";
import { getAllTtiPairs, getAllTtiTypes } from "@/lib/tti-content";
import { FORTUNE_YEARS, fortuneIndexPath, fortuneLabel, fortunePath, yearLabel } from "@/lib/fortune";
import { getFortune, getFortuneTtis } from "@/lib/fortune-content";

// 정적 데이터로만 만드는 피드라 빌드 시 한 번 생성한다.
// (Route Handler 는 Next 16 기준 기본 비캐시)
export const dynamic = "force-static";

const FEED_DESCRIPTION =
  "MBTI 16가지 유형별 궁합 순위와 136가지 조합, 12띠 78가지 조합의 관계별 궁합 점수. 연인·부부·친구·직장동료·가족 기준으로 정리한 궁합 콘텐츠.";

interface FeedItem {
  title: string;
  path: string;
  description: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 300자 안쪽으로 잘라 요약문으로 쓴다. */
function summarize(s: string, max = 300): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * 수집 우선순위 순서. 네이버 RSS 수집기는 앞쪽 항목부터 읽어가므로
 * 아직 색인이 얇은 조합(pair) 페이지를 먼저 싣고 유형·인덱스를 뒤에 둔다.
 * 새로 연 띠 궁합 조합이 색인이 가장 얇아 맨 앞에 둔다.
 * 신년운세는 시즌(11~1월) 전에 색인돼야 의미가 있어 그보다도 앞에 둔다.
 */
function feedItems(): FeedItem[] {
  const fortunes: FeedItem[] = FORTUNE_YEARS.flatMap((y) => {
    const ttis = getFortuneTtis(y);
    if (!ttis.length) return [];
    const { ganji } = yearLabel(y);
    return [
      {
        title: `${y}년 띠별 운세 - ${ganji} 신년운세 순위와 삼재 띠`,
        path: fortuneIndexPath(y),
        description: `${y}년 ${ganji} 12띠 신년운세를 총운 점수 순위로 정리. 분야별·월별 운세와 삼재 띠까지.`,
      },
      ...ttis.map((t) => {
        const f = getFortune(y, t)!;
        return {
          title: `${y} ${ttiName(t)} 운세 - ${ganji} 총운 ${f.score}점, ${fortuneLabel(f.score)}`,
          path: fortunePath(y, t),
          description: summarize(`${f.headline} ${f.summary}`),
        };
      }),
    ];
  });

  const ttiPairs: FeedItem[] = getAllTtiPairs()
    .sort((x, y) => y.score - x.score)
    .map((p) => ({
      title: `${ttiName(p.a)} ${ttiName(p.b)} 궁합 ${p.score}점 - ${ttiScoreLabel(p.score)}`,
      path: ttiPairPath(p.a, p.b),
      description: summarize(`${p.headline} ${p.summary}`),
    }));

  const ttiTypes: FeedItem[] = getAllTtiTypes().map((t) => ({
    title: `${ttiName(t.id)} 궁합 순위 - ${ttiName(t.id)}와 잘 맞는 띠, ${ttiName(t.id)} 성격 (${ttiInfo(t.id).branch}·${ttiInfo(t.id).hanja})`,
    path: ttiTypePath(t.id),
    description: summarize(`${t.tagline}. ${t.intro}`),
  }));

  const pairs: FeedItem[] = getAllPairs()
    .sort((x, y) => y.overall - x.overall)
    .map((p) => ({
      title: `${p.a} ${p.b} 궁합 ${p.overall}점 (${ko(p.a)} ${ko(p.b)})`,
      path: pairPath(p.a, p.b),
      description: summarize(`${p.headline} ${p.summary}`),
    }));

  const types: FeedItem[] = getAllTypes().map((t) => ({
    title: `${t.type}(${ko(t.type)}) 궁합 순위 - ${t.type}와 잘 맞는 MBTI, 안 맞는 MBTI`,
    path: typePath(t.type),
    description: summarize(`${t.tagline}. ${t.intro}`),
  }));

  const index: FeedItem[] = [
    {
      title: "띠 궁합표 - 12띠 궁합 점수, 잘 맞는 띠와 안 맞는 띠",
      path: TTI_INDEX_PATH,
      description:
        "쥐띠부터 돼지띠까지 12띠 78가지 조합의 궁합 점수. 육합·삼합·충·원진으로 계산한 근거와 관계별 궁합.",
    },
    {
      title: "MBTI 궁합표 - 16가지 유형별 궁합 순위",
      path: "/mbti",
      description: summarize(FEED_DESCRIPTION),
    },
    {
      title: `${SITE_NAME} - MBTI 궁합 점수 테스트`,
      path: "/",
      description:
        "두 사람의 MBTI·나이·혈액형을 넣으면 관계별 궁합 점수를 AI가 분석해주는 무료 테스트.",
    },
  ];

  return [...fortunes, ...ttiPairs, ...pairs, ...ttiTypes, ...types, ...index];
}

export async function GET() {
  const entries = feedItems();

  const items = entries
    .map((it) => {
      const url = `${SITE_URL}${it.path}`;
      return `    <item>
      <title>${esc(it.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <description>${esc(it.description)}</description>
      <pubDate>${lastmodFor(it.path).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  // 채널 갱신일은 가장 최근에 바뀐 문서 기준
  const lastBuildDate = new Date(
    Math.max(
      CONTENT_UPDATED.getTime(),
      ...entries.map((it) => lastmodFor(it.path).getTime()),
    ),
  ).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} - MBTI·띠 궁합 점수와 신년운세</title>
    <link>${SITE_URL}</link>
    <description>${esc(FEED_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
