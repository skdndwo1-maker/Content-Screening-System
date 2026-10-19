const FINDING_ITEM = {
  type: "object",
  properties: {
    category: {
      type: "string",
      description: "활성 criteria 코드 (예: UNLIMITED_CLAIM, HATE)",
    },
    contentType: {
      type: "string",
      enum: ["카피", "텍스트", "이미지", "영상", "네이밍"],
    },
    target: { type: "string", description: "리스크로 판정한 원문 또는 범위. 원문 그대로." },
    highlight: {
      type: "array",
      items: { type: "string" },
      description: "target 안에서 하이라이트할 핵심 어휘들",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "탐지 신호 요약 키워드",
    },
    grade: { type: "string", enum: ["high", "med", "unverified", "low"] },
    score: { type: "integer", minimum: 0, maximum: 100, description: "사용 가능 점수. 100=게시 가능, 0=사용 불가. 위험도가 아님." },
    aiText: { type: "string", description: "2~4문장 판단 근거" },
    citedChunkIds: {
      type: "array",
      items: { type: "string" },
      description: "인용한 RAG chunk_id",
    },
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string", enum: ["톤 유지", "안전 우선", "간결"] },
          text: { type: "string" },
        },
        required: ["label", "text"],
      },
    },
    wholeContext: { type: "boolean", description: "문맥 전체가 대상이면 true" },
  },
  required: ["category", "contentType", "target", "keywords", "grade", "score", "aiText"],
} as const;

export const FINDINGS_SCHEMA = {
  type: "array",
  items: FINDING_ITEM,
} as const;

export const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    findings: FINDINGS_SCHEMA,
    hiddenJudgments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          path_id: { type: "string" },
          verdict: { type: "string", enum: ["high", "med", "unverified", "low"] },
          intent_likelihood: { type: "integer", minimum: 0, maximum: 100 },
          unnatural: { type: "boolean" },
          reason: { type: "string" },
          fix: { type: "string" },
        },
        required: ["term", "path_id", "verdict", "reason"],
      },
    },
    openSearch: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rule: { type: "string" },
          positions: {
            type: "array",
            items: {
              type: "array",
              items: { type: "integer" },
              minItems: 2,
              maxItems: 2,
            },
          },
          result: { type: "string" },
        },
        required: ["rule", "positions", "result"],
      },
    },
  },
  required: ["findings"],
} as const;
