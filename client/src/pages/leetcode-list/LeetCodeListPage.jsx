import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  FolderPlus,
  Layers3,
  Loader2,
  PencilLine,
  Save,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import leetcodeListApi from "../../services/leetcodeListApi";
import useFileStore from "../../store/useFileStore";
import RevisionListHeroSection from "../../components/revision-list/RevisionListHeroSection";
import RevisionListProblemRow from "../../components/revision-list/RevisionListProblemRow";

const exampleText = `Search questions

142. Linked List Cycle II
57.5%
Med.

19. Remove Nth Node From End of List
51.2%
Med.

287. Find the Duplicate Number
64.1%
Med.

234. Palindrome Linked List
57.6%
Easy`;

const LeetCodeListPage = () => {
  const [platform, setPlatform] = useState("leetcode");
  const [inputText, setInputText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderCreated, setFolderCreated] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [folderName, setFolderName] = useState("Revision List");
  const [isEditingFolderName, setIsEditingFolderName] = useState(false);
  const [problemSearch, setProblemSearch] = useState("");
  const loadFileSystem = useFileStore((state) => state.loadFileSystem);

  const problems = result?.problems || [];

  const stats = useMemo(
    () => ({
      total: problems.length,
      easy: problems.filter((problem) => problem.difficulty === "Easy").length,
      medium: problems.filter((problem) => problem.difficulty === "Medium").length,
      hard: problems.filter((problem) => problem.difficulty === "Hard").length,
      needsLink: problems.filter((problem) => problem.needsLink).length,
    }),
    [problems],
  );

  const visibleProblems = problems.filter((problem) => {
    const query = problemSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      problem.title?.toLowerCase().includes(query) ||
      problem.slug?.toLowerCase().includes(query) ||
      problem.platform?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputText.trim()) {
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const { data } = await leetcodeListApi.importList(inputText.trim(), platform);
      setResult(data);
      setFolderCreated(false);
      if (!sourceName) {
        setFolderName(
          platform === "gfg"
            ? "GFG Revision List"
            : platform === "mixed"
              ? "Mixed Revision List"
              : "LeetCode Revision List",
        );
      }
    } catch (requestError) {
      setResult(null);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to build revision list",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setInputText(text);
      setSourceName(file.name);
      setFolderName(file.name.replace(/\.txt$/i, ""));
      setError("");
    } catch (_error) {
      setError("Could not read the selected file");
    }
  };

  const handleCreateFolder = async () => {
    if (!problems.length || !folderName.trim()) {
      return;
    }

    setIsCreatingFolder(true);
    setError("");

    try {
      await leetcodeListApi.createFolderFromList(folderName.trim(), problems);
      setFolderCreated(true);
      await loadFileSystem({ force: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Failed to create workspace folder",
      );
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#07130f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(52,211,153,0.13),transparent_24%),radial-gradient(circle_at_32%_9%,rgba(45,212,191,0.07),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.03),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-7 pb-12">
          <RevisionListHeroSection
            exampleText={exampleText}
            inputText={inputText}
            platform={platform}
            sourceName={sourceName}
            isImporting={isImporting}
            onSubmit={handleSubmit}
            onTextChange={(value) => {
              setInputText(value);
              setSourceName("");
            }}
            onPlatformChange={setPlatform}
            onFileChange={handleFileChange}
          />

          {error ? (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              <ShieldAlert size={18} />
              {error}
            </div>
          ) : null}

          <section>
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/72">
                  <Layers3 size={18} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                    Revision List
                  </h2>
                  <p className="mt-1 text-sm text-[#b5c8c1]">
                    Review the parsed items, rename the folder, and add it to workspace.
                  </p>
                </div>
              </div>

              <label className="relative block lg:min-w-[320px]">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  type="text"
                  value={problemSearch}
                  onChange={(event) => setProblemSearch(event.target.value)}
                  placeholder="Search problems, slugs, or platform..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#181f22]/92 pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/25 focus:bg-[#1a2326]"
                />
              </label>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
                {visibleProblems.length} visible
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                {stats.total} total
              </span>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                {stats.easy} Easy
              </span>
              <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                {stats.medium} Medium
              </span>
              <span className="rounded-full border border-rose-400/15 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                {stats.hard} Hard
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                {stats.needsLink} need links
              </span>
            </div>

            {isImporting ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                <Loader2 size={28} className="animate-spin text-emerald-300" />
                Building your revision list...
              </div>
            ) : problems.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#121b19]/88 py-20 text-center text-slate-500">
                Paste or upload problem text to generate your revision list here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#141d1c] shadow-[0_10px_28px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isEditingFolderName ? (
                          <input
                            type="text"
                            value={folderName}
                            onChange={(event) => setFolderName(event.target.value)}
                            className="h-9 min-w-0 flex-1 rounded-xl border border-slate-400/18 bg-[#101616] px-3 text-sm font-semibold text-white outline-none focus:border-white/25 focus:bg-[#151d1d]"
                          />
                        ) : (
                          <p className="truncate text-[15px] font-semibold text-white">
                            {folderName}
                          </p>
                        )}
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                          Folder
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-white/72">
                          {stats.total} problems
                        </span>
                        {sourceName ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/48">
                            {sourceName}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {isEditingFolderName ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditingFolderName(false)}
                            className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/75 transition hover:bg-white/[0.06]"
                            title="Save folder name"
                          >
                            <Save size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingFolderName(false);
                              setFolderName(folderName.trim() || "Revision List");
                            }}
                            className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                            title="Finish editing"
                          >
                            <X size={17} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingFolderName(true)}
                          className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] p-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                          title="Rename folder"
                        >
                          <PencilLine size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCreateFolder}
                        disabled={isCreatingFolder || folderCreated || !folderName.trim()}
                        className={`shrink-0 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                          folderCreated
                            ? "cursor-default border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                            : "border-white/12 bg-white text-[#08110f] hover:bg-[#f1faf7]"
                        }`}
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
                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-[#182322] px-3 py-2">
                    {visibleProblems.length === 0 ? (
                      <p className="py-10 text-center text-base text-zinc-500">
                        No matching problems found.
                      </p>
                    ) : (
                      visibleProblems.map((problem, index) => (
                        <RevisionListProblemRow
                          key={`${problem.platform}-${problem.slug || problem.title}-${index}`}
                          index={index}
                          problem={problem}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LeetCodeListPage;
