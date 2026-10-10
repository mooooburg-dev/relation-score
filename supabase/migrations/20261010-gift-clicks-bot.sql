-- 선물 클릭에서 봇을 가려내기 위한 컬럼 (미적용 — 코드 배포 전에 먼저 적용할 것).
--
-- 배경: 2026-10-10 오전(KST 07~11시)에 하루 2~5건이던 선물 클릭이 697건으로 뛰었다.
-- 같은 날 사람 분석은 0건이었고, MBTI 유형별로 50건 안팎씩 고르게, 선물 72종에
-- 넓게 퍼져 있어 링크를 훑는 봇으로 판단했다. robots.txt 가 /go 를 막고 있고
-- 링크도 nofollow 지만, /go/gift 가 UA 를 보지 않아 그대로 기록되고 쿠팡까지 넘어갔다.
--
-- 대응:
--   1) /go/gift 가 봇 UA(src/lib/bot.ts)면 쿠팡으로 보내지 않고 is_bot=true 로만 남긴다.
--   2) user_agent 를 앞 200자만 남긴다. 그날 봇은 UA 가 없어 정체를 알 수 없었다 —
--      다음에는 어떤 봇인지 보고 bot.ts 목록에 추가하기 위함. IP 는 여전히 저장하지 않는다.
--   3) 2026-10-10(KST) 행은 전부 소급 표시한다. UA 기록이 없어 개별 판별이 불가능하고,
--      그날 00:34 의 2건도 사람이라는 근거가 없다.
--
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN is_bot, DROP COLUMN user_agent;

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

UPDATE gift_clicks
SET is_bot = true
WHERE is_bot = false
  AND (created_at AT TIME ZONE 'Asia/Seoul')::date = '2026-10-10';

CREATE INDEX IF NOT EXISTS idx_gift_clicks_is_bot ON gift_clicks (is_bot);
