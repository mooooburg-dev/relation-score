"use client";

import { useState } from "react";
import { NAME_MAX, isValidName, nameMatch, nameSharePath } from "@/lib/name-match";
import { addHistory } from "@/lib/visitor";
import { NameResult } from "@/components/name-result";
import ShareButton from "@/components/share-button";

/** 이름 궁합 계산기. 계산은 전부 브라우저에서 — 이름은 서버로 가지 않는다 */
export default function NameMatchApp() {
  const [me, setMe] = useState("");
  const [other, setOther] = useState("");
  const [shown, setShown] = useState<[string, string] | null>(null);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = me.trim();
    const b = other.trim();
    if (!isValidName(a) || !isValidName(b)) {
      setError(`이름은 한글로 1~${NAME_MAX}글자까지 넣어줘 (성까지 넣으면 더 정확해)`);
      setShown(null);
      return;
    }
    setError("");
    setShown([a, b]);
    addHistory({
      kind: "name",
      label: `${a} ♥ ${b} ${nameMatch(a, b).score}%`,
      path: nameSharePath(a, b),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs font-bold text-foreground/60">
            내 이름
            <input
              value={me}
              onChange={(e) => setMe(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="김철수"
              autoComplete="off"
              className="rounded-xl border-2 border-foreground/10 bg-white px-3 py-2.5 text-base font-bold text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-foreground/60">
            상대 이름
            <input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              maxLength={NAME_MAX}
              placeholder="이영희"
              autoComplete="off"
              className="rounded-xl border-2 border-foreground/10 bg-white px-3 py-2.5 text-base font-bold text-foreground"
            />
          </label>
        </div>
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          이름 궁합 보기 💘
        </button>
      </form>

      {shown && (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-primary/20 bg-white p-4">
          <NameResult me={shown[0]} other={shown[1]} />
          <ShareButton
            path={nameSharePath(shown[0], shown[1])}
            title={`${shown[0]} ♥ ${shown[1]} 이름 궁합`}
          />
        </div>
      )}
    </div>
  );
}
