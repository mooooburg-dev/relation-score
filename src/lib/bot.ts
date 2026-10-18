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
 * 위장 아이폰: `iPhone OS 13_2_3 … Version/13.0.3` 은 2019년 iOS 13 사파리 UA 이자 크롬 개발자도구
 * 아이폰 에뮬레이션의 기본값이라 사람인 척하는 크롤러가 흔히 쓴다. 2026-10-11~18 에 이 UA 하나가
 * 새벽 시간대에 띠·별자리 선물 버튼을 20분 간격으로 순회하며 18건을 눌렀고, 쿠팡 파트너스 실적에는
 * 잡히지 않았다(쿠팡이 무효 클릭으로 걸렀다). 그대로 두면 무효 클릭이 계정에 쌓이므로 봇으로 본다.
 * 정확히 이 조합(버전 13.2.3 + Version/13.0.3)만 잡는다 — 다른 아이폰 사용자는 건드리지 않는다.
 *
 * 주의: Daum 은 크롤러(Daumoa)와 사용자 인앱 브라우저(DaumApps)가 이름이 비슷하다.
 * 크롤러 쪽만 정확히 적는다.
 */
const BOT_UA =
  /bot\b|bot\/|crawler|spider|slurp|headless|bingpreview|GoogleOther|Google-InspectionTool|Mediapartners-Google|AdsBot|Yeti|Daumoa|facebookexternalhit|Bytespider|PetalBot|YandexBot|Applebot|GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot|Amazonbot|SemrushBot|AhrefsBot|kakaotalk-scrap|meta-externalagent|iPhone OS 13_2_3 like Mac OS X\) AppleWebKit\/605\.1\.15 \(KHTML, like Gecko\) Version\/13\.0\.3 /i;

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
                    : /meta-externalagent/i.test(ua)
                      ? "Meta AI 크롤러"
                      : /GPTBot|ClaudeBot|Claude-Web|CCBot|PerplexityBot/i.test(ua)
                        ? "AI 크롤러"
                        : /iPhone OS 13_2_3/.test(ua)
                          ? "위장 아이폰 봇"
                          : "봇";
  return `🤖 ${name}`;
}
