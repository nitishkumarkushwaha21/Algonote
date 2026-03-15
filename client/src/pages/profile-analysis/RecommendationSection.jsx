import React, { useState } from "react";
import { FolderPlus, Download, Loader2, ExternalLink } from "lucide-react";

const RecommendationSection = ({
  recommendations,
  onAddToRevision,
  onExportSheet,
  hasRevisionRows,
  onImportToExplorer,
  isImporting,
  importResult,
}) => {
  const [addingState, setAddingState] = useState({});

  if (!recommendations || Object.keys(recommendations).length === 0)
    return null;

  const handleAdd = async (problem, topic) => {
    const key = `${topic}-${problem.name}`;
    setAddingState((prev) => ({ ...prev, [key]: "adding" }));
    try {
      await onAddToRevision(problem, topic);
      setAddingState((prev) => ({ ...prev, [key]: "added" }));
      setTimeout(
        () => setAddingState((prev) => ({ ...prev, [key]: null })),
        2500,
      );
    } catch {
      setAddingState((prev) => ({ ...prev, [key]: "error" }));
      setTimeout(
        () => setAddingState((prev) => ({ ...prev, [key]: null })),
        3000,
      );
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || "").toLowerCase()) {
      case "easy":
        return "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400";
      case "hard":
        return "text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] p-6 mb-6 border border-gray-100 dark:border-neutral-800">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg shrink-0">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">
              Smart Recommendations
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <b>Add to Revision</b> saves to your list.{" "}
              <b>Import All to Explorer</b> creates the full Weak Areas folder
              in one shot.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={onImportToExplorer}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors bg-indigo-50 dark:bg-neutral-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-neutral-700 hover:bg-indigo-100 dark:hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FolderPlus size={14} />
            )}
            {isImporting ? "Importing..." : "Import All to Explorer"}
          </button>
          <button
            onClick={onExportSheet}
            disabled={!hasRevisionRows}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${hasRevisionRows ? "bg-emerald-50 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-neutral-700 hover:bg-emerald-100 dark:hover:bg-neutral-700" : "bg-gray-100 dark:bg-neutral-800 text-gray-400 border-gray-200 dark:border-neutral-800 cursor-not-allowed"}`}
          >
            <Download size={14} />
            Export Sheet (CSV)
          </button>
        </div>
      </div>

      {importResult && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${importResult.success ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"}`}
        >
          <span>{importResult.success ? "✓" : "x"}</span>
          <span>{importResult.message}</span>
          {importResult.success && (
            <span className="text-gray-500 dark:text-gray-400">
              check the File Explorer sidebar.
            </span>
          )}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(recommendations).map(([topic, problems]) => (
          <div
            key={topic}
            className="border dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="bg-gray-50 dark:bg-neutral-950 px-5 py-3 border-b dark:border-neutral-800">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                Focus:{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {topic}
                </span>
              </h3>
            </div>
            <div className="divide-y dark:divide-neutral-800">
              {problems.map((prob, idx) => {
                const addKey = `${topic}-${prob.name}`;
                const state = addingState[addKey];
                const practiceUrl = prob.leetcodeUrl || prob.url;
                return (
                  <div
                    key={idx}
                    className="px-5 flex flex-row items-center justify-between gap-4 py-3 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 text-sm font-bold text-gray-600 dark:text-gray-300 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {prob.name}
                          </span>
                          {practiceUrl && (
                            <a
                              href={practiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Practice on LeetCode"
                              className="shrink-0 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        {prob.comment && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {prob.comment}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap ${getDifficultyColor(prob.difficulty)}`}
                      >
                        {prob.difficulty}
                      </span>
                      <button
                        onClick={() => handleAdd(prob, topic)}
                        disabled={state === "adding" || state === "added"}
                        className={`min-w-[130px] px-4 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${state === "added" ? "bg-green-500 text-white" : state === "error" ? "bg-red-500 text-white" : "bg-indigo-50 dark:bg-neutral-800 text-indigo-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-neutral-700 border border-indigo-200 dark:border-neutral-700"}`}
                      >
                        {state === "adding" ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : state === "added" ? (
                          "Saved"
                        ) : state === "error" ? (
                          "Failed"
                        ) : (
                          "+ Add to Revision"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationSection;
