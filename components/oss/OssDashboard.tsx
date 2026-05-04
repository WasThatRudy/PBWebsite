"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  createEmptyOssResponse,
  normalizeContributionsData,
  type ContributionTag,
  type ContributionsCollectionResponse,
  type ContributionsContributorRow,
  type ContributionsOrganizationRow,
  type ContributionsStatsResponse,
  type NormalizedOssContributor,
  type NormalizedOssData,
  type NormalizedOssOrganization,
} from "@/lib/oss";
import { useLoadingStore } from "@/lib/store/loading";

type DashboardTab = "dashboard" | "organizations" | "contributors";

type OrganizationView = NormalizedOssOrganization & {
  contributors: NormalizedOssContributor[];
};

type ContributorView = NormalizedOssContributor & {
  organizations: NormalizedOssOrganization[];
};

function matchSearch(values: Array<string | undefined>, query: string) {
  if (!query) return true;
  return values.some((value) => value?.toLowerCase().includes(query));
}

function contributorLabel(contributor: NormalizedOssContributor) {
  return contributor.login ? `@${contributor.login}` : contributor.name;
}

function buildViewUrl(
  basePath: string,
  view: "stats" | "orgs" | "contributors",
) {
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}view=${view}`;
}

const TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "organizations", label: "Organizations" },
  { id: "contributors", label: "Contributors" },
];

const ORGANIZATION_SORT_OPTIONS: Array<{
  id: "totalContributions" | "prCount" | "name" | "contributors";
  label: string;
}> = [
  { id: "totalContributions", label: "Total" },
  { id: "prCount", label: "PR Count" },
  { id: "contributors", label: "Active Devs" },
  { id: "name", label: "A-Z" },
];

const CONTRIBUTOR_SORT_OPTIONS: Array<{
  id: "totalContributions" | "prCount" | "name";
  label: string;
}> = [
  { id: "totalContributions", label: "Total" },
  { id: "prCount", label: "PR Count" },
  { id: "name", label: "A-Z" },
];

const ORGANIZATION_TAG_OPTIONS: Array<{
  id: "all" | ContributionTag;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "gsoc", label: "GSoC" },
  { id: "lfx", label: "LFX" },
  { id: "both", label: "Both" },
  { id: "none", label: "None" },
];

function PrStatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path
        d="M18 15C16.3431 15 15 16.3431 15 18C15 19.6569 16.3431 21 18 21C19.6569 21 21 19.6569 21 18C21 16.3431 19.6569 15 18 15ZM18 15V8C18 7.46957 17.7893 6.96086 17.4142 6.58579C17.0391 6.21071 16.5304 6 16 6H13M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9ZM6 9V21"
        stroke="#37FF00"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OrgStatIcon() {
  return (
    <svg
      width="18"
      height="24"
      viewBox="0 0 18 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-6 w-[18px]"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.99924 0C7.21421 0.000328329 5.46959 0.531363 3.98714 1.5256C2.50469 2.51984 1.35135 3.93238 0.673743 5.58368C-0.00386737 7.23497 -0.175152 9.05044 0.181661 10.7993C0.538473 12.5482 1.40727 14.1515 2.67761 15.4054C2.65978 15.4608 2.64624 15.5175 2.63711 15.5749L1.512 22.7001C1.48173 22.8925 1.50191 23.0894 1.57056 23.2716C1.63921 23.4538 1.75399 23.6151 1.90367 23.7397C2.05335 23.8642 2.2328 23.9478 2.42447 23.9823C2.61614 24.0167 2.81346 24.0008 2.99715 23.9361L8.99924 21.8181L14.9998 23.9361C15.1835 24.0008 15.3808 24.0167 15.5725 23.9823C15.7642 23.9478 15.9436 23.8642 16.0933 23.7397C16.243 23.6151 16.3578 23.4538 16.4264 23.2716C16.4951 23.0894 16.5153 22.8925 16.485 22.7001L15.3599 15.5749C15.3511 15.518 15.3381 15.4618 15.3209 15.4069C16.5917 14.1531 17.461 12.5496 17.8181 10.8005C18.1752 9.05138 18.004 7.23556 17.3264 5.58396C16.6487 3.93236 15.4951 2.51958 14.0124 1.52526C12.5296 0.530952 10.7846 2.69358e-05 8.99924 0ZM2.24857 9.00024C2.24857 7.20998 2.9598 5.49304 4.2258 4.22714C5.49179 2.96124 7.20885 2.25006 8.99924 2.25006C10.7896 2.25006 12.5067 2.96124 13.7727 4.22714C15.0387 5.49304 15.7499 7.20998 15.7499 9.00024C15.7499 10.7905 15.0387 12.5074 13.7727 13.7733C12.5067 15.0392 10.7896 15.7504 8.99924 15.7504C7.20885 15.7504 5.49179 15.0392 4.2258 13.7733C2.9598 12.5074 2.24857 10.7905 2.24857 9.00024ZM13.2942 16.9114C11.9762 17.6282 10.4995 18.0026 8.99924 18.0005C7.499 18.0027 6.02221 17.6283 4.70431 16.9114L4.02925 21.1866L8.6242 19.565C8.86687 19.4792 9.13161 19.4792 9.37428 19.565L13.9692 21.1851L13.2942 16.9114Z"
        fill="#37FF00"
      />
    </svg>
  );
}

function ContributorStatIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 27 27"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[27px] w-[27px]"
    >
      <circle cx="13.5" cy="7.875" r="4.5" stroke="#37FF00" strokeWidth="2" />
      <path
        d="M17.9991 23.625H8.99906C6.51378 23.625 4.31922 21.4443 5.61479 19.3234C6.88159 17.2496 9.3334 15.75 13.4991 15.75C17.6647 15.75 20.1165 17.2496 21.3833 19.3234C22.6789 21.4443 20.4843 23.625 17.9991 23.625Z"
        stroke="#37FF00"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function OssDashboard({ endpoint }: { endpoint: string }) {
  const setLoading = useLoadingStore((state) => state.setLoading);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState<NormalizedOssData>(() => createEmptyOssResponse());
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationTag, setOrganizationTag] = useState<"all" | ContributionTag>(
    "all",
  );
  const [orgSort, setOrgSort] = useState<
    "totalContributions" | "prCount" | "name" | "contributors"
  >("totalContributions");
  const [contributorSort, setContributorSort] = useState<
    "totalContributions" | "prCount" | "name"
  >("totalContributions");

  function formatTagLabel(tag: ContributionTag) {
    if (tag === "gsoc") return "GSoC";
    if (tag === "lfx") return "LFX";
    if (tag === "both") return "Both";
    return "None";
  }

  function tagBadgeClasses(tag: ContributionTag) {
    if (tag === "gsoc") return "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/40";
    if (tag === "lfx") return "bg-cyan-500/10 text-cyan-300 border-cyan-400/40";
    if (tag === "both") return "bg-amber-500/10 text-amber-300 border-amber-400/40";
    return "bg-zinc-700/20 text-zinc-400 border-zinc-700/40";
  }

  function formatContributionMeta(prs: number, commits: number, total: number) {
    return `${prs} PRs • ${commits} commits • ${total} total`;
  }

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOssData() {
      try {
        setStatus("loading");
        setErrorMessage("");

        const [statsResponse, organizationsResponse, contributorsResponse] =
          await Promise.all([
            fetch(buildViewUrl(endpoint, "stats"), {
              signal: controller.signal,
              cache: "no-store",
            }),
            fetch(buildViewUrl(endpoint, "orgs"), {
              signal: controller.signal,
              cache: "no-store",
            }),
            fetch(buildViewUrl(endpoint, "contributors"), {
              signal: controller.signal,
              cache: "no-store",
            }),
          ]);

        if (!statsResponse.ok || !organizationsResponse.ok || !contributorsResponse.ok) {
          const failedResponse =
            !statsResponse.ok
              ? statsResponse
              : !organizationsResponse.ok
                ? organizationsResponse
                : contributorsResponse;
          throw new Error(`Contributions route returned ${failedResponse.status}`);
        }

        const [statsPayload, organizationsPayload, contributorsPayload] =
          await Promise.all([
            statsResponse.json() as Promise<ContributionsStatsResponse>,
            organizationsResponse.json() as Promise<
              ContributionsCollectionResponse<ContributionsOrganizationRow>
            >,
            contributorsResponse.json() as Promise<
              ContributionsCollectionResponse<ContributionsContributorRow>
            >,
          ]);

        setData(
          normalizeContributionsData({
            stats: statsPayload,
            organizations: organizationsPayload.data,
            contributors: contributorsPayload.data,
          }),
        );
        setStatus("success");
      } catch (error) {
        if (controller.signal.aborted) return;

        setData(createEmptyOssResponse());
        setStatus("success");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load OSS contributions right now.",
        );
      }
    }

    void loadOssData();

    return () => controller.abort();
  }, [endpoint]);

  const { organizationStats, contributorStats } = useMemo(() => {
    const contributorsById = new Map(
      data.contributors.map((contributor) => [contributor.id, contributor]),
    );
    const organizationsById = new Map(
      data.organizations.map((organization) => [organization.id, organization]),
    );

    const organizations: OrganizationView[] = data.organizations.map((organization) => ({
      ...organization,
      contributors: organization.contributorIds
        .map((contributorId) => contributorsById.get(contributorId))
        .filter(
          (contributor): contributor is NormalizedOssContributor =>
            Boolean(contributor),
        ),
    }));

    const contributors: ContributorView[] = data.contributors.map((contributor) => ({
      ...contributor,
      organizations: contributor.organizationIds
        .map((organizationId) => organizationsById.get(organizationId))
        .filter(
          (organization): organization is NormalizedOssOrganization =>
            Boolean(organization),
        ),
    }));

    return {
      organizationStats: organizations,
      contributorStats: contributors,
    };
  }, [data]);

  const query = searchQuery.trim().toLowerCase();

  const filteredAndSortedOrganizations = useMemo(() => {
    const results = organizationStats.filter((organization) => {
      const matchesTag =
        organizationTag === "all" || organization.tag === organizationTag;
      const matchesQuery = matchSearch(
        [
          organization.name,
          organization.url,
          organization.description,
          organization.tag,
          ...organization.contributors.map((contributor) => contributor.name),
          ...organization.contributors.map((contributor) => contributor.login),
        ],
        query,
      );

      return matchesTag && matchesQuery;
    });

    results.sort((left, right) => {
      if (orgSort === "totalContributions") {
        return right.totalContributions - left.totalContributions;
      }
      if (orgSort === "prCount") return right.prCount - left.prCount;
      if (orgSort === "contributors") {
        return right.contributors.length - left.contributors.length;
      }
      return left.name.localeCompare(right.name);
    });

    return results;
  }, [organizationStats, orgSort, organizationTag, query]);

  const filteredAndSortedContributors = useMemo(() => {
    const results = contributorStats.filter((contributor) =>
      matchSearch(
        [
          contributor.name,
          contributor.login,
          contributor.bio,
          ...contributor.organizations.map((organization) => organization.name),
        ],
        query,
      ),
    );

    results.sort((left, right) => {
      if (contributorSort === "totalContributions") {
        return right.totalContributions - left.totalContributions;
      }
      if (contributorSort === "prCount") return right.prCount - left.prCount;
      return left.name.localeCompare(right.name);
    });

    return results;
  }, [contributorStats, contributorSort, query]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-pbpages px-4 text-zinc-300">
        <div className="mx-auto flex min-h-screen w-full max-w-[1700px] items-center justify-center py-16 sm:px-6 lg:px-10 xl:px-[80px]">
          <div className="flex w-full max-w-md flex-col items-center rounded-[28px] border border-white/6 bg-[#1c1c1c] px-6 py-10 text-center sm:px-8">
            <div className="mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#39FF14]/25 border-t-[#39FF14]" />
            <h2 className="text-balance text-lg font-medium uppercase tracking-[0.18em] text-zinc-300 sm:text-xl sm:tracking-[0.3em]">
              Fetching Contributions...
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
              Pulling the latest open source stats for Point Blank.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-pbpages px-4 text-zinc-300 font-medium">
        <div className="mx-auto flex min-h-screen w-full max-w-[1700px] items-center justify-center py-16 sm:px-6 lg:px-10 xl:px-[80px]">
          <div className="flex w-full max-w-lg flex-col items-center rounded-[28px] border border-red-400/10 bg-[#1c1c1c] px-6 py-10 text-center sm:px-8">
            <div className="mb-4 text-red-300">
              <h2 className="text-2xl font-medium text-white text-center">
                Failed to load data
              </h2>
            </div>
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-zinc-500 sm:text-base">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center rounded-full border border-[#00FF41]/50 bg-[#00FF41]/10 px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[#00FF41] transition-colors hover:bg-[#00FF41] hover:text-black sm:text-base sm:tracking-[0.24em]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pbpages text-zinc-300 selection:bg-[#00FF41]/30 selection:text-white font-medium">
      <main className="mx-auto w-full max-w-[1700px] px-2 py-10 sm:px-5 md:py-10 lg:px-10 xl:px-[80px]">
        <div className="px-1 pb-10 pt-6 text-center flex flex-col items-center sm:px-3 sm:pt-8 sm:pb-12">
          <motion.h1
            initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight"
          >
            Our Open Source Footprint
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-5xl text-balance text-base leading-relaxed text-zinc-400 sm:mt-8 sm:text-lg md:text-xl font-medium"
          >
            Every merged pull request from a Point Blank member, in one place.
            From first-year first PRs to alumni still shipping years later, it
            all counts, and it all lives here.
          </motion.p>
        </div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-10 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={`inline-flex w-full items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium transition-all sm:min-w-[170px] sm:w-auto md:px-7 md:text-base ${
                  activeTab === tab.id
                    ? "bg-[#39FF14] text-black border-[#39FF14]"
                    : "bg-[#222222] text-zinc-300 border-transparent hover:text-white hover:border-[#39FF14]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                <div className="flex min-h-[160px] flex-col rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14] sm:p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px]">
                      <PrStatIcon />
                    </div>
                    <h3 className="text-zinc-400 text-sm tracking-widest uppercase font-medium">
                      Total PRs Merged
                    </h3>
                  </div>
                  <div className="text-5xl font-medium text-white mt-auto">
                    {data.stats.totalMergedPRs}
                  </div>
                </div>

                <div className="flex min-h-[160px] flex-col rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14] sm:p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px]">
                      <OrgStatIcon />
                    </div>
                    <h3 className="text-zinc-400 text-sm tracking-widest uppercase font-medium">
                      Unique Orgs
                    </h3>
                  </div>
                  <div className="text-5xl font-medium text-white mt-auto">
                    {data.stats.totalOrganizations}
                  </div>
                </div>

                <div className="flex min-h-[160px] flex-col rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14] sm:p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px]">
                      <ContributorStatIcon />
                    </div>
                    <h3 className="text-zinc-400 text-sm tracking-widest uppercase font-medium">
                      Contributors
                    </h3>
                  </div>
                  <div className="text-5xl font-medium text-white mt-auto">
                    {data.stats.totalContributors}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div>
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-medium text-white sm:text-[2rem]">
                      Top Organizations
                    </h2>
                    <button
                      onClick={() => setActiveTab("organizations")}
                      className="shrink-0 text-right text-xs font-medium uppercase tracking-[0.18em] text-[#00FF41] hover:underline sm:text-sm sm:tracking-[0.24em]"
                    >
                      VIEW ALL
                    </button>
                  </div>

                  <div className="space-y-3">
                    {organizationStats.length === 0 ? (
                      <div className="p-5 bg-[#1c1c1c] rounded-[20px] text-zinc-500">
                        No organizations yet.
                      </div>
                    ) : (
                      organizationStats.slice(0, 5).map((organization) => (
                        <div
                          key={organization.id}
                          className="w-full rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14]"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                            <div className="min-w-0">
                              <span className="block break-words font-medium text-lg text-white">
                                {organization.name}
                              </span>
                              {organization.url && (
                                <p className="mt-1 break-all pr-1 text-xs text-zinc-500">
                                  {organization.url}
                                </p>
                              )}
                              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                                {formatContributionMeta(
                                  organization.prCount,
                                  organization.commitCount,
                                  organization.totalContributions,
                                )}
                              </p>
                            </div>
                            <div className="rounded-full bg-[#00FF41]/10 px-4 py-2 text-sm font-medium text-[#00FF41]">
                              {organization.totalContributions} Total
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-medium text-white sm:text-[2rem]">
                      Top Contributors
                    </h2>
                    <button
                      onClick={() => setActiveTab("contributors")}
                      className="shrink-0 text-right text-xs font-medium uppercase tracking-[0.18em] text-[#00FF41] hover:underline sm:text-sm sm:tracking-[0.24em]"
                    >
                      VIEW ALL
                    </button>
                  </div>

                  <div className="space-y-3">
                    {contributorStats.length === 0 ? (
                      <div className="p-5 bg-[#1c1c1c] rounded-[20px] text-zinc-500">
                        No contributors yet.
                      </div>
                    ) : (
                      contributorStats.slice(0, 5).map((contributor) => (
                        <div
                          key={contributor.id}
                          className="w-full rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14]"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                            <div className="min-w-0 text-left">
                              <span className="block break-words font-medium text-lg leading-tight text-white">
                                {contributor.name}
                              </span>
                              <span className="mt-1 block break-words text-xs font-medium text-zinc-500 sm:text-sm">
                                {contributor.login
                                  ? `@${contributor.login}`
                                  : "Point Blank contributor"}
                              </span>
                              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                                {formatContributionMeta(
                                  contributor.prCount,
                                  contributor.commitCount,
                                  contributor.totalContributions,
                                )}
                              </p>
                            </div>
                            <div className="rounded-full bg-[#00FF41]/10 px-4 py-2 text-sm font-medium text-[#00FF41]">
                              {contributor.totalContributions} Total
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "organizations" && (
            <div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-3xl font-medium text-white shrink-0">
                  Organizations
                </h2>
                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
                  <div className="w-full sm:w-[260px]">
                    <input
                      type="text"
                      placeholder="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="bg-[#111111] border border-transparent hover:border-[#39FF14] focus:border-[#39FF14] text-white rounded-full outline-none px-6 py-3 text-sm transition-colors w-full font-medium"
                    />
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
                    {ORGANIZATION_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setOrgSort(option.id)}
                        className={`inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm transition-colors ${
                          orgSort === option.id
                            ? "border-[#39FF14] bg-[#39FF14] text-black"
                            : "border-transparent bg-[#111111] text-zinc-300 hover:border-[#39FF14] hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {ORGANIZATION_TAG_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setOrganizationTag(option.id)}
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm transition-colors ${
                      organizationTag === option.id
                        ? "border-[#39FF14] bg-[#39FF14] text-black"
                        : "border-transparent bg-[#111111] text-zinc-300 hover:border-[#39FF14] hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {filteredAndSortedOrganizations.length === 0 ? (
                <div className="py-20 text-center rounded-[20px] bg-[#1c1c1c]">
                  <p className="text-zinc-500 font-medium">
                    No organizations found matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedOrganizations.map((organization) => (
                    <div
                      key={organization.id}
                      className="flex flex-col rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 shadow-lg transition-colors hover:border-[#39FF14] sm:p-6"
                    >
                      <div className="flex justify-between items-start mb-6 gap-4">
                        <div>
                          <h3 className="text-xl font-medium text-white">
                            {organization.name}
                          </h3>
                          {organization.url && (
                            <p className="text-xs text-zinc-500 mt-2 break-all">
                              {organization.url}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${tagBadgeClasses(
                                organization.tag,
                              )}`}
                            >
                              {formatTagLabel(organization.tag)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {organization.commitCount} commits
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-[#00FF41] bg-[#00FF41]/10 px-3 py-1 rounded-full text-sm tracking-wider shrink-0 font-medium">
                          <span>{organization.totalContributions} Total</span>
                        </div>
                      </div>

                      {organization.description && (
                        <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                          {organization.description}
                        </p>
                      )}

                      <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                        {formatContributionMeta(
                          organization.prCount,
                          organization.commitCount,
                          organization.totalContributions,
                        )}
                      </p>

                      <div className="mt-auto pt-4 border-t border-zinc-800/50">
                        <p className="text-xs text-zinc-500 font-medium mb-3 uppercase tracking-wider">
                          Active Contributors ({organization.contributors.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {organization.contributors.length === 0 ? (
                            <span className="text-xs text-zinc-600">
                              No active contributors
                            </span>
                          ) : (
                            organization.contributors.map((contributor) => (
                              <div
                                key={contributor.id}
                                className="bg-black/50 border border-zinc-800 px-2 py-1 rounded-full"
                              >
                                <span className="text-xs text-zinc-300">
                                  {contributorLabel(contributor)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "contributors" && (
            <div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <h2 className="text-3xl font-medium text-white shrink-0">
                  Contributors
                </h2>
                <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
                  <div className="w-full sm:w-[260px]">
                    <input
                      type="text"
                      placeholder="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="bg-[#111111] border border-transparent hover:border-[#39FF14] focus:border-[#39FF14] text-white rounded-full outline-none px-6 py-3 text-sm transition-colors w-full font-medium"
                    />
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
                    {CONTRIBUTOR_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setContributorSort(option.id)}
                        className={`inline-flex items-center justify-center rounded-full border px-4 py-3 text-sm transition-colors ${
                          contributorSort === option.id
                            ? "border-[#39FF14] bg-[#39FF14] text-black"
                            : "border-transparent bg-[#111111] text-zinc-300 hover:border-[#39FF14] hover:text-white"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredAndSortedContributors.length === 0 ? (
                <div className="py-20 text-center rounded-[20px] bg-[#1c1c1c]">
                  <p className="text-zinc-500 font-medium">
                    No contributors found matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
                  {filteredAndSortedContributors.map((contributor) => (
                    <div
                      key={contributor.id}
                      className="rounded-[20px] border border-transparent bg-[#1c1c1c] p-5 transition-colors hover:border-[#39FF14] sm:p-6"
                    >
                      <div className="flex flex-col gap-5 sm:gap-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-xl font-medium text-white">
                              {contributor.name}
                            </h3>
                            <p className="mt-1 break-words text-sm text-zinc-500">
                              {contributor.login
                                ? `@${contributor.login}`
                                : "Point Blank contributor"}
                            </p>
                            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                              {formatContributionMeta(
                                contributor.prCount,
                                contributor.commitCount,
                                contributor.totalContributions,
                              )}
                            </p>
                            {contributor.bio && (
                              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                                {contributor.bio}
                              </p>
                            )}
                          </div>
                          <div className="self-start rounded-full bg-[#00FF41]/10 px-4 py-2 text-base font-medium text-[#00FF41] sm:shrink-0">
                            {contributor.totalContributions} Total
                          </div>
                        </div>

                        <div className="border-t border-zinc-800/50 pt-4">
                          <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                            Organizations
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {contributor.organizations.length === 0 ? (
                              <span className="text-xs text-zinc-600">
                                No orgs yet
                              </span>
                            ) : (
                              contributor.organizations.map((organization) => (
                                <span
                                  key={organization.id}
                                  title={organization.name}
                                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300"
                                >
                                  {organization.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
