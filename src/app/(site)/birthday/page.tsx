import type { Metadata } from "next";
import Link from "next/link";
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
import BirthdayMatchApp from "@/components/birthday-match-app";
import { SITE_URL, type Faq } from "@/lib/site";
import { YEAR_MAX } from "@/lib/tti";

const PATH = "/birthday";
const TITLE = "생일 궁합 - 생년월일로 보는 띠 궁합 + 별자리 궁합 점수";
const DESCRIPTION =
  "두 사람의 생년월일만 넣으면 태어난 해로 띠 궁합을, 태어난 날로 별자리 궁합을 계산해 종합 점수로 보여줘. 태어난 요일과 나이 차이까지 한 번에.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "생일 궁합",
    "생년월일 궁합",
    "생일로 궁합",
    "생일 궁합 테스트",
    "생년월일 궁합 무료",
    "나이차 궁합",
    "띠 별자리 궁합",
  ],
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | 몇점이야?`, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ: Faq[] = [
  {
    q: "생일 궁합은 어떻게 계산해?",
    a: "태어난 해로 띠를, 태어난 월·일로 별자리를 정해. 그다음 띠끼리의 합·충·원진 같은 관계로 띠 궁합을, 별자리 사이의 각도로 별자리 궁합을 계산하고 두 점수의 평균을 종합 점수로 보여줘.",
  },
  {
    q: "1월·2월생은 띠가 어떻게 돼?",
    a: "띠가 바뀌는 시점은 명리로는 입춘(2월 4일 전후), 민속으로는 설날이야. 그 전에 태어났다면 전년도 띠로 보는 게 맞아서, 결과 화면에서 따로 안내해줘.",
  },
  {
    q: "생년월일이 저장돼?",
    a: "아니. 계산은 전부 내 휴대폰·브라우저 안에서 끝나고 생년월일은 서버로 보내지 않아. 결과를 공유할 때만 링크 안에 담겨.",
  },
];

export default function BirthdayPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "생일 궁합",
        url: `${SITE_URL}${PATH}`,
        description: DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: "ko-KR",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumbLd([{ name: "생일 궁합", path: PATH }]),
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "생일 궁합" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">생일 궁합 🎂</h1>
        <p className="mt-2 text-base font-bold text-primary">생년월일 하나로 띠 궁합 + 별자리 궁합</p>
      </header>

      <Card>
        <BirthdayMatchApp maxYear={YEAR_MAX} />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>생일 궁합은 이렇게 봐</SectionTitle>
        <ul className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/80">
          <li>
            <span className="font-bold">🐭 태어난 해 → 띠 궁합.</span> 띠끼리 합이 되는지(육합·삼합),
            부딪히는지(충·원진·형)로 점수를 매겨.{" "}
            <Link href="/tti" className="font-bold text-primary underline">
              띠 궁합표
            </Link>
          </li>
          <li>
            <span className="font-bold">♈ 태어난 날 → 별자리 궁합.</span> 두 별자리가 황도에서 몇 도
            떨어져 있는지(트라인·섹스타일·스퀘어)로 봐.{" "}
            <Link href="/zodiac" className="font-bold text-primary underline">
              별자리 궁합표
            </Link>
          </li>
          <li>
            <span className="font-bold">✨ 종합 점수</span>는 두 점수의 평균이야. 한쪽이 낮아도 다른
            쪽이 받쳐주면 충분히 좋은 궁합이야.
          </li>
        </ul>
      </Card>

      <GoldboxCta
        campaign="family_birthday-cta"
        content="birthday_index"
        vertical="birthday"
        title="생일 챙길 사람 있으면, 선물은 특가로 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={FAQ} />
      </Card>

      <Card>
        <SectionTitle>다른 궁합도 볼까?</SectionTitle>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold">
          <Link href="/name" className="rounded-xl bg-background py-3 text-center hover:text-primary">💘 이름 궁합</Link>
          <Link href="/" className="rounded-xl bg-background py-3 text-center hover:text-primary">🔮 MBTI 궁합</Link>
          <Link href="/tti" className="rounded-xl bg-background py-3 text-center hover:text-primary">🐭 띠 궁합</Link>
          <Link href="/zodiac" className="rounded-xl bg-background py-3 text-center hover:text-primary">♈ 별자리 궁합</Link>
        </div>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-foreground/40">
        생일 궁합은 전통 띠 궁합과 서양 별자리 궁합을 합친 참고용 콘텐츠야.
      </p>
    </main>
  );
}
