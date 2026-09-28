-- 봇·크롤러 분석을 통계에서 제외하기 위한 플래그 (적용 완료 2026-09-28).
--
-- 배경: 2026-09-17 무렵부터 구글 크롤러가 POST /api/analyze 를 실제로 호출했다.
-- 적용 시점 기준 누적 146건 중 85건(58%)이 봇이었고, 봇 평균 86점 / 사람 평균 62점이라
-- 대시보드 숫자가 통째로 흔들렸다. AI 호출까지 그대로 나가 비용도 샜다.
--
-- 대응은 두 겹이다:
--   1) src/app/api/analyze/route.ts 가 봇 UA 를 403 으로 끊는다 (본문·AI 호출 전).
--      그래서 이 컬럼에 true 가 새로 쌓일 일은 사실상 없다.
--   2) 차단 이전에 들어온 행은 아래 UPDATE 로 소급 표시해 통계에서 뺀다.
--
-- ⚠️ 아래 정규식은 src/lib/bot.ts 의 BOT_UA 와 같은 목록을 POSIX 문법으로 옮긴 것이다
--    (\b 대신 \y). 한쪽을 고치면 다른 쪽도 함께 고쳐야 한다.
--    `bot` 이라는 글자만 찾으면 안 된다 — 실제로 들어온 GoogleOther 와
--    Mediapartners-Google(애드센스)에는 그 글자가 없다.
--
-- 롤백: ALTER TABLE score_analyses DROP COLUMN is_bot;

ALTER TABLE score_analyses
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN score_analyses.is_bot IS
  '봇·크롤러 요청 여부. 어드민 통계에서 제외한다. 2026-09 GoogleOther 등 구글 크롤러가 /api/analyze를 호출해 전체의 절반 이상을 차지했고, 이후 API에서 봇 UA를 차단했다. 이 컬럼은 차단 이전에 쌓인 행을 가려내기 위한 것.';

UPDATE score_analyses
SET is_bot = true
WHERE is_bot = false
  AND user_agent ~* 'bot\y|bot/|crawler|spider|slurp|headless|bingpreview|GoogleOther|Google-InspectionTool|Mediapartners-Google|AdsBot|Yeti|Daumoa|facebookexternalhit|Bytespider|PetalBot|YandexBot|Applebot|GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot|Amazonbot|SemrushBot|AhrefsBot';

CREATE INDEX IF NOT EXISTS idx_score_analyses_is_bot ON score_analyses (is_bot);
