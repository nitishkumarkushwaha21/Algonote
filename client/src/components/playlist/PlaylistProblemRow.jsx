import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import PlaylistDifficultyBadge from "./PlaylistDifficultyBadge";

const PlaylistProblemRow = ({ index, problem }) => {
  const handleOpen = () => {
    if (problem.leetcode_link) {
      window.open(problem.leetcode_link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group flex items-center gap-3 border-b border-white/8 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.025]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/60">
        {index + 1}
      </div>

      <span
        className="min-w-0 flex-1 cursor-pointer truncate text-sm font-medium text-white/92 transition-colors hover:text-white"
        onClick={handleOpen}
      >
        {problem.title}
      </span>

      {problem.confidence_score != null && (
        <span className="hidden shrink-0 text-xs text-white/42 lg:block">
          {Math.round(problem.confidence_score * 100)}% match
        </span>
      )}

      <div className="flex w-20 shrink-0 justify-center">
        <PlaylistDifficultyBadge difficulty={problem.difficulty} />
      </div>

      <button
        onClick={handleOpen}
        className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white"
        title="Open on LeetCode"
      >
        Open
        <ExternalLink size={12} />
      </button>
    </motion.div>
  );
};

export default PlaylistProblemRow;
