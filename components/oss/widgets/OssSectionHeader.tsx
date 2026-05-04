export default function OssSectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <h2 className="text-xl font-medium text-white sm:text-2xl md:text-[2rem]">
        {title}
      </h2>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="shrink-0 rounded-full bg-[#39FF14] px-4 py-2 text-right text-[11px] font-medium uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#32e600] sm:text-sm sm:tracking-[0.24em]"
        >
          VIEW ALL
        </button>
      )}
    </div>
  );
}
