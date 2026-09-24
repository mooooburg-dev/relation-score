-- 몇점이야?(score.drawyourmind.com) 선물 딥링크 배치를 계정 공용 장부에 등록.
--
-- 장부 본체는 goldbox-today/supabase/migrations/supabase-cp-api-ledger-migration.sql.
-- cp_try_consume_quota 는 장부에 없는 site/bucket 을 무조건 거부(fail-closed)하므로,
-- 이 행이 없으면 scripts/gen-coupang-links.mjs 는 한 콜도 못 쏜다.
--
-- 한도를 빡빡하게 잡은 이유: 선물 카탈로그 74종을 20개씩 묶어 4콜로 끝나는 수동 배치다.
-- 실제 필요량보다 조금만 위로 잡아야, 누가 반복 실행했을 때 계정 한도(경고 3회 = 이용 제한)에
-- 닿기 전에 여기서 먼저 막힌다.
--
-- 계정 계열은 기존 account:deeplink (50/분·300/시·2000/일) 를 그대로 공유한다.
-- cp_api_family 에 'coupang-deeplink' → 'deeplink' 매핑이 이미 있어 추가 작업 없음.
--
-- 적용:  supabase 콘솔 SQL 에디터에 붙여넣기 (또는 supabase db push)
-- 롤백:  DELETE FROM cp_api_policy WHERE scope = 'score';
-- 현황:  SELECT * FROM cp_api_usage WHERE bucket LIKE 'score%';

INSERT INTO cp_api_policy (scope, bucket, window_seconds, max_count, note) VALUES
  ('score', 'coupang-deeplink', 60,    5,  '선물 딥링크 수동 배치 — 74종/20 = 4콜, 1초 간격'),
  ('score', 'coupang-deeplink', 3600,  12, '재시도 여유 포함. 정상 1회분(4콜)의 3배'),
  ('score', 'coupang-deeplink', 86400, 24, '하루 6회 이상 돌 일이 없다 — 넘으면 의도치 않은 반복')
ON CONFLICT (scope, bucket, window_seconds)
  DO UPDATE SET max_count = EXCLUDED.max_count, note = EXCLUDED.note;
