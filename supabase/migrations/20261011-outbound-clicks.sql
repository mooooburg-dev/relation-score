-- 패밀리 사이트(골드박스투데이·금리박스·월급박스)로 나간 클릭 기록 (적용 완료 2026-10-11).
--
-- 배경: 띠 궁합 등 버티컬을 늘리면서 "골드박스투데이로 얼마나 넘겼나"가 핵심 지표가 됐다.
-- 그동안 패밀리 링크는 UTM 만 붙여 바로 나가서, 숫자를 보려면 골드박스 쪽 GA 를 열어야 했고
-- 어느 버티컬·어느 페이지에서 넘어갔는지를 이 사이트 어드민에서 볼 수 없었다.
-- 이제 /go/out/[site] 가 302 하기 직전에 after() 로 한 줄 넣는다. UTM 은 그대로 붙어 나간다.
--
-- 개인 식별 정보는 넣지 않는다(IP 미저장). UA 는 봇 판별 확인용으로 앞 200자만.
--
-- 적용 전에 배포해도 안전하다: insert 실패는 삼키고 이동은 그대로 된다.
-- 롤백: DROP TABLE outbound_clicks;

CREATE TABLE IF NOT EXISTS outbound_clicks (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  site        TEXT NOT NULL,   -- 'goldbox' | 'ratebox' | 'paybox' (src/lib/family.ts)
  vertical    TEXT,            -- 'mbti' | 'tti' | 'gift' | 'result' | 'footer' …
  campaign    TEXT,            -- utm_campaign 과 같은 값 (family_tti-pair 등)
  content     TEXT,            -- utm_content (조합 키·관계 등)
  source_path TEXT,            -- 클릭이 난 페이지 경로 (같은 도메인 Referer 에서만)
  is_admin    BOOLEAN NOT NULL DEFAULT false,
  is_bot      BOOLEAN NOT NULL DEFAULT false,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbound_clicks_created_at ON outbound_clicks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_vertical ON outbound_clicks (vertical);

-- service_role 전용. 공개 정책을 두지 않는다.
ALTER TABLE outbound_clicks ENABLE ROW LEVEL SECURITY;
