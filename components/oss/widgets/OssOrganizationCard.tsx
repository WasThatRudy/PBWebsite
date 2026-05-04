import type { OrganizationView } from "@/components/oss/types";
import OssPill from "@/components/oss/elements/OssPill";
import {
  contributorLabel,
  formatContributionMeta,
  formatTagLabel,
  MUTED_PILL_CLASSNAME,
  PRIMARY_PILL_CLASSNAME,
} from "@/components/oss/utils";

export default function OssOrganizationCard({
  organization,
}: {
  organization: OrganizationView;
}) {
  return (
    <div className="flex flex-col rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-medium text-white sm:text-xl">
            {organization.name}
          </h3>
          {organization.url && (
            <p className="mt-2 break-all pr-1 text-xs text-zinc-500">
              {organization.url}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OssPill className={`${PRIMARY_PILL_CLASSNAME} text-[11px] font-medium uppercase tracking-[0.18em]`}>
            {formatTagLabel(organization.tag)}
          </OssPill>
          <span className="text-xs text-zinc-500">
            {organization.commitCount} commits
          </span>
        </div>
      </div>

      {organization.description && (
        <p className="mb-5 text-sm leading-relaxed text-zinc-400">
          {organization.description}
        </p>
      )}

      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        {formatContributionMeta(
          organization.prCount,
          organization.commitCount,
        )}
      </p>

      <div className="mt-auto border-t border-zinc-800/50 pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Active Contributors ({organization.contributors.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {organization.contributors.length === 0 ? (
            <span className="text-xs text-zinc-600">No active contributors</span>
          ) : (
            organization.contributors.map((contributor) => (
              <OssPill
                key={contributor.id}
                className={`${MUTED_PILL_CLASSNAME}`}
              >
                {contributorLabel(contributor)}
              </OssPill>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
