import type { ContributorView } from "@/components/oss/types";
import { Pill } from "@/components/ui/Pill";
import {
  formatContributionMeta,
} from "@/components/oss/utils";

export default function OssContributorCard({
  contributor,
}: {
  contributor: ContributorView;
}) {
  return (
    <div className="rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-medium text-white sm:text-xl">
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
            )}
          </p>
          {contributor.bio && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {contributor.bio}
            </p>
          )}
        </div>

        <div className="border-t border-zinc-800/50 pt-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Organizations
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contributor.organizations.length === 0 ? (
              <span className="text-xs text-zinc-600">No orgs yet</span>
            ) : (
              contributor.organizations.map((organization) => (
                <Pill
                  key={organization.id}
                  className="max-w-[160px]"
                  variant="muted"
                >
                  <span className="truncate">{organization.name}</span>
                </Pill>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
