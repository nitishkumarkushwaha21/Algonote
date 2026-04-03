import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FolderPlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import profileAnalysisApi from "../../services/profileAnalysisApi";

const getDifficultyColor = (difficulty) => {
  switch ((difficulty || "").toLowerCase()) {
    case "easy":
      return "border-emerald-400/15 bg-emerald-500/10 text-emerald-300";
    case "medium":
      return "border-amber-400/15 bg-amber-500/10 text-amber-300";
    case "hard":
      return "border-rose-400/15 bg-rose-500/10 text-rose-300";
    default:
      return "border-white/10 bg-white/[0.04] text-white/65";
  }
};

const TopicQuestionRow = ({ index, problem, onAdd, addState }) => {
  const practiceUrl = problem.leetcodeUrl || problem.url;

  return (
    <div className="flex items-center gap-3 border-b border-white/8 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.025]">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/60">
        {index + 1}
      </div>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/92">
        {problem.problemName || problem.name}
      </span>

      <div className="flex w-24 shrink-0 justify-center">
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getDifficultyColor(
            problem.difficulty,
          )}`}
        >
          {problem.difficulty || "Unknown"}
        </span>
      </div>

      {practiceUrl ? (
        <a
          href={practiceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/78 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          Open
          <ExternalLink size={12} />
        </a>
      ) : null}

      <button
        onClick={onAdd}
        disabled={addState === "adding" || addState === "added"}
        className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
          addState === "added"
            ? "bg-emerald-500 text-white"
            : addState === "error"
              ? "bg-red-500 text-white"
              : "border border-white/10 bg-white/[0.04] text-white/78 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        {addState === "adding" ? (
          <span className="flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            Adding
          </span>
        ) : addState === "added" ? (
          "Saved"
        ) : addState === "error" ? (
          "Failed"
        ) : (
          "Add"
        )}
      </button>
    </div>
  );
};

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
  const [expandedTopics, setExpandedTopics] = useState({});
  const [topicQuestionBank, setTopicQuestionBank] = useState({});
  const [loadingTopics, setLoadingTopics] = useState({});

  if (!recommendations || Object.keys(recommendations).length === 0) {
    return null;
  }

  const handleAdd = async (problem, topic) => {
    const key = `${topic}-${problem.problemName || problem.name}`;
    setAddingState((prev) => ({ ...prev, [key]: "adding" }));

    try {
      await onAddToRevision(problem, topic);
      setAddingState((prev) => ({ ...prev, [key]: "added" }));
      setTimeout(() => {
        setAddingState((prev) => ({ ...prev, [key]: null }));
      }, 2500);
    } catch {
      setAddingState((prev) => ({ ...prev, [key]: "error" }));
      setTimeout(() => {
        setAddingState((prev) => ({ ...prev, [key]: null }));
      }, 3000);
    }
  };

  const handleToggleTopic = async (topic) => {
    if (expandedTopics[topic]) {
      setExpandedTopics((prev) => ({ ...prev, [topic]: false }));
      return;
    }

    if (!topicQuestionBank[topic]) {
      setLoadingTopics((prev) => ({ ...prev, [topic]: true }));
      try {
        const { data } = await profileAnalysisApi.getTopicQuestions(topic);
        setTopicQuestionBank((prev) => ({
          ...prev,
          [topic]: data.data?.problems || [],
        }));
      } catch (_error) {
        setTopicQuestionBank((prev) => ({ ...prev, [topic]: [] }));
      } finally {
        setLoadingTopics((prev) => ({ ...prev, [topic]: false }));
      }
    }

    setExpandedTopics((prev) => ({ ...prev, [topic]: true }));
  };

  return (
    <div className="mb-6 rounded-[24px] border border-white/10 bg-[#151c25] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-2xl border border-slate-300/16 bg-slate-300/10 p-3 text-slate-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Generated Questions
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#b7c2cf]">
              Expand a topic to see the full curated sheet, or save questions directly to revision.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={onImportToExplorer}
            disabled={isImporting}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/82 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
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
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              hasRevisionRows
                ? "border-slate-300/16 bg-slate-300/10 text-slate-200 hover:bg-slate-300/14"
                : "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/34"
            }`}
          >
            <Download size={14} />
            Export Sheet
          </button>
        </div>
      </div>

      {importResult && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
            importResult.success
              ? "border-emerald-400/16 bg-emerald-500/10 text-emerald-200"
              : "border-red-400/16 bg-red-500/10 text-red-200"
          }`}
        >
          {importResult.message}
        </div>
      )}

      <div className="space-y-5">
        {Object.entries(recommendations).map(([topic, problems]) => {
          const previewProblems = problems.slice(0, 3);
          const fullTopicQuestions = topicQuestionBank[topic] || [];
          const isExpanded = Boolean(expandedTopics[topic]);
          const isLoadingTopic = Boolean(loadingTopics[topic]);

          return (
            <div
              key={topic}
              className="overflow-hidden rounded-[20px] border border-white/10 bg-[#1b232d]"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Focus: <span className="text-slate-200">{topic}</span>
                    </h3>
                    <p className="mt-1 text-sm text-white/46">
                      {problems[0]?.comment || "Recommended practice set for this weak area."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleTopic(topic)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/78 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {isExpanded ? "Less ques" : "More ques"}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {!isExpanded && (
                <div className="px-3 py-2">
                  {previewProblems.map((prob, idx) => {
                    const key = `${topic}-${prob.problemName || prob.name}`;
                    return (
                      <TopicQuestionRow
                        key={`${key}-preview`}
                        index={idx}
                        problem={prob}
                        addState={addingState[key]}
                        onAdd={() => handleAdd(prob, topic)}
                      />
                    );
                  })}
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-white/10 bg-[#18212b] px-3 py-2">
                  {isLoadingTopic ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/58">
                      <Loader2 size={16} className="animate-spin" />
                      Loading topic sheet...
                    </div>
                  ) : fullTopicQuestions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-white/46">
                      No extra questions found for this topic.
                    </div>
                  ) : (
                    fullTopicQuestions.map((prob, idx) => {
                      const key = `${topic}-${prob.problemName || prob.name}`;
                      return (
                        <TopicQuestionRow
                          key={`${key}-full`}
                          index={idx}
                          problem={prob}
                          addState={addingState[key]}
                          onAdd={() => handleAdd(prob, topic)}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationSection;
