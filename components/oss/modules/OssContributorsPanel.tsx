import type {
  ContributorSortOptionId,
  ContributorView,
} from "@/components/oss/types";
import { CONTRIBUTOR_SORT_OPTIONS } from "@/components/oss/utils";
import OssContributorCard from "@/components/oss/widgets/OssContributorCard";
import OssFilterGroup from "@/components/oss/widgets/OssFilterGroup";
import OssSearchInput from "@/components/oss/widgets/OssSearchInput";

export default function OssContributorsPanel({
  contributorSort,
  contributors,
  onContributorSortChange,
  onSearchQueryChange,
  searchQuery,
}: {
  contributorSort: ContributorSortOptionId;
  contributors: ContributorView[];
  onContributorSortChange: (value: ContributorSortOptionId) => void;
  onSearchQueryChange: (value: string) => void;
  searchQuery: string;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <h2 className="shrink-0 text-2xl font-medium text-white sm:text-3xl">
          Meet the Contributors
        </h2>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:justify-end">
          <OssSearchInput
            value={searchQuery}
            onChange={onSearchQueryChange}
          />
          <OssFilterGroup
            activeId={contributorSort}
            options={CONTRIBUTOR_SORT_OPTIONS}
            onChange={onContributorSortChange}
            className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end"
          />
        </div>
      </div>

      {contributors.length === 0 ? (
        <div className="rounded-[20px] bg-[#1c1c1c] py-20 text-center">
          <p className="font-medium text-zinc-500">
            No contributors found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6">
          {contributors.map((contributor) => (
            <OssContributorCard
              key={contributor.id}
              contributor={contributor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
