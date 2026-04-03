import React from "react";
import { ShieldCheck } from "lucide-react";

const StrengthSection = ({ strongTopics }) => {
  if (!strongTopics || strongTopics.length === 0) return null;

  return (
    <div className="rounded-[24px] border border-emerald-400/12 bg-[#131f1b] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl border border-emerald-400/16 bg-emerald-500/10 p-3 text-emerald-300">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Strong Areas
          </h2>
          <p className="mt-1 text-sm text-emerald-200/72">
            Topics where your repetition is already building confidence.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {strongTopics.map((topic, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-2xl border border-emerald-400/14 bg-emerald-500/8 px-4 py-3 text-emerald-100"
          >
            <span className="font-semibold">{topic.name}</span>
            <span className="rounded-full border border-emerald-400/12 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              {topic.solved} solved
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrengthSection;
