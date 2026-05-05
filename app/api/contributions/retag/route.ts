/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { retagAllContributions } from "@/lib/server/contributions";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await retagAllContributions();
    return NextResponse.json({ message: "Retag complete", ...result });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to retag" }, { status: 500 });
  }
}