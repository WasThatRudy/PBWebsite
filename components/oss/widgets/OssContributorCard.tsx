import type { ContributorView } from "@/components/oss/types";
import { Pill } from "@/components/ui/Pill";
import {
  formatContributionMeta,
  getContributorGithubUrl,
} from "@/components/oss/utils";

export default function OssContributorCard({
  contributor,
}: {
  contributor: ContributorView;
}) {
  const contributorUrl = getContributorGithubUrl(contributor);
  const visibleOrgs = contributor.organizations.slice(0, 5);
  const remainingOrgs = contributor.organizations.slice(5);
  return (
    <div className="rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:rounded-[20px] sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-medium text-white sm:text-xl">
            {contributor.name}
          </h3>
          {contributor.login && (
            contributorUrl ? (
                <a
                  href={contributorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-words text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                >
                @{contributor.login}
                </a>
              ) : (
                <p className="mt-1 break-words text-sm text-zinc-500">
                 @{contributor.login}
              </p>
  )
)}
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {formatContributionMeta(
              contributor.prCount,
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
  <>
    {visibleOrgs.map((organization) => (
      <Pill
        key={organization.id}
        className="max-w-[160px]"
        variant="muted"
      >
        <span className="truncate">{organization.name}</span>
      </Pill>
    ))}

    {remainingOrgs.length > 0 && (
      <div className="relative group">
        <Pill
          className="cursor-pointer font-medium"
          variant="muted"
        >
          +{remainingOrgs.length} more
        </Pill>

        {/* Hover dropdown */}
        <div className="absolute left-0 top-full z-20 mt-2 w-[220px] rounded-lg bg-[#111] p-3 shadow-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition">
          <div className="flex flex-col gap-1">
            {remainingOrgs.map((org) => (
              <span
                key={org.id}
                className="text-xs text-zinc-400"
              >
                {org.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
)}
          </div>
        </div>
      </div>
    </div>
  );
}