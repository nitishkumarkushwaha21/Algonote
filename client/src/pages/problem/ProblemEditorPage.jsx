import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import CodeEditor from "../../components/editor/CodeEditor";
import ProblemComplexityFields from "../../components/problem/ProblemComplexityFields";
import ProblemMetadataPanel from "../../components/problem/ProblemMetadataPanel";
import NotesEditorPanel from "../../components/problem/NotesEditorPanel";
import ProblemSolutionTabs from "../../components/problem/ProblemSolutionTabs";
import { ProblemEditorSkeleton } from "../../components/skeletons/ContentSkeletons";
import { fileService } from "../../services/api";
import useFileStore from "../../store/useFileStore";
import {
  ensureNotesFileName,
  detectProblemSource,
  getProblemSourceLabel,
  isNotesFileName,
  stripNotesExtension,
} from "../../utils/problemSources";
import { findTreeNode } from "../../utils/fileTree";

const findParentFolder = (nodes, targetId, parent = null) => {
  for (const node of nodes) {
    if (String(node.id) === String(targetId)) {
      return parent;
    }

    if (node.children?.length) {
      const foundParent = findParentFolder(node.children, targetId, node);
      if (foundParent) {
        return foundParent;
      }
    }
  }

  return null;
};

const buildImportedProblemState = (problemData) => ({
  title: problemData.title,
  slug: problemData.slug,
  source: problemData.source,
  sourceUrl: problemData.sourceUrl,
  difficulty: problemData.difficulty,
  description:
    problemData.descriptionHtml ||
    problemData.description ||
    problemData.descriptionText ||
    "",
  constraints: problemData.constraints || "",
  examples: problemData.examples || [],
  tags: problemData.tags || [],
  exampleTestcases: problemData.exampleTestcases || "",
  codeSnippets: problemData.codeSnippets || [],
});

const ProblemEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeFileId,
    fileSystem,
    setActiveFile,
    updateFileAnalysis,
    updateFileContent,
    updateFileNotes,
    updateSolutionEntries,
  } = useFileStore();
  const { fileSystem: allFiles, isLoading } = useFileStore();
  const [activeTab, setActiveTab] = useState("optimal");
  const [isImporting, setIsImporting] = useState(false);
  const [isProblemLoading, setIsProblemLoading] = useState(true);
  const [problemRecord, setProblemRecord] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");

  const activeFile = id ? findTreeNode(fileSystem, id) : null;
  const [localLink, setLocalLink] = useState(activeFile?.link || "");

  const problemView = activeFile
    ? {
        ...activeFile,
        ...problemRecord,
        title: problemRecord?.title ?? activeFile.title,
        slug: problemRecord?.slug ?? activeFile.slug,
        source: problemRecord?.source ?? activeFile.source,
        sourceUrl: problemRecord?.sourceUrl ?? activeFile.sourceUrl,
        difficulty: problemRecord?.difficulty ?? activeFile.difficulty,
        description: problemRecord?.description ?? activeFile.description,
        exampleTestcases:
          problemRecord?.exampleTestcases ?? activeFile.exampleTestcases,
        constraints: problemRecord?.constraints ?? activeFile.constraints,
        examples: problemRecord?.examples ?? activeFile.examples,
        codeSnippets: problemRecord?.codeSnippets ?? activeFile.codeSnippets,
        tags: problemRecord?.tags ?? activeFile.tags,
        notes: problemRecord?.notes ?? activeFile.notes,
        solutionEntries:
          problemRecord?.solutionEntries ??
          activeFile.solutionEntries ?? [
            { id: "optimal", label: "Optimal", code: "" },
          ],
        solutions: problemRecord?.solutions ?? activeFile.solutions,
        analysis: problemRecord?.analysis ?? activeFile.analysis,
      }
    : null;

  const solutionEntries = problemView?.solutionEntries?.length
    ? problemView.solutionEntries
    : [{ id: "optimal", label: "Optimal", code: "" }];
  const isNotesFile = isNotesFileName(activeFile?.name || "");
  const parentFolder = id ? findParentFolder(fileSystem, id) : null;
  const siblingProblems = (parentFolder?.children || [])
    .filter((item) => item.type === "file")
    .sort((left, right) => String(left.id).localeCompare(String(right.id), undefined, { numeric: true }));
  const currentProblemIndex = siblingProblems.findIndex(
    (item) => String(item.id) === String(id),
  );
  const nextProblem =
    currentProblemIndex >= 0 ? siblingProblems[currentProblemIndex + 1] : null;
  const previousProblem =
    currentProblemIndex > 0 ? siblingProblems[currentProblemIndex - 1] : null;

  useEffect(() => {
    if (activeFile && activeFile.link !== localLink && !isImporting) {
      setLocalLink(activeFile.link || "");
    }
  }, [activeFile, isImporting, localLink]);

  useEffect(() => {
    setNoteDraft(problemView?.notes || "");
  }, [problemView?.id, problemView?.notes]);

  useEffect(() => {
    if (!solutionEntries.some((entry) => entry.id === activeTab)) {
      setActiveTab(solutionEntries[0]?.id || "optimal");
    }
  }, [activeTab, solutionEntries]);

  useEffect(() => {
    if (id && (!activeFileId || String(activeFileId) !== String(id))) {
      setActiveFile(id);
      useFileStore.getState().clearExpandedFolders();
    }
  }, [activeFileId, id, setActiveFile]);

  useEffect(() => {
    if (!id) {
      setProblemRecord(null);
      setIsProblemLoading(false);
      return undefined;
    }

    let isCancelled = false;
    setIsProblemLoading(true);

    const loadProblemRecord = async () => {
      try {
        const { data } = await fileService.getProblem(id);
        if (!isCancelled) {
          setProblemRecord(data);
          setIsProblemLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load problem record", error);
          setIsProblemLoading(false);
        }
      }
    };

    loadProblemRecord();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!isNotesFile || !activeFileId || noteDraft === (problemView?.notes || "")) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      updateFileNotes(activeFileId, noteDraft);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [activeFileId, isNotesFile, noteDraft, problemView?.notes, updateFileNotes]);

  const showProblemSkeleton =
    isLoading ||
    (allFiles.length === 0 && id) ||
    (!isNotesFile &&
      !!id &&
      (!!activeFile || allFiles.length > 0) &&
      isProblemLoading &&
      !problemRecord &&
      !(activeFile?.description || activeFile?.solutionEntries?.length));

  if (showProblemSkeleton) {
    return <ProblemEditorSkeleton />;
  }

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-900 text-gray-500">
        Problem not found.
      </div>
    );
  }

  const handleTimeChange = (event) => {
    setProblemRecord((current) => ({
      ...(current || {}),
      analysis: {
        time: event.target.value,
        space: problemView?.analysis?.space || "",
        explanation: problemView?.analysis?.explanation || "",
      },
    }));
    updateFileAnalysis(activeFileId, {
      time: event.target.value,
      space: problemView?.analysis?.space || "",
      explanation: problemView?.analysis?.explanation || "",
    });
  };

  const handleSpaceChange = (event) => {
    setProblemRecord((current) => ({
      ...(current || {}),
      analysis: {
        time: problemView?.analysis?.time || "",
        space: event.target.value,
        explanation: problemView?.analysis?.explanation || "",
      },
    }));
    updateFileAnalysis(activeFileId, {
      time: problemView?.analysis?.time || "",
      space: event.target.value,
      explanation: problemView?.analysis?.explanation || "",
    });
  };

  const handleLinkBlur = async (event) => {
    const newLink = event.target.value.trim();

    if (newLink !== activeFile.link) {
      await useFileStore.getState().updateFileLink(activeFile.id, newLink);
    }
  };

  const handleImportQuestion = async () => {
    const sourceLink = localLink.trim();
    const source = detectProblemSource(sourceLink);
    const sourceLabel = getProblemSourceLabel(source);

    if (!sourceLink || !source) {
      window.alert("Paste a valid LeetCode or GFG problem link first.");
      return;
    }

    setIsImporting(true);
    try {
      if (sourceLink !== activeFile.link) {
        await useFileStore.getState().updateFileLink(activeFile.id, sourceLink);
      }

      const { data: problemData } = await fileService.importProblem(sourceLink);
      const resolvedDescription =
        problemData.description || problemData.descriptionText || "";

      try {
        await fileService.createProblem(activeFile.id);
      } catch (_error) {
        console.log("Problem entry might already exist");
      }

      await fileService.updateProblem(activeFile.id, {
        title: problemData.title,
        slug: problemData.slug,
        source: problemData.source,
        sourceUrl: problemData.sourceUrl || sourceLink,
        difficulty: problemData.difficulty,
        description: problemData.descriptionHtml || resolvedDescription,
        exampleTestcases: problemData.exampleTestcases,
        constraints: problemData.constraints,
        examples: problemData.examples,
        codeSnippets: problemData.codeSnippets,
        tags: problemData.tags,
      });

      setProblemRecord((current) => ({
        ...current,
        ...buildImportedProblemState({
          ...problemData,
          description: resolvedDescription,
        }),
      }));
      useFileStore.getState().mergeProblemDetails(activeFile.id, {
        title: problemData.title,
        slug: problemData.slug,
        source: problemData.source,
        sourceUrl: problemData.sourceUrl || sourceLink,
        difficulty: problemData.difficulty,
        description: problemData.descriptionHtml || resolvedDescription,
        exampleTestcases: problemData.exampleTestcases,
        constraints: problemData.constraints,
        examples: problemData.examples,
        codeSnippets: problemData.codeSnippets,
        tags: problemData.tags,
      });

      await useFileStore.getState().renameItem(activeFile.id, problemData.title);
      await useFileStore.getState().setActiveFile(activeFile.id);
    } catch (error) {
      console.error("Failed to import problem:", error);
      window.alert(
        `Failed to import ${sourceLabel}: ${
          error.response?.data?.message || error.message || "Unknown error"
        }`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const persistSolutionEntries = async (nextEntries) => {
    setProblemRecord((current) => ({
      ...(current || {}),
      solutionEntries: nextEntries,
    }));
    await updateSolutionEntries(activeFile.id, nextEntries);
  };

  const handleAddSolution = async () => {
    const nextEntries = [
      ...solutionEntries,
      {
        id: `solution-${Date.now()}`,
        label: `Solution ${solutionEntries.length + 1}`,
        code: "",
      },
    ];
    await persistSolutionEntries(nextEntries);
    setActiveTab(nextEntries[nextEntries.length - 1].id);
  };

  const handleRenameSolution = async (solutionId, nextLabel) => {
    const nextEntries = solutionEntries.map((entry) =>
      entry.id === solutionId ? { ...entry, label: nextLabel } : entry,
    );
    await persistSolutionEntries(nextEntries);
  };

  const handleDeleteSolution = async (solutionId) => {
    if (solutionEntries.length === 1) {
      return;
    }

    const nextEntries = solutionEntries.filter((entry) => entry.id !== solutionId);
    await persistSolutionEntries(nextEntries);

    if (activeTab === solutionId) {
      setActiveTab(nextEntries[0].id);
    }
  };

  const handlePrevProblem = async () => {
    if (!previousProblem) {
      return;
    }

    await setActiveFile(previousProblem.id);
    navigate(`/problem/${previousProblem.id}`);
  };

  const handleNextProblem = async () => {
    if (!nextProblem) {
      return;
    }

    await setActiveFile(nextProblem.id);
    navigate(`/problem/${nextProblem.id}`);
  };

  if (isNotesFile) {
    return (
      <NotesEditorPanel
        title={stripNotesExtension(activeFile?.name || problemView?.name || "")}
        notes={noteDraft}
        onChange={setNoteDraft}
        onClose={() => navigate(-1)}
        onRename={async (nextName) => {
          await useFileStore
            .getState()
            .renameItem(activeFile.id, ensureNotesFileName(nextName));
        }}
      />
    );
  }

  return (
    <div className="h-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_26%),#090909]">
      <PanelGroup direction="horizontal" className="group h-full">
        <Panel
          defaultSize={40}
          minSize={20}
          className="border-r border-white/6 bg-neutral-900"
        >
          <ProblemMetadataPanel
            activeFile={problemView}
            isImporting={isImporting}
            localLink={localLink}
            onLinkChange={setLocalLink}
            onLinkBlur={handleLinkBlur}
            onImportClick={handleImportQuestion}
          />
        </Panel>

        <PanelResizeHandle className="w-[2px] bg-white/[0.05] transition-colors group-hover:bg-blue-500/70" />

        <Panel defaultSize={60} minSize={20} className="bg-[#0d0d0d]">
          <div className="flex h-full flex-col">
            <ProblemSolutionTabs
              activeTab={activeTab}
              solutions={solutionEntries}
              onAdd={handleAddSolution}
              onChange={setActiveTab}
              onDelete={handleDeleteSolution}
              onRename={handleRenameSolution}
            />

            <div className="min-h-0 flex-1 bg-[#1e1e1e]">
              <CodeEditor
                code={
                  solutionEntries.find((entry) => entry.id === activeTab)?.code || ""
                }
                language="javascript"
                onChange={(newCode) => {
                  const nextEntries = solutionEntries.map((entry) =>
                    entry.id === activeTab ? { ...entry, code: newCode } : entry,
                  );
                  setProblemRecord((current) => ({
                    ...(current || {}),
                    solutionEntries: nextEntries,
                  }));
                  updateFileContent(activeFileId, activeTab, newCode);
                }}
              />
            </div>

            <ProblemComplexityFields
              timeValue={problemView?.analysis?.time}
              spaceValue={problemView?.analysis?.space}
              onTimeChange={handleTimeChange}
              onSpaceChange={handleSpaceChange}
              onPrev={handlePrevProblem}
              hasPrev={Boolean(previousProblem)}
              onNext={handleNextProblem}
              hasNext={Boolean(nextProblem)}
            />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default ProblemEditorPage;
