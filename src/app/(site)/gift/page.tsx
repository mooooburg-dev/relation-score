import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  Card,
  JsonLd,
  SectionTitle,
  breadcrumbLd,
} from "@/components/seo";
import { AffiliateNotice } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import { SITE_URL, getAllTypes, giftPath, ko } from "@/lib/mbti";
import { allGiftsFor } from "@/lib/gifts";

const TITLE = "MBTI 선물 추천 - 16유형별로 진짜 좋아하는 선물";
const DESCRIPTION =
  "상대방 MBTI만 알면 선물 고민 끝. 16가지 유형별로 성격에 맞는 선물을 이유와 함께 골랐어. 연인·썸·친구·직장동료·가족·소개팅까지 관계별로 선 넘지 않는 선물도 따로 정리했어.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "MBTI 선물 추천",
    "MBTI별 선물",
    "MBTI 생일선물",
    "성격유형 선물",
    "남자친구 선물 추천",
    "여자친구 선물 추천",
  ],
  alternates: { canonical: "/gift" },
  openGraph: {
    title: `${TITLE} | 몇점이야?`,
    description: DESCRIPTION,
    url: `${SITE_URL}/gift`,
    type: "website",
  },
};

export default function GiftIndexPage() {
  const types = getAllTypes();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}/gift`,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: "MBTI 선물 추천", path: "/gift" }]),
      {
        "@type": "ItemList",
        name: "MBTI 16유형 선물 추천",
        itemListElement: types.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${t.type} 선물 추천`,
          url: `${SITE_URL}${giftPath(t.type)}`,
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "MBTI 선물 추천" }]} />

      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">
          MBTI 선물 추천
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          뭘 좋아하는지 물어보면 &ldquo;아무거나&rdquo;라고 하잖아. 상대방 MBTI만
          알면 돼. 16유형별로 성격을 근거로 골랐고, 관계에 따라 부담스러운 선물은
          미리 걸러뒀어.
        </p>
        <AffiliateNotice />
      </header>

      <Card>
        <SectionTitle>유형 선택</SectionTitle>
        <ul className="flex flex-col gap-2">
          {types.map((t) => {
            const set = allGiftsFor(t.type);
            const sample = set?.items.slice(0, 3).map((i) => i.label).join(" · ");
            return (
              <li key={t.type}>
                <Link
                  href={giftPath(t.type)}
                  className="flex items-center gap-3 rounded-2xl border-2 border-foreground/10 bg-background px-3 py-2.5 transition hover:border-primary/50"
                >
                  <span className="flex w-16 shrink-0 flex-col leading-tight">
                    <span className="text-base font-extrabold">{t.type}</span>
                    <span className="text-[10px] font-semibold text-foreground/50">
                      {ko(t.type)}
                    </span>
                  </span>
                  <span className="flex-1 truncate text-xs text-foreground/60">
                    {sample}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-primary">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <SectionTitle>선물 고르기 전에</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">
          상대방이랑 몇 점인지부터 보고 싶다면 궁합 분석을 먼저 해봐. 결과
          화면에서 그 사람 유형에 맞는 선물로 바로 넘어올 수 있어.
        </p>
        <Link
          href="/"
          className="mt-3 block rounded-2xl bg-primary py-3.5 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          궁합 점수부터 보기 🔮
        </Link>
      </Card>

      <FamilyCard campaign="gift-index" />
    </main>
  );
}
