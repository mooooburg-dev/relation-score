/**
 * Google Fonts에서 사용 글자만 서브셋으로 받아 OG 이미지 한글 렌더링에 사용.
 * 실패 시 null 반환 → 호출부에서 기본 폰트로 폴백.
 */
export async function loadKoreanFont(
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@800&text=${encodeURIComponent(
      text,
    )}`;
    const css = await (await fetch(url)).text();
    const src = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    );
    if (!src) return null;
    const res = await fetch(src[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
