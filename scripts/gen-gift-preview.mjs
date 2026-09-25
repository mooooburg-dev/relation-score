/**
 * gifts.json → src/data/gift-preview.json (유형별 대표 선물 3개 이름만)
 *
 * 왜 따로 빼는가: 결과 화면(ScoreApp)은 클라이언트 컴포넌트라 gifts.ts 를 import 하면
 * pairs.json(878KB)까지 번들에 딸려온다. 이름 세 개만 뽑아 두면 1KB 남짓으로 끝난다.
 *
 * gifts.json 의 picks 를 고치면 다시 돌린다:  npm run gift-preview
 */
import fs from "node:fs";

const g = JSON.parse(fs.readFileSync("src/data/gifts.json", "utf8"));
const out = {};
for (const [type, v] of Object.entries(g.types)) {
  out[type] = v.picks.slice(0, 3).map(([id]) => g.catalog[id].label);
}
fs.writeFileSync("src/data/gift-preview.json", JSON.stringify(out, null, 2) + "\n");
console.log(`✓ ${Object.keys(out).length}개 유형 → src/data/gift-preview.json`);
console.log(`  예) INFJ: ${out.INFJ.join(" · ")}`);
