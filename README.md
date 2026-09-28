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

공개 페이지는 `src/app/(site)/` 안에 있다. SEO 메타·구조화 데이터·GA·AdSense·footer는
`(site)/layout.tsx` 소관이고, root `layout.tsx`에는 `<html>`·폰트·파비콘만 남긴다.
`/admin`은 root layout만 상속하므로 어드민 화면에 사이트 footer나 추적 스크립트가 붙지 않는다.

| 경로 | 설명 |
|---|---|
| `/` | 입력 → AI 분석 → 결과 (클라이언트 앱 `src/app/ScoreApp.tsx`) |
| `/r/[id]` | 공유 결과 페이지 (Supabase 저장값 재현, noindex) |
| `/mbti` | MBTI 궁합표 인덱스 |
| `/mbti/[type]` | 유형별 궁합 순위 (16장, 정적 생성) |
| `/pair/[a-b]` | 조합별 궁합 상세 (136장, 정적 생성, 알파벳순 slug가 canonical) |
| `/api/analyze` | OpenAI(gpt-5.4-mini) 분석 + Supabase 저장. `OPENAI_BASE_URL`로 게이트웨이 교체 가능 |
| `/api/og` | 결과 공유용 동적 OG 이미지 |
| `/admin` | 운영 대시보드 (통계) — `ADMIN_PASSWORD` 로그인, noindex |
| `/admin/analyses` | 분석 목록 (필터·정렬·페이지네이션, 행 펼치면 AI 응답 원문) |
| `/sitemap.xml` | 154개 URL (URL별 `lastmod` 포함) |
| `/rss.xml` | 네이버 서치어드바이저 RSS 제출용 피드. 색인이 얇은 `/pair/*`를 앞쪽에 배치 |

레거시 공유 링크 `/?id=uuid`는 `src/proxy.ts`에서 `/r/uuid`로 301 리다이렉트된다.

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
- 데이터를 재생성했으면 `src/lib/mbti.ts`의 `CONTENT_UPDATED`를 갱신한다

## 갱신일(lastmod) 관리

`sitemap.xml`의 `lastmod`와 `rss.xml`의 `pubDate`는 `src/data/lastmod.json`에서 읽는다.
소스 파일의 커밋 날짜를 쓰지 않는데, 메타 태그 추가처럼 렌더 결과가 그대로인 변경까지
갱신일을 밀어올리면 거짓 신호가 되고 검색엔진이 `lastmod`를 통째로 무시하기 때문이다.

```bash
npm run build && npm run lastmod   # 빌드 결과 본문을 해시해 실제로 바뀐 URL만 날짜 갱신
```

`scripts/update-lastmod.mjs`가 각 페이지의 `<title>` + meta description + `<body>`를 해시해
이전 기록과 비교한다. 본문이 같으면 날짜를 유지하므로 재빌드만으로는 값이 흔들리지 않는다.
결과 JSON은 커밋해야 배포에 반영되며, 한 배포 뒤에 sitemap에 나타난다.

- `<body>` 전체를 보므로 footer 같은 layout 공통 영역이 바뀌면 154개 URL이 함께 갱신된다
- `<script>`와 AdSense 마크업(`data-ad` 블록, `.adsbygoogle`)은 해시에서 제외한다.
  광고 env 유무로 마크업이 통째로 생겼다 사라져서, 빼지 않으면 광고 slot이 설정된 환경에서
  빌드했다는 이유만으로 152개 URL이 전부 "변경"으로 뒤집힌다
- 홈(`/`)은 `ScoreApp`이 CSR로 bail out 되어 본문이 프리렌더 HTML에 없다.
  따라서 홈은 layout·메타 변경만 감지되고 앱 UI 변경은 잡히지 않는다
- `src/data/lastmod.json`은 `src/lib/lastmod.ts`가 정적 import 하므로 지우면 빌드가 깨진다

## 어드민

`/admin`은 `score_analyses` 테이블을 그대로 읽어 보여준다. 쓰기 기능은 없다.

- 대시보드: 누적/오늘/최근 7일 건수, 평균 점수, 공유 결과 조회수, 최근 14일 추이,
  관계 유형별·점수 구간별 분포, 많이 입력된 MBTI·조합 TOP 10
- 분석 목록: 관계·MBTI·점수 구간·기간 필터, 정렬, 20건씩 페이지네이션.
  행을 펼치면 입력값 전체, 세부 점수 4종, AI 응답 원문, 모델·IP·UA, 공유 링크가 보인다
- 분석 목록의 **사용자별 묶기**: 같은 사람이 연달아 돌린 흐름을 한 줄로 본다

### 사용자별 묶기

로그인이 없으므로 `IP + User-Agent` 를 같은 사용자의 대리 키로 쓴다. 통신사 NAT 뒤에서는
남남이 묶이고 IP가 바뀌면 한 사람이 갈라지므로, 신원이 아니라 "한 번에 여러 번 돌려본
흐름"을 보는 용도다. `GROUP BY` 를 supabase-js 로 못 쓰니 필터에 걸린 행(최대 5,000건)을
받아 메모리에서 묶는다. 규모가 커지면 RPC(SQL 함수)로 옮겨야 한다.

봇·크롤러는 🤖 라벨을 달고 흐리게 보여준다. 기본은 제외이고, 필터 바의 **봇 포함**을
켜면 차단 이전에 쌓인 크롤러 기록까지 볼 수 있다.

## 봇·크롤러 차단

2026-09-17 무렵부터 구글 크롤러가 `POST /api/analyze` 를 실제로 호출했다. 9/28 기준
누적 146건 중 **85건(58%)이 봇**이었고, 봇 평균 86점 · 사람 평균 62점이라 대시보드
숫자가 통째로 흔들렸다. AI 호출까지 그대로 나가 비용도 샜다.

대응은 두 겹이다.

1. `src/app/api/analyze/route.ts` 가 봇 UA 를 **403 으로 끊는다**. 본문을 읽기 전, AI 를
   부르기 전에 막으므로 비용이 0 이다. 크롤링할 가치가 없는 POST 라 색인에는 손해가 없다.
   OG 이미지(`/api/og`)와 결과 조회는 공유 미리보기에 필요하므로 그대로 열려 있다
2. 차단 이전에 들어온 행은 `score_analyses.is_bot` 으로 표시해 통계에서 뺀다
   (`supabase/migrations/20260928-is-bot-flag.sql`). 대시보드 하단에 제외된 건수를 띄운다

판별은 `src/lib/bot.ts` 의 `BOT_UA` 하나다. `bot` 이라는 글자만 찾으면 놓친다 — 실제로
들어온 셋 중 `GoogleOther` 와 `Mediapartners-Google`(애드센스)에는 그 글자가 없어서
한동안 평범한 안드로이드 기기로 집계됐다. 마이그레이션 SQL 에 같은 목록이 POSIX 문법으로
한 벌 더 있으니 한쪽을 고치면 다른 쪽도 함께 고쳐야 한다.

`robots.txt` 에도 `/api/analyze` 를 막아 두지만, 크롤러가 예의를 지킬 거라 기대하지 않는다
— 실제 방어선은 UA 차단이다.

인증은 `ADMIN_PASSWORD` 하나로 한다. 환경 변수가 없으면 어드민은 **항상 잠긴다**(fail closed).
쿠키에는 비밀번호가 아니라 거기서 파생한 HMAC 토큰이 들어간다(`src/lib/admin/auth.ts`).

인증 검사는 두 군데에 있다. `src/app/admin/layout.tsx`는 로그인 폼을 대신 렌더하는 화면용이고,
실제 방어선은 `src/lib/admin/data.ts`의 쿼리 함수다. page는 layout과 병렬로 렌더될 수 있어
layout에서만 막으면 데이터 쿼리가 먼저 나가는 구멍이 생긴다.

날짜 집계는 모두 KST(Asia/Seoul) 기준이다.

### 화면 갱신

어드민 헤더에 조회 시각 · 수동 새로고침 · 자동 1분 토글이 있다(골드박스·랭킹박스와 동일 패턴).

- **포커스 복귀**: 다른 탭·창을 보다가 어드민으로 돌아오면 자동 토글과 무관하게 항상 갱신한다.
  짧은 간격의 반복 포커스는 15초 스로틀로 억제한다
- **자동 1분**: 켜면 1분마다 갱신한다. 설정은 `localStorage`(`rs_admin_auto_refresh`)에 남고
  `storage` 이벤트를 구독하므로 탭 간에도 같은 상태가 된다
- 탭이 백그라운드면(`document.hidden`) 자동 갱신을 건너뛴다. 안 보는 화면을 1분마다
  다시 그려봐야 서버 함수만 태운다
- 갱신은 `router.refresh()`다. Supabase 읽기만 다시 돌고 AI 호출은 없으며,
  스크롤 위치와 펼쳐둔 `<details>` 상태는 유지된다
- 마지막 갱신 시각은 `use-admin-refresh.ts` 모듈 스코프에 두고 헤더 컨트롤과 플로팅 버튼이
  공유한다. 따로 두면 플로팅으로 막 갱신한 직후 탭을 옮겼다 돌아왔을 때 한 번 더 갱신된다

## 환경 변수

`.env.example` 참고. 광고는 `NEXT_PUBLIC_ADSENSE_CLIENT`와 각 slot ID가 있어야 렌더된다
(`SLOT_BANNER` 하단 고정, `SLOT_LOADING` 분석중 화면, `SLOT_ARTICLE` 콘텐츠 페이지 본문).
