-- 운영자 본인 활동을 통계에서 제외하기 위한 플래그 (적용 완료 2026-09-25).
--
-- 왜 행을 안 넣는 대신 표시하나: 분석 행은 /r/[id] 공유 결과의 실체라 안 남길 수 없다.
-- 클릭도 같은 방식으로 맞춰 두면 제외가 실제로 동작하는지 확인할 수 있다.
--
-- 판정은 src/lib/admin/operator.ts — rs_admin(세션) 또는 rs_admin_hint(마커) 둘 중
-- 하나라도 있으면 운영자로 본다. 마커를 지워도 세션에서 걸린다.
--
-- ⚠️ 기존 행은 전부 false 로 들어간다. 2026-09-25 이전 통계에는 운영자 활동이
--    섞여 있으므로 이 날 앞뒤 숫자를 직접 비교하지 말 것.
--
-- 롤백: ALTER TABLE score_analyses DROP COLUMN is_admin;
--       ALTER TABLE gift_clicks DROP COLUMN is_admin;

ALTER TABLE score_analyses
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE gift_clicks
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_score_analyses_is_admin ON score_analyses (is_admin);
CREATE INDEX IF NOT EXISTS idx_gift_clicks_is_admin ON gift_clicks (is_admin);
