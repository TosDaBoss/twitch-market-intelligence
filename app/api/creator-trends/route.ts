import { NextRequest, NextResponse } from "next/server";
import { generateCreatorGrowth } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get("gameId") ?? undefined;
  const data = generateCreatorGrowth(gameId);

  return NextResponse.json({ data, gameId });
}
