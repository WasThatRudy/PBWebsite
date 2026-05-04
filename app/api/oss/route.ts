import { NextResponse } from "next/server";
import { createEmptyOssResponse } from "@/lib/oss";

export async function GET() {
  return NextResponse.json(createEmptyOssResponse());
}
