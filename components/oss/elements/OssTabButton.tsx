export default function OssTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-[10px] font-medium tracking-[0.08em] transition-all sm:min-w-[170px] sm:w-auto sm:px-5 sm:py-2.5 sm:text-sm sm:tracking-[0.18em] md:px-7 md:text-base ${
        active
          ? "bg-[#39FF14] text-black"
          : "bg-[#222222] text-zinc-300 hover:bg-[#2a2a2a] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
