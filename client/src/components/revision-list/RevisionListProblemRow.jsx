import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const difficultyTone = {
  Easy: "border-emerald-400/15 bg-emerald-500/10 text-emerald-300",
  Medium: "border-amber-400/15 bg-amber-500/10 text-amber-300",
  Hard: "border-rose-400/15 bg-rose-500/10 text-rose-300",
};

const platformTone = {
  leetcode: "border-sky-400/15 bg-sky-500/10 text-sky-200",
  gfg: "border-emerald-400/15 bg-emerald-500/10 text-emerald-200",
  mixed: "border-teal-400/15 bg-teal-500/10 text-teal-200",
};

const RevisionListProblemRow = ({ index, problem }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group flex items-center gap-3 border-b border-white/8 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.025]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/60">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white/92">
          {problem.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span
            className={`rounded-full border px-2 py-0.5 font-medium ${
              difficultyTone[problem.difficulty] ||
              "border-white/10 bg-white/[0.04] text-white/65"
            }`}
          >
            {problem.difficulty || "Unknown"}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 font-medium ${
              platformTone[problem.platform] ||
              "border-white/10 bg-white/[0.04] text-white/65"
            }`}
          >
            {problem.platform || "item"}
          </span>
          {problem.needsLink ? (
            <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-200">
              Link needed
            </span>
          ) : null}
          {problem.slug ? (
            <span className="truncate text-white/38">{problem.slug}</span>
          ) : null}
        </div>
      </div>

      {problem.link ? (
        <a
          href={problem.link}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Open
          <ExternalLink size={12} />
        </a>
      ) : (
        <span className="shrink-0 text-xs text-amber-200/85">Needs link</span>
      )}
    </motion.div>
  );
};

export default RevisionListProblemRow;
