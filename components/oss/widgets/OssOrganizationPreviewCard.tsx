import type { OrganizationView } from "@/components/oss/types";
import { Pill } from "@/components/ui/Pill";
import {
  contributorLabel,
  formatContributionMeta,
  formatTagLabel,
  getOrganizationGithubUrl,
  SHOW_ORGANIZATION_TAGS,
} from "@/components/oss/utils";

export default function OssOrganizationPreviewCard({
  organization,
}: {
  organization: OrganizationView;
}) {
  const organizationUrl = getOrganizationGithubUrl(
    organization.name,
    organization.url,
  );

  return (
    <div className="w-full rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:min-h-[172px] sm:rounded-[20px] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <span className="block break-words font-medium text-base text-white sm:text-lg">
            {organization.name}
          </span>
          {organization.url && (
            <a
              href={organizationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all pr-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              {organization.url}
            </a>
          )}
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:mt-3 sm:text-sm">
            {formatContributionMeta(
              organization.prCount,
            )}
          </p>
        </div>
        <div className="flex min-h-[32px] flex-wrap items-center gap-1.5">
          {SHOW_ORGANIZATION_TAGS && (
            <Pill
              className="font-medium uppercase tracking-[0.18em]"
              size="compact"
              variant="accent"
            >
              {formatTagLabel(organization.tag)}
            </Pill>
          )}
          {organization.contributors.length === 0 ? (
            <Pill
              className="font-medium uppercase tracking-[0.14em]"
              size="compact"
              variant="muted"
            >
              No Contributors
            </Pill>
          ) : (
            <>
              {organization.contributors.slice(0, 2).map((contributor) => (
                <Pill
                  key={contributor.id}
                  variant="muted"
                >
                  {contributorLabel(contributor)}
                </Pill>
              ))}
              {organization.contributors.length > 2 && (
                <Pill
                  className="font-medium uppercase tracking-[0.14em]"
                  size="compact"
                  variant="muted"
                >
                  +{organization.contributors.length - 2} More
                </Pill>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
