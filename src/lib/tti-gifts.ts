import { catalogPick, type GiftPick } from "./gifts";
import { TTI_IDS, ttiInfo, ttiName, type Tti } from "./tti";

/**
 * 띠별 선물. 카탈로그(gifts.json)의 tti-gold-* / tti-goods-* 항목을 쓴다.
 * 딥링크는 MBTI 선물과 같은 배치(npm run gift-links)가 같은 subId(scoregift)로 만든다
 * — 이 사이트의 채널은 루트 URL 하나라 버티컬마다 채널을 새로 만들지 않는다.
 */

export const TTI_GIFT_IDS = TTI_IDS.flatMap((t) => [`tti-gold-${t}`, `tti-goods-${t}`]);

export function ttiGiftsFor(t: Tti): GiftPick[] {
  const name = ttiName(t);
  const animal = ttiInfo(t).ko;
  return [
    catalogPick(
      `tti-gold-${t}`,
      `돌·생일·환갑처럼 의미 있는 날엔 ${name} 상징이 들어간 순금이 기념품으로 오래 남아.`,
    ),
    catalogPick(
      `tti-goods-${t}`,
      `부담 없이 건네기 좋은 ${animal} 캐릭터 소품. 가방이나 열쇠에 달아 두면 자꾸 눈에 밟혀.`,
    ),
  ].filter((p): p is GiftPick => p !== null);
}
