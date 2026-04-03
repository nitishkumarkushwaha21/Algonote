import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  Loader2,
  PencilLine,
  PlayCircle,
  Save,
  Trash2,
  X,
} from "lucide-react";
import playlistApi from "../../services/playlistApi";
import useFileStore from "../../store/useFileStore";
import PlaylistProblemRow from "./PlaylistProblemRow";

const buildDifficultyCounts = (items) =>
  items.reduce(
    (counts, problem) => {
      if (problem.difficulty === "Easy") {
        counts.easy += 1;
      } else if (problem.difficulty === "Medium") {
        counts.medium += 1;
      } else if (problem.difficulty === "Hard") {
        counts.hard += 1;
      }

      return counts;
    },
    { easy: 0, medium: 0, hard: 0 },
  );

const PlaylistSheetCard = ({ sheet, onDelete, onRename }) => {
  const loadFileSystem = useFileStore((state) => state.loadFileSystem);
  const [expanded, setExpanded] = useState(false);
  const [problems, setProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderCreated, setFolderCreated] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(sheet.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleStartRename = (event) => {
    event.stopPropagation();
    setDraftName(sheet.name);
    setIsEditingName(true);
    setFolderError(null);
  };

  const handleCancelRename = (event) => {
    event.stopPropagation();
    setDraftName(sheet.name);
    setIsEditingName(false);
  };

  const handleSaveRename = async (event) => {
    event.stopPropagation();
    const trimmedName = draftName.trim();

    if (!trimmedName || trimmedName === sheet.name) {
      setIsEditingName(false);
      setDraftName(sheet.name);
      return;
    }

    setIsSavingName(true);
    setFolderError(null);

    try {
      await onRename(sheet.id, trimmedName);
      setIsEditingName(false);
    } catch (error) {
      setFolderError(
        error.response?.data?.error || error.message || "Failed to rename sheet",
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleExpand = async () => {
    if (!expanded && problems.length === 0) {
      setIsLoadingProblems(true);
      try {
        const { data } = await playlistApi.getSheet(sheet.id);
        setProblems(data.problems || []);
      } catch (_error) {
        setProblems([]);
      } finally {
        setIsLoadingProblems(false);
      }
    }

    setExpanded((prev) => !prev);
  };

  const handleCreateFolder = async (event) => {
    event.stopPropagation();
    setIsCreatingFolder(true);
    setFolderError(null);

    try {
      await playlistApi.createFolderFromSheet(sheet.id);
      await loadFileSystem({ force: true });
      setFolderCreated(true);
    } catch (error) {
      setFolderError(
        error.response?.data?.error || error.message || "Failed to create folder",
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const difficultyCounts =
    problems.length > 0
      ? buildDifficultyCounts(problems)
      : {
          easy: Number(sheet.easy_count || 0),
          medium: Number(sheet.medium_count || 0),
          hard: Number(sheet.hard_count || 0),
        };
  const displayedProblemCount = problems.length || sheet.problem_count || 0;

  return (
    <div className="mb-3 overflow-hidden rounded-[20px] border border-white/10 bg-[#141a24] shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
      <div
        role="button"
        tabIndex={0}
        onClick={handleExpand}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleExpand();
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/78">
          <PlayCircle size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSaveRename(event);
                  }
                  if (event.key === "Escape") {
                    handleCancelRename(event);
                  }
                }}
                autoFocus
                className="h-9 min-w-0 flex-1 rounded-xl border border-slate-400/18 bg-[#10141c] px-3 text-sm font-semibold text-white outline-none focus:border-white/25 focus:bg-[#171c25]"
              />
            ) : (
              <p className="truncate text-[15px] font-semibold text-white">
                {sheet.name}
              </p>
            )}
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              Sheet
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/72">
              {displayedProblemCount} problems
            </span>
            <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              {difficultyCounts.easy} Easy
            </span>
            <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
              {difficultyCounts.medium} Medium
            </span>
            <span className="rounded-full border border-rose-400/15 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
              {difficultyCounts.hard} Hard
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/48">
              {new Date(sheet.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          {isEditingName ? (
            <>
              <button
                className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/75 transition hover:bg-white/[0.06]"
                title="Save name"
                onClick={handleSaveRename}
                disabled={isSavingName}
              >
                {isSavingName ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
              </button>
              <button
                className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                title="Cancel rename"
                onClick={handleCancelRename}
              >
                <X size={17} />
              </button>
            </>
          ) : (
            <button
              className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
              title="Rename sheet"
              onClick={handleStartRename}
            >
              <PencilLine size={17} />
            </button>
          )}

          <button
            className={`shrink-0 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
              folderCreated
                ? "cursor-default border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                : "border-white/12 bg-white text-[#08111f] hover:bg-[#f2f7ff]"
            }`}
            title={
              folderCreated
                ? "Folder already created"
                : "Create folder in File Explorer"
            }
            onClick={handleCreateFolder}
            disabled={isCreatingFolder || folderCreated}
          >
            <span className="flex items-center gap-2">
              {isCreatingFolder ? (
                <Loader2 size={15} className="animate-spin" />
              ) : folderCreated ? (
                <CheckCircle2 size={15} />
              ) : (
                <FolderPlus size={15} />
              )}
              <span className="hidden xl:inline">
                {isCreatingFolder
                  ? "Creating..."
                  : folderCreated
                    ? "Added"
                    : "Add to Workspace"}
              </span>
            </span>
          </button>

          <button
            className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/40 transition hover:border-red-400/15 hover:bg-red-500/10 hover:text-red-300"
            title="Delete sheet"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(sheet.id);
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {folderError && (
        <div className="flex items-center gap-2 border-t border-red-400/10 bg-red-500/10 px-6 py-3 text-sm text-red-200">
          <AlertCircle size={16} />
          {folderError}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 bg-[#18212d] px-3 py-2">
              {isLoadingProblems ? (
                <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
                  <Loader2 size={24} className="animate-spin text-white/70" />
                  <span className="text-base font-medium">Loading problems...</span>
                </div>
              ) : problems.length === 0 ? (
                <p className="py-10 text-center text-base text-zinc-500">
                  No problems found in this sheet.
                </p>
              ) : (
                problems.map((problem, index) => (
                  <PlaylistProblemRow
                    key={problem.id}
                    index={index}
                    problem={problem}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaylistSheetCard;
