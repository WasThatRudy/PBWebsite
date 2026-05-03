import { NextRequest, NextResponse } from "next/server";
import { runScrapeJob } from "@/lib/server/contributions";
import { verifyAuth } from "@/lib/verifyAuth"; // already exists in your project

/**
 * POST /api/contributions/scrape
 *
 * Two callers:
 *  1. Admin panel — sends a normal request with session auth
 *  2. Vercel Cron — sends the CRON_SECRET in Authorization header
 *
 */
export async function POST(req: NextRequest) {
  //Auth check
  const authHeader = req.headers.get("authorization");
  const isVercelCron =
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron) {
    //Fallback to session based admin auth
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
