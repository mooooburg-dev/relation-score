-- 별자리 선물 클릭에 대상 별자리를 남기는 컬럼 (적용 완료 2026-10-11).
--
-- /zodiac/* 페이지의 선물 버튼은 /go/gift/[id]?zs=<별자리>&f=zodiac 로 나간다.
-- 띠(tti)와 같은 이유로 mbti 컬럼에 섞지 않고 따로 둔다.
-- 라우트는 별자리 선물일 때만 zodiac 키를 넣으므로 적용 전 배포도 안전하다(그 사이 기록만 빠짐).
-- 롤백: ALTER TABLE gift_clicks DROP COLUMN zodiac;

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS zodiac TEXT;
