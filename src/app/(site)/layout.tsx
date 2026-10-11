import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { MBTI_LIST, typePath } from "@/lib/mbti";
import { TTI_IDS, TTI_INDEX_PATH, ttiName, ttiTypePath } from "@/lib/tti";
import { LATEST_FORTUNE_YEAR, fortuneIndexPath } from "@/lib/fortune";
import { ZODIAC_IDS, ZODIAC_INDEX_PATH, zodiacName, zodiacTypePath } from "@/lib/zodiac";
import { FamilyLinks } from "@/components/family";
import AdminEntry from "@/components/admin-entry";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const DESCRIPTION = SITE_DESCRIPTION;

// SEO·광고·애널리틱스는 공개 사이트 영역에만 적용한다.
// (/admin 은 root layout만 상속하므로 GA·AdSense·footer가 붙지 않는다)
export const metadata: Metadata = {
  title: {
    default: "몇점이야? - MBTI 궁합 점수 테스트",
    template: "%s | 몇점이야?",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "MBTI 궁합",
    "궁합 테스트",
    "MBTI 궁합 점수",
    "연애 궁합",
    "썸 궁합",
    "소개팅 궁합",
    "혈액형 궁합",
    "MBTI 케미",
    "궁합 테스트 무료",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  category: "lifestyle",
  alternates: {
    canonical: "/",
    types: {
      // 네이버 서치어드바이저 RSS 제출용 피드
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "몇점이야? - MBTI 궁합 점수 테스트",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "몇점이야? - MBTI 궁합 점수 테스트",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    other: {
      "naver-site-verification": "e9c8237136ff2db49ee4bbc8b8280c7d407cadf9",
    },
  },
  ...(ADSENSE_CLIENT
    ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
    : {}),
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {ADSENSE_CLIENT && (
        <Script
          id="adsbygoogle-init"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {GA_ID && (
        <>
          <Script
            id="ga-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
          </Script>
        </>
      )}
      {children}
      <footer className="mx-auto w-full max-w-[480px] px-5 pb-10 pt-2 text-center text-xs leading-relaxed text-foreground/40">
        <nav aria-label="MBTI 궁합 바로가기" className="mb-4">
          <p className="mb-2 font-bold text-foreground/60">
            <Link href="/mbti" className="hover:text-primary">
              MBTI 궁합표
            </Link>
          </p>
          <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
            {MBTI_LIST.map((t) => (
              <li key={t}>
                <Link href={typePath(t)} className="hover:text-primary">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="띠 궁합 바로가기" className="mb-4">
          <p className="mb-2 font-bold text-foreground/60">
            <Link href={TTI_INDEX_PATH} className="hover:text-primary">
              띠 궁합표
            </Link>
            {" · "}
            <Link href={fortuneIndexPath(LATEST_FORTUNE_YEAR)} className="hover:text-primary">
              {LATEST_FORTUNE_YEAR} 띠별 운세
            </Link>
            {" · "}
            <Link href="/today" className="hover:text-primary">
              오늘의 운세
            </Link>
            {" · "}
            <Link href="/name" className="hover:text-primary">
              이름 궁합
            </Link>
            {" · "}
            <Link href="/birthday" className="hover:text-primary">
              생일 궁합
            </Link>
          </p>
          <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
            {TTI_IDS.map((t) => (
              <li key={t}>
                <Link href={ttiTypePath(t)} className="hover:text-primary">
                  {ttiName(t)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="별자리 궁합 바로가기" className="mb-4">
          <p className="mb-2 font-bold text-foreground/60">
            <Link href={ZODIAC_INDEX_PATH} className="hover:text-primary">
              별자리 궁합표
            </Link>
          </p>
          <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
            {ZODIAC_IDS.map((z) => (
              <li key={z}>
                <Link href={zodiacTypePath(z)} className="hover:text-primary">
                  {zodiacName(z)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <FamilyLinks />
        <p>
          <strong>몇점이야?</strong>는 두 사람의 MBTI·나이·혈액형으로 연인,
          친구, 썸, 소개팅 등 관계별 궁합 점수를 AI가 분석해주는 무료
          테스트입니다. 12띠·12별자리 궁합 점수, 이름·생일 궁합, 띠별 신년운세도 함께 볼 수 있습니다.
        </p>
        <p className="mt-2">© 2026 몇점이야?</p>
      </footer>
      {/* 운영자 브라우저에만 렌더된다 — SSG HTML 에는 들어가지 않는다 */}
      <AdminEntry />
    </>
  );
}
