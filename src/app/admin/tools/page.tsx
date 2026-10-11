import Link from "next/link";
import { verifyAdmin } from "@/lib/admin/auth";
import { getOutboundStats, getToolViewStats } from "@/lib/admin/data";
import { BarList, ColumnChart, Empty, Panel, Stat } from "../ui";

/**
 * 입력형 도구(이름·생일 궁합) 운영 화면.
 * 계산은 브라우저에서 끝나 입력값·사용 횟수가 서버에 남지 않는다 (사용량은 GA 몫).
 * 여기서는 공유 결과가 열린 횟수(바이럴)와 골드박스 전환을 본다.
 */
export default async function AdminToolsPage() {
  if (!(await verifyAdmin())) return null;

  const [views, nameOut, birthdayOut] = await Promise.all([
    getToolViewStats(),
    getOutboundStats({ vertical: "name" }),
    getOutboundStats({ vertical: "birthday" }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">이름·생일 궁합</h1>

      <h2 className="mt-2 text-lg font-bold">공유 결과 조회</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        /name/r · /birthday/r 링크가 열린 횟수 (운영자·봇 제외). 이름·생일은 저장하지 않는다.
      </p>
      {views.error ? (
        <Notice>기록 테이블을 읽지 못했어 (20261011-tool-views.sql). {views.error}</Notice>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="누적" value={views.total.toLocaleString()} />
            <Stat label="최근 7일" value={views.last7.toLocaleString()} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="최근 14일" hint="KST">
              <ColumnChart data={views.daily} />
            </Panel>
            <Panel title="도구별">
              {views.byTool.length ? <BarList items={views.byTool} /> : <Empty>아직 공유 조회가 없어</Empty>}
            </Panel>
          </div>
        </>
      )}

      <h2 className="mt-2 text-lg font-bold">골드박스투데이 전환</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "💘 이름 궁합", s: nameOut },
          { title: "🎂 생일 궁합", s: birthdayOut },
        ].map(({ title, s }) => (
          <Panel key={title} title={title} hint={s.error ? "" : `누적 ${s.total} · 7일 ${s.last7}`}>
            {s.error ? (
              <p className="text-sm text-foreground/60">기록 테이블을 읽지 못했어: {s.error}</p>
            ) : s.byCampaign.length ? (
              <BarList items={s.byCampaign} />
            ) : (
              <Empty>아직 클릭이 없어</Empty>
            )}
          </Panel>
        ))}
      </div>

      <p className="text-center text-[11px] text-foreground/35">
        <Link href="/name" className="hover:text-primary">/name 열기</Link> ·{" "}
        <Link href="/birthday" className="hover:text-primary">/birthday 열기</Link>
      </p>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">{children}</div>;
}
