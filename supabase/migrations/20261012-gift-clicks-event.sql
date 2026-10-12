-- 시즌 이벤트 선물 클릭에 이벤트 slug 를 남기는 컬럼 (적용 완료 2026-10-12).
--
-- /event/* 페이지의 선물 버튼은 /go/gift/[id]?f=event&ev=<slug> 로 나간다 (pepero-day 등).
-- 라우트는 이벤트 선물일 때만 event 키를 넣으므로 적용 전 배포도 안전하다.
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN event;

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS event TEXT;
