import fs from "node:fs";
import path from "node:path";

function readPrompt(name: string): string {
  return fs.readFileSync(path.join(process.cwd(), "prompts", name), "utf8").trim();
}

export function loadSystemPrompt(): string {
  return readPrompt("system.md");
}

export function loadUserPrompt(vars: Record<string, string>): string {
  let t = readPrompt("user.md");
  for (const [k, v] of Object.entries(vars)) {
    t = t.replaceAll(`{{${k}}}`, v);
  }
  return t;
}
