import { catalogPick, type GiftPick } from "./gifts";
import { ZODIAC_IDS, zodiacName, type Zodiac } from "./zodiac";

/**
 * 별자리 선물. 카탈로그(gifts.json)의 zodiac-necklace-* / zodiac-keyring-* 항목.
 * 딥링크는 기존 배치(npm run gift-links)가 같은 subId(scoregift)로 만든다 — 채널을 새로 만들지 않는다.
 */
export const ZODIAC_GIFT_IDS = ZODIAC_IDS.flatMap((z) => [
  `zodiac-necklace-${z}`,
  `zodiac-keyring-${z}`,
]);

export function zodiacGiftsFor(z: Zodiac): GiftPick[] {
  const name = zodiacName(z);
  return [
    catalogPick(`zodiac-necklace-${z}`, `생일 선물로 ${name} 별자리 목걸이는 의미까지 담겨서 실패가 적어.`),
    catalogPick(`zodiac-keyring-${z}`, `부담 없이 건네기 좋은 ${name} 키링. 매일 들고 다니는 물건이라 자주 떠올라.`),
  ].filter((p): p is GiftPick => p !== null);
}
