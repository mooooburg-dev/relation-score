"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/visitor";

/**
 * 매일 아침 오늘의 운세 알림 켜기/끄기 + 홈 화면 추가 안내.
 *
 *  - 아이폰은 홈 화면에 추가한 앱(standalone)에서만 웹 푸시가 된다 → 일반 사파리면 추가 방법을 안내한다
 *  - 안드로이드 크롬은 beforeinstallprompt 가 오면 "홈 화면에 추가" 버튼을 보여준다(오지 않으면 숨긴다)
 *  - 구독하면 띠·별자리만 서버에 보낸다(개인화 문구용). 생일은 보내지 않는다
 *  - 생일(띠·별자리)이 바뀌면 이미 켠 구독의 띠·별자리를 다시 보낸다 (syncOnMount — 내 운세 카드)
 *  - 띠·별자리 운세 페이지에서는 생일 저장 없이 "그 띠" 하나로 바로 구독한다. 이미 구독 중이면 다른 띠 페이지를
 *    구경하는 것만으로 구독이 바뀌지 않게 자동 갱신하지 않고, "이 띠로 바꾸기"를 눌렀을 때만 바꾼다
 */

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const KEY_ON = "rs_push";
/** 지금 구독에 묶인 대상 이름 ("쥐띠") — 다른 띠 페이지에서 "○○띠 알림 받는 중"을 보여주려고 둔다 */
const KEY_LABEL = "rs_push_label";

function readLabel(): string | null {
  try {
    return localStorage.getItem(KEY_LABEL);
  } catch {
    return null;
  }
}
function writeLabel(v: string | null) {
  try {
    if (v) localStorage.setItem(KEY_LABEL, v);
    else localStorage.removeItem(KEY_LABEL);
  } catch {}
}

function b64ToUint8(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "busy";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

export default function PushOptIn({
  tti = null,
  zodiac = null,
  label,
  syncOnMount = true,
  variant = "inline",
}: {
  tti?: string | null;
  zodiac?: string | null;
  /** 알림 대상 이름 ("쥐띠", "쥐띠·양자리") */
  label: string;
  /** 이미 구독 중이면 마운트할 때 이 띠·별자리로 갱신할지 (내 운세 카드만 true) */
  syncOnMount?: boolean;
  /** inline: 내 운세 카드 안 / card: 운세 페이지에 단독 카드 */
  variant?: "inline" | "card";
}) {
  const [state, setState] = useState<State>("loading");
  const [subLabel, setSubLabel] = useState<string | null>(null);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    (async () => {
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/i.test(ua);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!VAPID) return setState("unsupported");
      if (!supported) return setState(ios && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          if (syncOnMount) {
            // 생일이 바뀌었을 수 있어 띠·별자리를 다시 보낸다 (upsert)
            void save(sub, tti, zodiac);
            writeLabel(label);
          }
          setSubLabel(readLabel());
          setState("on");
        } else setState("off");
      } catch {
        setState("unsupported");
      }
    })();
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [tti, zodiac, label, syncOnMount]);

  async function save(sub: PushSubscription, t: string | null, z: string | null) {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), tti: t, zodiac: z }),
    });
  }

  async function turnOn() {
    setState("busy");
    setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(VAPID!) }));
      await save(sub, tti, zodiac);
      try {
        localStorage.setItem(KEY_ON, "1");
      } catch {}
      writeLabel(label);
      setSubLabel(label);
      track("push_subscribe", { where: variant, target: tti ?? zodiac ?? "" });
      setState("on");
      setMsg("내일 아침 8시쯤 첫 알림이 갈 거야!");
    } catch {
      setState("off");
      setMsg("알림을 켜지 못했어. 잠시 뒤 다시 해 봐.");
    }
  }

  async function turnOff() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      try {
        localStorage.removeItem(KEY_ON);
      } catch {}
      writeLabel(null);
      setSubLabel(null);
      track("push_unsubscribe");
    } finally {
      setState("off");
      setMsg("");
    }
  }

  async function switchHere() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await save(sub, tti, zodiac);
      writeLabel(label);
      setSubLabel(label);
      track("push_switch", { target: tti ?? zodiac ?? "" });
      setMsg(`내일부터 ${label} 운세로 보낼게!`);
    } finally {
      setState("on");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  const wrap =
    variant === "card"
      ? "rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4 text-center shadow-sm"
      : "mt-3 rounded-2xl bg-white/80 p-3 text-center";

  return (
    <div className={wrap}>
      {state === "ios-install" ? (
        <p className="text-xs leading-relaxed text-foreground/70">
          📲 아이폰은 <b>공유 버튼 → &quot;홈 화면에 추가&quot;</b> 후 그 앱에서 열면 매일 아침 운세 알림을 받을 수 있어.
        </p>
      ) : state === "denied" ? (
        <p className="text-xs leading-relaxed text-foreground/60">
          알림이 차단돼 있어. 브라우저 설정 → 사이트 설정에서 알림을 허용하면 켤 수 있어.
        </p>
      ) : state === "on" ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary">
              🔔 매일 아침 8시 {subLabel ?? ""} 알림 받는 중
            </span>
            <button type="button" onClick={turnOff} className="text-xs text-foreground/45 underline">
              끄기
            </button>
          </div>
          {!syncOnMount && subLabel !== label && (
            <button type="button" onClick={switchHere} className="text-xs font-bold text-primary underline">
              {label} 운세로 바꾸기
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={state === "busy"}
          onClick={turnOn}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          🔔 매일 아침 8시 {label} 오늘의 운세 받기
        </button>
      )}
      {msg && <p className="mt-2 text-xs text-foreground/60">{msg}</p>}
      {installEvt && (
        <button
          type="button"
          onClick={async () => {
            await installEvt.prompt();
            track("pwa_install_prompt");
            setInstallEvt(null);
          }}
          className="mt-2 text-xs font-bold text-primary underline"
        >
          📲 홈 화면에 추가하고 앱처럼 쓰기
        </button>
      )}
    </div>
  );
}
