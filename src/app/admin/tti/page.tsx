import Link from "next/link";
import { verifyAdmin } from "@/lib/admin/auth";
import {
  getCoupangLedger,
  getOutboundStats,
  getTtiGiftClickStats,
} from "@/lib/admin/data";
import linksJson from "@/data/gift-links.json";
import {
  TTI_IDS,
  allTtiPairs,
  isTti,
  scoreTti,
  ttiName,
  ttiPairPath,
  ttiTypePath,
  type TtiRelationKind,
} from "@/lib/tti";
import { getTtiPair, getTtiType } from "@/lib/tti-content";
import { TTI_GIFT_IDS } from "@/lib/tti-gifts";
import { FORTUNE_YEARS, fortunePath, fortuneScore } from "@/lib/fortune";
import { getFortune } from "@/lib/fortune-content";
import { BarList, ColumnChart, Empty, Panel, Stat, formatDateTime } from "../ui";

/**
 * 띠 궁합 버티컬 운영 화면.
 *
 * 띠 페이지는 전부 정적 생성이라 서버에 남는 사용 기록이 없다 (조회수는 GA 몫).
 * 그래서 여기서는 이 버티컬의 목적 — 골드박스투데이 전환·선물 클릭 — 과
 * 콘텐츠·딥링크가 빠짐없이 준비됐는지를 본다.
 */

const links = linksJson as Record<string, string>;

const KIND_LABEL: Record<TtiRelationKind, string> = {
  yukhap: "육합",
  samhap: "삼합",
  same: "같은 띠",
  chung: "충",
  wonjin: "원진",
  hyeong: "형",
  hae: "해",
  jahyeong: "자형",
  saengsaeng: "오행 상생",
  bihwa: "오행 비화",
  sanggeuk: "오행 상극",
  neutral: "관계 없음",
};

const WINDOW_LABEL: Record<number, string> = { 60: "분당", 3600: "시간당", 86400: "일간" };

function ttiLabel(t: string): string {
  return isTti(t) ? ttiName(t) : t;
}

export default async function AdminTtiPage() {
  if (!(await verifyAdmin())) return null;

  const [outbound, fortuneOutbound, gifts, ledger] = await Promise.all([
    getOutboundStats({ vertical: "tti" }),
    getOutboundStats({ vertical: "fortune" }),
    getTtiGiftClickStats(ttiLabel),
    getCoupangLedger(),
  ]);

  // ---- 신년운세 콘텐츠 ----
  const fortuneStatus = FORTUNE_YEARS.map((year) => {
    const missing = TTI_IDS.filter((t) => !getFortune(year, t));
    // 분야별 점수가 총운 ±8 을 벗어났거나 96 을 넘은 본문
    const drift = TTI_IDS.map((t) => getFortune(year, t)).filter(
      (f) => f && f.fields.some((x) => Math.abs(x.score - f.score) > 8 || x.score > 96),
    );
    const scores = TTI_IDS.map((t) => fortuneScore(year, t).score);
    return { year, missing, drift, min: Math.min(...scores), max: Math.max(...scores) };
  });

  // ---- 콘텐츠 현황 (빌드에 들어간 정적 데이터 기준) ----
  const pairs = allTtiPairs();
  const missingTypes = TTI_IDS.filter((t) => !getTtiType(t));
  const missingPairs = pairs.filter(([a, b]) => !getTtiPair(a, b));
  const scores = pairs.map(([a, b]) => scoreTti(a, b).score);
  const buckets = [
    { label: "88+ 천생연분", min: 88 },
    { label: "80~87 잘 맞음", min: 80 },
    { label: "70~79 무난", min: 70 },
    { label: "60~69 맞춰감", min: 60 },
    { label: "50~59 조심", min: 50 },
    { label: "~49 부딪힘", min: 0 },
  ].map((b, i, all) => ({
    key: b.label,
    label: b.label,
    count: scores.filter((s) => s >= b.min && (i === 0 || s < all[i - 1].min)).length,
  }));
  const kindCount = new Map<string, number>();
  for (const [a, b] of pairs)
    for (const f of scoreTti(a, b).factors)
      kindCount.set(KIND_LABEL[f.kind], (kindCount.get(KIND_LABEL[f.kind]) ?? 0) + 1);

  // 관계별 점수가 규칙 점수 ±8 을 벗어났거나 상한(96)을 넘은 본문 (재생성 대상)
  const drift = pairs
    .map(([a, b]) => getTtiPair(a, b))
    .filter((p) => p && p.relations.some((r) => Math.abs(r.score - p.score) > 8 || r.score > 96));

  // ---- 딥링크 준비 상태 ----
  const linked = TTI_GIFT_IDS.filter((id) => links[id]);
  const unlinked = TTI_GIFT_IDS.filter((id) => !links[id]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">띠 궁합 · 신년운세</h1>

      <h2 className="mt-2 text-lg font-bold">골드박스투데이 전환</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        /tti/* 에서 패밀리 사이트로 나간 클릭 (/go/out 기록, 운영자·봇 제외). UTM 은
        family_tti-* 로 붙어 나가므로 골드박스 GA 에서도 같은 값으로 볼 수 있어.
      </p>
      {outbound.error ? (
        <MigrationNotice file="20261011-outbound-clicks.sql" error={outbound.error} />
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
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="목적지">
              {outbound.bySite.length ? <BarList items={outbound.bySite} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
            <Panel title="클릭 자리" hint="-cta = 본문 중간 · 없으면 하단 카드">
              {outbound.byCampaign.length ? <BarList items={outbound.byCampaign} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
            <Panel title="클릭이 난 페이지" hint="상위 10">
              {outbound.byPage.length ? <BarList items={outbound.byPage} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
          </div>
        </>
      )}

      <h2 className="mt-2 text-lg font-bold">신년운세 → 골드박스 전환</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        /fortune/* 에서 나간 클릭 (UTM family_fortune*). 시즌(11~1월)에 몰린다.
      </p>
      {fortuneOutbound.error ? (
        <MigrationNotice file="20261011-outbound-clicks.sql" error={fortuneOutbound.error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Stat label="누적" value={fortuneOutbound.total.toLocaleString()} />
            <Stat label="최근 7일" value={fortuneOutbound.last7.toLocaleString()} />
          </div>
          <Panel title="클릭 자리" hint="-cta = 본문 중간">
            {fortuneOutbound.byCampaign.length ? (
              <BarList items={fortuneOutbound.byCampaign} />
            ) : (
              <Empty>아직 클릭이 없어</Empty>
            )}
          </Panel>
          <Panel title="클릭이 난 페이지" hint="상위 10">
            {fortuneOutbound.byPage.length ? (
              <BarList items={fortuneOutbound.byPage} />
            ) : (
              <Empty>아직 클릭이 없어</Empty>
            )}
          </Panel>
        </div>
      )}

      <h2 className="mt-2 text-lg font-bold">띠 선물 클릭</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        쿠팡으로 넘어간 띠 선물 클릭 (gift_clicks.entry = tti | fortune). subId 는 사이트 공통 scoregift.
      </p>
      {gifts.error ? (
        <MigrationNotice file="20261011-gift-clicks-tti.sql" error={gifts.error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="누적" value={gifts.total.toLocaleString()} />
              <Stat label="최근 7일" value={gifts.last7.toLocaleString()} />
            </div>
            <Panel title="출처">
              {gifts.byEntry.length ? <BarList items={gifts.byEntry} /> : <Empty>아직 클릭이 없어</Empty>}
            </Panel>
          </div>
          <Panel title="대상 띠">
            {gifts.byTti.length ? <BarList items={gifts.byTti} /> : <Empty>아직 클릭이 없어</Empty>}
          </Panel>
          <Panel title="많이 눌린 선물" hint="상위 10">
            {gifts.byGift.length ? <BarList items={gifts.byGift} /> : <Empty>아직 클릭이 없어</Empty>}
          </Panel>
        </div>
      )}

      <h2 className="mt-2 text-lg font-bold">쿠팡 딥링크</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="띠 선물 딥링크 준비"
          hint={`${linked.length}/${TTI_GIFT_IDS.length}`}
        >
          {unlinked.length === 0 ? (
            <p className="text-sm text-foreground/70">24종 모두 딥링크가 있어. 버튼이 전부 노출돼.</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-foreground/70">
                {unlinked.length}종이 아직 딥링크가 없어 화면에서 숨겨져 있어. 아래 장부 여유를
                확인한 뒤 <code className="rounded bg-black/5 px-1">npm run gift-links -- --dry</code>{" "}
                → <code className="rounded bg-black/5 px-1">npm run gift-links</code> 순서로 돌려.
                (필요 호출 {Math.ceil(unlinked.length / 20)}콜, 20개씩 묶음)
              </p>
              <p className="text-xs text-foreground/40">{unlinked.join(", ")}</p>
            </div>
          )}
        </Panel>
        <Panel title="파트너스 API 공용 장부" hint="계정 전체 · 읽기 전용">
          {ledger.error ? (
            <p className="text-sm text-foreground/60">장부를 읽지 못했어: {ledger.error}</p>
          ) : ledger.buckets.length === 0 ? (
            <Empty>정책 행이 없어 (20260925-cp-api-policy-score.sql 적용 필요)</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-foreground/40">
                  <th className="pb-1 font-normal">버킷</th>
                  <th className="pb-1 font-normal">창</th>
                  <th className="pb-1 text-right font-normal">사용 / 한도</th>
                </tr>
              </thead>
              <tbody>
                {ledger.buckets.map((b) => {
                  const ratio = b.used / Math.max(1, b.max);
                  return (
                    <tr key={b.key} className="border-t border-black/5" title={b.note ?? undefined}>
                      <td className="py-1.5 font-mono text-xs">
                        {b.scope}:{b.bucket}
                      </td>
                      <td className="py-1.5 text-xs text-foreground/60">
                        {WINDOW_LABEL[b.windowSeconds] ?? `${b.windowSeconds}s`}
                      </td>
                      <td
                        className={`py-1.5 text-right tabular-nums ${
                          ratio >= 0.8 ? "font-bold text-red-500" : ratio >= 0.5 ? "text-amber-600" : ""
                        }`}
                      >
                        {b.used} / {b.max}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <h2 className="mt-2 text-lg font-bold">신년운세 콘텐츠</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fortuneStatus.map((f) => (
          <Stat
            key={f.year}
            label={`${f.year} 띠별 운세`}
            value={`${TTI_IDS.length - f.missing.length}/${TTI_IDS.length}`}
            sub={`총운 ${f.min}~${f.max}점 · 점수 어긋남 ${f.drift.length}`}
          />
        ))}
      </div>
      {fortuneStatus.some((f) => f.missing.length || f.drift.length) && (
        <Panel title="신년운세 재작성 필요">
          <ul className="flex flex-col gap-1 text-sm">
            {fortuneStatus.flatMap((f) => [
              ...f.missing.map((t) => (
                <li key={`${f.year}-${t}-m`}>
                  {f.year} {ttiName(t)} 본문 없음 (페이지가 생성되지 않음)
                </li>
              )),
              ...f.drift.map((x) => (
                <li key={`${f.year}-${x!.tti}-d`}>
                  <Link href={fortunePath(f.year, x!.tti)} className="underline">
                    {f.year} {ttiName(x!.tti)}
                  </Link>{" "}
                  분야 점수 어긋남 (총운 {x!.score}, 분야 {x!.fields.map((y) => y.score).join("/")})
                </li>
              )),
            ])}
          </ul>
        </Panel>
      )}

      <h2 className="mt-2 text-lg font-bold">띠 궁합 콘텐츠</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="띠 소개" value={`${TTI_IDS.length - missingTypes.length}/${TTI_IDS.length}`} />
        <Stat label="조합 본문" value={`${pairs.length - missingPairs.length}/${pairs.length}`} />
        <Stat
          label="점수 범위"
          value={`${Math.min(...scores)}~${Math.max(...scores)}`}
          sub={`평균 ${Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)}`}
        />
        <Stat
          label="점수 어긋난 본문"
          value={drift.length}
          sub="관계 점수가 규칙 ±8 밖·96 초과"
        />
      </div>
      {(missingTypes.length > 0 || missingPairs.length > 0 || drift.length > 0) && (
        <Panel title="재생성 필요" hint="npm run tti-content">
          <ul className="flex flex-col gap-1 text-sm">
            {missingTypes.map((t) => (
              <li key={t}>띠 소개 없음 · {ttiName(t)}</li>
            ))}
            {missingPairs.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                조합 본문 없음 · {ttiName(a)} × {ttiName(b)} (페이지가 생성되지 않음)
              </li>
            ))}
            {drift.map((p) => (
              <li key={`${p!.a}-${p!.b}`}>
                점수 어긋남 ·{" "}
                <Link href={ttiPairPath(p!.a, p!.b)} className="underline">
                  {ttiName(p!.a)} × {ttiName(p!.b)}
                </Link>{" "}
                (규칙 {p!.score}점, 관계 {p!.relations.map((r) => r.score).join("/")})
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="점수 분포" hint="78개 조합 · 규칙 점수">
          <BarList items={buckets} />
        </Panel>
        <Panel title="점수 근거별 조합 수" hint="한 조합에 여러 개 걸릴 수 있음">
          <BarList
            items={[...kindCount.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => ({ key: label, label, count }))}
          />
        </Panel>
      </div>

      {!outbound.error && outbound.recent.length > 0 && (
        <Panel title="최근 전환 클릭" hint="최대 20건">
          <ul className="flex flex-col divide-y divide-foreground/5">
            {outbound.recent.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-32 shrink-0 text-xs text-foreground/50">
                  {formatDateTime(c.created_at)}
                </span>
                <span className="w-20 shrink-0 font-bold">{c.site}</span>
                <span className="min-w-0 flex-1 truncate">{c.source_path ?? "-"}</span>
                <span className="shrink-0 text-xs text-foreground/50">{c.campaign ?? "-"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-center text-[11px] text-foreground/35">
        띠 페이지 조회수는 서버에 남지 않아 GA 에서 본다 ·{" "}
        <Link href="/tti" className="hover:text-primary">
          /tti 열기 →
        </Link>{" "}
        ·{" "}
        {TTI_IDS.map((t, i) => (
          <span key={t}>
            {i > 0 && " "}
            <Link href={ttiTypePath(t)} className="hover:text-primary">
              {ttiName(t)}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

function MigrationNotice({ file, error }: { file: string; error: string }) {
  return (
    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      기록 테이블을 읽지 못했어. <code className="font-mono">supabase/migrations/{file}</code> 를
      적용했는지 확인해.
      <span className="mt-1 block text-xs text-amber-900/60">{error}</span>
    </div>
  );
}
