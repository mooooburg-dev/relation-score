// MBTI 유형(16) + 조합(136) 정적 콘텐츠 생성 스크립트.
// 실행: node scripts/generate-content.mjs [types|pairs|all] [--force] [--provider anthropic|openai]
// - 기본 provider는 anthropic(Claude Opus 5). --provider openai 시 OPENAI_API_KEY로 gpt-5.4 사용
// - 두 provider 모두 JSON Schema 구조화 출력 사용
// - 이미 생성된 항목은 건너뜀(--force 시 재생성) → 중단돼도 이어서 실행 가능
// - 결과: src/data/types.json, src/data/pairs.json

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROOT, "src/data");
const TYPES_PATH = resolve(DATA_DIR, "types.json");
const PAIRS_PATH = resolve(DATA_DIR, "pairs.json");

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

const MBTI = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];
const RELATIONS = ["연인", "친구", "직장동료", "가족", "소개팅", "썸"];

const SYSTEM = `너는 한국어로 MBTI 궁합 콘텐츠를 쓰는 에디터야.
- 독자는 검색으로 들어온 10~30대. 친근한 반말체("~해", "~야")로 쓰되, 정보가 실제로 있어야 해. 근거 없는 밈만 나열하지 마.
- 인지 기능(Fe, Ti, Ne 등) 같은 전문 용어는 꼭 필요할 때만 한 번 쓰고 바로 쉽게 풀어줘.
- 각 문장은 짧게. 이모지는 headline/nickname 외에는 쓰지 마.
- 같은 표현을 반복하지 말고, 다른 조합·유형과 구분되는 구체적인 묘사를 써.
- 특정 회사의 상표(예: 16Personalities의 유형 별명)를 그대로 베끼지 말고 새로 지어.`;

const TYPE_SCHEMA = {
  type: "object",
  properties: {
    nickname: { type: "string", description: "유형 별명, 3~6글자 명사구 (예: 조용한 설계자)" },
    tagline: { type: "string", description: "한 줄 소개 20자 내외" },
    intro: { type: "string", description: "유형 성향 소개 4~5문장" },
    loveStyle: { type: "string", description: "연애 스타일 3문장" },
    friendStyle: { type: "string", description: "우정/친구 관계 스타일 2문장" },
    workStyle: { type: "string", description: "직장/협업 스타일 2문장" },
    keywords: { type: "array", items: { type: "string" }, description: "성향 키워드 5개, 각 2~4글자" },
    faq: {
      type: "array",
      description: "검색 질문형 FAQ 3개",
      items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string", description: "2~3문장" } },
        required: ["q", "a"],
  additionalProperties: false,
      },
    },
  },
  required: ["nickname", "tagline", "intro", "loveStyle", "friendStyle", "workStyle", "keywords", "faq"],
  additionalProperties: false,
};

const PAIR_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "조합을 한 줄로 요약한 제목, 15자 내외, 이모지 1개 허용" },
    overall: { type: "integer", description: "종합 궁합 점수 0~100" },
    summary: { type: "string", description: "두 유형이 만났을 때의 전반적 케미 4~5문장" },
    relations: {
      type: "array",
      description: "관계 유형별 분석. 연인, 친구, 직장동료, 가족, 소개팅, 썸 순서로 6개",
      items: {
        type: "object",
        properties: {
          relation: { type: "string" },
          score: { type: "integer", description: "0~100" },
          summary: { type: "string", description: "이 관계에서의 케미 2~3문장" },
          tip: { type: "string", description: "이 관계를 잘 굴리는 실전 팁 1~2문장" },
        },
        required: ["relation", "score", "summary", "tip"],
  additionalProperties: false,
      },
    },
    strengths: { type: "array", items: { type: "string" }, description: "잘 맞는 포인트 3개, 각 1문장" },
    conflicts: { type: "array", items: { type: "string" }, description: "부딪히는 포인트 3개, 각 1문장" },
    advice: { type: "string", description: "두 사람에게 주는 조언 2~3문장" },
    faq: {
      type: "array",
      description: "검색 질문형 FAQ 3개 (예: 'INFJ와 ENTP는 연인으로 잘 맞나요?')",
      items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string", description: "2~3문장" } },
        required: ["q", "a"],
  additionalProperties: false,
      },
    },
  },
  required: ["headline", "overall", "summary", "relations", "strengths", "conflicts", "advice", "faq"],
  additionalProperties: false,
};

async function callAnthropic(prompt, schema) {
  const res = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("empty response");
  return JSON.parse(text);
}

async function callOpenAI(prompt, schema) {
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
        { role: "system", content: SYSTEM },
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

async function generate(prompt, schema, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return PROVIDER === "openai"
        ? await callOpenAI(prompt, schema)
        : await callAnthropic(prompt, schema);
    } catch (e) {
      console.warn(`  재시도 ${i + 1}/${retries}:`, e.message ?? e);
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error("생성 실패");
}

function readJson(p, fallback) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJson(p, data) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

// 동시 실행 제한
async function runPool(items, worker, concurrency = 4) {
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const item = items[idx++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function generateTypes(force) {
  const data = readJson(TYPES_PATH, {});
  const todo = MBTI.filter((t) => force || !data[t]);
  console.log(`유형: ${todo.length}개 생성`);
  await runPool(todo, async (t) => {
    console.log(`- ${t}`);
    const out = await generate(
      `MBTI 유형 ${t}에 대한 소개 콘텐츠를 만들어줘. "${t} 궁합", "${t} 특징", "${t} 연애"로 검색한 사람이 만족할 내용이어야 해.`,
      TYPE_SCHEMA,
    );
    data[t] = { type: t, ...out };
    writeJson(TYPES_PATH, data);
  });
}

function pairKey(a, b) {
  return [a, b].sort().join("-");
}

async function generatePairs(force) {
  const data = readJson(PAIRS_PATH, {});
  const pairs = [];
  for (let i = 0; i < MBTI.length; i++)
    for (let j = i; j < MBTI.length; j++) pairs.push([MBTI[i], MBTI[j]]);
  const todo = pairs.filter(([a, b]) => force || !data[pairKey(a, b)]);
  console.log(`조합: ${todo.length}개 생성`);
  await runPool(todo, async ([a, b]) => {
    const key = pairKey(a, b);
    console.log(`- ${key}`);
    const same = a === b ? " (같은 유형끼리의 조합이야. 닮아서 편한 점과 닮아서 답답한 점을 함께 다뤄.)" : "";
    const out = await generate(
      `MBTI ${a}와 ${b}의 궁합 콘텐츠를 만들어줘.${same}
"${a} ${b} 궁합"으로 검색한 사람이 만족할 내용이어야 해.
점수 지침:
- 0~100 범위를 넓게 써. 실제 성향 상 잘 맞는 조합은 80~96, 보통은 55~79, 자주 부딪히는 조합은 30~54. 모든 조합이 비슷한 점수면 안 돼.
- 관계 유형(${RELATIONS.join(", ")})마다 점수가 달라야 해. 연인으로는 별로여도 친구·동료로는 좋을 수 있어.
- relations 배열은 반드시 ${RELATIONS.join(", ")} 순서로 6개.`,
      PAIR_SCHEMA,
    );
    // 관계 순서/개수 보정
    const byRel = Object.fromEntries((out.relations ?? []).map((r) => [r.relation, r]));
    out.relations = RELATIONS.map(
      (r) => byRel[r] ?? { relation: r, score: out.overall, summary: "", tip: "" },
    );
    data[key] = { a, b, ...out };
    writeJson(PAIRS_PATH, data);
  });
}

const mode = process.argv[2] ?? "all";
const force = process.argv.includes("--force");
if (mode === "types" || mode === "all") await generateTypes(force);
if (mode === "pairs" || mode === "all") await generatePairs(force);
console.log("완료");
