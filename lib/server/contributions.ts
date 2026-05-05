/* eslint-disable @typescript-eslint/no-explicit-any */
import connectDB from "@/lib/db/connection";
import Contribution from "@/lib/db/models/contributions";
import Org from "@/lib/db/models/orgs";
import User from "@/lib/db/models/users";
import { getOrgTagSync, refreshOrgTagCache } from "@/lib/data/orgs";
import { fetchGitHubMergedPRs, clearGitHubCaches, extractOrgLogin } from "./scrapers/github";
import { fetchGitLabMergedMRs, resolveGitLabUserId } from "./scrapers/gitlab";
import type { RawContribution } from "./scrapers/types";


/**
 * Split a member's raw customOrgLinks array into GitHub and GitLab buckets
 * by inspecting the hostname of each URL.
 *
 * Examples that route to GitHub  : https://github.com/my-org
 * Examples that route to GitLab  : https://gitlab.com/my-group
 * Anything else is silently ignored (malformed URLs, other forges, etc.)
 */


function splitOrgLinks(links: string[]): { github: string[]; gitlab: string[] } {
  const github: string[] = [];
  const gitlab: string[] = [];

  for (const raw of links) {
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (url.hostname.includes("github.com")) github.push(raw);
      else if (url.hostname.includes("gitlab.com")) gitlab.push(raw);
    } catch {
    }
  }

  return { github, gitlab };
}

// saveContributions


async function saveContributions(contributions: RawContribution[]): Promise<void> {
  if (contributions.length === 0) return;

  const orgsMap = new Map<
    string,
    { login: string; avatarUrl: string; htmlUrl: string; platform: "github" | "gitlab" }
  >();

  for (const c of contributions) {
    const key = `${c.orgLogin.toLowerCase()}:${c.platform}`;
    if (!orgsMap.has(key)) {
      orgsMap.set(key, {
        login:     c.orgLogin,
        avatarUrl: c.orgAvatarUrl,
        htmlUrl:   c.orgHtmlUrl,
        platform:  c.platform,
      });
    }
  }

  for (const org of orgsMap.values()) {
    try {
      await Org.findOneAndUpdate(
        { login: org.login.toLowerCase(), platform: org.platform },
        { $set: { avatarUrl: org.avatarUrl, htmlUrl: org.htmlUrl, lastFetched: new Date() } },
        { upsert: true, returnDocument: 'before' },
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        try {
          await Org.updateOne(
            { login: org.login.toLowerCase(), platform: org.platform },
            { $set: { avatarUrl: org.avatarUrl, htmlUrl: org.htmlUrl, lastFetched: new Date() } },
          );
        } catch {
        }
      } else {
        throw err;
      }
    }
  }

  let saved = 0;
  for (const c of contributions) {
    const tag = getOrgTagSync(c.orgLogin);
    await Contribution.findOneAndUpdate(
      { username: c.username, url: c.url },
      {
        $set: {
          memberName:   c.memberName,
          username:     c.username,
          platform:     c.platform,
          repoFullName: c.repoFullName,
          orgLogin:     c.orgLogin,
          title:        c.title,
          url:          c.url,
          mergedAt:     c.mergedAt,
          tag,
          scrapedAt:    new Date(),
        },
      },
      { upsert: true, returnDocument: 'before' },
    );
    saved++;
  }

  console.log(`[DB] Saved ${saved} contributions across ${orgsMap.size} orgs`);
}

export interface ScrapeJobResult {
  users:       number;
  totalGitHub: number;
  totalGitLab: number;
  totalSaved:  number;
  errors:      string[];
}

export interface ScrapeJobOptions {
  incremental?:  boolean;
  memberFilter?: string[];
}

export async function runScrapeJob(options: ScrapeJobOptions = {}): Promise<ScrapeJobResult> {
  await connectDB();
  await refreshOrgTagCache();
  clearGitHubCaches();

  const { incremental = false, memberFilter } = options;

  // Fetch members from DB
  const query: Record<string, any> = memberFilter?.length
    ? { name: { $in: memberFilter } }
    : {};
  const members = await User.find(query).lean();

  if (members.length === 0) {
    throw new Error("No users found. Seed the Users collection first.");
  }
  console.log(`[Job] Scraping ${members.length} members (incremental=${incremental})`);

  let totalGitHub = 0;
  let totalGitLab = 0;
  const errors: string[] = [];

  for (const member of members) {
    const {
      name,
      githubUsername,
      gitlabUsername,
      customOrgLinks = [],
    } = member;

    let since: Date | undefined;
    if (incremental) {
      const latest = await Contribution.findOne({ memberName: name })
        .sort({ mergedAt: -1 })
        .lean();
      if (latest?.mergedAt) {
        // Go back 3 days to catch any PRs whose mergedAt timestamp was
        since = new Date(latest.mergedAt.getTime() - 3 * 24 * 60 * 60 * 1000);
      }
    }

    //Split org links by platform
    const { github: githubOrgLinks, gitlab: gitlabOrgLinks } = splitOrgLinks(customOrgLinks);

    const allContributions: RawContribution[] = [];

    // GitHub
    if (githubUsername) {
      try {
        console.log(
          `[Job] GitHub → ${githubUsername}` +
          (githubOrgLinks.length ? ` | explicit orgs: ${githubOrgLinks.map(extractOrgLogin).join(", ")}` : ""),
        );
        const prs = await fetchGitHubMergedPRs({
          username:       githubUsername,
          memberName:     name,
          customOrgLinks: githubOrgLinks,   // ← only GitHub URLs
          since,
        });
        allContributions.push(...prs);
        totalGitHub += prs.length;
      } catch (err: any) {
        const msg = `[GitHub] ${name} (${githubUsername}): ${err.message}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    //GitLab
    if (gitlabUsername) {
      try {
        // Resolve numeric GitLab user ID (cached on User doc after first run)
        let gitlabId: number | null = member.gitlabId ?? null;
        if (!gitlabId) {
          gitlabId = await resolveGitLabUserId(gitlabUsername);
          if (gitlabId) await User.updateOne({ _id: member._id }, { gitlabId });
        }
        if (!gitlabId) {
          throw new Error(`Could not resolve GitLab ID for "${gitlabUsername}"`);
        }

        console.log(
          `[Job] GitLab → ${gitlabUsername} (id: ${gitlabId})` +
          (gitlabOrgLinks.length ? ` | explicit groups: ${gitlabOrgLinks.join(", ")}` : ""),
        );
        const mrs = await fetchGitLabMergedMRs({
          username:       gitlabUsername,
          memberName:     name,
          gitlabUserId:   gitlabId,
          customOrgLinks: gitlabOrgLinks, 
          since,
        });
        allContributions.push(...mrs);
        totalGitLab += mrs.length;
      } catch (err: any) {
        const msg = `[GitLab] ${name} (${gitlabUsername}): ${err.message}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    if (allContributions.length > 0) {
      try {
        await saveContributions(allContributions);
      } catch (err: any) {
        const msg = `[DB] Save failed for ${name}: ${err.message}`;
        console.error(msg);
        errors.push(msg);
      }
    } else {
      console.log(`[Job] No new contributions for ${name}`);
    }
  }

  console.log(
    `[Job] Done — GitHub: ${totalGitHub}, GitLab: ${totalGitLab}, Errors: ${errors.length}`,
  );
  return {
    users:      members.length,
    totalGitHub,
    totalGitLab,
    totalSaved: totalGitHub + totalGitLab,
    errors,
  };
}

export async function retagAllContributions(): Promise<{ updated: number }> {
  await connectDB();
  await refreshOrgTagCache();
  const all = await Contribution.find({}, { _id: 1, orgLogin: 1 }).lean();
  let updated = 0;
  for (const doc of all) {
    await Contribution.updateOne(
      { _id: doc._id },
      { $set: { tag: getOrgTagSync(doc.orgLogin) } },
    );
    updated++;
  }
  console.log(`[Retag] Updated ${updated} contributions`);
  return { updated };
}

export async function getOrgBreakdown(tagFilter?: string) {
  await connectDB();
  const matchStage: Record<string, any> = {};
  if (tagFilter) matchStage.tag = tagFilter;

  return Contribution.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id:            "$orgLogin",
        totalMergedPRs: { $sum: 1 },
        contributors:   { $addToSet: "$username" },
        memberNames:    { $addToSet: "$memberName" },
        platforms:      { $addToSet: "$platform" },
        tag:            { $first: "$tag" },
      },
    },
    {
      $lookup: { from: "orgs", localField: "_id", foreignField: "login", as: "orgDetails" },
    },
    {
      $project: {
        _id: 0,
        orgLogin:         "$_id",
        totalMergedPRs:   1,
        totalCommits:     { $literal: 0 },
        contributors:     1,
        memberNames:      1,
        platforms:        1,
        tag:              1,
        contributorCount: { $size: "$contributors" },
        orgAvatar: { $arrayElemAt: ["$orgDetails.avatarUrl", 0] },
        orgUrl:    { $arrayElemAt: ["$orgDetails.htmlUrl",   0] },
      },
    },
    { $sort: { totalMergedPRs: -1 } },
  ]);
}

export async function getGlobalStats() {
  await connectDB();
  const [result] = await Contribution.aggregate([
    {
      $group: {
        _id:                null,
        totalMergedPRs:     { $sum: 1 },
        uniqueOrgs:         { $addToSet: "$orgLogin" },
        uniqueContributors: { $addToSet: "$username" },
        uniqueMembers:      { $addToSet: "$memberName" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMergedPRs:    1,
        totalCommits:      { $literal: 0 },
        totalOrgs:         { $size: "$uniqueOrgs" },
        totalContributors: { $size: "$uniqueContributors" },
        totalMembers:      { $size: "$uniqueMembers" },
      },
    },
  ]);
  return result ?? {
    totalMergedPRs: 0, totalCommits: 0,
    totalOrgs: 0, totalContributors: 0, totalMembers: 0,
  };
}

export async function getContributorStats(username?: string) {
  await connectDB();
  const matchStage: Record<string, any> = {};
  if (username) matchStage.username = username;

  return Contribution.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id:            "$username",
        memberName:     { $first: "$memberName" },
        totalMergedPRs: { $sum: 1 },
        orgs:           { $addToSet: "$orgLogin" },
        platforms:      { $addToSet: "$platform" },
        tags:           { $addToSet: "$tag" },
      },
    },
    {
      $project: {
        _id: 0,
        username:       "$_id",
        memberName:     1,
        totalMergedPRs: 1,
        totalCommits:   { $literal: 0 },
        orgs:           1,
        platforms:      1,
        tags:           1,
        totalOrgs:      { $size: "$orgs" },
      },
    },
    { $sort: { totalMergedPRs: -1 } },
  ]);
}

export async function getMemberPRs(options: {
  memberName?: string; username?: string; orgLogin?: string;
  tag?: string; platform?: string; page?: number; limit?: number;
}) {
  await connectDB();
  const { memberName, username, orgLogin, tag, platform, page = 1, limit = 50 } = options;
  const match: Record<string, any> = {};
  if (memberName) match.memberName = memberName;
  if (username)   match.username   = username;
  if (orgLogin)   match.orgLogin   = orgLogin;
  if (tag)        match.tag        = tag;
  if (platform)   match.platform   = platform;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Contribution.find(match, {
      _id: 0, memberName: 1, username: 1, platform: 1,
      repoFullName: 1, orgLogin: 1, title: 1, url: 1, mergedAt: 1, tag: 1,
    }).sort({ mergedAt: -1 }).skip(skip).limit(limit).lean(),
    Contribution.countDocuments(match),
  ]);
  return { data, total, page, limit, pages: Math.ceil(total / limit) };
}