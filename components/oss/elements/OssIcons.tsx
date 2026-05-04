import Image from "next/image";

function StatIcon({
  alt,
  className,
  height,
  src,
  width,
}: {
  alt: string;
  className: string;
  height: number;
  src: string;
  width: number;
}) {
  return (
    <Image
      alt={alt}
      aria-hidden="true"
      className={className}
      height={height}
      src={src}
      width={width}
    />
  );
}

export function PrStatIcon() {
  return (
    <StatIcon
      alt=""
      className="h-6 w-6"
      height={24}
      src="/icons/oss/pr-stat.svg"
      width={24}
    />
  );
}

export function OrgStatIcon() {
  return (
    <StatIcon
      alt=""
      className="h-6 w-[18px]"
      height={24}
      src="/icons/oss/org-stat.svg"
      width={18}
    />
  );
}

export function ContributorStatIcon() {
  return (
    <StatIcon
      alt=""
      className="h-[27px] w-[27px]"
      height={27}
      src="/icons/oss/contributor-stat.svg"
      width={27}
    />
  );
}
