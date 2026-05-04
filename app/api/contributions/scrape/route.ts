/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { runScrapeJob } from "@/lib/server/contributions";

/**
 * POST /api/contributions/scrape
 *
 * Triggers the GitHub scrape job in the background.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  try {
    const resultPromise = runScrapeJob();

    resultPromise.catch((err) =>
      console.error("[Scrape] Background job failed:", err)
    );

    return NextResponse.json({ message: "Scrape job started" }, { status: 202 });
  } catch (err: any) {
    console.error("[API] POST /contributions/scrape error:", err);
    return NextResponse.json(
      { error: "Failed to start scrape job" },
      { status: 500 }
    );
  }
}
