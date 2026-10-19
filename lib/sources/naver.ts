import { naverConfigured } from "@/lib/llm/gemini";
import { naverEnabled } from "./flags";
import type { ExternalSourceProvider, SourceResult } from "./types";

export const naverProvider: ExternalSourceProvider = {
  id: "naver",
  enabled: naverEnabled,
  async run(): Promise<SourceResult> {
    if (!naverConfigured()) {
      return { id: "naver", status: "error", error: "NAVER 키 없음" };
    }
    return { id: "naver", status: "error", error: "Naver 클라이언트 미구현" };
  },
};
