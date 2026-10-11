"use client";

import Link from "next/link";
import { useState } from "react";
// zodiac.ts 는 규칙만 들고 있어 클라이언트에 실어도 가볍다 (본문 JSON 은 zodiac-content.ts)
import {
  zodiacInfo,
  zodiacName,
  zodiacOf,
  zodiacPairPath,
  zodiacTypePath,
  type Zodiac,
} from "@/lib/zodiac";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface Birthday {
  month: string;
  day: string;
}

function toZodiac(b: Birthday): Zodiac | undefined {
  if (!b.month || !b.day) return undefined;
  return zodiacOf(Number(b.month), Number(b.day));
}

/** 생일(월·일) → 별자리 계산기. 둘 다 고르면 궁합 상세로, 내 것만 고르면 순위로 보낸다 */
export default function ZodiacFinder({ initial }: { initial?: Zodiac }) {
  const [me, setMe] = useState<Birthday>({ month: "", day: "" });
  const [other, setOther] = useState<Birthday>({ month: "", day: "" });
  const mine = toZodiac(me) ?? initial;
  const theirs = toZodiac(other);

  return (
    <div className="flex flex-col gap-3">
      {!initial && <BirthdayInput label="나" value={me} onChange={setMe} />}
      <BirthdayInput label="상대" value={other} onChange={setOther} />
      {mine && theirs ? (
        <Link
          href={zodiacPairPath(mine, theirs)}
          className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          {zodiacInfo(mine).symbol} {zodiacName(mine)} × {zodiacName(theirs)}{" "}
          {zodiacInfo(theirs).symbol} 궁합 보기 →
        </Link>
      ) : !initial && mine ? (
        <Link
          href={zodiacTypePath(mine)}
          className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
        >
          {zodiacName(mine)}와 잘 맞는 별자리 순위 보기 →
        </Link>
      ) : (
        <p className="rounded-2xl bg-background py-3.5 text-center text-sm font-semibold text-foreground/40">
          {initial ? "상대의 생일을 골라줘" : "두 사람의 생일을 골라줘"}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-foreground/45">
        별자리 경계일은 해마다 하루 정도 달라질 수 있어. 경계일생이면 앞뒤 별자리도 같이 봐.
      </p>
    </div>
  );
}

function BirthdayInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Birthday;
  onChange: (b: Birthday) => void;
}) {
  const z = toZodiac(value);
  const days = value.month ? DAYS_IN[Number(value.month) - 1] : 31;
  const id = `zodiac-${label}`;
  return (
    <div className="rounded-2xl border-2 border-foreground/10 bg-background p-3">
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 text-sm font-extrabold">{label}</span>
        <label htmlFor={`${id}-m`} className="sr-only">
          {label} 생일 월
        </label>
        <select
          id={`${id}-m`}
          value={value.month}
          onChange={(e) => {
            const month = e.target.value;
            const max = month ? DAYS_IN[Number(month) - 1] : 31;
            onChange({ month, day: Number(value.day) > max ? "" : value.day });
          }}
          className="min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold"
        >
          <option value="">월</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
        <label htmlFor={`${id}-d`} className="sr-only">
          {label} 생일 일
        </label>
        <select
          id={`${id}-d`}
          value={value.day}
          onChange={(e) => onChange({ ...value, day: e.target.value })}
          className="min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold"
        >
          <option value="">일</option>
          {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}일
            </option>
          ))}
        </select>
      </div>
      {z && (
        <p className="mt-2 text-sm font-bold">
          <span aria-hidden>{zodiacInfo(z).symbol}</span> {zodiacName(z)}
          <span className="ml-1 text-xs font-semibold text-foreground/50">
            {zodiacInfo(z).element} 원소 · 지배성 {zodiacInfo(z).ruler}
          </span>
        </p>
      )}
    </div>
  );
}
