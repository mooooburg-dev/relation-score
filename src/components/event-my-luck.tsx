"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BAND_LABEL, band, dailyEmoji, ttiDaily, zodiacDaily, type Ymd } from "@/lib/daily";
import { TTI_LIST } from "@/lib/tti-rules";
import { ZODIAC_LIST } from "@/lib/zodiac-rules";
import { getProfile, profileTti, profileZodiac, type Profile } from "@/lib/visitor";

/** 저장한 생일로 "그날 내 연애운"을 보여준다. 생일이 없으면 /today 에서 저장하도록 안내 */
export default function EventMyLuck({ date, name }: { date: Ymd; name: string }) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage 는 마운트 후에만 읽는다
    setProfile(getProfile());
  }, []);

  if (profile === undefined) return null;
  if (!profile) {
    return (
      <Link href="/today" className="block rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-primary">
        🎯 생일을 저장하면 {name} 내 연애운을 바로 볼 수 있어 →
      </Link>
    );
  }
  const t = profileTti(profile);
  const z = profileZodiac(profile);
  const tl = ttiDaily(t, date).fields["연애"];
  const zl = zodiacDaily(z, date).fields["연애"];
  const ti = TTI_LIST.find((x) => x.id === t)!;
  const zi = ZODIAC_LIST.find((x) => x.id === z)!;
  return (
    <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5">
      <h2 className="text-base font-extrabold">{name} 내 연애운</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        {[
          { label: `${ti.emoji} ${ti.ko}띠`, v: tl },
          { label: `${zi.symbol} ${zi.ko}`, v: zl },
        ].map((x) => (
          <div key={x.label} className="rounded-2xl bg-white/80 p-3">
            <span className="block text-xs font-bold text-foreground/50">{x.label}</span>
            <span className="block text-3xl font-extrabold text-primary">{x.v}</span>
            <span className="text-xs font-bold">
              {dailyEmoji(x.v)} {BAND_LABEL[band(x.v)]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
