import OrgList from "@/lib/db/models/orgList";
import connectDB from "@/lib/db/connection";

export type OrgTag = "gsoc" | "lfx" | "both" | "none";

let cache: Map<string, OrgTag> | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function buildCache(): Promise<Map<string, OrgTag>> {
  await connectDB();
  const docs = await OrgList.find({}, { login: 1, programs: 1 }).lean();
  const map = new Map<string, OrgTag>();
  for (const doc of docs) {
    const inGsoc = doc.programs.includes("gsoc");
    const inLfx  = doc.programs.includes("lfx");
    if (inGsoc && inLfx) map.set(doc.login, "both");
    else if (inGsoc)     map.set(doc.login, "gsoc");
    else if (inLfx)      map.set(doc.login, "lfx");
  }
  return map;
}

async function getCache(): Promise<Map<string, OrgTag>> {
  const now = Date.now();
  if (cache && now - cacheBuiltAt < CACHE_TTL_MS) return cache;
  cache = await buildCache();
  cacheBuiltAt = now;
  return cache;
}

export async function refreshOrgTagCache(): Promise<void> {
  cache = await buildCache();
  cacheBuiltAt = Date.now();
}
export async function ensureOrgTagCache(): Promise<void> {
  if (!cache) {
    cache = await buildCache();
    cacheBuiltAt = Date.now();
  }
}

export async function getOrgTag(org: string): Promise<OrgTag> {
  const map = await getCache();
  return map.get(org.toLowerCase()) ?? "none";
}

// Safe only after cache has been warmed — used inside scrape job
export function getOrgTagSync(orgLogin: string): OrgTag {
  if (!cache) {
    throw new Error("Org tag cache not initialized");
  }
  return cache.get(orgLogin.toLowerCase()) ?? "none";
}
