"use client";

import { useEffect, useMemo, useState } from "react";
import { useLoadingStore } from "@/lib/store/loading";
import { useOssDashboardData } from "@/hooks/useOssDashboardData";
import OssTabButton from "@/components/oss/elements/OssTabButton";
import OssPointBlankLoader from "@/components/oss/widgets/OssPointBlankLoader";
import OssHero from "@/components/oss/modules/OssHero";
import OssOverviewSection from "@/components/oss/modules/OssOverviewSection";
import OssHighlightsSection from "@/components/oss/modules/OssHighlightsSection";
import OssOrganizationsPanel from "@/components/oss/modules/OssOrganizationsPanel";
import OssContributorsPanel from "@/components/oss/modules/OssContributorsPanel";
import type {
  ContributorSortOptionId,
  DashboardTab,
  OrganizationSortOptionId,
  OrganizationTagFilter,
} from "@/components/oss/types";
import {
  TABS,
  matchSearch,
} from "@/components/oss/utils";

export default function OssDashboard({ endpoint }: { endpoint: string }) {
  const setLoading = useLoadingStore((state) => state.setLoading);
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationTag, setOrganizationTag] =
    useState<OrganizationTagFilter>("all");
  const [orgSort, setOrgSort] =
    useState<OrganizationSortOptionId>("totalContributions");
  const [contributorSort, setContributorSort] =
    useState<ContributorSortOptionId>("totalContributions");
  const { status, errorMessage, data, organizationStats, contributorStats } =
    useOssDashboardData(endpoint);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

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
    return <OssPointBlankLoader />;
  }

  if (status === "error") {
    return (
      <div className="bg-pbpages px-3 pb-12 pt-6 font-medium text-zinc-300 sm:px-4 sm:pb-20 sm:pt-12">
        <div className="mx-auto flex w-full max-w-[1700px] items-start justify-center sm:px-6 lg:px-10 xl:px-[80px]">
          <div className="flex w-full max-w-lg flex-col items-center rounded-[20px] border border-red-400/10 bg-[#1c1c1c] px-4 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:rounded-[28px] sm:px-8 sm:py-10">
            <div className="mb-4 text-red-300">
              <h2 className="text-center text-2xl font-medium text-white">
                Failed to load data
              </h2>
            </div>
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-zinc-500 sm:text-base">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center rounded-full bg-[#39FF14] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#32e600] sm:text-base sm:tracking-[0.24em]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pbpages font-medium text-zinc-300 selection:bg-[#00FF41]/30 selection:text-white">
      <main className="mx-auto w-full max-w-[1700px] px-3 py-6 sm:px-5 sm:py-10 lg:px-10 xl:px-[80px]">
        <OssHero />

        <div className="mb-8 grid grid-cols-3 gap-2 sm:mb-10 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
          {TABS.map((tab) => (
            <OssTabButton
              key={tab.id}
              active={activeTab === tab.id}
              label={tab.label}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
            />
          ))}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-10">
            <OssOverviewSection
              totalContributors={data.stats.totalContributors}
              totalMergedPRs={data.stats.totalMergedPRs}
              totalOrganizations={data.stats.totalOrganizations}
            />
            <OssHighlightsSection
              contributorStats={contributorStats}
              organizationStats={organizationStats}
              onTabChange={setActiveTab}
            />
          </div>
        )}

        {activeTab === "organizations" && (
          <OssOrganizationsPanel
            onOrganizationTagChange={setOrganizationTag}
            onOrgSortChange={setOrgSort}
            onSearchQueryChange={setSearchQuery}
            organizationTag={organizationTag}
            organizations={filteredAndSortedOrganizations}
            orgSort={orgSort}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === "contributors" && (
          <OssContributorsPanel
            contributorSort={contributorSort}
            contributors={filteredAndSortedContributors}
            onContributorSortChange={setContributorSort}
            onSearchQueryChange={setSearchQuery}
            searchQuery={searchQuery}
          />
        )}
      </main>
    </div>
  );
}
