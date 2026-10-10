"use client";

import Link from "next/link";
import { useState } from "react";
// tti.ts 는 규칙만 들고 있어 클라이언트에 실어도 가볍다 (본문 JSON 은 tti-content.ts)
import {
  ttiInfo,
  ttiName,
  ttiOf,
  ttiPairPath,
  ttiTypePath,
  yearInfo,
  YEAR_MIN,
  type Tti,
} from "@/lib/tti";

/**
 * 출생연도 → 띠 계산기.
 *
 * 띠가 바뀌는 시점은 명리 기준 입춘(2월 4일 전후), 민속 기준 설날이다. 연도만으로는
 * 1~2월생을 가를 수 없어서 "설·입춘 전 출생" 체크로 전년도 띠를 고르게 한다.
 *
 * maxYear 는 서버(빌드)에서 받는다 — 브라우저 시계로 만들면 해가 바뀌는 순간
 * 서버 HTML 과 옵션 개수가 달라져 hydration 이 깨진다.
 */
export default function TtiFinder({ maxYear, initial }: { maxYear: number; initial?: Tti }) {
  const [me, setMe] = useState<Person>({ year: "", early: false });
  const [other, setOther] = useState<Person>({ year: "", early: false });

  const years: number[] = [];
  for (let y = maxYear; y >= YEAR_MIN; y--) years.push(y);

  const myTti = toTti(me) ?? (me.year === "" ? initial : undefined);
  const otherTti = toTti(other);

  return (
    <div className="flex flex-col gap-3">
      <PersonInput label="나" value={me} onChange={setMe} years={years} />
      <PersonInput label="상대" value={other} onChange={setOther} years={years} />
      <p className="text-[11px] leading-relaxed text-foreground/45">
        1~2월생은 설날(민속)이나 입춘(명리) 전에 태어났다면 전년도 띠야. 헷갈리면 체크해 봐.
      </p>
      {myTti && otherTti ? (
        <Link
          href={ttiPairPath(myTti, otherTti)}
          className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          {ttiInfo(myTti).emoji} {ttiName(myTti)} × {ttiName(otherTti)} {ttiInfo(otherTti).emoji}{" "}
          궁합 보기 →
        </Link>
      ) : myTti && toTti(me) ? (
        <Link
          href={ttiTypePath(myTti)}
          className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
        >
          {ttiName(myTti)}와 잘 맞는 띠 순위 보기 →
        </Link>
      ) : (
        <p className="rounded-2xl bg-background py-3.5 text-center text-sm font-semibold text-foreground/40">
          {initial ? "상대의 출생연도를 골라줘" : "두 사람의 출생연도를 골라줘"}
        </p>
      )}
    </div>
  );
}

interface Person {
  year: string;
  early: boolean;
}

function toTti(p: Person): Tti | undefined {
  if (!p.year) return undefined;
  const y = Number(p.year);
  return ttiOf(p.early ? y - 1 : y);
}

function PersonInput({
  label,
  value,
  onChange,
  years,
}: {
  label: string;
  value: Person;
  onChange: (p: Person) => void;
  years: number[];
}) {
  const t = toTti(value);
  const y = Number(value.year);
  const info = t ? yearInfo(value.early ? y - 1 : y) : null;
  const id = `tti-year-${label}`;

  return (
    <div className="rounded-2xl border-2 border-foreground/10 bg-background p-3">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="w-8 shrink-0 text-sm font-extrabold">
          {label}
        </label>
        <select
          id={id}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value })}
          className="min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold"
        >
          <option value="">출생연도</option>
          {years.map((yy) => (
            <option key={yy} value={yy}>
              {yy}년생
            </option>
          ))}
        </select>
        <label className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-foreground/60">
          <input
            type="checkbox"
            checked={value.early}
            onChange={(e) => onChange({ ...value, early: e.target.checked })}
            className="accent-primary"
          />
          설·입춘 전
        </label>
      </div>
      {t && info && (
        <p className="mt-2 text-sm font-bold">
          <span aria-hidden>{ttiInfo(t).emoji}</span> {ttiName(t)}
          <span className="ml-1 text-xs font-semibold text-foreground/50">
            {info.ganji} · {info.color}
          </span>
        </p>
      )}
    </div>
  );
}
