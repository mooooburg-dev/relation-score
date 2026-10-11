-- 웹 푸시 구독과 발송 기록 — 매일 아침 "오늘의 운세" 알림 (적용 완료 2026-10-12).
--
-- 구독은 /today 의 "알림 받기"에서 사용자가 직접 켠 경우에만 생긴다.
-- 저장하는 것: 푸시 엔드포인트·키(브라우저가 발급한 익명 주소), 개인화용 띠·별자리.
-- 저장하지 않는 것: 생일, IP, User-Agent. 알림을 끄면 행을 지운다.
-- 발송은 /api/cron/push-daily (Vercel 크론, 매일 08시 KST 무렵).
-- 만료된 구독(404/410)은 발송 중에 지운다.
--
-- 롤백: DROP TABLE push_subscriptions; DROP TABLE push_log;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  tti          TEXT,             -- 개인화: 'rat' 등 (생일은 저장하지 않는다)
  zodiac       TEXT,             -- 개인화: 'aries' 등
  last_sent_at TIMESTAMPTZ,
  fail_count   INT NOT NULL DEFAULT 0,
  is_admin     BOOLEAN NOT NULL DEFAULT false
);

-- 하루 한 줄 발송 요약 (어드민 확인용)
CREATE TABLE IF NOT EXISTS push_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_date   DATE NOT NULL,      -- KST 발송일
  total      INT NOT NULL,
  sent       INT NOT NULL,
  failed     INT NOT NULL,
  removed    INT NOT NULL,
  note       TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_log_run_date ON push_log (run_date DESC);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;
