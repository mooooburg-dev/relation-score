import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
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
import { FamilyCard } from "@/components/family";
import {
  TtiDisclaimer,
  TtiGiftCard,
  TtiGrid,
  TtiRankingList,
} from "@/components/tti";
import TtiFinder from "@/components/tti-finder";
import { SITE_URL } from "@/lib/site";
import { lastmodFor } from "@/lib/lastmod";
import {
  TTI_IDS,
  TTI_INDEX_PATH,
  YEAR_MAX,
  birthYears,
  isTti,
  shortYear,
  ttiInfo,
  ttiName,
  ttiTypePath,
  type Tti,
} from "@/lib/tti";
import { TTI_CONTENT_UPDATED, getTtiRanking, getTtiType } from "@/lib/tti-content";

// 대문자 등 비정규 slug 는 런타임에 정규화 리다이렉트 / 404
export const dynamicParams = true;

export function generateStaticParams() {
  return TTI_IDS.filter((t) => getTtiType(t)).map((animal) => ({ animal }));
}

type Params = { animal: string };

function parse(slug: string): Tti | null {
  const s = slug.toLowerCase();
  return isTti(s) ? s : null;
}

/** 검색에서 많이 쓰는 최근 출생연도 4개 ("84년생 쥐띠") */
function popularYears(t: Tti): number[] {
  return birthYears(t, 1960, 2010)
    .map((y) => y.year)
    .slice(-4);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { animal } = await params;
  const t = parse(animal);
  const content = t ? getTtiType(t) : null;
  if (!t || !content) return {};

  const name = ttiName(t);
  const ranking = getTtiRanking(t).filter((r) => r.other !== t);
  const best = ranking.slice(0, 3).map((r) => ttiName(r.other));
  const years = popularYears(t).map(shortYear);
  const title = `${name} 궁합 - 잘 맞는 띠 순위와 ${name} 성격 (${years.slice(-2).join("·")})`;
  const description = `${name}(${years.join("·")})와 가장 잘 맞는 띠는 ${best.join(", ")}. ${content.tagline}. 12띠 궁합 점수 순위와 연애·결혼 스타일, 출생연도별 ${name} 정리.`;
  const path = ttiTypePath(t);

  return {
    title,
    description,
    keywords: [
      `${name} 궁합`,
      `${name}와 잘 맞는 띠`,
      `${name} 결혼 궁합`,
      `${name} 성격`,
      `${name} 특징`,
      `${name} 출생연도`,
      ...years.map((y) => `${y} 띠`),
      "띠 궁합",
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | 몇점이야?`,
      description,
      url: `${SITE_URL}${path}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TtiTypePage({ params }: { params: Promise<Params> }) {
  const { animal } = await params;
  const t = parse(animal);
  if (!t) notFound();
  if (animal !== t) permanentRedirect(ttiTypePath(t));

  const content = getTtiType(t);
  if (!content) notFound();

  const info = ttiInfo(t);
  const name = ttiName(t);
  const path = ttiTypePath(t);
  const ranking = getTtiRanking(t).filter((r) => r.other !== t);
  const best = ranking.slice(0, 3);
  const worst = ranking.slice(-2).reverse();
  const years = birthYears(t);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${name} 궁합 - 잘 맞는 띠 순위`,
        alternativeHeadline: `${name} 성격과 특징`,
        description: content.tagline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: TTI_CONTENT_UPDATED.toISOString(),
        dateModified: lastmodFor(path).toISOString(),
        about: { "@type": "Thing", name },
      },
      breadcrumbLd([
        { name: "띠 궁합표", path: TTI_INDEX_PATH },
        { name: `${name} 궁합`, path },
      ]),
      faqLd(content.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "띠 궁합표", path: TTI_INDEX_PATH }, { name: `${name} 궁합` }]} />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {info.emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {name} 궁합
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {info.branch}({info.hanja}) · 오행 {info.element} · {content.nickname}
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{content.tagline}</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          {name}와 가장 잘 맞는 띠는{" "}
          {best.map((r, i) => (
            <span key={r.other}>
              {i > 0 && ", "}
              {ttiName(r.other)}({r.score}점)
            </span>
          ))}
          이고, 상대적으로 조심할 띠는{" "}
          {worst.map((r, i) => (
            <span key={r.other}>
              {i > 0 && ", "}
              {ttiName(r.other)}({r.score}점)
            </span>
          ))}
          이야.
        </p>
      </header>

      <Card>
        <SectionTitle>{name}와 잘 맞는 띠 순위</SectionTitle>
        <TtiRankingList me={t} />
      </Card>

      <TtiGiftCard ttis={[t]} lead={content.giftAngle} />

      <GoldboxCta
        campaign="family_tti-type-cta"
        content={t}
        vertical="tti"
        title={`${name}에게 줄 선물, 오늘 특가인지 보고 사자 🎁`}
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <ArticleAd />

      <Card>
        <SectionTitle>{name} 성격과 특징</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">{content.intro}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {content.keywords.map((k) => (
            <li
              key={k}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
            >
              #{k}
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-5 text-base font-extrabold">연애·결혼할 때</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{content.loveStyle}</p>
        <h3 className="mb-2 mt-5 text-base font-extrabold">일·돈을 대할 때</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{content.workStyle}</p>
      </Card>

      <Card>
        <SectionTitle>{name} 출생연도</SectionTitle>
        <p className="mb-3 text-xs leading-relaxed text-foreground/50">
          1~2월생은 설날·입춘 전에 태어났다면 전년도 띠야.
        </p>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {years.map((y) => (
            <li key={y.year} className="flex items-baseline justify-between rounded-xl bg-background px-3 py-2">
              <span className="font-bold">{y.year}년생</span>
              <span className="text-xs text-foreground/55">
                {y.ganji} · {y.color}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>상대 띠와 궁합 보기</SectionTitle>
        <TtiFinder maxYear={YEAR_MAX} initial={t} />
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={content.faq} />
      </Card>

      <Card>
        <SectionTitle>다른 띠 궁합</SectionTitle>
        <TtiGrid current={t} />
        <p className="mt-3 text-right">
          <Link href={TTI_INDEX_PATH} className="text-xs font-bold text-primary underline underline-offset-2">
            띠 궁합표 전체 보기 →
          </Link>
        </p>
      </Card>

      <FamilyCard seed={t} campaign="tti-type" />

      <TtiDisclaimer />
    </main>
  );
}
