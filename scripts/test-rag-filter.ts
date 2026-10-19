import { filterEffectiveChunks } from "../lib/rag/search";
import { loadChunks } from "../lib/rag/store";
import { parseKnowledgeMarkdown, isChunkEffective } from "../lib/rag/parse";
import fs from "node:fs";
import path from "node:path";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const { chunks } = loadChunks();
assert(chunks.length > 0, "knowledge chunks should load");

const expired = chunks.find(c => c.chunk_id === "expired-tta-device-001");
assert(Boolean(expired), "expired chunk exists");
assert(!isChunkEffective(expired!, "2026-10-13"), "expired 단통법 chunk must be excluded on 2026-10-13");
assert(isChunkEffective(expired!, "2024-01-01"), "expired chunk still valid before effective_to");

const unlimited = filterEffectiveChunks(chunks, {
  tab: "text",
  channels: ["SNS"],
  publishDate: "2026-10-13",
  codes: ["UNLIMITED_CLAIM"],
});
assert(
  unlimited.some(c => c.chunk_id === "telecom-unlimited-001"),
  "UNLIMITED_CLAIM seed must be retrieved"
);
assert(
  !unlimited.some(c => c.chunk_id === "expired-tta-device-001"),
  "expired chunk must not leak into other codes"
);

const device = filterEffectiveChunks(chunks, {
  tab: "text",
  channels: ["WEB"],
  publishDate: "2026-10-13",
  codes: ["DEVICE_SUBSIDY"],
});
assert(
  device.every(c => c.chunk_id !== "expired-tta-device-001"),
  "DEVICE_SUBSIDY search excludes expired 단통법 chunk"
);
assert(
  device.some(c => c.chunk_id === "telecom-device-current-001"),
  "current device subsidy chunk remains"
);

const raw = fs.readFileSync(path.join(process.cwd(), "knowledge", "telecom.md"), "utf8");
const parsed = parseKnowledgeMarkdown(raw, "2026-10-13");
assert(parsed.length >= 4, "telecom.md parses multiple chunks");

console.log("rag filter tests passed", { chunks: chunks.length, unlimited: unlimited.length, device: device.length });
