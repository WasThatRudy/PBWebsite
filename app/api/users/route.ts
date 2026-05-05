/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/users";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}, { __v: 0 }).lean();
    return NextResponse.json({ data: users });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {

  const key = req.headers.get("x-api-key");

  //AUTH
  if (
    !key || (key !== process.env.SCRAPE_SECRET)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();

    console.log("Incoming users:", body.users?.length);

    //BULK INSERT/UPSERT
    if (Array.isArray(body.users)) {
      const results = [];
      const skipped = [];

      for (const m of body.users) {
        //VALIDATION
        if (!m.name || typeof m.name !== "string" || m.name.trim() === "") {
          console.log("❌ Invalid user skipped:", m);
          skipped.push(m);
          continue;
        }

        const cleanName = m.name.trim();

        try {
          const doc = await User.findOneAndUpdate(
            { name: cleanName }, //SINGLE SOURCE OF TRUTH
            {
              name: cleanName,
              githubUsername:
                m.githubUsername && m.githubUsername !== "NA"
                  ? m.githubUsername
                  : null,
              gitlabUsername:
                m.gitlabUsername && m.gitlabUsername !== "NA"
                  ? m.gitlabUsername
                  : null,
              customOrgLinks: Array.isArray(m.customOrgLinks)
                ? m.customOrgLinks
                : [],
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );

          results.push(doc);
        } catch (err) {
          console.error("❌ DB error for user:", m, err);
          skipped.push(m);
        }
      }

      return NextResponse.json({
        message: `Upserted ${results.length} users`,
        skipped: skipped.length,
        data: results,
      });
    }
    //SINGLE USER UPSERT
    const { name, githubUsername, gitlabUsername, customOrgLinks } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    const doc = await User.findOneAndUpdate(
      { name: cleanName }, // ✅ FIXED
      {
        name: cleanName,
        githubUsername:
          githubUsername && githubUsername !== "NA"
            ? githubUsername
            : null,
        gitlabUsername:
          gitlabUsername && gitlabUsername !== "NA"
            ? gitlabUsername
            : null,
        customOrgLinks: Array.isArray(customOrgLinks)
          ? customOrgLinks
          : [],
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      message: "User upserted",
      data: doc,
    });
  } catch (err: any) {
    console.error("❌ API ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save user" },
      { status: 500 }
    );
  }
}