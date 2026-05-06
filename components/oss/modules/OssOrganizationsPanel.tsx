import type {
  OrganizationSortOptionId,
  OrganizationTagFilter,
  OrganizationView,
} from "@/components/oss/types";
import {
  ORGANIZATION_SORT_OPTIONS,
  ORGANIZATION_TAG_OPTIONS,
  SHOW_ORGANIZATION_TAGS,
} from "@/components/oss/utils";
import OssFilterGroup from "@/components/oss/widgets/OssFilterGroup";
import OssFilterMenu from "@/components/oss/widgets/OssFilterMenu";
import OssOrganizationCard from "@/components/oss/widgets/OssOrganizationCard";
import OssSearchInput from "@/components/oss/widgets/OssSearchInput";

export default function OssOrganizationsPanel({
  onOrganizationTagChange,
  onOrgSortChange,
  onSearchQueryChange,
  organizationTag,
  orgSort,
  organizations,
  searchQuery,
}: {
  onOrganizationTagChange: (value: OrganizationTagFilter) => void;
  onOrgSortChange: (value: OrganizationSortOptionId) => void;
  onSearchQueryChange: (value: string) => void;
  organizationTag: OrganizationTagFilter;
  orgSort: OrganizationSortOptionId;
  organizations: OrganizationView[];
  searchQuery: string;
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <h2 className="shrink-0 text-2xl font-medium text-white sm:text-3xl">
          Explore Repositories
        </h2>
        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-start md:justify-end">
          <OssSearchInput
            value={searchQuery}
            onChange={onSearchQueryChange}
          />
          <OssFilterMenu>
            {({ close }) => (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Sort By
                  </p>
                  <OssFilterGroup
                    activeId={orgSort}
                    options={ORGANIZATION_SORT_OPTIONS}
                    onChange={(value) => {
                      onOrgSortChange(value);
                      close();
                    }}
                    className="grid grid-cols-2 gap-2"
                  />
                </div>

                {SHOW_ORGANIZATION_TAGS && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                      Tags
                    </p>
                    <OssFilterGroup
                      activeId={organizationTag}
                      options={ORGANIZATION_TAG_OPTIONS}
                      onChange={(value) => {
                        onOrganizationTagChange(value);
                        close();
                      }}
                      className="grid grid-cols-2 gap-2"
                    />
                  </div>
                )}
              </div>
            )}
          </OssFilterMenu>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-[20px] bg-[#1c1c1c] py-20 text-center">
          <p className="font-medium text-zinc-500">
            No organizations found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-3">
          {organizations.map((organization) => (
            <OssOrganizationCard
              key={organization.id}
              organization={organization}
            />
          ))}
        </div>
      )}
    </div>
  );
}
