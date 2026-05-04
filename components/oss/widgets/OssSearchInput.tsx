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
        className="w-full rounded-full bg-[#111111] px-4 py-2.5 text-sm font-medium text-white outline-none sm:px-6 sm:py-3"
      />
    </div>
  );
}
