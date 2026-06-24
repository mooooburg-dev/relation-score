import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://score.drawyourmind.com";
const SITE_NAME = "몇점이야?";
const DESCRIPTION =
  "두 사람의 MBTI, 나이, 혈액형을 입력하면 연인·친구·썸·소개팅 등 관계별 궁합 점수를 AI가 분석해주는 무료 테스트. B급 감성 한 줄 평과 결과 공유까지.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
  ...(ADSENSE_CLIENT
    ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#7F77DD",
  width: "device-width",
  initialScale: 1,
};

// 구조화 데이터 (SEO/AEO) — 답변 엔진이 서비스와 FAQ를 이해하도록
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: DESCRIPTION,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-init"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {children}
        <footer className="mx-auto w-full max-w-[480px] px-5 pb-10 pt-2 text-center text-xs leading-relaxed text-foreground/40">
          <p>
            <strong>몇점이야?</strong>는 두 사람의 MBTI·나이·혈액형으로 연인,
            친구, 썸, 소개팅 등 관계별 궁합 점수를 AI가 분석해주는 무료
            테스트입니다.
          </p>
          <p className="mt-2">© 2026 몇점이야?</p>
        </footer>
      </body>
    </html>
  );
}
