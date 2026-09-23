#!/usr/bin/env node
/**
 * 빌드 산출 HTML의 본문을 해시해서 URL별 실제 변경일(lastmod)을 기록한다.
 *
 *   npm run build && npm run lastmod
 *
 * 소스 파일의 커밋 날짜를 쓰지 않는 이유: 메타 태그 추가나 상수 이동처럼
 * 렌더 결과가 그대로인 변경까지 갱신일을 밀어올리면 거짓 신호가 되고,
 * 검색엔진은 부정확한 lastmod 를 무시한다. 본문이 실제로 달라진 URL 만 날짜를 올린다.
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

/** 빌드마다 값이 바뀌는 조각은 해시 대상에서 뺀다. */
function normalize(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/);
  const body = main ? main[0] : html.match(/<body\b[\s\S]*?<\/body>/)?.[0] ?? html;
  return body
    .replace(/<script[\s\S]*?<\/script>/g, "")
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

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf-8")) : {};
const now = new Date().toISOString();
const isFirstRun = Object.keys(prev).length === 0;

const next = {};
let changed = 0;
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
    changed += 1;
  } else {
    next[path] = before;
  }
}

const removed = Object.keys(prev).filter((p) => !(p in next));

writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`, "utf-8");

console.log(
  `lastmod: ${Object.keys(next).length}개 URL (신규 ${added}, 변경 ${changed}, 삭제 ${removed.length})`,
);
if (changed) {
  console.log(
    Object.entries(next)
      .filter(([p]) => prev[p] && prev[p].hash !== next[p].hash)
      .map(([p]) => `  ~ ${p}`)
      .join("\n"),
  );
}
if (removed.length) console.log(removed.map((p) => `  - ${p}`).join("\n"));
