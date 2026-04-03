import React, { useState } from "react";
import { Search } from "lucide-react";

const extractUsername = (input) => {
  const trimmed = input.trim();
  try {
    const match = trimmed.match(/leetcode\.com\/(?:u\/)?([^/?#]+)/);
    if (match && match[1]) return match[1].replace(/\/$/, "");
  } catch (_error) {}
  return trimmed;
};

const ProfileInput = ({ onAnalyze, isLoading }) => {
  const [input, setInput] = useState("");
  const parsedUsername = extractUsername(input);
  const isUrl = input.trim().startsWith("http");

  const handleAnalyze = () => {
    const username = extractUsername(input);
    if (username) onAnalyze(username);
  };

  return (
    <div className="mb-6 rounded-[28px] border border-white/10 bg-[#121922]/90 p-4 shadow-[0_18px_45px_rgba(3,10,24,0.16)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Analyze LeetCode Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
            Paste a username or profile URL
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b7c2cf]">
            We&apos;ll normalize the link, estimate topic coverage, and generate
            a focused practice plan from your weaker areas.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/58">
          Works with `leetcode.com/u/username/` and plain handles.
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-grow flex-col gap-2">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/32"
            />
            <input
              type="text"
              placeholder="Enter username or paste leetcode.com profile URL..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" &&
                !isLoading &&
                input.trim() &&
                handleAnalyze()
              }
              className="h-14 w-full rounded-2xl border border-white/12 bg-[linear-gradient(180deg,#1b242f_0%,#18212a_100%)] pr-4 pl-11 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-slate-500 hover:border-white/15 focus:border-slate-300/28 focus:bg-[#1d2630] focus:shadow-[0_0_0_1px_rgba(203,213,225,0.08),0_0_20px_rgba(148,163,184,0.06)]"
            />
          </label>

          {isUrl && parsedUsername && (
            <p className="ml-1 text-xs font-medium text-emerald-300">
              Username detected: <strong>{parsedUsername}</strong>
            </p>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!input.trim() || isLoading}
          className="inline-flex h-14 min-w-[152px] items-center justify-center rounded-2xl border border-white/14 bg-white px-6 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(255,255,255,0.06)] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/35 disabled:text-black/60"
        >
          {isLoading ? (
            <div className="h-5 w-5 rounded-full border-2 border-black/70 border-t-transparent animate-spin" />
          ) : (
            "Analyze"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileInput;
