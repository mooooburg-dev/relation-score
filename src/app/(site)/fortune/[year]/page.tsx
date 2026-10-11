import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArticleAd,
  Breadcrumb,
  Card,
  FaqList,
  JsonLd,
  SectionTitle,
  breadcrumbLd,
  faqLd,
} from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FortuneDisclaimer, FortuneGrid, FortuneRankingList } from "@/components/fortune";
import FortuneFinder from "@/components/fortune-finder";
import { SITE_URL, type Faq } from "@/lib/site";
import { TTI_INDEX_PATH, YEAR_MAX, ttiInfo, ttiName } from "@/lib/tti";
import {
  FORTUNE_YEARS,
  SAMJAE_NOTE,
  fortuneIndexPath,
  fortunePath,
  fortuneRanking,
  isFortuneYear,
  samjaeTtis,
  yearLabel,
} from "@/lib/fortune";
import { getFortuneTtis } from "@/lib/fortune-content";

// 본문이 있는 해만 만든다. 없는 해는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return FORTUNE_YEARS.filter((y) => getFortuneTtis(y).length).map((y) => ({ year: String(y) }));
}

type Params = { year: string };

function parse(v: string): number | null {
  const y = Number(v);
  return isFortuneYear(y) ? y : null;
}

function texts(year: number) {
  const { ganji, color } = yearLabel(year);
  const title = `${year}년 띠별 운세 - ${ganji} 신년운세 순위와 삼재 띠`;
  const best = fortuneRanking(year).slice(0, 2).map((r) => ttiName(r.tti));
  const samjae = samjaeTtis(year).map((s) => ttiName(s.tti));
  const description = `${year}년은 ${ganji}, ${color}의 해. 12띠 신년운세를 총운 점수 순위로 정리했어. 운이 가장 좋은 띠는 ${best.join("·")}, 삼재 띠는 ${samjae.join("·")}. 출생연도로 내 띠 운세와 월별 흐름까지 확인해.`;
  return { title, description, ganji, color };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const year = parse((await params).year);
  if (!year) return {};
  const { title, description } = texts(year);
  const path = fortuneIndexPath(year);
  return {
    title,
    description,
    keywords: [
      `${year} 띠별 운세`,
      `${year}년 신년운세`,
      `${year} 운세`,
      `${yearLabel(year).ganji} 운세`,
      `${year} 삼재`,
      `${year} 삼재 띠`,
      "띠별 운세",
      "신년운세",
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | 몇점이야?`,
      description,
      url: `${SITE_URL}${path}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FortuneIndexPage({ params }: { params: Promise<Params> }) {
  const year = parse((await params).year);
  if (!year) notFound();

  const { title, description, ganji, color } = texts(year);
  const path = fortuneIndexPath(year);
  const yearTti = yearLabel(year).tti;
  const ranking = fortuneRanking(year);
  const samjae = samjaeTtis(year);

  const faq: Faq[] = [
    {
      q: `${year}년은 무슨 띠의 해야?`,
      a: `${year}년은 ${ganji}, ${color}의 해야. 띠가 바뀌는 시점은 명리로는 입춘(2월 초), 민속으로는 설날이라 그 전까지는 전년도 띠의 기운으로 봐.`,
    },
    {
      q: `${year}년 운이 가장 좋은 띠는?`,
      a: `그 해의 띠와 합이 되는 띠의 흐름이 좋다고 봐. ${year}년은 ${ttiName(ranking[0].tti)}(${ranking[0].score}점), ${ttiName(ranking[1].tti)}(${ranking[1].score}점), ${ttiName(ranking[2].tti)}(${ranking[2].score}점) 순이야.`,
    },
    {
      q: `${year}년 삼재 띠는?`,
      a: samjae.length
        ? `${samjae.map((s) => `${ttiName(s.tti)}(${s.stage})`).join(", ")}야. 삼재는 민속 신앙이라 너무 마음 쓰기보다, 큰 결정을 한 번 더 점검하는 계기로 삼으면 충분해.`
        : `${year}년에는 삼재에 드는 띠가 없어.`,
    },
    {
      q: "띠별 운세 점수는 어떻게 계산해?",
      a: "그 해의 띠와 내 띠의 관계를 띠 궁합과 같은 규칙(육합·삼합·충·원진·형·해·오행)으로 계산해. 월별 운세는 그 달의 지지와 내 띠의 관계로 봐.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: `${year} 띠별 운세`, path }]),
      {
        "@type": "ItemList",
        name: `${year}년 띠별 운세`,
        itemListElement: getFortuneTtis(year).map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${year} ${ttiName(t)} 운세`,
          url: `${SITE_URL}${fortunePath(year, t)}`,
        })),
      },
      faqLd(faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: `${year} 띠별 운세` }]} />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {ttiInfo(yearTti).emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {year} 띠별 신년운세
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {ganji} · {color}의 해
          </span>
        </h1>
        <p className="mt-3 text-left text-sm leading-relaxed text-foreground/70">
          {year}년 한 해의 흐름을 12띠별로 점수로 정리했어. 그 해의 띠({ttiName(yearTti)})와 내
          띠가 합이 되는지, 부딪히는지를 띠 궁합과 같은 규칙으로 계산했고, 분야별(연애·재물·일·
          인간관계) 운과 월별 흐름, 출생연도별 한마디까지 담았어.
        </p>
      </header>

      <Card>
        <SectionTitle>출생연도로 내 운세 보기</SectionTitle>
        <FortuneFinder year={year} maxYear={YEAR_MAX} />
      </Card>

      <Card>
        <SectionTitle>{year}년 띠별 운세 순위</SectionTitle>
        <FortuneRankingList year={year} />
      </Card>

      <ArticleAd />

      {samjae.length > 0 && (
        <Card>
          <SectionTitle>{year}년 삼재 띠</SectionTitle>
          <ul className="flex flex-col gap-2">
            {samjae.map((s) => (
              <li key={s.tti}>
                <Link
                  href={fortunePath(year, s.tti)}
                  className="flex items-center gap-3 rounded-xl bg-background px-3 py-2 hover:text-primary"
                >
                  <span aria-hidden className="text-xl">
                    {ttiInfo(s.tti).emoji}
                  </span>
                  <span className="text-sm font-bold">{ttiName(s.tti)}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {s.stage}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-foreground/50">
            {SAMJAE_NOTE[samjae[0].stage]} 삼재는 민속 신앙이라 겁먹을 필요는 없어.
          </p>
        </Card>
      )}

      <GoldboxCta
        campaign="family_fortune-index-cta"
        content={String(year)}
        vertical="fortune"
        title="새해 선물·설 선물, 오늘 특가인지 보고 사자 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>12띠 운세 바로가기</SectionTitle>
        <FortuneGrid year={year} />
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={faq} />
      </Card>

      <Link
        href={TTI_INDEX_PATH}
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        띠 궁합표도 보기 →
      </Link>

      <FortuneDisclaimer />
    </main>
  );
}
