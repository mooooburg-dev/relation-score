import Link from "next/link";
import { getDashboardStats, getRecentAnalyses } from "@/lib/admin/data";
import { verifyAdmin } from "@/lib/admin/auth";
import { RELATIONS, ko, isMbti } from "@/lib/mbti";
import {
  BarList,
  ColumnChart,
  Empty,
  Panel,
  ScorePill,
  Stat,
  formatDateTime,
} from "./ui";

const RELATION_EMOJI = new Map<string, string>(
  RELATIONS.map((r) => [r.value as string, r.emoji as string]),
);

function delta(now: number, before: number): string {
  if (before === 0) return now === 0 ? "지난주와 같음" : `지난주 0건 → +${now}`;
  const diff = now - before;
  const pct = Math.round((diff / before) * 100);
  if (diff === 0) return "지난주와 같음";
  return `지난주 대비 ${diff > 0 ? "+" : ""}${diff}건 (${pct > 0 ? "+" : ""}${pct}%)`;
}

export default async function AdminDashboard() {
  // layout이 로그인 폼을 대신 렌더한다. page는 layout과 병렬로 렌더될 수 있어
  // 여기서 한 번 더 끊어줘야 데이터 계층이 throw 하지 않는다.
  if (!(await verifyAdmin())) return null;

  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getRecentAnalyses(6),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">대시보드</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="누적 분석" value={stats.total.toLocaleString()} />
        <Stat label="오늘" value={stats.today.toLocaleString()} sub="KST 기준" />
        <Stat
          label="최근 7일"
          value={stats.last7.toLocaleString()}
          sub={delta(stats.last7, stats.prev7)}
        />
        <Stat label="평균 점수" value={stats.avgScore} sub="총점 기준" />
        <Stat
          label="공유 결과 조회"
          value={stats.totalViews.toLocaleString()}
          sub="/r/[id] 누적"
        />
      </div>

      <Panel title="최근 14일 분석 추이" hint="KST · 막대 위 숫자는 건수">
        <ColumnChart data={stats.daily} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="관계 유형별" hint="건수 / 평균 점수">
          <BarList
            items={stats.byRelation.map((r) => ({
              key: r.relation,
              label: `${RELATION_EMOJI.get(r.relation) ?? ""} ${r.relation}`,
              count: r.count,
              note: r.count > 0 ? `평균 ${r.avgScore}` : "",
            }))}
          />
        </Panel>

        <Panel title="점수 분포" hint="AI가 매긴 총점 구간">
          <BarList
            items={stats.scoreBuckets.map((b) => ({
              key: b.label,
              label: `${b.label}점`,
              count: b.count,
              note:
                stats.total > 0
                  ? `${Math.round((b.count / stats.total) * 100)}%`
                  : "",
            }))}
          />
        </Panel>

        <Panel title="많이 입력된 MBTI" hint="나·상대 합산 TOP 10">
          <BarList
            items={stats.topMbti.map((m) => ({
              key: m.mbti,
              label: isMbti(m.mbti) ? `${m.mbti} ${ko(m.mbti)}` : m.mbti,
              count: m.count,
            }))}
          />
        </Panel>

        <Panel title="많이 나온 조합" hint="방향 무시 · TOP 10">
          <BarList
            items={stats.topPairs.map((p) => ({
              key: p.pair,
              label: p.pair,
              count: p.count,
              note: `평균 ${p.avgScore}`,
            }))}
          />
        </Panel>
      </div>

      <Panel
        title="최근 분석"
        hint={
          <Link href="/admin/analyses" className="hover:text-primary">
            전체 보기 →
          </Link>
        }
      >
        {recent.length === 0 ? (
          <Empty>아직 분석 기록이 없어</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5">
            {recent.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2 text-xs">
                <ScorePill score={row.score} />
                <span className="font-medium">
                  {row.inputs?.myMbti} × {row.inputs?.otherMbti}
                </span>
                <span className="text-foreground/50">
                  {RELATION_EMOJI.get(row.relation) ?? ""} {row.relation}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground/40">
                  {row.result?.tag}
                </span>
                <span className="shrink-0 tabular-nums text-foreground/35">
                  {formatDateTime(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="text-center text-[11px] text-foreground/35">
        모델: {stats.models.map((m) => `${m.model} ${m.count}건`).join(" · ") || "–"}
        {stats.truncated && " · 통계는 최근 20,000건 기준"}
      </p>
    </div>
  );
}
