import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "몇점이야? - 우리 궁합 점수",
    short_name: "몇점이야?",
    description:
      "MBTI·나이·혈액형·별자리로 보는 관계별 궁합 점수 테스트",
    start_url: "/",
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
