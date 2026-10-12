/**
 * 시즌 이벤트 (빼빼로데이·크리스마스·발렌타인데이·화이트데이).
 *
 * 해마다 같은 날이라 "다음 그날"을 계산해 쓴다 — 지나면 자동으로 내년 날짜로 넘어간다.
 * 그날의 띠·별자리 연애운은 오늘의 운세 엔진(daily.ts)을 그 날짜로 돌려 만든다.
 * 선물 카탈로그 id 는 gifts.json 의 event-* 항목 (브랜드명 금지 — "빼빼로" 대신 "막대과자").
 *
 * 클라이언트(배너)도 import 하므로 JSON 을 import 하지 않는다.
 */
import type { Faq } from "./site";
import { kstToday, ymdKey, type Ymd } from "./daily";

export interface SeasonEvent {
  slug: string;
  name: string;
  emoji: string;
  month: number;
  day: number;
  /** 배너·카드 한 줄 */
  hook: string;
  intro: string;
  /** 순위 제목 ("고백하기 좋은 띠") */
  rankTitle: string;
  giftIds: string[];
  giftLead: string;
  keywords: string[];
  faq: Faq[];
}

export const EVENTS: SeasonEvent[] = [
  {
    slug: "pepero-day",
    name: "빼빼로데이",
    emoji: "🍫",
    month: 11,
    day: 11,
    hook: "고백하기 좋은 띠·별자리는?",
    intro:
      "11월 11일, 막대과자를 주고받으며 마음을 전하는 날이야. 그날의 일진과 달의 위치로 띠·별자리별 연애운을 미리 계산해 뒀어. 고백 타이밍이 고민이라면 내 연애운부터 확인해 봐.",
    rankTitle: "빼빼로데이 연애운이 좋은",
    giftIds: ["event-stick-snack", "event-handmade-choco", "event-couple-keyring", "event-flower"],
    giftLead: "막대과자에 작은 선물 하나를 더하면 마음이 더 잘 전해져",
    keywords: ["빼빼로데이", "빼빼로데이 고백", "빼빼로데이 선물", "빼빼로데이 궁합", "11월 11일 운세"],
    faq: [
      {
        q: "빼빼로데이 고백 성공하려면 언제가 좋아?",
        a: "그날 연애운이 높은 띠·별자리라면 낮보다 저녁의 차분한 분위기에서 짧고 진심 어린 말로 전하는 게 좋아. 연애운이 낮게 나와도 걱정하지 마. 부담 없는 선물로 분위기를 먼저 만들면 충분해.",
      },
      {
        q: "빼빼로데이 연애운은 어떻게 계산해?",
        a: "11월 11일의 일진(60갑자)과 내 띠의 관계, 그날 달이 지나는 별자리와 내 별자리의 각도로 계산해. 오늘의 운세와 같은 방식이라 그날이 되면 오늘의 운세에서도 같은 점수가 나와.",
      },
    ],
  },
  {
    slug: "christmas",
    name: "크리스마스",
    emoji: "🎄",
    month: 12,
    day: 25,
    hook: "크리스마스 연애운 좋은 띠·별자리는?",
    intro:
      "12월 25일 크리스마스, 연인과 보내든 친구와 보내든 설레는 날이야. 그날의 일진과 달의 위치로 띠·별자리별 연애운을 미리 계산해 뒀어. 데이트 계획과 선물 준비에 참고해 봐.",
    rankTitle: "크리스마스 연애운이 좋은",
    giftIds: ["event-xmas-giftset", "event-xmas-light", "event-couple-pajama", "event-mini-tree"],
    giftLead: "분위기를 살리는 크리스마스 선물, 미리 준비해 두면 마음이 편해",
    keywords: ["크리스마스 운세", "크리스마스 연애운", "크리스마스 선물", "크리스마스 커플", "12월 25일 운세"],
    faq: [
      {
        q: "크리스마스 연애운이 낮게 나오면 어떡해?",
        a: "운세는 그날의 흐름일 뿐이야. 연애운이 낮은 날엔 큰 이벤트보다 함께 시간을 보내는 데 집중하면 오히려 편안한 하루가 돼.",
      },
      {
        q: "크리스마스 선물은 언제 사는 게 좋아?",
        a: "인기 선물은 12월 중순이면 품절이 잦아. 11월 말~12월 초에 미리 골라 두고, 특가가 뜰 때 사면 부담이 줄어.",
      },
    ],
  },
  {
    slug: "valentines-day",
    name: "발렌타인데이",
    emoji: "💝",
    month: 2,
    day: 14,
    hook: "발렌타인데이 고백운 좋은 띠·별자리는?",
    intro:
      "2월 14일, 초콜릿과 함께 마음을 전하는 날이야. 그날의 일진과 달의 위치로 띠·별자리별 연애운을 미리 계산해 뒀어. 고백이나 데이트 계획 전에 확인해 봐.",
    rankTitle: "발렌타인데이 연애운이 좋은",
    giftIds: ["event-handmade-choco", "event-couple-ring", "event-handcream-set", "event-flower"],
    giftLead: "초콜릿과 함께 건넬 작은 선물을 골라 봤어",
    keywords: ["발렌타인데이", "발렌타인데이 고백", "발렌타인데이 선물", "발렌타인 운세", "2월 14일 운세"],
    faq: [
      {
        q: "발렌타인데이 연애운은 어떻게 계산해?",
        a: "2월 14일의 일진과 내 띠의 관계, 그날 달이 지나는 별자리와 내 별자리의 각도로 계산해. 그날이 되면 오늘의 운세에서도 같은 점수가 나와.",
      },
    ],
  },
  {
    slug: "white-day",
    name: "화이트데이",
    emoji: "🍬",
    month: 3,
    day: 14,
    hook: "화이트데이 연애운 좋은 띠·별자리는?",
    intro:
      "3월 14일, 사탕으로 마음에 답하는 날이야. 그날의 일진과 달의 위치로 띠·별자리별 연애운을 미리 계산해 뒀어. 답장 타이밍이 고민이라면 확인해 봐.",
    rankTitle: "화이트데이 연애운이 좋은",
    giftIds: ["event-candy-set", "event-flower", "event-necklace", "event-couple-keyring"],
    giftLead: "사탕과 함께 건넬 선물을 골라 봤어",
    keywords: ["화이트데이", "화이트데이 선물", "화이트데이 고백", "화이트데이 운세", "3월 14일 운세"],
    faq: [
      {
        q: "화이트데이 연애운은 어떻게 계산해?",
        a: "3월 14일의 일진과 내 띠의 관계, 그날 달이 지나는 별자리와 내 별자리의 각도로 계산해. 오늘의 운세와 같은 방식이야.",
      },
    ],
  },
];

/** 이벤트 본문(문구·선물) 갱신일 — sitemap lastmod. 문구를 바꾸면 함께 갱신한다 */
export const EVENT_CONTENT_UPDATED = new Date("2026-10-12T00:00:00+09:00");

export function getEvent(slug: string): SeasonEvent | null {
  return EVENTS.find((e) => e.slug === slug) ?? null;
}

export const eventPath = (slug: string) => `/event/${slug}`;

/** 오늘 이후(오늘 포함) 가장 가까운 그날 */
export function nextOccurrence(ev: SeasonEvent, today: Ymd = kstToday()): Ymd {
  const thisYear = { y: today.y, m: ev.month, d: ev.day };
  return ymdKey(thisYear) >= ymdKey(today) ? thisYear : { y: today.y + 1, m: ev.month, d: ev.day };
}

/** 그날까지 남은 날 (당일 0) */
export function daysUntil(ev: SeasonEvent, today: Ymd = kstToday()): number {
  const n = nextOccurrence(ev, today);
  return Math.round((Date.UTC(n.y, n.m - 1, n.d) - Date.UTC(today.y, today.m - 1, today.d)) / 86_400_000);
}

export function ddayLabel(days: number): string {
  return days === 0 ? "D-DAY" : `D-${days}`;
}

/** 배너에 띄울 가장 가까운 이벤트 (window 일 이내) */
export function upcomingEvent(today: Ymd = kstToday(), window = 45): SeasonEvent | null {
  return (
    EVENTS.map((e) => ({ e, d: daysUntil(e, today) }))
      .filter((x) => x.d <= window)
      .sort((a, b) => a.d - b.d)[0]?.e ?? null
  );
}

/** 오늘이 이벤트 당일이면 그 이벤트 (알림 문구용) */
export function eventToday(today: Ymd = kstToday()): SeasonEvent | null {
  return EVENTS.find((e) => e.month === today.m && e.day === today.d) ?? null;
}
