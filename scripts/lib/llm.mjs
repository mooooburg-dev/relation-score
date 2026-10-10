// 정적 콘텐츠 생성 스크립트들이 공유하는 LLM 호출부.
// (generate-content.mjs = MBTI, generate-tti.mjs = 띠 궁합)
// - 기본 provider는 anthropic(Claude Opus 5). --provider openai 시 OPENAI_API_KEY로 gpt-5.4 사용
// - 두 provider 모두 JSON Schema 구조화 출력 사용

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const DATA_DIR = resolve(ROOT, "src/data");

// ---- env ----
function loadEnv() {
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const PROVIDER = process.argv.includes("--provider")
  ? process.argv[process.argv.indexOf("--provider") + 1]
  : "anthropic";
const KEY_NAME = PROVIDER === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
if (!process.env[KEY_NAME]) {
  console.error(`${KEY_NAME} 가 없습니다 (.env.local)`);
  process.exit(1);
}

const anthropic = PROVIDER === "anthropic" ? new Anthropic() : null;
const ANTHROPIC_MODEL = "claude-opus-5";
const OPENAI_MODEL = "gpt-5.4";

async function callAnthropic(system, prompt, schema) {
  const res = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    system,
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("empty response");
  return JSON.parse(text);
}

async function callOpenAI(system, prompt, schema) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning_effort: "low",
      max_completion_tokens: 8000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "content", strict: true, schema },
      },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const msg = json.choices?.[0]?.message;
  if (msg?.refusal) throw new Error("refusal");
  if (!msg?.content) throw new Error("empty response");
  return JSON.parse(msg.content);
}

/**
 * 구조화 출력 1건 생성. validate 가 에러 문자열을 돌려주면 재시도한다
 * (스키마로 못 거는 조건 — 점수 범위 등 — 을 여기서 건다).
 */
export async function generate(system, prompt, schema, { retries = 3, validate } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const out =
        PROVIDER === "openai"
          ? await callOpenAI(system, prompt, schema)
          : await callAnthropic(system, prompt, schema);
      const problem = validate?.(out);
      if (problem) throw new Error(`검증 실패: ${problem}`);
      return out;
    } catch (e) {
      console.warn(`  재시도 ${i + 1}/${retries}:`, e.message ?? e);
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error("생성 실패");
}

export function readJson(p, fallback) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}
export function writeJson(p, data) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

// 동시 실행 제한
export async function runPool(items, worker, concurrency = 4) {
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const item = items[idx++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}
