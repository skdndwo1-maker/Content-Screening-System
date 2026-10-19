import { NextRequest, NextResponse } from "next/server";
import { runSource } from "@/lib/sources/runner";
import type { ExternalSourceId, ReportFinding } from "@/lib/types";

const IDS: ExternalSourceId[] = ["websearch", "grok", "naver"];

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { source?: ExternalSourceId; findings?: ReportFinding[]; ctx?: { name?: string; type?: string; date?: string; channels?: string[] } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 본문을 파싱할 수 없습니다." }, { status: 400 });
  }

  const source = body.source;
  if (!source || !IDS.includes(source)) {
    return NextResponse.json({ error: "source 가 올바르지 않습니다." }, { status: 400 });
  }

  const result = await runSource(source, {
    findings: Array.isArray(body.findings) ? body.findings : [],
    ctx: {
      name: body.ctx?.name || "",
      type: body.ctx?.type || "",
      date: body.ctx?.date,
      channels: body.ctx?.channels,
    },
  });

  return NextResponse.json(result);
}
