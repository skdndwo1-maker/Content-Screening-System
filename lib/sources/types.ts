import type { ExternalSourceId, ExternalSourceState, ReportFinding, WebSearchEvidence } from "@/lib/types";

export interface SourceRunCtx {
  findings: ReportFinding[];
  ctx: {
    name: string;
    type: string;
    date?: string;
    channels?: string[];
  };
}

export interface SourceResult {
  id: ExternalSourceId;
  status: ExternalSourceState;
  findings?: ReportFinding[];
  error?: string;
  note?: string;
}

export interface ExternalSourceProvider {
  id: ExternalSourceId;
  enabled(): boolean;
  run(ctx: SourceRunCtx, signal: AbortSignal): Promise<SourceResult>;
}

export type FindingSearchMap = Record<string, WebSearchEvidence>;
