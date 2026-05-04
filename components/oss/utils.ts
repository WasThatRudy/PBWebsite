import type {
  ContributionTag,
  NormalizedOssContributor,
} from "@/lib/oss";
import type {
  ContributorSortOptionId,
  DashboardTab,
  OrganizationSortOptionId,
} from "@/components/oss/types";

export const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "dashboard", label: "DASHBOARD" },
  { id: "organizations", label: "ORGANIZATIONS" },
  { id: "contributors", label: "CONTRIBUTORS" },
];

export const ORGANIZATION_SORT_OPTIONS: Array<{
  id: OrganizationSortOptionId;
  label: string;
}> = [
  { id: "totalContributions", label: "Total" },
  { id: "prCount", label: "PR Count" },
  { id: "contributors", label: "Active Devs" },
  { id: "name", label: "A-Z" },
];

export const CONTRIBUTOR_SORT_OPTIONS: Array<{
  id: ContributorSortOptionId;
  label: string;
}> = [
  { id: "totalContributions", label: "Total" },
  { id: "prCount", label: "PR Count" },
  { id: "name", label: "A-Z" },
];

export const ORGANIZATION_TAG_OPTIONS: Array<{
  id: "all" | ContributionTag;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "gsoc", label: "GSoC" },
  { id: "lfx", label: "LFX" },
  { id: "both", label: "Both" },
  { id: "none", label: "None" },
];

export function matchSearch(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

export function contributorLabel(contributor: NormalizedOssContributor) {
  return contributor.login ? `@${contributor.login}` : contributor.name;
}

export function buildViewUrl(
  basePath: string,
  view: "stats" | "orgs" | "contributors",
) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}view=${view}`;
}

export function formatTagLabel(tag: ContributionTag) {
  if (tag === "gsoc") return "GSoC";
  if (tag === "lfx") return "LFX";
  if (tag === "both") return "Both";
  return "None";
}

export function formatContributionMeta(prs: number, commits: number) {
  return `${prs} PRs • ${commits} commits`;
}
