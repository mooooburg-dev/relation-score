-- 위장 아이폰 클릭을 "봇"에서 "의심"으로 되돌림 (적용 완료 2026-11-06).
--
-- 10/18 에 iPhone OS 13_2_3 UA 클릭 24건을 is_bot=true 로 소급 표시했다(20261018-fake-iphone-bot.sql,
-- 같이 만든 차단 코드 PR #29 는 머지하지 않고 닫았다). 이후 "확실하지 않으면 막지 말고 표시만" 하기로 하고
-- suspect 컬럼(20261105-gift-clicks-suspect.sql)을 만들었는데, 10/18 이후 같은 UA 는 suspect='emulator-ua'
-- 로만 쌓이고 있다. 11/12 쿠팡 리포트 대조 때 기간마다 기준이 다르면 안 되므로 앞선 24건도 같은 방식으로 맞춘다.
--
-- outbound_clicks 의 같은 UA 27건(is_bot=true)은 그대로 둔다 — 쿠팡과 무관하고 suspect 컬럼이 없다.

UPDATE gift_clicks
SET is_bot = false,
    suspect = 'emulator-ua'
WHERE is_bot = true
  AND is_admin = false
  AND suspect IS NULL
  AND user_agent LIKE '%iPhone OS 13_2_3 like Mac OS X%';
