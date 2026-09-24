// 만든 사람의 다른 서비스(drawyourmind 패밀리) 크로스링크 데이터.
//
// ⚠️ 이 문구들에 "쿠팡" 상호를 넣지 말 것. 운영정책 4.1 6) 은 쿠팡/쿠팡 파트너스
// 상호 자체의 사용을 제재 대상으로 삼고, 실제로 채널명에 상호를 넣어 계정이 해지된
// 전례가 있다(goldbox-today/docs/coupang-partners-policy-notes.md §1).
// 서비스명은 "골드박스투데이" 이므로 "골드박스" 만으로 의미 전달이 충분하다.
// 결과 화면에서는 관계 유형(+나이)에 맞춰 한 사이트만 골라 보여주고,
// 푸터에서는 전체 목록을 나열한다. 링크마다 UTM을 붙여 GA에서 유입을 측정한다.

import type { Relation } from "./mbti";

export type FamilySiteId = "goldbox" | "ratebox" | "paybox";

export interface FamilySite {
  id: FamilySiteId;
  name: string;
  url: string;
  emoji: string;
  tagline: string;
}

export const FAMILY_SITES: FamilySite[] = [
  {
    id: "goldbox",
    name: "골드박스투데이",
    url: "https://goldbox.today",
    emoji: "🎁",
    tagline: "골드박스 오늘의 특가와 역대 최저가",
  },
  {
    id: "ratebox",
    name: "금리박스",
    url: "https://ratebox.drawyourmind.com",
    emoji: "🏦",
    tagline: "예·적금 금리, 지금이 역대 어느 수준인지",
  },
  {
    id: "paybox",
    name: "월급박스",
    url: "https://paybox.drawyourmind.com",
    emoji: "💸",
    tagline: "연봉·월급 실수령액, 퇴직금 계산",
  },
];

const SITE_BY_ID = Object.fromEntries(
  FAMILY_SITES.map((s) => [s.id, s]),
) as Record<FamilySiteId, FamilySite>;

export interface FamilyPick {
  site: FamilySite;
  title: string;
  description: string;
  cta: string;
}

interface Copy {
  siteId: FamilySiteId;
  title: string;
  description: string;
  cta: string;
}

// 관계별 기본 카피. 사이트 톤(B급 한 줄 평)에 맞춰 짧게.
const BY_RELATION: Record<Relation, Copy> = {
  연인: {
    siteId: "goldbox",
    title: "궁합은 확인했고, 이제 선물 살 차례 🎁",
    description: "오늘 골드박스 특가에서 선물 미리 찜해두기",
    cta: "오늘의 특가 보기",
  },
  썸: {
    siteId: "goldbox",
    title: "썸 굳히기엔 타이밍보다 선물 🎁",
    description: "역대 최저가 뜬 날 사면 센스까지 챙긴다",
    cta: "오늘의 특가 보기",
  },
  소개팅: {
    siteId: "goldbox",
    title: "애프터 준비물, 특가로 챙기기 ☕",
    description: "오늘 골드박스에 뜬 특가 한눈에",
    cta: "오늘의 특가 보기",
  },
  친구: {
    siteId: "goldbox",
    title: "찐친 인증 완료. 생일 선물 미리 찜 🎁",
    description: "골드박스 오늘의 특가와 역대 최저가 확인",
    cta: "오늘의 특가 보기",
  },
  직장동료: {
    siteId: "paybox",
    title: "동료 궁합은 봤고, 내 월급은? 💼",
    description: "연봉별 실수령액·퇴직금·실업급여 바로 계산",
    cta: "내 실수령액 확인",
  },
  가족: {
    siteId: "ratebox",
    title: "가족 목돈, 지금 금리는 역대 어느 수준? 🏦",
    description: "예·적금 금리를 시계열로 모아 한눈에 비교",
    cta: "금리 확인하기",
  },
};

// 나이가 있을 때 바꿔 끼우는 카피 (30대 이상은 돈 얘기가 더 잘 먹힌다)
const BY_AGE: Partial<Record<Relation, { minAge: number; copy: Copy }>> = {
  연인: {
    minAge: 30,
    copy: {
      siteId: "ratebox",
      title: "궁합은 확인했고, 결혼 자금은? 🏦",
      description: "예·적금 금리, 지금이 역대 어느 수준인지 보기",
      cta: "금리 확인하기",
    },
  },
  친구: {
    minAge: 30,
    copy: {
      siteId: "paybox",
      title: "친구 연봉 궁금해지는 나이 💸",
      description: "연봉별 실수령액을 금액별로 미리 계산해 뒀다",
      cta: "실수령액 보기",
    },
  },
};

// 관계 정보가 없는 정적 페이지용 카피. 키(문자열) 해시로 골고루 분배한다.
const GENERIC: Copy[] = [
  {
    siteId: "goldbox",
    title: "궁합 보다가 생각난 그 선물 🎁",
    description: "골드박스 오늘의 특가와 역대 최저가",
    cta: "오늘의 특가 보기",
  },
  {
    siteId: "paybox",
    title: "MBTI보다 궁금한 건 실수령액 💸",
    description: "연봉·월급별 실수령액, 퇴직금 미리 계산",
    cta: "실수령액 보기",
  },
  {
    siteId: "ratebox",
    title: "궁합 점수 말고 금리 점수는? 🏦",
    description: "예·적금 금리, 지금이 역대 어느 수준인지",
    cta: "금리 확인하기",
  },
];

function isRelation(v: string): v is Relation {
  return v in BY_RELATION;
}

function toPick(copy: Copy): FamilyPick {
  return {
    site: SITE_BY_ID[copy.siteId],
    title: copy.title,
    description: copy.description,
    cta: copy.cta,
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 문맥에 맞는 패밀리 사이트 하나를 고른다.
 * - relation 이 있으면 관계별 카피(나이 조건 충족 시 나이별 카피)
 * - 없으면 seed 해시로 GENERIC 중 하나
 */
export function pickFamily({
  relation,
  age,
  seed = "",
}: {
  relation?: string;
  age?: string | number;
  seed?: string;
}): FamilyPick {
  if (relation && isRelation(relation)) {
    const n = typeof age === "number" ? age : parseInt(String(age ?? ""), 10);
    const byAge = BY_AGE[relation];
    if (byAge && Number.isFinite(n) && n >= byAge.minAge) {
      return toPick(byAge.copy);
    }
    return toPick(BY_RELATION[relation]);
  }
  return toPick(GENERIC[hash(seed) % GENERIC.length]);
}

/** UTM 파라미터를 붙인 외부 링크 */
export function familyHref(
  site: FamilySite,
  campaign: string,
  content?: string,
): string {
  const u = new URL(site.url);
  u.searchParams.set("utm_source", "score.drawyourmind.com");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", campaign);
  if (content) u.searchParams.set("utm_content", content);
  return u.toString();
}
