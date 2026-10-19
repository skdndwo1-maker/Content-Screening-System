import type { SourceType, TaxonomyChannel, UploadTab, Grade } from "@/lib/types";

export interface KnowledgeChunk {
  chunk_id: string;
  category_group: string;
  sub_code: string | string[];
  source_type: SourceType | string;
  source_title: string;
  source_ref: string;
  severity_default: "safe" | "caution" | "high" | Grade | string;
  applies_to: UploadTab[];
  channel: TaxonomyChannel[];
  effective_from: string;
  effective_to: string | null;
  ingested_at: string;
  embedding_model?: string;
  embedding?: number[];
  text: string;
}

export interface RagHit {
  chunk: KnowledgeChunk;
  score: number;
}

export interface RagQuery {
  codes: string[];
  tab: UploadTab;
  channels: TaxonomyChannel[];
  publishDate?: string;
  queryText: string;
  limit?: number;
}
