export default function OssEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] bg-[#1c1c1c] p-5 text-zinc-500">
      {message}
    </div>
  );
}
