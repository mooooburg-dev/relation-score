import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  AnalyzeCta,
  ArticleAd,
  Breadcrumb,
  Card,
  FaqList,
  JsonLd,
  SectionTitle,
  TypeGrid,
  breadcrumbLd,
  faqLd,
} from "@/components/seo";
import { FamilyCard } from "@/components/family";
import {
  MBTI_LIST,
  RELATIONS,
  SITE_URL,
  getRanking,
  getType,
  ko,
  normalizeMbti,
  pairPath,
  scoreEmoji,
  scoreLabel,
  typePath,
  type Mbti,
} from "@/lib/mbti";

// 사전 생성되지 않은 slug(대문자, 역순)는 런타임에 permanentRedirect / notFound 처리
export const dynamicParams = true;

export function generateStaticParams() {
  return MBTI_LIST.map((t) => ({ type: t.toLowerCase() }));
}

type Params = { type: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { type } = await params;
  const t = normalizeMbti(type);
  const content = t ? getType(t) : null;
  if (!t || !content) return {};

  const ranking = getRanking(t);
  const best = ranking.slice(0, 3).map((r) => r.other).join(", ");
  const k = ko(t);
  const title = `${t}(${k}) 궁합 순위 - ${t}와 잘 맞는 MBTI, 안 맞는 MBTI`;
  const description = `${t} ${k}(${content.nickname})와 가장 잘 맞는 MBTI는 ${best}. 16가지 유형별 궁합 점수와 연인·친구·직장동료·썸 관계별 순위, ${k} 연애 스타일과 특징까지 정리했어.`;
  const path = typePath(t);

  return {
    title,
    description,
    keywords: [
      `${t} 궁합`,
      `${k} 궁합`,
      `${t} 궁합 순위`,
      `${k} 궁합 순위`,
      `${t} 잘 맞는 MBTI`,
      `${k} 잘 맞는 MBTI`,
      `${t} 안 맞는 MBTI`,
      `${t} 연애`,
      `${k} 연애`,
      `${t} 특징`,
      `${k} 특징`,
      `${t} 성격`,
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

export default async function TypePage({ params }: { params: Promise<Params> }) {
  const { type } = await params;
  const t = normalizeMbti(type);
  if (!t) notFound();
  if (type !== t.toLowerCase()) permanentRedirect(typePath(t));
  const content = getType(t);
  if (!content) notFound();

  const ranking = getRanking(t);
  const best = ranking.slice(0, 5);
  const worst = ranking.slice(-5).reverse();
  const path = typePath(t);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${t}(${ko(t)}) 궁합 순위 - ${t}와 잘 맞는 MBTI`,
        alternativeHeadline: `${ko(t)} 궁합 순위`,
        description: content.tagline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
      },
      breadcrumbLd([
        { name: "MBTI 궁합표", path: "/mbti" },
        { name: `${t} 궁합`, path },
      ]),
      {
        "@type": "ItemList",
        name: `${t}와 잘 맞는 MBTI 순위`,
        itemListElement: ranking.map((r, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${t} × ${r.other} 궁합 ${r.score}점`,
          url: `${SITE_URL}${pairPath(t, r.other)}`,
        })),
      },
      faqLd(content.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[{ name: "MBTI 궁합표", path: "/mbti" }, { name: `${t} 궁합` }]}
      />

      <header>
        <p className="text-sm font-bold text-primary">{content.nickname}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          {t} 궁합 순위
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {ko(t)} 궁합 순위
          </span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          {content.tagline}. 흔히 {ko(t)}라고 부르는 {t}와 잘 맞는 MBTI, 안 맞는
          MBTI를 16개 유형 전부 점수로 정리했어.
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {content.keywords.map((k) => (
            <li
              key={k}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              #{k}
            </li>
          ))}
        </ul>
      </header>

      <Card>
        <SectionTitle>
          {t} 잘 맞는 MBTI TOP 5 ({ko(t)} 궁합 순위)
        </SectionTitle>
        <RankList me={t} items={best} />
      </Card>

      <Card>
        <SectionTitle>
          {t} 안 맞는 MBTI 5 ({ko(t)} 하위 궁합)
        </SectionTitle>
        <RankList me={t} items={worst} />
        <p className="mt-3 text-xs leading-relaxed text-foreground/50">
          16개 유형 중 점수가 낮은 순이야. 못 만나는 조합이라는 뜻은 아니고,
          서로 다른 점을 알고 시작하면 오히려 오래 가는 경우도 많아.
        </p>
      </Card>

      <AnalyzeCta a={t} />

      <ArticleAd />

      <Card>
        <SectionTitle>{t}는 어떤 사람이야?</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">{content.intro}</p>
      </Card>

      <Card>
        <SectionTitle>{t} 연애 스타일</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">
          {content.loveStyle}
        </p>
        <h3 className="mb-1 mt-4 text-sm font-bold">친구 관계에서는</h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          {content.friendStyle}
        </p>
        <h3 className="mb-1 mt-4 text-sm font-bold">직장에서는</h3>
        <p className="text-sm leading-relaxed text-foreground/80">
          {content.workStyle}
        </p>
      </Card>

      <Card>
        <SectionTitle>관계별 {t} 궁합 1위</SectionTitle>
        <ul className="flex flex-col gap-2">
          {RELATIONS.map((rel) => {
            const top = getRanking(t, rel.value)[0];
            if (!top) return null;
            return (
              <li key={rel.value}>
                <Link
                  href={pairPath(t, top.other)}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-background"
                >
                  <span className="w-20 shrink-0 text-sm font-semibold">
                    {rel.emoji} {rel.value}
                  </span>
                  <span className="flex-1 text-sm font-bold">
                    {top.other}{" "}
                    <span className="text-xs font-semibold text-foreground/50">
                      {ko(top.other)}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    {top.score}점
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <SectionTitle>{t} 전체 궁합표</SectionTitle>
        <ol className="flex flex-col gap-1.5">
          {ranking.map((r, i) => (
            <li key={r.other}>
              <Link
                href={pairPath(t, r.other)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background"
              >
                <span className="w-6 text-center text-xs font-bold text-foreground/40">
                  {i + 1}
                </span>
                <span className="flex w-16 shrink-0 flex-col leading-tight">
                  <span className="text-sm font-bold">{r.other}</span>
                  <span className="text-[10px] font-semibold text-foreground/50">
                    {ko(r.other)}
                  </span>
                </span>
                <span className="flex-1 truncate text-xs text-foreground/60">
                  {r.pair.headline}
                </span>
                <span className="shrink-0 text-sm font-extrabold text-primary">
                  {r.score}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={content.faq} />
      </Card>

      <Card>
        <SectionTitle>다른 유형 궁합 보기</SectionTitle>
        <TypeGrid current={t} />
      </Card>

      <FamilyCard seed={t} campaign="type" />
    </main>
  );
}

function RankList({
  me,
  items,
}: {
  me: Mbti;
  items: { other: Mbti; score: number; pair: { headline: string } }[];
}) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((r, i) => (
        <li key={r.other}>
          <Link
            href={pairPath(me, r.other)}
            className="flex items-center gap-3 rounded-2xl border-2 border-foreground/10 bg-background px-3 py-2.5 transition hover:border-primary/50"
          >
            <span className="w-5 text-center text-sm font-extrabold text-foreground/40">
              {i + 1}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-base font-extrabold">
                {r.other}{" "}
                <span className="text-xs font-semibold text-foreground/50">
                  {ko(r.other)}
                </span>
              </span>
              <span className="text-xs text-foreground/60">{r.pair.headline}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-lg font-extrabold text-primary">
                {r.score}
              </span>
              <span className="text-[10px] font-semibold text-foreground/50">
                {scoreEmoji(r.score)} {scoreLabel(r.score)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
