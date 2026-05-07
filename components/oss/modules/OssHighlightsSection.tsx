import type {
  ContributorView,
  DashboardTab,
  OrganizationView,
} from "@/components/oss/types";
import OssSectionHeader from "@/components/oss/widgets/OssSectionHeader";
import OssEmptyState from "@/components/oss/widgets/OssEmptyState";
import OssOrganizationPreviewCard from "@/components/oss/widgets/OssOrganizationPreviewCard";
import OssContributorPreviewCard from "@/components/oss/widgets/OssContributorPreviewCard";

export default function OssHighlightsSection({
  contributorStats,
  organizationStats,
  onTabChange,
}: {
  contributorStats: ContributorView[];
  organizationStats: OrganizationView[];
  onTabChange: (tab: DashboardTab) => void;
}) {
  const topOrganizations = organizationStats.slice(0, 5);
  const topContributors = contributorStats.slice(0, 5);
  const desktopRowCount = Math.max(
    topOrganizations.length,
    topContributors.length,
    1,
  );

  return (
    <>
      <div className="space-y-8 md:hidden">
        <div>
          <OssSectionHeader
            title="Top Organizations"
            onViewAll={() => onTabChange("organizations")}
          />
          <div className="space-y-3">
            {topOrganizations.length === 0 ? (
              <OssEmptyState message="No organizations yet." />
            ) : (
              topOrganizations.map((organization) => (
                <OssOrganizationPreviewCard
                  key={organization.id}
                  organization={organization}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <OssSectionHeader
            title="Top Contributors"
            onViewAll={() => onTabChange("contributors")}
          />
          <div className="space-y-3">
            {topContributors.length === 0 ? (
              <OssEmptyState message="No contributors yet." />
            ) : (
              topContributors.map((contributor) => (
                <OssContributorPreviewCard
                  key={contributor.id}
                  contributor={contributor}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-8">
          <OssSectionHeader
            title="Top Organizations"
            onViewAll={() => onTabChange("organizations")}
          />
          <OssSectionHeader
            title="Top Contributors"
            onViewAll={() => onTabChange("contributors")}
          />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: desktopRowCount }, (_, index) => {
            const organization = topOrganizations[index];
            const contributor = topContributors[index];

            return (
              <div
                key={`${organization?.id ?? "org-empty"}-${contributor?.id ?? "contributor-empty"}-${index}`}
                className="grid grid-cols-2 gap-8 items-stretch"
              >
                <div className="[&>div]:h-full">
                  {organization ? (
                    <OssOrganizationPreviewCard organization={organization} />
                  ) : topOrganizations.length === 0 && index === 0 ? (
                    <OssEmptyState message="No organizations yet." />
                  ) : null}
                </div>

                <div className="[&>div]:h-full">
                  {contributor ? (
                    <OssContributorPreviewCard contributor={contributor} />
                  ) : topContributors.length === 0 && index === 0 ? (
                    <OssEmptyState message="No contributors yet." />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
