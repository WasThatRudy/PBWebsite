/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import OrgList from "@/lib/db/models/orgList";
import { refreshOrgTagCache } from "@/lib/data/orgs";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const program = req.nextUrl.searchParams.get("program");
    const query: Record<string, any> = {};

    if (program === "gsoc" || program === "lfx") {
      query.programs = program;
    }

    const orgs = await OrgList.find(query, { __v: 0 })
      .sort({ login: 1 })
      .lean();

    return NextResponse.json({ data: orgs, total: orgs.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch org lists" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { action } = body;

    // 🔥 REPLACEMENT FOR "seed"
    if (action === "bulkUpsert") {
      const { orgs } = body;

      if (!Array.isArray(orgs) || orgs.length === 0) {
        return NextResponse.json(
          { error: "orgs[] required" },
          { status: 400 }
        );
      }

      let upserted = 0;

      for (const org of orgs) {
        const login = org.login?.toLowerCase();
        const programs = (org.programs || []).filter(
          (p: string) => p === "gsoc" || p === "lfx"
        );

        if (!login || programs.length === 0) continue;

        await OrgList.findOneAndUpdate(
          { login },
          { login, programs },
          { upsert: true, new: true }
        );

        upserted++;
      }

      await refreshOrgTagCache();

      return NextResponse.json({
        message: `Upserted ${upserted} orgs`,
        upserted,
      });
    }

    // single upsert
    if (action === "upsert") {
      const { login, programs } = body;

      if (!login || !Array.isArray(programs) || programs.length === 0) {
        return NextResponse.json(
          { error: "login and programs[] required" },
          { status: 400 }
        );
      }

      const valid = programs.filter(
        (p: string) => p === "gsoc" || p === "lfx"
      );

      const doc = await OrgList.findOneAndUpdate(
        { login: login.toLowerCase() },
        { login: login.toLowerCase(), programs: valid },
        { upsert: true, new: true }
      );

      await refreshOrgTagCache();

      return NextResponse.json({
        message: "Org upserted",
        data: doc,
      });
    }

    // remove org
    if (action === "remove") {
      const { login } = body;

      if (!login) {
        return NextResponse.json(
          { error: "login required" },
          { status: 400 }
        );
      }

      await OrgList.deleteOne({ login: login.toLowerCase() });

      await refreshOrgTagCache();

      return NextResponse.json({
        message: `Removed ${login}`,
      });
    }

    // add program
    if (action === "addProgram") {
      const { login, program } = body;

      if (!login || (program !== "gsoc" && program !== "lfx")) {
        return NextResponse.json(
          { error: "login and program (gsoc|lfx) required" },
          { status: 400 }
        );
      }

      const doc = await OrgList.findOneAndUpdate(
        { login: login.toLowerCase() },
        { $addToSet: { programs: program } },
        { upsert: true, new: true }
      );

      await refreshOrgTagCache();

      return NextResponse.json({
        message: `Added ${program} to ${login}`,
        data: doc,
      });
    }

    // remove program
    if (action === "removeProgram") {
      const { login, program } = body;

      if (!login || !program) {
        return NextResponse.json(
          { error: "login and program required" },
          { status: 400 }
        );
      }

      const doc = await OrgList.findOne({
        login: login.toLowerCase(),
      });

      if (!doc) {
        return NextResponse.json(
          { error: `Org "${login}" not found` },
          { status: 404 }
        );
      }

      const remaining = doc.programs.filter((p) => p !== program);

      if (remaining.length === 0) {
        await OrgList.deleteOne({ login: login.toLowerCase() });
      } else {
        doc.programs = remaining;
        await doc.save();
      }

      await refreshOrgTagCache();

      return NextResponse.json({
        message: `Removed ${program} from ${login}`,
      });
    }

    return NextResponse.json(
      {
        error:
          "Unknown action. Valid: bulkUpsert | upsert | remove | addProgram | removeProgram",
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API] POST /orglists error:", err);

    return NextResponse.json(
      { error: "Failed to update org lists" },
      { status: 500 }
    );
  }
}