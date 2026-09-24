import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://score.drawyourmind.com";

// 문서 공통(파비콘·매니페스트·기본 제목)만 둔다.
// SEO 메타·구조화 데이터·GA·AdSense·footer는 공개 사이트 영역인
// src/app/(site)/layout.tsx 소관 — /admin 에는 상속되지 않는다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // template은 (site) layout 소관. 여기에 두면 (site)의 default 제목에까지
  // 접미사가 덧붙어 홈 <title>이 "... | 몇점이야?"로 중복된다.
  title: "몇점이야? - MBTI 궁합 점수 테스트",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7F77DD",
  width: "device-width",
  initialScale: 1,
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
