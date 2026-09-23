#!/usr/bin/env node
/**
 * 빌드 산출 HTML을 해시해서 URL별 실제 변경일(lastmod)을 기록한다.
 *
 *   npm run build && npm run lastmod
 *
 * 소스 파일의 커밋 날짜를 쓰지 않는 이유: 메타 태그 추가나 상수 이동처럼
 * 렌더 결과가 그대로인 변경까지 갱신일을 밀어올리면 거짓 신호가 되고,
 * 검색엔진은 부정확한 lastmod 를 무시한다. 본문이 실제로 달라진 URL 만 날짜를 올린다.
 *
 * 해시 대상: <title> + meta description + <body>
 *  - <body> 전체를 쓰는 이유: footer 같은 layout 공통 영역이 바뀌면 전 페이지가 함께
 *    바뀐 것이 맞다. <main> 만 보면 공통 영역 변경을 놓친다.
 *  - 홈(/)은 ScoreApp 이 CSR 로 bail out 되어 본문이 프리렌더 HTML 에 없다.
 *    따라서 홈은 layout·메타 변경만 감지된다 (앱 UI 변경은 감지 못 함).
 *  - 빌드 환경에 따라 달라지는 조각(script, AdSense)은 제외한다.
 *
 * 결과: src/data/lastmod.json  { "<path>": { hash, lastmod } }
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const APP_DIR = ".next/server/app";
const OUT = "src/data/lastmod.json";

/** 기존 기록이 없는 최초 실행 시 쓰는 기준일 (콘텐츠에 영향을 준 마지막 커밋) */
const SEED = "2026-09-17T17:08:58+09:00";

/**
 * 빌드마다/환경마다 달라지는 조각을 걷어낸 해시 입력을 만든다.
 * AdSense 는 env 유무로 마크업이 통째로 생겼다 사라지므로 반드시 제거해야 한다
 * (광고 env 가 채워진 환경에서 돌렸다고 전 페이지가 "변경"으로 뒤집히면 안 된다).
 */
function normalize(html) {
  const title = html.match(/<title[^>]*>[\s\S]*?<\/title>/i)?.[0] ?? "";
  const desc = html.match(/<meta\s+name="description"[^>]*>/i)?.[0] ?? "";
  const body = html.match(/<body\b[\s\S]*?<\/body>/i)?.[0] ?? html;

  return `${title}${desc}${body}`
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<div\s+data-ad="[^"]*"[\s\S]*?<\/div>/gi, "")
    .replace(/<ins\b[^>]*adsbygoogle[^>]*>[\s\S]*?<\/ins>/gi, "")
    .replace(/<ins\b[^>]*adsbygoogle[^>]*\/?>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

/** .next/server/app/mbti/infp.html → /mbti/infp , index.html → / */
function toPath(file) {
  const rel = relative(APP_DIR, file).replace(/\.html$/, "");
  if (rel === "index") return "/";
  return `/${rel}`;
}

if (!existsSync(APP_DIR)) {
  console.error(
    `${APP_DIR} 가 없습니다. 먼저 \`npm run build\` 를 실행하세요.`,
  );
  process.exit(1);
}

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf-8")) : {};
const now = new Date().toISOString();
const isFirstRun = Object.keys(prev).length === 0;

const next = {};
const changedPaths = [];
let added = 0;

for (const file of (await htmlFiles(APP_DIR)).sort()) {
  const path = toPath(file);
  if (path.startsWith("/_")) continue; // _not-found, _global-error

  const hash = createHash("sha1")
    .update(normalize(readFileSync(file, "utf-8")))
    .digest("hex")
    .slice(0, 16);

  const before = prev[path];
  if (!before) {
    next[path] = { hash, lastmod: isFirstRun ? SEED : now };
    added += 1;
  } else if (before.hash !== hash) {
    next[path] = { hash, lastmod: now };
    changedPaths.push(path);
  } else {
    next[path] = before;
  }
}

// 이번 빌드에 없던 URL 의 기록은 지우지 않고 남긴다.
// 빌드 실패·설정 차이로 HTML 이 안 나온 경우까지 이력이 날아가면,
// 라우트가 돌아왔을 때 "신규"로 잡혀 내용이 그대로인데도 날짜가 튄다.
const missing = Object.keys(prev).filter((p) => !(p in next));
for (const p of missing) next[p] = prev[p];

const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`, "utf-8");

console.log(
  `lastmod: ${Object.keys(sorted).length}개 URL (신규 ${added}, 변경 ${changedPaths.length}, 이번 빌드에 없음 ${missing.length})`,
);
if (changedPaths.length) {
  console.log(changedPaths.map((p) => `  ~ ${p}`).join("\n"));
}
if (missing.length) {
  console.log(missing.map((p) => `  ? ${p} (기존 기록 유지)`).join("\n"));
}
