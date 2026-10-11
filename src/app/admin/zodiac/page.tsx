import Link from "next/link";
import { verifyAdmin } from "@/lib/admin/auth";
import { getOutboundStats, getZodiacGiftClickStats } from "@/lib/admin/data";
import linksJson from "@/data/gift-links.json";
import {
  ZODIAC_IDS,
  allZodiacPairs,
  isZodiac,
  scoreZodiac,
  zodiacName,
  zodiacPairPath,
  zodiacTypePath,
} from "@/lib/zodiac";
import { getZodiacPair, getZodiacType } from "@/lib/zodiac-content";
import { ZODIAC_GIFT_IDS } from "@/lib/zodiac-gifts";
import { BarList, ColumnChart, Empty, Panel, Stat } from "../ui";

/**
 * 별자리 궁합 버티컬 운영 화면.
 * 정적 페이지라 조회수는 GA 몫이고, 여기서는 전환(골드박스·선물)과 콘텐츠·딥링크 준비 상태를 본다.
 * 파트너스 API 공용 장부는 /admin/tti 에 있다(계정 공용이라 한 곳에서만 본다).
 */

const links = linksJson as Record<string, string>;

function signLabel(z: string): string {
  return isZodiac(z) ? zodiacName(z) : z;
}

export default async function AdminZodiacPage() {
  if (!(await verifyAdmin())) return null;

  const [outbound, gifts] = await Promise.all([
    getOutboundStats({ vertical: "zodiac" }),
    getZodiacGiftClickStats(signLabel),
  ]);

  const pairs = allZodiacPairs();
  const missingTypes = ZODIAC_IDS.filter((z) => !getZodiacType(z));
  const missingPairs = pairs.filter(([a, b]) => !getZodiacPair(a, b));
  const scores = pairs.map(([a, b]) => scoreZodiac(a, b).score);
  const drift = pairs
    .map(([a, b]) => getZodiacPair(a, b))
    .filter((p) => p && p.relations.some((r) => Math.abs(r.score - p.score) > 8 || r.score > 96));
  const kindCount = new Map<string, number>();
  for (const [a, b] of pairs)
    for (const f of scoreZodiac(a, b).factors) {
      const label = f.name.replace(/ \(.*\)$/, "");
      kindCount.set(label, (kindCount.get(label) ?? 0) + 1);
    }
  const unlinked = ZODIAC_GIFT_IDS.filter((id) => !links[id]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">별자리 궁합</h1>

      <h2 className="mt-2 text-lg font-bold">골드박스투데이 전환</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        /zodiac/* 에서 나간 클릭 (UTM family_zodiac*, 운영자·봇 제외).
      </p>
      {outbound.error ? (
        <Notice>
          기록 테이블을 읽지 못했어 (20261011-outbound-clicks.sql). {outbound.error}
        </Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="누적" value={outbound.total.toLocaleString()} />
            <Stat label="오늘" value={outbound.today.toLocaleString()} sub="KST 기준" />
            <Stat label="최근 7일" value={outbound.last7.toLocaleString()} />
            <Stat label="그 전 7일" value={outbound.prev7.toLocaleString()} />
          </div>
          <Panel title="최근 14일 전환 추이" hint="KST">
            <ColumnChart data={outbound.daily} />
          </Panel>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="클릭 자리" hint="-cta = 본문 중간 · 없으면 하단 카드">
              {outbound.byCampaign.length ? <BarList items={outbound.byCampaign} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
            <Panel title="클릭이 난 페이지" hint="상위 10">
              {outbound.byPage.length ? <BarList items={outbound.byPage} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
          </div>
        </>
      )}

      <h2 className="mt-2 text-lg font-bold">별자리 선물 클릭</h2>
      {gifts.error ? (
        <Notice>기록 테이블을 읽지 못했어 (20261011-gift-clicks-zodiac.sql). {gifts.error}</Notice>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Stat label="누적" value={gifts.total.toLocaleString()} />
            <Stat label="최근 7일" value={gifts.last7.toLocaleString()} />
          </div>
          <Panel title="대상 별자리">
            {gifts.bySign.length ? <BarList items={gifts.bySign} /> : <Empty>아직 클릭이 없어</Empty>}
          </Panel>
          <Panel title="많이 눌린 선물" hint="상위 10">
            {gifts.byGift.length ? <BarList items={gifts.byGift} /> : <Empty>아직 클릭이 없어</Empty>}
          </Panel>
        </div>
      )}

      <Panel title="별자리 선물 딥링크 준비" hint={`${ZODIAC_GIFT_IDS.length - unlinked.length}/${ZODIAC_GIFT_IDS.length}`}>
        {unlinked.length === 0 ? (
          <p className="text-sm text-foreground/70">24종 모두 딥링크가 있어.</p>
        ) : (
          <p className="text-sm text-foreground/70">
            {unlinked.length}종이 딥링크가 없어 숨겨져 있어. 장부 여유는{" "}
            <Link href="/admin/tti" className="underline">
              띠·운세 탭
            </Link>
            에서 보고 <code className="rounded bg-black/5 px-1">npm run gift-links</code> 를 돌려.
            <span className="mt-1 block text-xs text-foreground/40">{unlinked.join(", ")}</span>
          </p>
        )}
      </Panel>

      <h2 className="mt-2 text-lg font-bold">콘텐츠</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="별자리 소개" value={`${ZODIAC_IDS.length - missingTypes.length}/${ZODIAC_IDS.length}`} />
        <Stat label="조합 본문" value={`${pairs.length - missingPairs.length}/${pairs.length}`} />
        <Stat label="점수 범위" value={`${Math.min(...scores)}~${Math.max(...scores)}`} />
        <Stat label="점수 어긋난 본문" value={drift.length} sub="관계 점수가 규칙 ±8 밖·96 초과" />
      </div>
      {(missingTypes.length > 0 || missingPairs.length > 0 || drift.length > 0) && (
        <Panel title="재작성 필요">
          <ul className="flex flex-col gap-1 text-sm">
            {missingTypes.map((z) => (
              <li key={z}>소개 없음 · {zodiacName(z)}</li>
            ))}
            {missingPairs.map(([a, b]) => (
              <li key={`${a}-${b}`}>조합 본문 없음 · {zodiacName(a)} × {zodiacName(b)}</li>
            ))}
            {drift.map((p) => (
              <li key={`${p!.a}-${p!.b}`}>
                점수 어긋남 ·{" "}
                <Link href={zodiacPairPath(p!.a, p!.b)} className="underline">
                  {zodiacName(p!.a)} × {zodiacName(p!.b)}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Panel title="점수 근거별 조합 수" hint="한 조합에 여러 개 걸릴 수 있음">
        <BarList
          items={[...kindCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => ({ key: label, label, count }))}
        />
      </Panel>

      <p className="text-center text-[11px] text-foreground/35">
        조회수는 GA 에서 본다 ·{" "}
        {ZODIAC_IDS.map((z, i) => (
          <span key={z}>
            {i > 0 && " "}
            <Link href={zodiacTypePath(z)} className="hover:text-primary">
              {zodiacName(z)}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">{children}</div>
  );
}
