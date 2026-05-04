import type { ReactNode } from "react";

export default function OssPill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3 text-xs leading-none ${className}`}
    >
      {children}
    </span>
  );
}
