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
import NameMatchApp from "@/components/name-match-app";
import { NamePyramid } from "@/components/name-result";
import { SITE_URL, type Faq } from "@/lib/site";

const PATH = "/name";
const TITLE = "이름 궁합 테스트 - 획수로 보는 이름 궁합 점수 계산기";
const DESCRIPTION =
  "두 사람 이름만 넣으면 예전 그 방식 그대로 획수를 더해 이름 궁합 퍼센트를 계산해줘. 내가 생각하는 마음과 상대가 생각하는 마음, 두 방향 점수와 계산 과정까지 한눈에.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "이름 궁합",
    "이름 궁합 테스트",
    "이름 궁합 계산기",
    "획수 궁합",
    "이름 획수 궁합",
    "이름으로 궁합",
    "커플 이름 궁합",
  ],
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | 몇점이야?`, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ: Faq[] = [
  {
    q: "이름 궁합은 어떻게 계산해?",
    a: "두 이름을 한 글자씩 번갈아 쓰고, 글자마다 자음·모음 획수를 더해 숫자로 바꿔. 그다음 옆 숫자끼리 더한 일의 자리만 남기는 걸 두 자리가 될 때까지 반복하면, 남은 두 자리가 궁합 퍼센트야.",
  },
  {
    q: "누구 이름을 먼저 쓰느냐에 따라 결과가 왜 달라?",
    a: "번갈아 쓰는 순서가 바뀌면 숫자 배열이 달라져서 결과도 달라져. 그래서 보통 내 이름을 먼저 쓴 건 '내가 상대를 생각하는 마음', 상대 이름을 먼저 쓴 건 '상대가 나를 생각하는 마음'으로 봐.",
  },
  {
    q: "성까지 넣어야 해?",
    a: "보통은 성까지 넣은 전체 이름으로 해. 이름만 넣어도 계산은 되지만 결과가 달라지니까, 비교할 때는 같은 방식으로 넣어야 공정해.",
  },
  {
    q: "입력한 이름이 저장돼?",
    a: "아니. 계산은 전부 내 휴대폰·브라우저 안에서 끝나고, 이름은 서버로 보내지 않아. 결과를 공유할 때만 링크 안에 이름이 담겨.",
  },
];

const CONSONANTS: [string, number][] = [
  ["ㄱ", 2], ["ㄴ", 2], ["ㄷ", 3], ["ㄹ", 5], ["ㅁ", 4], ["ㅂ", 4], ["ㅅ", 2],
  ["ㅇ", 1], ["ㅈ", 3], ["ㅊ", 4], ["ㅋ", 3], ["ㅌ", 4], ["ㅍ", 4], ["ㅎ", 3],
];
const VOWELS: [string, number][] = [
  ["ㅏ", 2], ["ㅑ", 3], ["ㅓ", 2], ["ㅕ", 3], ["ㅗ", 2], ["ㅛ", 3], ["ㅜ", 2],
  ["ㅠ", 3], ["ㅡ", 1], ["ㅣ", 1], ["ㅐ", 3], ["ㅔ", 3], ["ㅚ", 3], ["ㅟ", 3],
];

export default function NamePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "이름 궁합 테스트",
        url: `${SITE_URL}${PATH}`,
        description: DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: "ko-KR",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumbLd([{ name: "이름 궁합", path: PATH }]),
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "이름 궁합" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">이름 궁합 💘</h1>
        <p className="mt-2 text-base font-bold text-primary">그때 그 획수 궁합, 그대로 계산해줄게</p>
      </header>

      <Card>
        <NameMatchApp />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>이름 궁합 계산하는 법</SectionTitle>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-foreground/80">
          <li>두 이름을 한 글자씩 번갈아 써 (김·이·철·영·수·희).</li>
          <li>글자마다 자음·모음 획수를 더해 숫자로 바꿔.</li>
          <li>옆 숫자끼리 더해서 일의 자리만 남겨.</li>
          <li>두 자리가 남을 때까지 반복하면 그게 궁합 퍼센트야.</li>
        </ol>
        <p className="mb-2 mt-4 text-center text-xs font-bold text-foreground/50">예시 · 김철수 → 이영희</p>
        <NamePyramid first="김철수" second="이영희" />
      </Card>

      <Card>
        <SectionTitle>자음·모음 획수표</SectionTitle>
        <p className="-mt-1 mb-3 text-xs text-foreground/50">
          된소리(ㄲ·ㄸ·ㅃ·ㅆ·ㅉ)는 두 배, 받침은 같은 자음 획수를 더해.
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {[...CONSONANTS, ...VOWELS].map(([c, n]) => (
            <span key={c} className="rounded-lg bg-background py-1.5">
              <span className="block font-extrabold">{c}</span>
              <span className="text-[11px] text-foreground/50">{n}</span>
            </span>
          ))}
        </div>
      </Card>

      <GoldboxCta
        campaign="family_name-cta"
        content="name_index"
        vertical="name"
        title="궁합 좋게 나왔으면, 선물 하나 챙겨 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={FAQ} />
      </Card>

      <Card>
        <SectionTitle>다른 궁합도 볼까?</SectionTitle>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold">
          <Link href="/birthday" className="rounded-xl bg-background py-3 text-center hover:text-primary">🎂 생일 궁합</Link>
          <Link href="/" className="rounded-xl bg-background py-3 text-center hover:text-primary">🔮 MBTI 궁합</Link>
          <Link href="/tti" className="rounded-xl bg-background py-3 text-center hover:text-primary">🐭 띠 궁합</Link>
          <Link href="/zodiac" className="rounded-xl bg-background py-3 text-center hover:text-primary">♈ 별자리 궁합</Link>
        </div>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-foreground/40">
        이름 궁합은 재미로 보는 놀이야. 숫자보다 두 사람이 서로를 대하는 마음이 훨씬 중요해.
      </p>
    </main>
  );
}
