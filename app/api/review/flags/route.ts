import { NextResponse } from "next/server";
import { sourceFlags } from "@/lib/sources/flags";

export async function GET() {
  return NextResponse.json(sourceFlags());
}
