/**
 * 쿠팡 파트너스 딥링크 생성 → src/data/gift-links.json
 *
 * 왜 오프라인 배치인가:
 *   선물 카탈로그는 사용자 입력과 무관한 고정 집합이다. 런타임에 만들 이유가 없고,
 *   서비스가 API 쿼터를 전혀 쓰지 않으므로 같은 계정의 다른 채널(골드박스투데이)에
 *   영향이 없다. generate-content.mjs 가 types/pairs.json 을 만드는 방식과 동일하다.
 *
 * 인증·재시도·에러 처리는 coupang-partners-sdk-standalone 에 맡긴다.
 *
 * 실행:  COUPANG_ACCESS_KEY=... COUPANG_SECRET_KEY=... npm run gift-links
 * 옵션:  --force  이미 링크가 있는 항목도 재생성 (기본은 건너뜀 → 재실행이 거의 공짜)
 *        --dry    호출 없이 대상만 출력
 */
import fs from "node:fs";
import path from "node:path";
import { CoupangPartnersClient } from "coupang-partners-sdk-standalone";
import { createClient } from "@supabase/supabase-js";

// ---- env (.env.local) — generate-content.mjs 와 같은 방식 ----
function loadEnv() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const ACCESS = process.env.COUPANG_ACCESS_KEY;
const SECRET = process.env.COUPANG_SECRET_KEY;
// 파트너스 채널 ID. 딥링크에 subId 로 박혀야 골드박스투데이와 성과·정산이 갈린다.
const SUB_ID = process.env.COUPANG_SUB_ID || "scoregift";
const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry");

const CHUNK = 20;      // 한 호출에 URL 여러 개 — 호출 수를 줄인다
// 호출 간격. 1초로 두면 4콜이 3초 안에 몰려 한 분 윈도에 전부 들어간다.
// 15초면 같은 배치가 2~3개 분 윈도로 흩어져, 분당 피크가 4 → 1~2 로 떨어진다.
// 쿠팡이 공개하지 않은 버스트/시간당 감지가 있더라도 걸릴 여지를 줄이는 쪽이 싸다.
// (배치는 사람이 수동으로 돌리는 것이라 총 소요가 1분 늘어나는 건 비용이 아니다)
const DELAY_MS = 15000;

// ---- 계정 공용 호출 장부 ----
// 파트너스 API 한도는 액세스키(계정) 단위다. 골드박스·랭킹박스·프라이스갭이 같은 계정을
// 쓰고, 2026-09-19 에 검색 API 시간당 초과로 경고 3회 누적 → 이용 제한을 실제로 겪었다.
// 그래서 한도를 Supabase(cp_api_policy)에 두고 RPC 가 계정 전체·계열·사이트 버킷을 한
// 트랜잭션에서 원자적으로 검사·증가한다. 이 배치도 반드시 장부를 거친다 — 안 거치면
// 다른 서비스가 남은 여유를 오판한다.
//   장부 본체: goldbox-today/supabase/migrations/supabase-cp-api-ledger-migration.sql
//   정책 행  : supabase/migrations/20260925-cp-api-policy-score.sql  ← 먼저 적용해야 함
// 공용 장부의 프로젝트 스코프. 쿠팡 채널 ID(SUB_ID)와는 별개다 —
// 이건 우리 Supabase 장부에서 프로젝트를 가르는 이름이고, 도메인을 따른다.
const LEDGER_SITE = "score";
const LEDGER_BUCKET = "coupang-deeplink";

const GIFTS = "src/data/gifts.json";
const LINKS = "src/data/gift-links.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const searchUrl = (q) => `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}`;

function ledger() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * 쏘기 전에 남은 여유를 읽어 보고한다.
 *
 * RPC(consumeQuota)는 콜 단위로 막아주지만, "지금 계정이 얼마나 달아올라 있는지"는
 * 알려주지 않는다. 다른 서비스가 이미 시간당 한도 근처까지 썼다면 배치를 나중으로
 * 미루는 편이 낫다 — 경고 3회면 계정이 묶인다.
 *
 * 테이블 직접 조회는 service role 이 필요하다. anon 키뿐이면 못 읽지만, 그때도
 * RPC 가드는 그대로 동작하므로 경고만 남기고 진행한다.
 */
async function reportHeadroom(db, callsNeeded) {
  if (!db) return true;

  const wanted = [
    ["account", "all"],
    ["account", "deeplink"],
    [LEDGER_SITE, LEDGER_BUCKET],
  ];

  const { data: pol, error: pe } = await db
    .from("cp_api_policy")
    .select("scope,bucket,window_seconds,max_count");
  const { data: rows, error: qe } = await db
    .from("cp_api_quota")
    .select("bucket,window_start,count")
    .gte("window_start", new Date(Date.now() - 86400_000).toISOString());

  if (pe || qe || !pol || !rows) {
    console.warn("⚠ 장부를 직접 읽지 못했어 (service role 키 필요). RPC 가드로만 진행할게.");
    return true;
  }

  // 버킷 키는 '<scope>:<bucket>:<window>'.
  // 아직 안 닫힌 윈도의 행만 현재 사용량이다. 최신 행을 그냥 집으면, 이미 지나간
  // 분 윈도의 숫자를 현재치로 읽어 멀쩡한 배치를 막는다.
  const now = Date.now();
  const current = new Map();
  for (const r of rows) {
    const w = Number(r.bucket.split(":").pop());
    if (!Number.isFinite(w)) continue;
    if (new Date(r.window_start).getTime() + w * 1000 <= now) continue; // 닫힌 윈도
    const cur = current.get(r.bucket);
    if (!cur || new Date(r.window_start) > new Date(cur.window_start)) current.set(r.bucket, r);
  }

  console.log("\n남은 여유:");
  let tightest = Infinity;
  for (const [scope, bucket] of wanted) {
    for (const w of [60, 3600, 86400]) {
      const rule = pol.find(
        (x) => x.scope === scope && x.bucket === bucket && x.window_seconds === w,
      );
      if (!rule) continue;
      const key = `${scope}:${bucket}:${w}`;
      const used = current.get(key)?.count ?? 0;
      const left = rule.max_count - used;
      const label = w === 60 ? "분당" : w === 3600 ? "시간당" : "일간";
      console.log(`  ${key.padEnd(34)} ${label.padEnd(4)} ${used}/${rule.max_count}  남음 ${left}`);
      if (left < tightest) tightest = left;
    }
  }

  if (tightest < callsNeeded) {
    console.error(
      `\n⛔ 가장 빡빡한 버킷의 남은 여유(${tightest})가 필요한 호출 수(${callsNeeded})보다 적어. 중단.\n` +
        "   잠시 뒤 다시 돌리면 윈도가 넘어가면서 풀려.",
    );
    return false;
  }
  console.log(`  → 필요 ${callsNeeded}콜, 가장 빡빡한 여유 ${tightest}. 진행.\n`);
  return true;
}

/**
 * 장부에서 1콜 소비. true 일 때만 API 를 쏜다.
 *
 * fail-closed — 장부에 못 닿으면 거부한다. 배치는 나중에 다시 돌리면 그만이고,
 * 한도를 모르는 채로 쏘는 쪽이 훨씬 비싸다(경고 3회 = 계정 이용 제한).
 */
async function consumeQuota(db) {
  if (!db) {
    console.error(
      "공용 장부에 접속할 수 없어 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n" +
        "계정 한도를 확인하지 않고 쏘지 않는다 — 중단.",
    );
    return false;
  }
  const { data, error } = await db.rpc("cp_try_consume_quota", {
    p_site: LEDGER_SITE,
    p_bucket: LEDGER_BUCKET,
  });
  if (error) {
    console.error(`장부 RPC 오류: ${error.message} — 중단.`);
    return false;
  }
  if (data !== true) {
    console.error(
      `한도 초과 (${LEDGER_SITE}:${LEDGER_BUCKET}). 잔여는 SELECT * FROM cp_api_usage 로 확인.\n` +
        "정책 행이 없으면 supabase/migrations/20260925-cp-api-policy-score.sql 을 먼저 적용해.",
    );
    return false;
  }
  return true;
}

async function main() {
  const { catalog } = JSON.parse(fs.readFileSync(GIFTS, "utf8"));
  const links = fs.existsSync(LINKS) ? JSON.parse(fs.readFileSync(LINKS, "utf8")) : {};

  const todo = Object.entries(catalog)
    .filter(([id]) => FORCE || !links[id])
    .map(([id, v]) => ({ id, url: searchUrl(v.query) }));

  if (!todo.length) {
    console.log("생성할 링크 없음. (--force 로 전체 재생성)");
    return;
  }

  const calls = Math.ceil(todo.length / CHUNK);
  console.log(`대상 ${todo.length}건 → API 호출 ${calls}회 (채널 subId=${SUB_ID})`);

  if (DRY) {
    todo.forEach((t) => console.log(`  ${t.id}\t${t.url}`));
    await reportHeadroom(ledger(), calls); // 읽기 전용 — 소비하지 않는다
    return;
  }
  if (!ACCESS || !SECRET) {
    console.error("COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 가 필요해.");
    process.exit(1);
  }

  const client = new CoupangPartnersClient({ accessKey: ACCESS, secretKey: SECRET });
  const db = ledger();

  if (!(await reportHeadroom(db, calls))) process.exit(1);

  for (let i = 0; i < todo.length; i += CHUNK) {
    const batch = todo.slice(i, i + CHUNK);

    if (!(await consumeQuota(db))) {
      console.error(`중단 — ${Object.keys(links).length}건까지는 저장됐어. 나중에 다시 돌리면 이어서 받아.`);
      process.exit(1);
    }

    const res = await client.deeplink({
      coupangUrls: batch.map((b) => b.url),
      subId: SUB_ID,
    });

    if (res.rCode !== "0") {
      throw new Error(`쿠팡 API 오류 ${res.rCode}: ${res.rMessage}`);
    }

    // 응답 순서에 기대지 않고 originalUrl 로 되짚는다
    const byUrl = new Map((res.data ?? []).map((d) => [d.originalUrl, d]));
    for (const b of batch) {
      const hit = byUrl.get(b.url);
      const link = hit?.shortenUrl || hit?.landingUrl;
      if (link) links[b.id] = link;
      else console.warn(`  ! ${b.id} 링크 없음`);
    }

    console.log(`  ${Math.min(i + CHUNK, todo.length)}/${todo.length}`);
    fs.writeFileSync(LINKS, JSON.stringify(links, null, 2) + "\n"); // 중간 저장 → 실패해도 재시도 비용 최소
    if (i + CHUNK < todo.length) await sleep(DELAY_MS);
  }

  console.log(`✓ ${Object.keys(links).length}/${Object.keys(catalog).length} 완료 → ${LINKS}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
