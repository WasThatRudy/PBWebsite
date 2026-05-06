import type {
  ContributionTag,
  ContributionPlatform,
  ContributorSortOptionId,
  ContributorView,
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
  { id: "prCount", label: "PR Count" },
  { id: "contributors", label: "Active Devs" },
  { id: "name", label: "A-Z" },
];

export const CONTRIBUTOR_SORT_OPTIONS: Array<{
  id: ContributorSortOptionId;
  label: string;
}> = [
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

export const SHOW_ORGANIZATION_TAGS = false;

export function matchSearch(values: Array<unknown>, query: string) {
  if (!query) return true;
  return values.some((value) => {
    if (value == null) return false;
    if (typeof value !== "string") return false;
    return value.toLowerCase().includes(query);
  });
}

export function contributorLabel(contributor: Pick<ContributorView, "login" | "name">) {
  return contributor.login ? `@${contributor.login}` : contributor.name;
}

function buildProfileUrl(
  loginOrName: string,
  platform: ContributionPlatform | undefined,
) {
  if (!loginOrName) return undefined;
  const baseUrl = platform === "gitlab"
    ? "https://gitlab.com"
    : "https://github.com";
  return `${baseUrl}/${loginOrName}`;
}

export function getContributorGithubUrl(
  contributor: Pick<ContributorView, "login" | "url" | "platform">,
) {
  if (contributor.url) return contributor.url;
  if (!contributor.login) return undefined;
  return buildProfileUrl(contributor.login, contributor.platform);
}

export function getOrganizationGithubUrl(
  name: string,
  url?: string,
  platform?: ContributionPlatform,
) {
  if (url) return url;
  const trimmedName = name.trim();
  if (!trimmedName) return undefined;
  return buildProfileUrl(trimmedName, platform);
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

export function formatContributionMeta(prs: number) {
  return `${prs} PRs`;
}
