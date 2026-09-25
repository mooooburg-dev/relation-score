-- 선물 클릭 기록 (적용 완료 2026-09-25).
--
-- 쿠팡 subId 는 채널 귀속 때문에 'scoregift' 단일로 고정이라(쪼개지 않는다)
-- 파트너스 리포트로는 "어느 화면에서 눌렀나"를 알 수 없다. 그 구분만 우리가 남긴다.
-- /go/gift/[id] 가 파트너스 링크로 302 하기 직전에 after() 로 한 줄 넣는다.
--
-- 개인 식별 정보는 넣지 않는다(IP·UA 미저장). 어드민 확인용으로만 쓴다.
-- 롤백: DROP TABLE gift_clicks;

CREATE TABLE IF NOT EXISTS gift_clicks (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gift_id    TEXT NOT NULL,   -- 선물 카탈로그 id (gifts.json catalog 키)
  mbti       TEXT,            -- 선물 대상 유형
  surface    TEXT NOT NULL,   -- 클릭 자리: 'list'(본문 목록) | 'relation'(관계 섹션)
  relation   TEXT,            -- 관계 섹션에서 눌렀으면 그 관계
  entry      TEXT             -- /gift 로 들어온 게이트: 'type' | 'pair' | 'result' | NULL(직접)
);

CREATE INDEX IF NOT EXISTS idx_gift_clicks_created_at ON gift_clicks (created_at DESC);

-- service_role 전용. 공개 정책을 두지 않는다.
ALTER TABLE gift_clicks ENABLE ROW LEVEL SECURITY;
