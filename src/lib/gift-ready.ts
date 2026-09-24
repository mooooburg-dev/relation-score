import linksJson from "@/data/gift-links.json";

/**
 * 승인 전 미리보기 모드.
 *
 * 파트너스 채널 심사에는 "제휴 링크가 실제로 동작하는 화면"이 필요한데,
 * 딥링크는 승인이 나야 만들 수 있다(닭-달걀). 이 플래그를 켜면 제휴 링크 대신
 * 일반 쿠팡 검색 URL로 버튼을 렌더해서 심사용 스크린샷을 찍을 수 있다.
 * 수수료가 붙지 않는 평범한 링크라 켜둬도 정책상 문제가 없다.
 *
 * 승인 후 `npm run gift-links` 를 돌리면 딥링크가 우선하므로 이 값은 꺼도 된다.
 */
export const GIFT_PREVIEW = process.env.NEXT_PUBLIC_GIFT_PREVIEW === "1";

/**
 * 선물 버튼·CTA를 노출할지.
 *
 * gifts.ts 가 아니라 이 모듈을 따로 둔 건, ScoreApp 같은 클라이언트 컴포넌트가
 * 이 값을 쓰면서 types/pairs.json(878KB)까지 번들에 끌고 들어오지 않게 하려는 것.
 */
export const GIFT_LINKS_READY =
  GIFT_PREVIEW || Object.keys(linksJson as Record<string, string>).length > 0;
