/*
 * 몇점이야? 서비스 워커 — 웹 푸시 전용.
 * 오프라인 캐시는 하지 않는다(페이지는 매일 바뀌므로 오래된 화면을 보여줄 위험만 생긴다).
 * 서버(/api/cron/push-daily)가 보내는 payload: { title, body, url, tag }
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "몇점이야?", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "오늘의 운세가 도착했어 ☀️";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      // 같은 tag 는 덮어쓴다 — 하루에 알림이 쌓이지 않게
      tag: data.tag || "daily",
      data: { url: data.url || "/today" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/today", self.location.origin);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // 이미 열린 탭이 있으면 그 탭으로 이동
      for (const c of list) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          c.navigate(url.href);
          return c.focus();
        }
      }
      return self.clients.openWindow(url.href);
    }),
  );
});
