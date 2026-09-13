# 몇점이야? (relation-score)

MBTI·나이·혈액형 기반 관계별 궁합 점수 테스트. https://score.drawyourmind.com

## 개발

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev                  # http://localhost:3000
npm run build
npm run lint
```

## 구조

| 경로 | 설명 |
|---|---|
| `/` | 입력 → AI 분석 → 결과 (클라이언트 앱 `src/app/ScoreApp.tsx`) |
| `/r/[id]` | 공유 결과 페이지 (Supabase 저장값 재현, noindex) |
| `/mbti` | MBTI 궁합표 인덱스 |
| `/mbti/[type]` | 유형별 궁합 순위 (16장, 정적 생성) |
| `/pair/[a-b]` | 조합별 궁합 상세 (136장, 정적 생성, 알파벳순 slug가 canonical) |
| `/api/analyze` | OpenAI(gpt-5.4-mini) 분석 + Supabase 저장. `OPENAI_BASE_URL`로 게이트웨이 교체 가능 |
| `/api/og` | 결과 공유용 동적 OG 이미지 |

레거시 공유 링크 `/?id=uuid`는 `next.config.ts`에서 `/r/uuid`로 301 리다이렉트된다.

## 정적 콘텐츠 생성

`/mbti/*`, `/pair/*` 페이지 본문은 `src/data/types.json`, `src/data/pairs.json`에서 읽는다.
런타임 AI 호출이 없으며, 아래 스크립트로 한 번 생성해 커밋한다.

```bash
node scripts/generate-content.mjs types            # 16개 유형
node scripts/generate-content.mjs pairs            # 136개 조합
node scripts/generate-content.mjs all --force      # 전부 재생성
node scripts/generate-content.mjs all --provider openai   # OpenAI(gpt-5.4)로 생성
```

- 기본 provider는 Anthropic(Claude Opus 5, `ANTHROPIC_API_KEY`), `--provider openai`는 `OPENAI_API_KEY` 사용
- 이미 생성된 항목은 건너뛰므로 중단돼도 이어서 실행 가능
- 데이터를 재생성했으면 `src/app/sitemap.ts`의 `CONTENT_UPDATED`를 갱신한다

## 환경 변수

`.env.example` 참고. 광고는 `NEXT_PUBLIC_ADSENSE_CLIENT`와 각 slot ID가 있어야 렌더된다
(`SLOT_BANNER` 하단 고정, `SLOT_LOADING` 분석중 화면, `SLOT_ARTICLE` 콘텐츠 페이지 본문).
