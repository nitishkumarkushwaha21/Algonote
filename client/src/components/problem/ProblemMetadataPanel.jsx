import React from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import {
  detectProblemSource,
  getProblemSourceLabel,
} from "../../utils/problemSources";

const difficultyStyles = {
  Easy: "border-green-500/20 bg-green-500/10 text-green-400",
  Medium: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  Hard: "border-red-500/20 bg-red-500/10 text-red-400",
};

const ProblemMetadataPanel = ({
  activeFile,
  isImporting,
  localLink,
  onLinkChange,
  onLinkBlur,
  onImportClick,
}) => {
  const source = detectProblemSource(localLink) || activeFile.source || null;
  const sourceLabel = getProblemSourceLabel(source);
  const canImport =
    localLink &&
    Boolean(detectProblemSource(localLink)) &&
    !activeFile.description &&
    !isImporting;

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),#0e131b] p-6">
      <style>{`
        .problem-statement {
          color: rgb(214 220 228);
          font-size: 0.93rem;
          line-height: 1.78;
        }

        .problem-statement > *:first-child {
          margin-top: 0;
        }

        .problem-statement h1,
        .problem-statement h2,
        .problem-statement h3,
        .problem-statement h4 {
          color: #ffffff;
          font-weight: 700;
          line-height: 1.35;
          margin-top: 1.5rem;
          margin-bottom: 0.8rem;
        }

        .problem-statement p,
        .problem-statement ul,
        .problem-statement ol,
        .problem-statement blockquote {
          margin-top: 0.9rem;
          margin-bottom: 0.9rem;
        }

        .problem-statement ul,
        .problem-statement ol {
          padding-left: 1.25rem;
        }

        .problem-statement li {
          margin: 0.4rem 0;
        }

        .problem-statement pre {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.035);
          padding: 15px 17px;
          color: #e5e7eb;
          font-size: 0.84rem;
          line-height: 1.65;
          overflow-x: auto;
        }

        .problem-statement code {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          border-radius: 8px;
          background: rgba(255,255,255,0.055);
          padding: 0.14rem 0.38rem;
          color: #f8fafc;
          font-size: 0.84rem;
        }

        .problem-statement pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }

        .problem-statement strong {
          color: #fff;
          font-weight: 700;
        }

        .problem-statement table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .problem-statement img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1rem auto;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .problem-statement figure {
          margin: 1rem 0;
        }

        .problem-statement td,
        .problem-statement th {
          border: 1px solid rgba(255,255,255,0.08);
          padding: 0.7rem;
          vertical-align: top;
          text-align: left;
        }

        .problem-statement * {
          max-width: 100%;
        }
      `}</style>

      <div className="mb-6 rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[2rem] font-semibold tracking-[-0.03em] text-white">
              {activeFile.title || activeFile.name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
            {activeFile.difficulty && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  difficultyStyles[activeFile.difficulty] ||
                  difficultyStyles.Hard
                }`}
              >
                {activeFile.difficulty}
              </span>
            )}
            {activeFile.tags?.map((tag) => (
              <span
                key={tag.name}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400"
              >
                {tag.name}
              </span>
            ))}
            </div>
          </div>

          {localLink && source && (
            <a
              href={localLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-orange-500/18 bg-orange-500/12 px-3 py-2 text-xs font-medium text-orange-300 transition-colors hover:bg-orange-500/20"
              title={`Open on ${sourceLabel}`}
            >
              <ExternalLink size={11} />
              {sourceLabel}
            </a>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              key={`link-${activeFile.id}`}
              type="text"
              placeholder="Paste LeetCode or GFG link here..."
              className={`flex-1 rounded-xl border px-3 py-2 text-xs outline-none transition-colors ${
                isImporting
                  ? "animate-pulse border-yellow-500/45 bg-yellow-500/5 text-yellow-300"
                  : "border-white/10 bg-[#0b1017] text-white/62 focus:border-blue-400/38 focus:text-white"
              }`}
              value={localLink}
              disabled={isImporting}
              onChange={(event) => onLinkChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.target.blur();
                }
              }}
              onBlur={onLinkBlur}
            />

            <button
              type="button"
              onClick={onImportClick}
              disabled={!canImport}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                canImport
                  ? "border-blue-500/22 bg-blue-500/12 text-blue-200 hover:bg-blue-500/20"
                  : "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/32"
              }`}
              title="Import and save question"
            >
              {isImporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              Import Question
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        {isImporting ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 animate-spin" size={20} />
            <span className="text-yellow-400">
              Importing {sourceLabel} problem...
            </span>
          </div>
        ) : activeFile.description ? (
          <div
            className="problem-statement"
            dangerouslySetInnerHTML={{ __html: activeFile.description }}
          />
        ) : (
          <div className="italic text-white/42">
            No description available yet. Paste a LeetCode or GFG link above
            and use Import Question to save the statement for future fast
            opens.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemMetadataPanel;
