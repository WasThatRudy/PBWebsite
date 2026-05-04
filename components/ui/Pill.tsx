import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center rounded-full px-3 text-xs leading-none",
  {
    variants: {
      variant: {
        accent: "bg-[#39FF14] text-black",
        muted: "bg-[#111111] text-zinc-300",
        neutral: "bg-[#1c1c1c] text-zinc-300",
      },
      size: {
        default: "h-8",
        compact: "h-7 px-2.5 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

function Pill({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof pillVariants>) {
  return (
    <span
      data-slot="pill"
      data-variant={variant}
      data-size={size}
      className={cn(pillVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Pill, pillVariants };
