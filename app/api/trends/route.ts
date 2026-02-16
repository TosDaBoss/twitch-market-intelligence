import { NextRequest, NextResponse } from "next/server";
import { generateViewerTrends } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") === "30d" ? "30d" : "7d";
  const data = generateViewerTrends(period);

  return NextResponse.json({ data, period });
}
