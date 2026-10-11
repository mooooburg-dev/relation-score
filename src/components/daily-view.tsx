import Link from "next/link";
import { BigScore, Card, ScoreBar, SectionTitle } from "@/components/seo";
import { TtiFactors } from "@/components/tti";
import {
  BAND_LABEL,
  DAILY_FIELDS,
  band,
  dailyEmoji,
  type DailyScore,
} from "@/lib/daily";
import type { DailyText } from "@/lib/daily-content";

const FIELD_EMOJI = { 연애: "💕", 재물: "💰", 일: "💼", 인간관계: "🤝" } as const;

/** 오늘의 운세 본문 (띠·별자리 공용) */
export function DailyView({
  score,
  text,
  basisTitle,
  basisNote,
  tomorrow,
}: {
  score: DailyScore;
  text: DailyText;
  basisTitle: string;
  basisNote: React.ReactNode;
  /** 내일 미리보기 점수 — 내일 다시 올 이유를 만든다 */
  tomorrow: number;
}) {
  return (
    <>
      <Card className="flex flex-col items-center gap-4">
        <BigScore score={score.score} emoji={dailyEmoji(score.score)} caption={BAND_LABEL[band(score.score)]} />
        <p className="text-center text-sm leading-relaxed text-foreground/80">{text.total}</p>
        <div className="grid w-full grid-cols-2 gap-2 text-center text-xs">
          <span className="rounded-xl bg-background py-2">
            <span className="block text-foreground/45">행운의 색</span>
            <span className="font-bold">{score.luckyColor}</span>
          </span>
          <span className="rounded-xl bg-background py-2">
            <span className="block text-foreground/45">행운의 숫자</span>
            <span className="font-bold">{score.luckyNumber}</span>
          </span>
        </div>
      </Card>

      <Card>
        <SectionTitle>분야별 오늘의 운세</SectionTitle>
        <div className="flex flex-col gap-3">
          {DAILY_FIELDS.map((f) => (
            <ScoreBar key={f} label={f} score={score.fields[f]} emoji={FIELD_EMOJI[f]} />
          ))}
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {DAILY_FIELDS.map((f) => (
            <li key={f} className="text-sm leading-relaxed">
              <span className="font-bold">
                {FIELD_EMOJI[f]} {f}
              </span>
              <span className="ml-1 text-foreground/75">{text.fields[f]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-primary/5 px-3 py-2 text-sm leading-relaxed">
          <span className="font-bold text-primary">오늘의 TIP </span>
          {text.tip}
        </p>
      </Card>

      <TtiFactors title={basisTitle} factors={score.factors.map((f, i) => ({ kind: String(i), ...f }))} score={score.score} footnote={basisNote} />

      <Card className="text-center">
        <p className="text-sm font-bold">
          내일은 {tomorrow}점 {dailyEmoji(tomorrow)} · {BAND_LABEL[band(tomorrow)]}
        </p>
        <p className="mt-1 text-xs text-foreground/50">
          자세한 내일 운세는 자정이 지나면 열려. 내일 또 확인하러 와!
        </p>
        <Link href="/today" className="mt-3 inline-block text-xs font-bold text-primary underline">
          생일 저장하고 매일 내 운세 받기 →
        </Link>
      </Card>
    </>
  );
}
