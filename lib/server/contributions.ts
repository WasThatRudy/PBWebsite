import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import connectDB from "@/lib/db/connection";
import Contribution from "@/lib/db/models/contributions";
import Org from "@/lib/db/models/orgs";
import { getOrgTag } from "@/lib/data/orgs";

const OctokitWithPlugins = Octokit.plugin(throttling, retry);

const octokit = new OctokitWithPlugins({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter: number, options: any, _: any, retryCount: number) => {
      console.warn(`[GitHub] Rate limit — retrying after ${retryAfter}s (attempt ${retryCount + 1}/3)`);
      return retryCount < 3;
    },
    onSecondaryRateLimit: (_: number, options: any) => {
      console.warn(`[GitHub] Secondary rate limit on ${options.url}`);
      return true;
    },
  },
});
const STAR_THRESHOLD = parseInt(process.env.GITHUB_STAR_THRESHOLD || "100", 10);

const GITHUB_USERNAMES = process.env.GITHUB_USERNAMES
  ? process.env.GITHUB_USERNAMES.split(",").map((u) => u.trim())
  : [];

interface RepoDetails {
  full_name: string;
  stargazers_count: number;
  private: boolean;
  fork: boolean;
  owner: {
    login: string;
    type: string;
    avatar_url: string;
  };
}

interface ContributionData {
  username: string;
  repoFullName: string;
  repoStars: number;
  orgLogin: string;
  orgAvatarUrl: string;
  type: "pr" | "commit";
  title: string;
  url: string;
  isMerged: boolean | null;
  mergedAt: string | null;
  committedAt: string | null;
}


const repoCache = new Map<string, RepoDetails | null>();

async function getRepoDetails(repoFullName: string): Promise<RepoDetails | null> {
  if (repoCache.has(repoFullName)) return repoCache.get(repoFullName)!;

  try {
    const [owner, repo] = repoFullName.split("/");
    const { data } = await octokit.rest.repos.get({ owner, repo });
    repoCache.set(repoFullName, data as RepoDetails);
    return data as RepoDetails;
  } catch (err: any) {
    if (err.status === 404) {
      repoCache.set(repoFullName, null);
      return null;
    }
    throw err;
  }
}
function isQualityRepo(repo: RepoDetails, authorUsername: string): boolean {
  if (repo.owner.type !== "Organization") return false;
  if (repo.private) return false;
  if (repo.fork) return false;
  if (repo.stargazers_count < STAR_THRESHOLD) return false;
  if (repo.owner.login.toLowerCase() === authorUsername.toLowerCase()) return false;
  return true;
}

async function fetchMergedPRs(username: string): Promise<ContributionData[]> {
  console.log(`[Scraper] Fetching merged PRs for: ${username}`);
  const results: ContributionData[] = [];

  const iterator = octokit.paginate.iterator(
    octokit.rest.search.issuesAndPullRequests,
    {
      q: `author:${username} type:pr is:merged is:public`,
      sort: "created",
      order: "desc",
      per_page: 100,
    }
  );

  for await (const page of iterator) {
    for (const pr of page.data) {
      const repoFullName = pr.repository_url.replace("https://api.github.com/repos/", "");
      const repo = await getRepoDetails(repoFullName);
      if (!repo || !isQualityRepo(repo, username)) continue;

      results.push({
        username,
        repoFullName,
        repoStars: repo.stargazers_count,
        orgLogin: repo.owner.login,
        orgAvatarUrl: repo.owner.avatar_url,
        type: "pr",
        title: pr.title,
        url: pr.html_url,
        isMerged: true,
        mergedAt: pr.pull_request?.merged_at ?? null,
        committedAt: null,
      });
    }
  }

  console.log(`[Scraper] ${username} → ${results.length} merged PRs`);
  return results;
}

async function fetchCommits(username: string): Promise<ContributionData[]> {
  console.log(`[Scraper] Fetching commits for: ${username}`);
  const results: ContributionData[] = [];

  const iterator = octokit.paginate.iterator(
    octokit.rest.search.commits,
    {
      q: `author:${username} is:public`,
      sort: "committer-date",
      order: "desc",
      per_page: 100,
    }
  );

  for await (const page of iterator) {
    for (const commit of page.data) {
      const repoFullName = commit.repository.full_name;
      const repo = await getRepoDetails(repoFullName);
      if (!repo || !isQualityRepo(repo, username)) continue;

      results.push({
        username,
        repoFullName,
        repoStars: repo.stargazers_count,
        orgLogin: repo.owner.login,
        orgAvatarUrl: repo.owner.avatar_url,
        type: "commit",
        // Commit message can be multiline — take the first line only
        title: commit.commit.message.split("\n")[0],
        url: commit.html_url,
        isMerged: null,
        mergedAt: null,
        committedAt: commit.commit.committer?.date ?? null,
      });
    }
  }

  console.log(`[Scraper] ${username} → ${results.length} commits`);
  return results;
}

async function saveToDB(contributions: ContributionData[]): Promise<void> {
  // Upsert orgs first (contributions reference them by orgLogin)
  const orgsMap = new Map<string, { login: string; avatarUrl: string; htmlUrl: string }>();
  for (const c of contributions) {
    if (!orgsMap.has(c.orgLogin)) {
      orgsMap.set(c.orgLogin, {
        login: c.orgLogin,
        avatarUrl: c.orgAvatarUrl,
        htmlUrl: `https://github.com/${c.orgLogin}`,
      });
    }
  }

  for (const org of orgsMap.values()) {
    await Org.findOneAndUpdate(
      { login: org.login },
      { ...org, lastFetched: new Date() },
      { upsert: true, new: true }
    );
  }

  for (const c of contributions) {
    await Contribution.findOneAndUpdate(
      { username: c.username, url: c.url },
      {
        username:     c.username,
        repoFullName: c.repoFullName,
        repoStars:    c.repoStars,
        orgLogin:     c.orgLogin,
        type:         c.type,
        title:        c.title,
        url:          c.url,
        isMerged:     c.isMerged,
        mergedAt:     c.mergedAt,
        committedAt:  c.committedAt,
        scrapedAt:    new Date(),
      },
      { upsert: true, new: true }
    );
  }

  console.log(`[DB] Saved ${contributions.length} records across ${orgsMap.size} orgs`);
}

export async function runScrapeJob(): Promise<{ totalPRs: number; totalCommits: number; users: number }> {
  await connectDB();

  if (GITHUB_USERNAMES.length === 0) {
    throw new Error("GITHUB_USERNAMES is not set in environment variables");
  }

  repoCache.clear();

  console.log(`[Job] Scraping ${GITHUB_USERNAMES.length} users: ${GITHUB_USERNAMES.join(", ")}`);

  let totalPRs = 0;
  let totalCommits = 0;

  for (const username of GITHUB_USERNAMES) {
    try {
      const [prs, commits] = await Promise.all([
        fetchMergedPRs(username),
        fetchCommits(username),
      ]);

      const all = [...prs, ...commits];
      if (all.length > 0) await saveToDB(all);

      totalPRs += prs.length;
      totalCommits += commits.length;
    } catch (err: any) {
      console.error(`[Job] Failed for ${username}:`, err.message);
    }
  }

  console.log(`[Job] Done — PRs: ${totalPRs}, Commits: ${totalCommits}`);
  return { totalPRs, totalCommits, users: GITHUB_USERNAMES.length };
}

export async function getOrgBreakdown() {
  await connectDB();

  const orgs = await Contribution.aggregate([
    {
      $group: {
        _id: { orgLogin: "$orgLogin", type: "$type" },
        count: { $sum: 1 },
        contributors: { $addToSet: "$username" },
      },
    },
    {
      $group: {
        _id: "$_id.orgLogin",
        totalMergedPRs: {
          $sum: { $cond: [{ $eq: ["$_id.type", "pr"] }, "$count", 0] },
        },
        totalCommits: {
          $sum: { $cond: [{ $eq: ["$_id.type", "commit"] }, "$count", 0] },
        },
        allContributors: { $push: "$contributors" },
      },
    },
    {
      $lookup: {
        from: "orgs",
        localField: "_id",
        foreignField: "login",
        as: "orgDetails",
      },
    },
    { $unwind: "$orgDetails" },
    {
      $project: {
        _id: 0,
        orgLogin: "$_id",
        orgAvatar: "$orgDetails.avatarUrl",
        orgUrl: "$orgDetails.htmlUrl",
        totalMergedPRs: 1,
        totalCommits: 1,
        contributors: {
          $reduce: {
            input: "$allContributors",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        },
      },
    },
    {
      $addFields: {
        totalContributions: { $add: ["$totalMergedPRs", "$totalCommits"] },
        contributorCount: { $size: {
          $reduce: {
            input: "$allContributors",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        }},
      },
    },
    { $sort: { totalContributions: -1 } },
  ]);
  return orgs.map((org: any) => ({
    ...org,
    tag: getOrgTag(org.orgLogin),
  }));
}

export async function getGlobalStats() {
  await connectDB();

  const [result] = await Contribution.aggregate([
    {
      $group: {
        _id: null,
        totalMergedPRs:   { $sum: { $cond: [{ $eq: ["$type", "pr"] }, 1, 0] } },
        totalCommits:     { $sum: { $cond: [{ $eq: ["$type", "commit"] }, 1, 0] } },
        uniqueOrgs:       { $addToSet: "$orgLogin" },
        uniqueContributors: { $addToSet: "$username" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMergedPRs: 1,
        totalCommits: 1,
        totalContributions: { $add: ["$totalMergedPRs", "$totalCommits"] },
        totalOrgs:         { $size: "$uniqueOrgs" },
        totalContributors: { $size: "$uniqueContributors" },
      },
    },
  ]);

  return result ?? {
    totalMergedPRs: 0,
    totalCommits: 0,
    totalContributions: 0,
    totalOrgs: 0,
    totalContributors: 0,
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
        _id: { username: "$username", type: "$type" },
        count: { $sum: 1 },
        orgs: { $addToSet: "$orgLogin" },
      },
    },
    {
      $group: {
        _id: "$_id.username",
        totalMergedPRs: {
          $sum: { $cond: [{ $eq: ["$_id.type", "pr"] }, "$count", 0] },
        },
        totalCommits: {
          $sum: { $cond: [{ $eq: ["$_id.type", "commit"] }, "$count", 0] },
        },
        allOrgs: { $push: "$orgs" },
      },
    },
    {
      $project: {
        _id: 0,
        username: "$_id",
        totalMergedPRs: 1,
        totalCommits: 1,
        totalContributions: { $add: ["$totalMergedPRs", "$totalCommits"] },
        orgs: {
          $reduce: {
            input: "$allOrgs",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] },
          },
        },
      },
    },
    {
      $addFields: {
        totalOrgs: { $size: "$orgs" },
      },
    },
    { $sort: { totalContributions: -1 } },
  ]);
}
