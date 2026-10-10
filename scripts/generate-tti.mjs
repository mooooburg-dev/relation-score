// 띠 궁합 정적 콘텐츠 생성 스크립트 — 12띠 소개 + 78개 조합.
// 실행: npm run tti-content -- [types|pairs|all] [--force] [--provider anthropic|openai]
//   (TS 규칙 파일을 직접 import 하므로 node --experimental-strip-types 로 돈다 — package.json 참고)
//
// 점수는 AI 가 정하지 않는다. src/lib/tti-rules.ts 가 합·충·원진·형·해·오행으로 계산한
// 종합 점수와 근거를 프롬프트에 넣고, AI 는 그 점수에 맞는 본문과 관계별 세부 점수
// (종합 ±8 이내, 아래 validate 로 강제)만 쓴다.
//
// - 이미 생성된 항목은 건너뜀(--force 시 재생성) → 중단돼도 이어서 실행 가능
// - 결과: src/data/tti-types.json, src/data/tti-pairs.json
// - 생성 후 src/lib/tti-content.ts 의 TTI_CONTENT_UPDATED 를 갱신한다

import { resolve } from "node:path";
import { DATA_DIR, generate, readJson, runPool, writeJson } from "./lib/llm.mjs";
import { TTI_LIST, scoreTti } from "../src/lib/tti-rules.ts";

const TYPES_PATH = resolve(DATA_DIR, "tti-types.json");
const PAIRS_PATH = resolve(DATA_DIR, "tti-pairs.json");

const RELATIONS = ["연인", "부부", "친구", "직장동료", "부모자식"];
const SPREAD = 8;

const SYSTEM = `너는 한국어로 띠 궁합 콘텐츠를 쓰는 에디터야.
- 독자는 검색으로 들어온 20~60대. 친근한 반말체("~해", "~야")로 쓰되, 정보가 실제로 있어야 해.
- 전통 명리의 띠(지지) 해석을 바탕으로 쓰되 단정하지 마. "~하기 쉬워", "~하는 편이야"처럼 경향으로 말해.
- 이별·이혼·질병·사고·죽음·재물 손실을 예언하거나 겁주는 표현은 절대 쓰지 마. 부적·굿·개명 같은 유료 해결책을 권하지 마.
- 합·충·원진 같은 용어는 근거로 한 번 쓰고 바로 쉬운 말로 풀어줘.
- 각 문장은 짧게. 이모지는 headline/nickname 외에는 쓰지 마.
- 같은 표현을 반복하지 말고, 다른 띠·조합과 구분되는 구체적인 묘사를 써.`;

const FAQ = {
  type: "array",
  description: "검색 질문형 FAQ 3개",
  items: {
    type: "object",
    properties: { q: { type: "string" }, a: { type: "string", description: "2~3문장" } },
    required: ["q", "a"],
    additionalProperties: false,
  },
};

const TYPE_SCHEMA = {
  type: "object",
  properties: {
    nickname: { type: "string", description: "띠 성향 별명, 3~7글자 명사구 (예: 부지런한 살림꾼)" },
    tagline: { type: "string", description: "한 줄 소개 20자 내외" },
    intro: { type: "string", description: "띠 성향 소개 4~5문장" },
    loveStyle: { type: "string", description: "연애·결혼 스타일 3문장" },
    workStyle: { type: "string", description: "일·돈을 대하는 스타일 2문장" },
    giftAngle: { type: "string", description: "이 띠에게 선물할 때 먹히는 포인트 1문장" },
    keywords: { type: "array", items: { type: "string" }, description: "성향 키워드 5개, 각 2~4글자" },
    faq: FAQ,
  },
  required: ["nickname", "tagline", "intro", "loveStyle", "workStyle", "giftAngle", "keywords", "faq"],
  additionalProperties: false,
};

const PAIR_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string", description: "조합을 한 줄로 요약한 제목, 15자 내외, 이모지 1개 허용" },
    summary: { type: "string", description: "두 띠가 만났을 때의 전반적 케미 4~5문장. 주어진 근거(합·충 등)를 자연스럽게 녹여" },
    relations: {
      type: "array",
      description: `관계 유형별 분석. ${RELATIONS.join(", ")} 순서로 ${RELATIONS.length}개`,
      items: {
        type: "object",
        properties: {
          relation: { type: "string" },
          score: { type: "integer", description: `종합 점수 ±${SPREAD} 이내의 정수` },
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
    faq: FAQ,
  },
  required: ["headline", "summary", "relations", "strengths", "conflicts", "advice", "faq"],
  additionalProperties: false,
};

const name = (t) => `${t.ko}띠`;

function sampleYears(t) {
  const ys = [];
  for (let y = 1960; y <= 2026; y++) if ((((y - 4) % 12) + 12) % 12 === t.index) ys.push(y);
  return ys.join(", ");
}

async function generateTypes(force) {
  const data = readJson(TYPES_PATH, {});
  const todo = TTI_LIST.filter((t) => force || !data[t.id]);
  console.log(`띠: ${todo.length}개 생성`);
  await runPool(todo, async (t) => {
    console.log(`- ${name(t)}`);
    const out = await generate(
      SYSTEM,
      `${name(t)}(${t.branch}·${t.hanja}, 오행 ${t.element}, ${t.yinYang})의 소개 콘텐츠를 만들어줘.
출생연도: ${sampleYears(t)}
"${name(t)} 성격", "${name(t)} 궁합", "${name(t)} 특징"으로 검색한 사람이 만족할 내용이어야 해.
FAQ 중 하나는 "${name(t)}와 잘 맞는 띠"처럼 궁합 질문으로 하되, 답은 일반론으로만 써 (구체 점수는 쓰지 마).`,
      TYPE_SCHEMA,
    );
    data[t.id] = { id: t.id, ...out };
    writeJson(TYPES_PATH, data);
  });
}

function validatePair(overall) {
  return (out) => {
    if (!Array.isArray(out.relations) || out.relations.length !== RELATIONS.length)
      return `relations ${out.relations?.length}개`;
    for (const r of out.relations) {
      if (!RELATIONS.includes(r.relation)) return `알 수 없는 관계 ${r.relation}`;
      if (Math.abs(r.score - overall) > SPREAD) return `${r.relation} ${r.score}점이 범위 밖`;
      if (r.score > 96) return `${r.relation} ${r.score}점이 사이트 상한(96) 초과`;
    }
    return null;
  };
}

async function generatePairs(force) {
  const data = readJson(PAIRS_PATH, {});
  const pairs = [];
  for (let i = 0; i < TTI_LIST.length; i++)
    for (let j = i; j < TTI_LIST.length; j++) pairs.push([TTI_LIST[i], TTI_LIST[j]]);
  const todo = pairs.filter(([a, b]) => force || !data[`${a.id}-${b.id}`]);
  console.log(`조합: ${todo.length}개 생성`);

  await runPool(todo, async ([a, b]) => {
    const key = `${a.id}-${b.id}`;
    const { score, factors } = scoreTti(a.id, b.id);
    console.log(`- ${name(a)} × ${name(b)} (${score})`);
    const same =
      a.id === b.id
        ? `\n같은 띠끼리의 조합이야. 닮아서 편한 점과 닮아서 답답한 점을 함께 다뤄.`
        : "";
    const basis = factors.map((f) => `- ${f.name} (${f.delta >= 0 ? "+" : ""}${f.delta}): ${f.desc}`).join("\n");

    const out = await generate(
      SYSTEM,
      `${name(a)}(${a.branch}, ${a.element})와 ${name(b)}(${b.branch}, ${b.element})의 띠 궁합 콘텐츠를 만들어줘.${same}
"${name(a)} ${name(b)} 궁합", "${name(b)} ${name(a)} 궁합", "${name(a)} ${name(b)} 결혼 궁합"으로 검색한 사람이 만족할 내용이어야 해.

종합 점수는 이미 정해져 있어: ${score}점 (100점 만점, 이 사이트의 띠 궁합은 40~96점 분포).
점수 근거:
${basis}

지침:
- 본문의 톤이 점수와 맞아야 해. ${score}점인데 "최고의 궁합"이라거나 반대로 겁주면 안 돼.
- relations 는 반드시 ${RELATIONS.join(", ")} 순서로 ${RELATIONS.length}개. 각 score 는 ${score - SPREAD}~${Math.min(96, score + SPREAD)} 사이 정수이고 관계마다 달라야 해.
  (예: 충이 있는 조합은 연인으로는 끌림이 있어도 부부·부모자식처럼 매일 부딪히는 관계에서 낮아지는 식)
- 부모자식은 어느 쪽이 부모인지 정하지 말고 양방향으로 써.
- FAQ 는 "${name(a)} ${name(b)} 결혼해도 괜찮나요?" 같은 실제 검색 질문으로.`,
      PAIR_SCHEMA,
      { validate: validatePair(score) },
    );
    // 관계 순서 보정 (validate 를 통과했으므로 누락은 없다)
    const byRel = Object.fromEntries(out.relations.map((r) => [r.relation, r]));
    out.relations = RELATIONS.map((r) => byRel[r]);
    data[key] = { a: a.id, b: b.id, ...out };
    writeJson(PAIRS_PATH, data);
  });
}

// 키 순서를 지지 순서로 고정해서 커밋 diff 가 생성 순서(병렬)에 따라 흔들리지 않게 한다
function sortFile(path, keys) {
  const data = readJson(path, {});
  const sorted = {};
  for (const k of keys) if (data[k]) sorted[k] = data[k];
  writeJson(path, sorted);
}

const mode = process.argv[2] ?? "all";
const force = process.argv.includes("--force");
if (mode === "types" || mode === "all") {
  await generateTypes(force);
  sortFile(TYPES_PATH, TTI_LIST.map((t) => t.id));
}
if (mode === "pairs" || mode === "all") {
  await generatePairs(force);
  const keys = [];
  for (let i = 0; i < TTI_LIST.length; i++)
    for (let j = i; j < TTI_LIST.length; j++) keys.push(`${TTI_LIST[i].id}-${TTI_LIST[j].id}`);
  sortFile(PAIRS_PATH, keys);
}
console.log("완료");
