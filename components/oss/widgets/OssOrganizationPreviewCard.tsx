import type { OrganizationView } from "@/components/oss/types";
import OssPill from "@/components/oss/elements/OssPill";
import {
  contributorLabel,
  formatContributionMeta,
  formatTagLabel,
  MUTED_PILL_CLASSNAME,
  PRIMARY_PILL_CLASSNAME,
} from "@/components/oss/utils";

export default function OssOrganizationPreviewCard({
  organization,
}: {
  organization: OrganizationView;
}) {
  return (
    <div className="w-full rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:min-h-[172px] sm:rounded-[20px] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <span className="block break-words font-medium text-base text-white sm:text-lg">
            {organization.name}
          </span>
          {organization.url && (
            <p className="mt-1 break-all pr-1 text-xs text-zinc-500">
              {organization.url}
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:mt-3 sm:text-sm">
            {formatContributionMeta(
              organization.prCount,
              organization.commitCount,
            )}
          </p>
        </div>
        <div className="flex min-h-[32px] flex-wrap items-center gap-1.5">
          <OssPill className={`${PRIMARY_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.18em]`}>
            {formatTagLabel(organization.tag)}
          </OssPill>
          {organization.contributors.length === 0 ? (
            <OssPill className={`${MUTED_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.14em]`}>
              No Contributors
            </OssPill>
          ) : (
            <>
              {organization.contributors.slice(0, 2).map((contributor) => (
                <OssPill
                  key={contributor.id}
                  className={`${MUTED_PILL_CLASSNAME}`}
                >
                  {contributorLabel(contributor)}
                </OssPill>
              ))}
              {organization.contributors.length > 2 && (
                <OssPill
                  className={`${MUTED_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.14em]`}
                >
                  +{organization.contributors.length - 2} More
                </OssPill>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
