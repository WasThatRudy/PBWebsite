import type { ReactNode } from "react";

export default function OssStatCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="flex min-h-[120px] flex-col rounded-[16px] bg-[#1c1c1c] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:min-h-[160px] sm:rounded-[20px] sm:p-6">
      <div className="mb-3 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] sm:h-14 sm:w-14 sm:rounded-[18px]">
          {icon}
        </div>
        <h3 className="text-zinc-400 text-[10px] tracking-wider uppercase font-medium sm:text-sm sm:tracking-widest">
          {title}
        </h3>
      </div>
      <div className="mt-auto text-3xl font-medium text-white sm:text-4xl md:text-5xl">
        {value}
      </div>
    </div>
  );
}
