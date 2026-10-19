import { grokConfigured } from "@/lib/llm/gemini";
import { grokEnabled } from "./flags";
import type { ExternalSourceProvider, SourceResult } from "./types";

export const grokProvider: ExternalSourceProvider = {
  id: "grok",
  enabled: grokEnabled,
  async run(): Promise<SourceResult> {
    if (!grokConfigured()) {
      return { id: "grok", status: "error", error: "GROK_API_KEY 없음" };
    }
    return { id: "grok", status: "error", error: "Grok 클라이언트 미구현" };
  },
};
