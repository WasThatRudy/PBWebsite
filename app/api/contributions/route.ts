/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  getOrgBreakdown,
  getGlobalStats,
  getContributorStats,
} from "@/lib/server/contributions";
import type { OrgTag } from "@/lib/data/orgs";

const VALID_TAGS = new Set<OrgTag>(["gsoc", "lfx", "both", "none"]);

/**
 * GET /api/contributions
 *
 * Three endpoints via ?view= param:
 *
 *   ?view=orgs
 *     Per-org breakdown — totalCommits, totalMergedPRs, contributor handles.
 *     Each org includes a `tag` field: "gsoc" | "lfx" | "both" | "none".
 *     Optionally filter by tag:  ?view=orgs&tag=gsoc
 *     This is what the OSS tab table consumes.
 *
 *   ?view=stats
 *     Global numbers — totalCommits, totalMergedPRs, totalOrgs, totalContributors.
 *     Use for the header/summary section of the OSS tab.
 *
 *   ?view=contributors
 *     Per-contributor stats — totalCommits, totalMergedPRs, orgs they contributed to.
 *     Pass ?username=handle to get a single member's stats.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view");
    const username = searchParams.get("username") ?? undefined;
    const tagFilter = searchParams.get("tag") as OrgTag | null;

    if (view === "orgs") {
      let data = await getOrgBreakdown();

      if (tagFilter) {
        if (!VALID_TAGS.has(tagFilter)) {
          return NextResponse.json(
            { error: `Invalid tag "${tagFilter}". Valid values: gsoc | lfx | both | none` },
            { status: 400 }
          );
        }
        data = data.filter((org: any) => org.tag === tagFilter);
      }

      return NextResponse.json({ data });
    }

    if (view === "stats") {
      const data = await getGlobalStats();
      return NextResponse.json(data);
    }

    if (view === "contributors") {
      const data = await getContributorStats(username);
      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: "Missing ?view= param. Valid values: orgs | stats | contributors" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API] GET /contributions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}

