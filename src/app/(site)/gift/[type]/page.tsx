import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  AnalyzeCta,
  ArticleAd,
  Breadcrumb,
  Card,
  JsonLd,
  SectionTitle,
  TypeGrid,
  breadcrumbLd,
  faqLd,
} from "@/components/seo";
import { FamilyCard } from "@/components/family";
import { AffiliateNotice, GiftButton } from "@/components/gift";
import {
  MBTI_LIST,
  RELATIONS,
  SITE_URL,
  getType,
  giftPath,
  giftRelationAnchor,
  ko,
  normalizeMbti,
  typePath,
} from "@/lib/mbti";
import { allGiftsFor, giftsFor } from "@/lib/gifts";

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

  const k = ko(t);
  const all = allGiftsFor(t);
  if (!all) return {};
  const picks = all.items;
  const sample = picks.slice(0, 3).map((p) => p.label).join(", ");
  const title = `${t}(${k}) 선물 추천 - ${k}가 진짜 좋아하는 선물`;
  const description = `${t} ${k}(${content.nickname})에게 뭘 줘야 할지 고민이라면. ${sample} 등 ${picks.length}가지를 성격 근거와 함께 골랐어. 연인·썸·친구·직장동료·가족·소개팅 관계별로 선 넘지 않는 선물까지 정리했어.`;
  const path = giftPath(t);

  return {
    title,
    description,
    keywords: [
      `${t} 선물`,
      `${k} 선물`,
      `${t} 선물 추천`,
      `${k} 선물 추천`,
      `${t} 생일선물`,
      `${k} 생일선물`,
      `${t} 좋아하는 것`,
      `MBTI 선물 추천`,
      `MBTI별 선물`,
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

export default async function GiftTypePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { type } = await params;
  const t = normalizeMbti(type);
  if (!t) notFound();
  if (type !== t.toLowerCase()) permanentRedirect(giftPath(t));
  const content = getType(t);
  if (!content) notFound();

  const k = ko(t);
  const path = giftPath(t);
  const all = allGiftsFor(t);
  if (!all) notFound();
  const picks = all.items;

  const faq = [
    {
      q: `${t} 선물 뭐가 좋아?`,
      a: `${picks[0].label} 같은 게 잘 맞아. ${picks[0].why} 고를 때 기준은 하나야 — ${content.tagline}`.trim(),
    },
    {
      q: `${k} 선물 고를 때 피해야 할 건?`,
      a: `관계보다 앞서가는 선물이야. 직장동료나 소개팅 상대에게 향수·화장품처럼 취향이 깊게 개입하는 걸 주면 부담스러워져. 아래 관계별 추천은 그런 항목을 미리 걸러뒀어.`,
    },
    {
      q: `${t}한테 현금이나 기프티콘은 별로야?`,
      a: `싫어하진 않는데 기억에 남진 않아. ${k}는 "나를 알고 골랐다"는 신호에 반응하는 편이라, 값보다 왜 골랐는지 한 줄 붙이는 쪽이 훨씬 효과가 커.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${t}(${k}) 선물 추천`,
        alternativeHeadline: `${k} 선물 추천`,
        description: content.tagline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
      },
      breadcrumbLd([
        { name: "MBTI 선물 추천", path: "/gift" },
        { name: `${t} 선물`, path },
      ]),
      {
        "@type": "ItemList",
        name: `${t}에게 어울리는 선물`,
        itemListElement: picks.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.label,
          description: p.why,
        })),
      },
      faqLd(faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { name: "MBTI 선물 추천", path: "/gift" },
          { name: `${t} 선물` },
        ]}
      />

      <header>
        <p className="text-sm font-bold text-primary">{content.nickname}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          {t} 선물 추천
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {k} 선물 추천
          </span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          {all.angle} 흔히 {k}라고 부르는 {t}의 성격을 근거로 {picks.length}
          가지를 골랐고, 관계별로 선 넘지 않는 선물도 따로 정리했어.
        </p>
        <AffiliateNotice />
      </header>

      <Card>
        <SectionTitle>관계부터 고르기</SectionTitle>
        <ul className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
            <li key={r.value}>
              <a
                href={`#${giftRelationAnchor(r.value)}`}
                className="inline-block rounded-full border-2 border-foreground/10 bg-background px-3 py-1 text-xs font-bold"
              >
                {r.emoji} {r.value}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>{t}가 좋아하는 선물</SectionTitle>
        <ul className="flex flex-col gap-3">
          {picks.map((p) => (
            <li
              key={p.id}
              id={`gift-${p.id}`}
              className="scroll-mt-4 rounded-2xl border-2 border-foreground/10 bg-background p-3"
            >
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-extrabold">{p.label}</h3>
                <span className="text-[11px] font-semibold text-foreground/40">
                  {p.priceLabel}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                {p.why}
              </p>
              <GiftButton item={p} />
            </li>
          ))}
        </ul>
      </Card>

      <ArticleAd />

      {RELATIONS.map((r) => {
        const set = giftsFor(t, r.value);
        if (!set) return null;
        return (
          <Card key={r.value}>
            <h2
              id={giftRelationAnchor(r.value)}
              className="mb-1 scroll-mt-4 text-lg font-extrabold tracking-tight"
            >
              {r.emoji} {set.heading}
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-foreground/50">
              {set.lead}
            </p>
            <ul className="flex flex-col gap-2">
              {set.items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-xl bg-background px-3 py-2"
                >
                  <a
                    href={`#gift-${p.id}`}
                    className="flex flex-1 flex-col leading-tight"
                  >
                    <span className="text-sm font-bold">{p.label}</span>
                    <span className="text-[10px] font-semibold text-foreground/40">
                      {p.priceLabel}
                    </span>
                  </a>
                  <GiftButton item={p} compact />
                </li>
              ))}
            </ul>
          </Card>
        );
      })}

      <AnalyzeCta b={t} />

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <dl className="flex flex-col gap-4">
          {faq.map((f, i) => (
            <div key={i}>
              <dt className="font-bold">Q. {f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-foreground/80">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle>{t} 더 알아보기</SectionTitle>
        <Link
          href={typePath(t)}
          className="text-sm font-bold text-primary underline underline-offset-2"
        >
          {t} 궁합 순위 보러 가기 →
        </Link>
      </Card>

      <Card>
        <SectionTitle>다른 유형 선물 보기</SectionTitle>
        <TypeGrid current={t} base="/gift/" />
      </Card>

      <FamilyCard seed={t} campaign="gift" />
    </main>
  );
}
