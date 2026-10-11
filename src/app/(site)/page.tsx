import Link from "next/link";
import ScoreApp from "@/app/ScoreApp";
import { ArticleAd, JsonLd, TypeGrid } from "@/components/seo";
import { getTopPairs, pairPath, scoreEmoji } from "@/lib/mbti";
import { TTI_INDEX_PATH, ttiInfo } from "@/lib/tti";
import { LATEST_FORTUNE_YEAR, fortuneIndexPath, yearLabel } from "@/lib/fortune";
import { TtiGrid } from "@/components/tti";
import { ZodiacGrid } from "@/components/zodiac";
import { ZODIAC_INDEX_PATH } from "@/lib/zodiac";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// 구조화 데이터 (SEO/AEO) — 답변 엔진이 서비스와 FAQ를 이해하도록.
// 레이아웃에 두면 모든 페이지에 이 FAQPage 가 붙어, 자기 FAQPage 를 가진
// /pair·/mbti·/tti 페이지에 FAQPage 가 두 개씩 생긴다. 홈 소개 내용이라 홈에만 둔다.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "몇점이야?는 어떤 서비스인가요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "두 사람의 MBTI, 나이, 성별, 혈액형을 입력하면 연인·친구·직장동료·가족·소개팅·썸 등 관계 유형에 맞춰 궁합 점수를 AI가 분석해주는 무료 테스트입니다.",
          },
        },
        {
          "@type": "Question",
          name: "궁합 점수는 어떻게 계산되나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "입력한 정보를 바탕으로 AI가 MBTI 궁합, 소통 스타일, 감성 케미, 장기 관계 4가지 지표를 평가하고 이를 종합해 0~100점의 총점과 한 줄 평을 만들어 줍니다.",
          },
        },
        {
          "@type": "Question",
          name: "이용 요금이 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "완전 무료입니다. 회원가입 없이 바로 이용할 수 있습니다.",
          },
        },
        {
          "@type": "Question",
          name: "어떤 정보를 입력해야 하나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "두 사람의 MBTI만 있으면 분석할 수 있고, 나이·성별·혈액형은 선택 입력입니다. 정보를 더 넣을수록 분석이 구체적으로 나옵니다.",
          },
        },
        {
          "@type": "Question",
          name: "결과를 친구와 공유할 수 있나요?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "네. 결과 화면의 공유 버튼을 누르면 입력값이 담긴 링크가 생성되어, 친구가 링크만 열어도 같은 결과를 바로 볼 수 있습니다.",
          },
        },
      ],
    },
  ],
};


export default function Page() {
  const top = getTopPairs(6);
  return (
    <>
      <JsonLd data={jsonLd} />
      <ScoreApp />
      {/* 검색 유입/크롤링용 콘텐츠 링크 (앱 아래) */}
      <section className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5 pb-8">
        <ArticleAd />
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/name"
            className="rounded-3xl bg-white p-4 text-center shadow-sm transition hover:text-primary"
          >
            <span className="block text-2xl">💘</span>
            <span className="text-sm font-extrabold">이름 궁합</span>
            <span className="block text-[11px] text-foreground/50">획수로 보는 퍼센트</span>
          </Link>
          <Link
            href="/birthday"
            className="rounded-3xl bg-white p-4 text-center shadow-sm transition hover:text-primary"
          >
            <span className="block text-2xl">🎂</span>
            <span className="text-sm font-extrabold">생일 궁합</span>
            <span className="block text-[11px] text-foreground/50">띠 + 별자리 한 번에</span>
          </Link>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">MBTI별 궁합 순위</h2>
            <Link href="/mbti" className="text-xs font-bold text-primary underline underline-offset-2">
              전체 궁합표 →
            </Link>
          </div>
          <TypeGrid />
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold">궁합 점수 높은 조합</h2>
          <ul className="grid grid-cols-2 gap-2">
            {top.map((p) => (
              <li key={`${p.a}-${p.b}`}>
                <Link
                  href={pairPath(p.a, p.b)}
                  className="flex items-center justify-between rounded-xl border-2 border-foreground/10 bg-background px-3 py-2 text-sm transition hover:border-primary/50"
                >
                  <span className="font-bold">
                    {p.a} × {p.b}
                  </span>
                  <span className="font-extrabold text-primary">
                    {scoreEmoji(p.overall)} {p.overall}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">띠 궁합도 볼까?</h2>
            <Link
              href={TTI_INDEX_PATH}
              className="text-xs font-bold text-primary underline underline-offset-2"
            >
              띠 궁합표 →
            </Link>
          </div>
          <TtiGrid />
          <Link
            href={fortuneIndexPath(LATEST_FORTUNE_YEAR)}
            className="mt-3 block rounded-xl bg-primary/10 py-2.5 text-center text-sm font-bold text-primary"
          >
            {ttiInfo(yearLabel(LATEST_FORTUNE_YEAR).tti).emoji} {LATEST_FORTUNE_YEAR} 띠별 신년운세
            보기 →
          </Link>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">별자리 궁합도 볼까?</h2>
            <Link
              href={ZODIAC_INDEX_PATH}
              className="text-xs font-bold text-primary underline underline-offset-2"
            >
              별자리 궁합표 →
            </Link>
          </div>
          <ZodiacGrid />
        </div>
      </section>
    </>
  );
}
