-- 선물 클릭 의심 표시 (적용 완료 2026-11-05).
--
-- 배경: 봇 UA 차단(20261010-gift-clicks-bot.sql) 뒤에도 정상 브라우저처럼 생긴 UA 가
-- 선물 클릭에 몰렸다. 실사용 Chrome 은 155~156 인데 Mac Chrome 101~146 이 하루 종일
-- 매번 다른 선물을 누르고(11/5 Chrome 123 하나가 선물 16종), 매일 18:50 무렵 묵은
-- 버전 여러 개가 게이트 없이 한꺼번에 들어온다. 자동화 도구 기본 UA
-- `iPhone OS 13_2_3` 도 반복된다.
--
-- 확실하지 않아서 막지 않고 표시만 한다(쿠팡 이동·집계 그대로). 1주일 쌓인 것을
-- 쿠팡 파트너스 리포트와 맞춰 본 뒤 차단 여부를 정한다.
--
-- suspect = 쉼표로 이은 이유 코드, 정상이면 NULL
--   old-browser : Chrome 메이저가 그날 추정 최신보다 8 넘게 낮음
--                 (최신 = 131 + (날짜 - 2024-11-12) / 28일, 삼성 인터넷·안드로이드 웹뷰 제외)
--   emulator-ua : `iPhone OS 13_2_3 like Mac OS X`
--   burst       : 같은 UA 가 앞선 60초 안에 4번 이상
-- ⚠️ src/lib/bot.ts suspectUaReasons 와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 고친다.
--
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN suspect;

ALTER TABLE gift_clicks ADD COLUMN IF NOT EXISTS suspect TEXT;

-- UA 를 저장하기 시작한 10/10 이후 행만 대상 (그 전은 UA 가 없어 판별 불가)
WITH r AS (
  SELECT g.id,
    array_remove(ARRAY[
      CASE WHEN g.user_agent !~* 'SamsungBrowser|; wv\)'
             AND (substring(g.user_agent FROM 'Chrome/(\d+)'))::int
               < 131 + floor(((g.created_at AT TIME ZONE 'Asia/Seoul')::date - DATE '2024-11-12') / 28.0)::int - 8
           THEN 'old-browser' END,
      CASE WHEN g.user_agent ~ 'iPhone OS 13_2_3 like Mac OS X' THEN 'emulator-ua' END,
      CASE WHEN (SELECT count(*) FROM gift_clicks p
                 WHERE p.user_agent = g.user_agent
                   AND p.created_at < g.created_at
                   AND p.created_at >= g.created_at - interval '60 seconds') >= 4
           THEN 'burst' END
    ], NULL) AS reasons
  FROM gift_clicks g
  WHERE NOT g.is_bot AND g.user_agent IS NOT NULL AND g.suspect IS NULL
)
UPDATE gift_clicks g
SET suspect = array_to_string(r.reasons, ',')
FROM r
WHERE g.id = r.id AND cardinality(r.reasons) > 0;
