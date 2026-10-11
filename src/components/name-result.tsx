// 이름 궁합 결과 표시. 훅이 없어 계산기(클라이언트)와 공유 페이지(서버) 양쪽에서 쓴다.
import { nameMatch, nameMatchEmoji, nameMatchLabel, strokes } from "@/lib/name-match";

export function NamePyramid({ first, second }: { first: string; second: string }) {
  const r = nameMatch(first, second);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        {r.letters.map((c, i) => (
          <span
            key={i}
            className={`flex w-8 flex-col items-center rounded-lg py-1 text-sm font-extrabold ${
              i % 2 === 0 ? "bg-primary/15 text-primary" : "bg-foreground/5"
            }`}
          >
            {c}
            <span className="text-[10px] font-semibold text-foreground/45">{strokes(c)}획</span>
          </span>
        ))}
      </div>
      {r.rows.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((v, j) => (
            <span
              key={j}
              className={`w-8 text-center text-sm tabular-nums ${
                i === r.rows.length - 1 ? "font-extrabold text-primary" : "text-foreground/60"
              }`}
            >
              {v}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function NameScore({ from, to }: { from: string; to: string }) {
  const { score } = nameMatch(from, to);
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-xs font-bold text-foreground/50">
        {from} → {to}
      </span>
      <span className="text-5xl font-extrabold leading-none text-primary">
        {score}
        <span className="text-xl">%</span>
      </span>
      <span className="text-sm font-bold">
        {nameMatchEmoji(score)} {nameMatchLabel(score)}
      </span>
    </div>
  );
}

/** 두 방향 결과 + 계산 과정 */
export function NameResult({ me, other }: { me: string; other: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <NameScore from={me} to={other} />
        <NameScore from={other} to={me} />
      </div>
      <details className="rounded-2xl bg-background p-3">
        <summary className="cursor-pointer text-sm font-bold">계산 과정 보기</summary>
        <div className="mt-3 flex flex-col gap-4 overflow-x-auto">
          <div>
            <p className="mb-2 text-center text-xs font-bold text-foreground/50">
              {me} → {other}
            </p>
            <NamePyramid first={me} second={other} />
          </div>
          <div>
            <p className="mb-2 text-center text-xs font-bold text-foreground/50">
              {other} → {me}
            </p>
            <NamePyramid first={other} second={me} />
          </div>
        </div>
      </details>
    </div>
  );
}
