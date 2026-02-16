import { NextResponse } from "next/server";
import { generateSnapshots } from "@/lib/mockData";

// In production, this would query Supabase for the latest snapshots.
// For development, we serve mock data.

export async function GET() {
  const snapshots = generateSnapshots();

  return NextResponse.json({
    snapshots,
    updatedAt: new Date().toISOString(),
  });
}
