type FilterOption<T extends string> = {
  id: T;
  label: string;
};

export default function OssFilterGroup<T extends string>({
  activeId,
  options,
  onChange,
  className = "",
}: {
  activeId: T;
  options: Array<FilterOption<T>>;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs transition-colors sm:px-4 sm:py-3 sm:text-sm ${
            activeId === option.id
              ? "bg-[#39FF14] text-black"
              : "bg-[#111111] text-zinc-300 hover:bg-[#222222] hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
