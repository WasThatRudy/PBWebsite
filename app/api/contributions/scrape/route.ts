/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { runScrapeJob } from "@/lib/server/contributions";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || key !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incremental  = req.nextUrl.searchParams.get("incremental") === "true";
  const membersParam = req.nextUrl.searchParams.get("members");
  const memberFilter = membersParam
    ? membersParam.split(",").map((m) => m.trim()).filter(Boolean)
    : undefined;

  try {
    runScrapeJob({ incremental, memberFilter }).catch((err) =>
      console.error("[Scrape] Job failed:", err)
    );
    return NextResponse.json({ message: "Scrape job started", incremental, memberFilter: memberFilter ?? "all" }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to start scrape job" }, { status: 500 });
  }
}