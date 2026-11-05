/**
 * 봇·크롤러 User-Agent 판별.
 *
 * 왜 필요한가: 2026-09 중순부터 구글 크롤러가 `/api/analyze` 를 실제로 호출해
 * 누적 분석의 절반이 넘는 85건을 만들어냈다. 통계가 부풀고(봇 평균 86점 vs 사람 62점)
 * OpenAI 비용까지 그대로 나갔다. 그래서 API 진입 지점에서 차단하고, 이미 쌓인 행은
 * score_analyses.is_bot 으로 표시해 어드민 통계에서 뺀다.
 *
 * `bot` 이라는 글자만 찾으면 놓친다 — 실제로 들어온 셋 중 `GoogleOther` 와
 * `Mediapartners-Google`(애드센스)에는 그 글자가 없다. 이름을 아는 놈은 이름으로 잡는다.
 *
 * 이 목록을 고치면 supabase/migrations 의 소급 분류 정규식(POSIX 문법, \b 대신 \y)도
 * 같이 봐야 한다.
 *
 * kakaotalk-scrap 은 카톡 링크 미리보기 수집기다. 이름·생일 궁합 공유 결과(/name/r, /birthday/r)는
 * 카톡으로 퍼지는데, 미리보기를 만들 때마다 한 번씩 열어서 조회수(tool_views)에 섞인다.
 * (사람의 카톡 인앱 브라우저는 UA 에 KAKAOTALK 이 들어가므로 구분된다)
 *
 * 주의: Daum 은 크롤러(Daumoa)와 사용자 인앱 브라우저(DaumApps)가 이름이 비슷하다.
 * 크롤러 쪽만 정확히 적는다.
 */
const BOT_UA =
  /bot\b|bot\/|crawler|spider|slurp|headless|bingpreview|GoogleOther|Google-InspectionTool|Mediapartners-Google|AdsBot|Yeti|Daumoa|facebookexternalhit|Bytespider|PetalBot|YandexBot|Applebot|GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot|Amazonbot|SemrushBot|AhrefsBot|kakaotalk-scrap/i;

export function isBotUa(ua: string | null | undefined): boolean {
  return ua ? BOT_UA.test(ua) : false;
}

/** 어떤 봇인지까지 보여준다 — 크롤러별로 대응이 다르다 */
export function botLabel(ua: string): string {
  const name = /Googlebot/i.test(ua)
    ? "Googlebot"
    : /GoogleOther/i.test(ua)
      ? "GoogleOther"
      : /Mediapartners-Google/i.test(ua)
        ? "애드센스 크롤러"
        : /Google-InspectionTool/i.test(ua)
          ? "구글 검사도구"
          : /AdsBot/i.test(ua)
            ? "AdsBot"
            : /Yeti/i.test(ua)
              ? "네이버 예티"
              : /Daumoa/i.test(ua)
                ? "다음 크롤러"
                : /Bingbot/i.test(ua)
                  ? "Bingbot"
                  : /facebookexternalhit/i.test(ua)
                    ? "페이스북 봇"
                    : /GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot/i.test(ua)
                      ? "AI 크롤러"
                      : "봇";
  return `🤖 ${name}`;
}

/**
 * 봇 UA 목록에는 안 걸리지만 사람으로 보기 어려운 UA.
 *
 * 왜: 2026-10-25·11-03 선물 클릭에 정상 브라우저처럼 생긴 UA 가 몰렸다 —
 * 30분 안에 Mac Chrome 123~146 이 번갈아 찍히고(실사용 Chrome 은 155~156),
 * 자동화 도구 기본값인 `iPhone OS 13_2_3` 이 매번 다른 선물을 눌렀다.
 * 확실하지 않아서 막지 않고 gift_clicks.suspect 에 표시만 한다. 1주일 쌓인 것을
 * 쿠팡 파트너스 리포트와 맞춰 본 뒤 차단 여부를 정한다.
 *
 * - old-browser: Chrome 은 자동 업데이트라 실사용자는 최신 근처에 몰려 있다.
 *   4주마다 한 버전(Chrome 131 = 2024-11-12 기준)으로 그날의 최신을 추정하고
 *   8버전(약 7개월) 넘게 뒤처지면 표시한다. 버전을 숫자로 박으면 몇 달 뒤 전부 걸린다.
 *   삼성 인터넷은 Chromium 을 늦게 따라가서, 안드로이드 인앱 웹뷰(`; wv)`)는
 *   기기마다 업데이트가 늦을 수 있어서 제외한다.
 * - emulator-ua: 개발자 도구·puppeteer 기본 아이폰 UA.
 *
 * ⚠️ 같은 규칙을 supabase/migrations/20261105-gift-clicks-suspect.sql 의 소급 표시가
 *    SQL 로 옮겨 쓴다. 한쪽을 고치면 다른 쪽도 고친다.
 */
const CHROME_ANCHOR = { version: 131, date: Date.UTC(2024, 10, 12) };
const CHROME_RELEASE_DAYS = 28;
const CHROME_STALE_GAP = 8;

export function suspectUaReasons(ua: string, now = new Date()): string[] {
  const reasons: string[] = [];
  const chrome = /Chrome\/(\d+)/.exec(ua);
  if (chrome && !/SamsungBrowser|; wv\)/i.test(ua)) {
    const latest =
      CHROME_ANCHOR.version +
      Math.floor(
        (now.getTime() - CHROME_ANCHOR.date) / (CHROME_RELEASE_DAYS * 86_400_000),
      );
    if (Number(chrome[1]) < latest - CHROME_STALE_GAP) reasons.push("old-browser");
  }
  if (/iPhone OS 13_2_3 like Mac OS X/.test(ua)) reasons.push("emulator-ua");
  return reasons;
}
