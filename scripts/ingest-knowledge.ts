import fs from "node:fs";
import path from "node:path";
import { loadChunks, writeIndex } from "../lib/rag/store";
import { embedTexts, geminiApiKey } from "../lib/llm/gemini";

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
  }
}

loadDotEnv();

async function main() {
  if (!geminiApiKey()) {
    throw new Error("GEMINI_API_KEY 가 필요합니다.");
  }
  const { chunks } = loadChunks();
  if (!chunks.length) {
    console.log("knowledge/ 에 청크가 없습니다.");
    return;
  }
  console.log(`청크 ${chunks.length}건 임베딩 중…`);
  const texts = chunks.map(c => `${c.source_title}\n${c.text}`.slice(0, 8000));
  const { vectors, model } = await embedTexts(texts);
  const ingested_at = new Date().toISOString().slice(0, 10);
  const withVec = chunks.map((c, i) => ({
    ...c,
    embedding: vectors[i] || [],
    embedding_model: model,
    ingested_at,
  }));
  writeIndex({ embedding_model: model, ingested_at, chunks: withVec });
  console.log(`저장 완료: data/rag/index.json (${withVec.length} chunks, model=${model})`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
