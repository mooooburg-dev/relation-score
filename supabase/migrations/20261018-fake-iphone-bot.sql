-- 위장 아이폰 봇 소급 분류 + 클릭 판단 근거(Sec-Fetch-Site) 컬럼 (적용 완료 2026-10-18).
--
-- 배경: 2026-10-18 쿠팡 파트너스 실적(9/18~10/17 클릭 10)과 우리 선물 클릭(사람 33)을 대조했더니
-- 18건이 같은 UA `iPhone OS 13_2_3 … Version/13.0.3` 였다. 2019년 iOS 13 사파리 UA 이자 크롬 개발자도구
-- 아이폰 에뮬레이션 기본값으로, 새벽 시간대에 띠·별자리 선물을 20분 간격으로 순회했다. 쿠팡 실적에는
-- 잡히지 않았다(무효 클릭으로 걸러짐). src/lib/bot.ts 에서 봇으로 분류하고 기존 행도 소급 표시한다.
--
-- fetch_site: 브라우저가 보내는 Sec-Fetch-Site 헤더. 사람이 우리 페이지에서 누르면 'same-origin',
-- 주소를 직접 치거나 봇이 바로 부르면 'none'/없음. 아직 차단 기준으로 쓰지 않고 판단 근거로만 남긴다
-- (오래된 브라우저는 이 헤더를 안 보낸다).
--
-- ⚠️ 함께 만든 차단 코드(PR #29)는 머지하지 않고 닫았다 — "확실하지 않으면 표시만" 방침(PR #30).
--    아래 gift_clicks is_bot 소급은 20261106-fake-iphone-to-suspect.sql 에서 suspect 로 되돌렸다.
--    fetch_site 컬럼은 PR #31 부터 실제로 기록한다.
--
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN fetch_site; (is_bot 소급은 되돌리지 않는다)

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS fetch_site TEXT;

UPDATE gift_clicks SET is_bot = true
WHERE is_bot = false
  AND user_agent LIKE '%iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 %';

UPDATE outbound_clicks SET is_bot = true
WHERE is_bot = false
  AND user_agent LIKE '%iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 %';

UPDATE score_analyses SET is_bot = true
WHERE is_bot = false
  AND user_agent LIKE '%iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 %';
