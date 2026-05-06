export default function OssSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full sm:w-[260px]">
      <input
        type="text"
        placeholder="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[42px] w-full rounded-full border border-transparent bg-[#222222] px-5 py-3 text-xs/relaxed font-medium text-white outline-none"
      />
    </div>
  );
}
