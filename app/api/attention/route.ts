import { NextRequest, NextResponse } from "next/server";
import { generateAttentionData } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId") ?? undefined;
  const data = generateAttentionData(gameId);

  return NextResponse.json({ data, gameId });
}
