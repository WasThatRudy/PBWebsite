export default function OssPointBlankLoader({
  message,
  subtext,
}: {
  message: string;
  subtext: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <svg className="h-15 w-30" viewBox="0 0 120 60" aria-hidden="true">
        <path
          className="fill-none stroke-pbgreen stroke-5 animate-[draw_1.5s_ease-in-out_infinite]"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: 100,
            strokeLinecap: "round",
          }}
          d="M40 15 L20 30 L40 45"
        />
        <path
          className="fill-none stroke-pbgreen stroke-5 animate-[draw_1.5s_ease-in-out_infinite]"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: 100,
            strokeLinecap: "round",
            animationDelay: "0.5s",
          }}
          d="M80 15 L100 30 L80 45"
        />
        <circle
          className="fill-pbgreen animate-[pop_1.5s_infinite]"
          style={{
            animationDelay: "1s",
            opacity: 0,
            transformOrigin: "center",
          }}
          cx="50"
          cy="30"
          r="4"
        />
      </svg>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-white sm:text-base">
          {message}
        </p>
        <p className="max-w-sm text-sm font-medium leading-relaxed text-zinc-500">
          {subtext}
        </p>
      </div>

      <style jsx>{`
        @keyframes draw {
          0% {
            stroke-dashoffset: 100;
          }
          20%,
          90% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 100;
          }
        }

        @keyframes pop {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          5% {
            opacity: 1;
            transform: scale(1.2);
          }
          10%,
          90% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }
      `}</style>
    </div>
  );
}
