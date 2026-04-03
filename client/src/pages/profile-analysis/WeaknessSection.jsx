import React from "react";
import { AlertTriangle } from "lucide-react";

const WeaknessSection = ({ weakTopics }) => {
  if (!weakTopics || weakTopics.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-amber-400/12 bg-[#201915] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-amber-400/16 bg-amber-500/10 p-3 text-amber-300">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Weak Areas
          </h2>
          <p className="mt-1 text-sm text-amber-200/72">
            Topics that deserve the next block of focused practice.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {weakTopics.map((topic, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-amber-400/14 bg-amber-500/8 px-4 py-3 text-amber-100"
          >
            <span className="font-semibold">{topic.name}</span>
            <span className="rounded-full border border-amber-400/12 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
              {topic.solved} solved
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeaknessSection;
