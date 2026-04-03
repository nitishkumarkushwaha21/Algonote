import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const complexityOptions = [
  "O(1)",
  "O(log N)",
  "O(N)",
  "O(N log N)",
  "O(N^2)",
  "O(N^3)",
  "O(2^N)",
  "O(N!)",
];

const ComplexitySelect = ({ label, value, onChange }) => {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/8 bg-[#151515] px-3 py-2">
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/70">
        {label}
      </span>
      <select
        value={value || ""}
        onChange={onChange}
        className="w-full cursor-pointer appearance-none border-none bg-transparent font-mono text-xs text-white/92 focus:outline-none"
        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
      >
        <option value="" disabled className="bg-neutral-900 text-gray-500">
          Select...
        </option>
        {complexityOptions.map((option) => (
          <option key={option} value={option} className="bg-neutral-900 text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

const ProblemComplexityFields = ({
  timeValue,
  spaceValue,
  onTimeChange,
  onSpaceChange,
  onPrev,
  hasPrev,
  onNext,
  hasNext,
}) => {
  return (
    <div className="border-t border-white/6 bg-[#101010] px-4 py-2.5">
      <div className="flex w-full items-center gap-3">
        <ComplexitySelect
          label="Time"
          value={timeValue}
          onChange={onTimeChange}
        />
        <ComplexitySelect
          label="Space"
          value={spaceValue}
          onChange={onSpaceChange}
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              hasPrev
                ? "border-white/12 bg-white/[0.05] text-white/78 hover:bg-white/[0.08]"
                : "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/28"
            }`}
          >
            <ArrowLeft size={13} />
            Prev
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              hasNext
                ? "border-blue-500/22 bg-blue-500/12 text-blue-200 hover:bg-blue-500/18"
                : "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/28"
            }`}
          >
            Next
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemComplexityFields;
