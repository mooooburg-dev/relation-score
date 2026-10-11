-- 이름·생일 궁합 공유 결과 조회 기록 (적용 완료 2026-10-11).
--
-- 두 도구는 계산을 브라우저에서 끝내서 서버에 남는 사용 기록이 없다 (입력한 이름·생일도 서버로
-- 보내지 않는다). 대신 "공유 링크가 열린 횟수"가 바이럴 정도를 보여주는 지표라
-- /name/r/[code], /birthday/r/[code] 가 렌더될 때 한 줄씩 남긴다.
-- 이름·생일·공유 코드는 저장하지 않는다 — 어느 도구인지와 봇·운영자 여부만.
--
-- 적용 전에 배포해도 안전하다: insert 실패는 삼킨다.
-- 롤백: DROP TABLE tool_views;

CREATE TABLE IF NOT EXISTS tool_views (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tool       TEXT NOT NULL,   -- 'name' | 'birthday'
  is_admin   BOOLEAN NOT NULL DEFAULT false,
  is_bot     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tool_views_created_at ON tool_views (created_at DESC);

ALTER TABLE tool_views ENABLE ROW LEVEL SECURITY;
