import React from "react";

const VerdictSection = ({ score, level, message }) => {
  if (score === undefined) return null;

  let strokeColor = "#ef4444";
  let badgeClass =
    "border-red-400/16 bg-red-500/10 text-red-200";

  if (score >= 70) {
    strokeColor = "#10b981";
    badgeClass = "border-emerald-400/16 bg-emerald-500/10 text-emerald-200";
  } else if (score >= 40) {
    strokeColor = "#f59e0b";
    badgeClass = "border-amber-400/16 bg-amber-500/10 text-amber-200";
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mb-6 overflow-hidden rounded-[24px] border border-white/10 bg-[#141d2a] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg className="h-40 w-40 -rotate-90 transform">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={strokeColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tracking-[-0.04em] text-white">
              {Math.round(score)}
            </span>
            <span className="text-sm font-semibold text-white/52">/ 100</span>
          </div>
        </div>

        <div className="z-10 flex-grow text-center md:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Current Status
          </span>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
            <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white">
              {level}
            </h3>
            <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${badgeClass}`}>
              Score: {Math.round(score)}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="whitespace-pre-line text-base leading-7 text-[#c2cfdf]">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdictSection;
