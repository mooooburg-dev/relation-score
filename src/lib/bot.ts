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
 * 주의: Daum 은 크롤러(Daumoa)와 사용자 인앱 브라우저(DaumApps)가 이름이 비슷하다.
 * 크롤러 쪽만 정확히 적는다.
 */
const BOT_UA =
  /bot\b|bot\/|crawler|spider|slurp|headless|bingpreview|GoogleOther|Google-InspectionTool|Mediapartners-Google|AdsBot|Yeti|Daumoa|facebookexternalhit|Bytespider|PetalBot|YandexBot|Applebot|GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot|Amazonbot|SemrushBot|AhrefsBot/i;

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
