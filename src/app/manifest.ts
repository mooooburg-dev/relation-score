import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "몇점이야? - 궁합 점수와 오늘의 운세",
    short_name: "몇점이야?",
    description:
      "MBTI·띠·별자리 궁합 점수와 매일 바뀌는 오늘의 운세",
    // 홈 화면에서 열면 매일 볼 오늘의 운세로 바로 간다. utm 으로 설치 사용자 재방문을 GA 에서 구분한다
    start_url: "/today?utm_source=pwa&utm_medium=homescreen",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#f4f2fb",
    theme_color: "#7F77DD",
    lang: "ko-KR",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
