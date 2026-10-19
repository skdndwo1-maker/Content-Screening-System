import { defaultCriteriaGroups } from "./criteria";

export const SYSTEM_INSTRUCTION = `당신은 LG U+ 브랜드 콘텐츠 사전 검수 시스템 'ContentGuard'의 1차 검수 AI입니다.
입력된 카피/텍스트/네이밍 후보를 아래 원칙에 따라 **보수적·방어적**으로 판정합니다.

[판정 등급]
- high (위험): 혐오·차별·명예훼손·법적 리스크·공공연한 사회 이슈 충돌 등 즉시 수정이 필요한 수준
- med (주의): 톤 완화·고지 보완·오해 소지가 있는 표현 등 수정 권고 수준
- low (안전): 특이사항 없음
- unverified (미검증): 사전/모델 기준만으로는 판정 불가하거나 외부 사례 확인이 필수인 경우

[점수]
- 각 판정에 0~100 사용 가능 점수. 높을수록 게시 가능. 위험도가 아님.
  * high: 0, med: 30~59, unverified: 35~75, low: 80~100
- 종합 판정은 호출자가 계산합니다. 당신은 개별 Finding만 반환.

[판정 원칙]
- 모델 기본 지식과 입력된 활성 기준(criteria)을 함께 근거로 사용.
- 사전/규칙이 모델 판단과 충돌하면 더 높은 위험을 택함 (prefer_higher_risk).
- 입력 콘텐츠에 리스크가 전혀 없다면 각 활성 기준에 대해 생성하지 말고, 전체 톤 평가 1건만 'low'로 반환.
- 리스크로 판정한 문구는 target 필드에 '원문 그대로' 담고, 하이라이트할 핵심 어휘는 highlight 배열에 분리해 넣음.
- 각 Finding 에는 반드시 category(활성 기준의 code 중 하나) 를 지정.
- 설명(aiText)은 2~4문장 한국어, 어떤 신호가 왜 리스크인지 구체적으로.
- 대안 제안(alternatives)은 선택 사항이지만, 리스크(high/med) 판정에는 1~3개 제시 권장. label 은 "톤 유지" | "안전 우선" | "간결" 중 하나.
- 외부 검증 소스(Grok/Naver)는 이번 호출에서 사용하지 않음. 반드시 sources: ["ai"] 로만 반환.
`;

interface BuildPromptInput {
  textValue: string;
  namingRows: string[];
  ctx: {
    name: string;
    date: string;
    channels: string[];
    targets: string[];
    type: string;
    intent: string;
  };
  enabledCriteria: Record<string, Record<string, boolean>>;
}

export function buildUserPrompt(input: BuildPromptInput): string {
  const { textValue, namingRows, ctx, enabledCriteria } = input;

  const activeItems: string[] = [];
  defaultCriteriaGroups.forEach(g => {
    g.items.forEach(it => {
      if (enabledCriteria[g.g]?.[it.k]) {
        activeItems.push(`- ${it.k} (${g.ko} > ${it.ko})${it.desc ? ` — ${it.desc}` : ""}`);
      }
    });
  });

  const samples: string[] = [];
  if (textValue.trim()) samples.push(`[텍스트 콘텐츠]\n${textValue.trim()}`);
  const names = namingRows.map(s => s.trim()).filter(Boolean);
  if (names.length) samples.push(`[네이밍/카피 후보]\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`);
  if (samples.length === 0) samples.push("[입력 없음]");

  return `아래 콘텐츠를 검수해 Findings 를 반환하세요.

### 검수 맥락
- 캠페인명: ${ctx.name || "(없음)"}
- 게시 예정일: ${ctx.date || "(없음)"}
- 게시 채널: ${ctx.channels.length ? ctx.channels.join(", ") : "(없음)"}
- 주요 타겟: ${ctx.targets.length ? ctx.targets.join(", ") : "(없음)"}
- 콘텐츠 유형: ${ctx.type || "(없음)"}
- 배경·의도: ${ctx.intent || "(없음)"}

### 활성 검수 기준 (code — 설명)
${activeItems.length ? activeItems.join("\n") : "- (활성 기준 없음)"}

### 검수 대상
${samples.join("\n\n")}

### 출력
responseSchema 에 맞는 JSON 만 반환. 설명·마크다운·코드블록 금지.`;
}

// Response schema for Gemini structured output (OpenAPI subset).
export const FINDINGS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "활성 criteria 의 code (예: hate, ad_law, timing_appropriateness)",
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
        description: "탐지 신호 요약 키워드 (예: '성별 혐오', '세대 조롱')",
      },
      grade: { type: "string", enum: ["high", "med", "unverified", "low"] },
      score: { type: "integer", minimum: 0, maximum: 100 },
      aiText: { type: "string", description: "2~4문장 판단 근거" },
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
  },
} as const;
