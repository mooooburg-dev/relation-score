// 패밀리 사이트 크로스링크 UI. 훅을 쓰지 않아 서버/클라이언트 어디서나 렌더 가능.
import {
  FAMILY_SITES,
  familyHref,
  pickFamily,
  type FamilyPick,
} from "@/lib/family";

/**
 * 문맥형 카드: 화면당 한 장만 노출한다.
 * relation/age 가 있으면 관계별 카피, 없으면 seed 로 분배.
 * campaign 은 GA 구분용 (result / shared / pair / type 등).
 */
export function FamilyCard({
  relation,
  age,
  seed,
  campaign,
  className = "",
}: {
  relation?: string;
  age?: string | number;
  seed?: string;
  campaign: string;
  className?: string;
}) {
  const pick: FamilyPick = pickFamily({ relation, age, seed });
  const href = familyHref(pick.site, `family_${campaign}`, relation || seed);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`group flex items-center gap-3 rounded-3xl border-2 border-dashed border-primary/25 bg-primary/5 p-4 transition hover:border-primary/60 active:scale-[0.99] ${className}`}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {pick.site.emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-foreground/40">
          만든 사람의 다른 서비스 · {pick.site.name}
        </span>
        <span className="text-sm font-extrabold leading-snug">{pick.title}</span>
        <span className="text-xs leading-relaxed text-foreground/60">
          {pick.description}
        </span>
        <span className="mt-0.5 text-xs font-bold text-primary group-hover:underline">
          {pick.cta} →
        </span>
      </span>
    </a>
  );
}

/** 푸터용 전체 목록 */
export function FamilyLinks() {
  return (
    <nav aria-label="만든 사람의 다른 서비스" className="mb-4">
      <p className="mb-2 font-bold text-foreground/60">만든 사람의 다른 서비스</p>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {FAMILY_SITES.map((s) => (
          <li key={s.id}>
            <a
              href={familyHref(s, "family_footer")}
              target="_blank"
              rel="noopener"
              title={s.tagline}
              className="hover:text-primary"
            >
              {s.emoji} {s.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
