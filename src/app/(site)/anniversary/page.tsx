import type { Metadata } from "next";
import Link from "next/link";
import { ArticleAd, Breadcrumb, Card, FaqList, JsonLd, SectionTitle, breadcrumbLd, faqLd } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import AnniversaryApp, { type GiftLite } from "@/components/anniversary-app";
import { SITE_URL, type Faq } from "@/lib/site";
import { catalogPick } from "@/lib/gifts";
import { ANNIV_GIFTS, type GiftKind } from "@/lib/anniversary";

const PATH = "/anniversary";
const TITLE = "커플 기념일 계산기 - 100일·200일·1주년 날짜와 D-day 계산";
const DESCRIPTION =
  "사귄 날만 넣으면 오늘이 며칠째인지, 100일·200일·300일·1주년·500일·1000일이 언제인지 날짜와 요일, D-day를 바로 계산해줘. 기념일 캘린더 추가와 기념일 선물 추천까지.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "100일 계산기",
    "커플 기념일 계산기",
    "사귄 날 계산",
    "만난 지 며칠",
    "200일 계산",
    "1주년 계산",
    "1000일 계산기",
    "디데이 계산기",
    "100일 선물",
  ],
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} | 몇점이야?`, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ: Faq[] = [
  {
    q: "100일은 사귄 날을 포함해서 세?",
    a: "보통은 사귄 날을 1일로 세. 그래서 100일은 사귄 날로부터 99일 뒤야. 사귄 날을 0일로 세고 싶으면 계산기에서 '사귄 날을 1일로 세기'를 끄면 돼.",
  },
  {
    q: "1주년은 365일째야?",
    a: "1주년은 날수가 아니라 다음 해의 같은 날짜로 세. 사귄 날을 1일로 세면 1주년은 366일째가 되고, 윤년이 끼면 하루 더 늘어나.",
  },
  {
    q: "사귄 날이 저장돼?",
    a: "이 기기 브라우저에만 기억돼서 다음에 열면 바로 보여줘. 서버로는 보내지 않고, 공유할 때만 링크 안에 담겨.",
  },
  {
    q: "기념일 알림을 받을 수 있어?",
    a: "'기념일 캘린더에 추가'를 누르면 다가오는 기념일 12개가 휴대폰 캘린더에 들어가고, 각 기념일 3일 전에 알림이 와.",
  },
];

export default function AnniversaryPage() {
  // 기념일 종류별 선물 — 딥링크가 있는 것만 클라이언트로 넘긴다
  const gifts = Object.fromEntries(
    (Object.keys(ANNIV_GIFTS) as GiftKind[]).map((k) => [
      k,
      ANNIV_GIFTS[k]
        .map((id) => catalogPick(id, ""))
        .filter((g): g is NonNullable<typeof g> => g !== null)
        .map<GiftLite>((g) => ({ id: g.id, label: g.label, priceLabel: g.priceLabel, url: g.url })),
    ]),
  ) as Record<GiftKind, GiftLite[]>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "커플 기념일 계산기",
        url: `${SITE_URL}${PATH}`,
        description: DESCRIPTION,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        inLanguage: "ko-KR",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      breadcrumbLd([{ name: "커플 기념일 계산기", path: PATH }]),
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "커플 기념일 계산기" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">커플 기념일 계산기 💑</h1>
        <p className="mt-2 text-base font-bold text-primary">우리 100일은 언제? 사귄 날만 넣어봐</p>
      </header>

      <Card>
        <AnniversaryApp gifts={gifts} />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>기념일은 이렇게 세</SectionTitle>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
          <li>
            <b>100일 단위</b> — 사귄 날을 1일로 세서 100일·200일·300일… 1000일까지.
          </li>
          <li>
            <b>주년</b> — 날수가 아니라 다음 해 같은 날짜. 2월 29일에 사귀었다면 평년엔 2월 28일.
          </li>
          <li>
            <b>500일·1000일</b> — 주년만큼 챙기는 커플이 많은 큰 기념일이야.
          </li>
        </ul>
      </Card>

      <GoldboxCta
        campaign="family_anniversary-cta"
        content="anniversary"
        vertical="anniversary"
        title="기념일 선물, 오늘 특가인지 보고 사자 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={FAQ} />
      </Card>

      <Card>
        <SectionTitle>둘이 함께 해보기</SectionTitle>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold">
          <Link href="/name" className="rounded-xl bg-background py-3 text-center hover:text-primary">💘 이름 궁합</Link>
          <Link href="/birthday" className="rounded-xl bg-background py-3 text-center hover:text-primary">🎂 생일 궁합</Link>
          <Link href="/" className="rounded-xl bg-background py-3 text-center hover:text-primary">🔮 MBTI 궁합</Link>
          <Link href="/event/christmas" className="rounded-xl bg-background py-3 text-center hover:text-primary">🎄 크리스마스 연애운</Link>
        </div>
      </Card>
    </main>
  );
}
