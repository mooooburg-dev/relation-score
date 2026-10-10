/**
 * 사이트 공통 상수·타입.
 *
 * mbti.ts 는 types/pairs.json(약 880KB)을 import 하므로, 버티컬(띠 궁합 등)이나
 * 클라이언트 컴포넌트가 SITE_URL 하나 때문에 그 데이터를 끌고 들어오지 않도록 분리했다.
 * 기존 import 경로(@/lib/mbti)는 mbti.ts 가 다시 내보내므로 그대로 동작한다.
 */
export const SITE_URL = "https://score.drawyourmind.com";
export const SITE_NAME = "몇점이야?";
export const SITE_DESCRIPTION =
  "두 사람의 MBTI, 나이, 혈액형을 입력하면 연인·친구·썸·소개팅 등 관계별 궁합 점수를 AI가 분석해주는 무료 테스트. B급 감성 한 줄 평과 결과 공유까지.";

export interface Faq {
  q: string;
  a: string;
}
