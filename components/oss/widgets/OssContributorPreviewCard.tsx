import type { ContributorView } from "@/components/oss/types";
import OssPill from "@/components/oss/elements/OssPill";
import {
  formatContributionMeta,
  MUTED_PILL_CLASSNAME,
} from "@/components/oss/utils";

export default function OssContributorPreviewCard({
  contributor,
}: {
  contributor: ContributorView;
}) {
  return (
    <div className="w-full rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:min-h-[172px] sm:rounded-[20px] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="min-w-0 text-left">
          <span className="block break-words font-medium text-base leading-tight text-white sm:text-lg">
            {contributor.name}
          </span>
          <span className="mt-1 block break-words text-xs font-medium text-zinc-500 sm:text-sm">
            {contributor.login
              ? `@${contributor.login}`
              : "Point Blank contributor"}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:mt-3 sm:text-sm">
            {formatContributionMeta(
              contributor.prCount,
              contributor.commitCount,
            )}
          </p>
        </div>
        <div className="flex min-h-[32px] flex-wrap items-center gap-2">
          {contributor.organizations.length === 0 ? (
            <OssPill
              className={`${MUTED_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.14em]`}
            >
              No Orgs Yet
            </OssPill>
          ) : (
            <>
              {contributor.organizations.slice(0, 2).map((organization) => (
                <OssPill
                  key={organization.id}
                  className={`${MUTED_PILL_CLASSNAME} max-w-[140px]`}
                >
                  <span className="truncate">{organization.name}</span>
                </OssPill>
              ))}
              {contributor.organizations.length > 2 && (
                <OssPill
                  className={`${MUTED_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.14em]`}
                >
                  +{contributor.organizations.length - 2} More
                </OssPill>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
