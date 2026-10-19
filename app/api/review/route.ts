import { NextRequest, NextResponse } from "next/server";
import { runReview, type ReviewRequest } from "@/lib/review/pipeline";
import { geminiApiKey, shortError } from "@/lib/llm/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!geminiApiKey()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY 가 .env 에 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let body: ReviewRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 파싱할 수 없습니다." }, { status: 400 });
  }

  try {
    const result = await runReview({
      textValue: body.textValue || "",
      namingRows: body.namingRows || [],
      ctx: body.ctx || { name: "", date: "", channels: [], targets: [], type: "", intent: "" },
      enabledCriteria: body.enabledCriteria || {},
      uploadTab: body.uploadTab || "text",
      images: body.images,
      termsJson: body.termsJson,
      rulesJson: body.rulesJson,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: shortError(e) }, { status: 500 });
  }
}
