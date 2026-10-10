-- 띠 선물 클릭에 대상 띠를 남기는 컬럼 (적용 완료 2026-10-11).
--
-- /tti/* 페이지의 선물 버튼은 /go/gift/[id]?z=<띠>&f=tti 로 나간다. mbti 컬럼에 띠를
-- 섞어 넣으면 MBTI 집계가 오염되므로 따로 둔다.
--
-- 적용 전에 배포해도 안전하다: 라우트가 띠 선물일 때만 tti 키를 넣고, 실패는 삼킨다.
-- (단, 적용 전 띠 선물 클릭은 기록되지 않는다 — 배포 전에 적용할 것)
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN tti;

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS tti TEXT;
