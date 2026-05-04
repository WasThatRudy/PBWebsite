import type {
  ContributionTag,
  NormalizedOssContributor,
  NormalizedOssOrganization,
} from "@/lib/oss";

export type DashboardTab = "dashboard" | "organizations" | "contributors";

export type OrganizationSortOptionId =
  | "totalContributions"
  | "prCount"
  | "name"
  | "contributors";

export type ContributorSortOptionId =
  | "totalContributions"
  | "prCount"
  | "name";

export type OrganizationTagFilter = "all" | ContributionTag;

export type OrganizationView = NormalizedOssOrganization & {
  contributors: NormalizedOssContributor[];
};

export type ContributorView = NormalizedOssContributor & {
  organizations: NormalizedOssOrganization[];
};
