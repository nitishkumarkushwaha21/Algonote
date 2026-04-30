import { create } from "zustand";
import { fileService } from "../services/api";
import {
  findTreeNode,
  removeTreeNode,
  updateTreeNode,
} from "../utils/fileTree";

const FILE_SYSTEM_RETRY_DELAYS_MS = [500, 1200, 2500, 4000, 6000, 8000, 10000];
const PROBLEM_CACHE_MAX_ENTRIES = 40;
const PROBLEM_CACHE_TTL_MS = 10 * 60 * 1000;
let loadFileSystemPromise = null;
const problemCache = new Map();
const problemInFlightRequests = new Map();

const defaultSolutionEntries = () => [
  {
    id: "optimal",
    label: "Optimal",
    code: "",
  },
];

const normalizeSolutionEntries = (item = {}) => {
  if (Array.isArray(item.solutionEntries) && item.solutionEntries.length > 0) {
    return item.solutionEntries;
  }

  const legacyEntries = [
    { id: "brute", label: "Brute Force", code: item.solutions?.brute || "" },
    { id: "better", label: "Better", code: item.solutions?.better || "" },
    { id: "optimal", label: "Optimal", code: item.solutions?.optimal || "" },
  ].filter((entry) => entry.code);

  return legacyEntries.length > 0 ? legacyEntries : defaultSolutionEntries();
};

const wait = (delay) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });

const shouldRetryFileSystemLoad = (error) => {
  const status = error?.response?.status;
  const code = error?.code;

  return status === 502 || code === "ERR_NETWORK" || code === "ECONNABORTED";
};

const normalizeFileId = (fileId) => String(fileId);

const getCachedProblem = (fileId) => {
  const key = normalizeFileId(fileId);
  const cached = problemCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > PROBLEM_CACHE_TTL_MS) {
    problemCache.delete(key);
    return null;
  }

  // Move to back for LRU ordering.
  problemCache.delete(key);
  problemCache.set(key, cached);
  return cached.data;
};

const setCachedProblem = (fileId, data) => {
  const key = normalizeFileId(fileId);
  if (problemCache.has(key)) {
    problemCache.delete(key);
  }

  problemCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  while (problemCache.size > PROBLEM_CACHE_MAX_ENTRIES) {
    const oldestKey = problemCache.keys().next().value;
    problemCache.delete(oldestKey);
  }
};

const clearProblemCache = () => {
  problemCache.clear();
  problemInFlightRequests.clear();
};

const syncProblemCacheFromTree = (get, fileId) => {
  const nextFile = findTreeNode(get().fileSystem, fileId);
  if (nextFile && nextFile.type === "file") {
    setCachedProblem(fileId, nextFile);
  }
};

const useFileStore = create((set, get) => ({
  fileSystem: [], // Initially empty, loaded from API
  activeFileId: null,
  expandedFolders: [],
  isLoading: false,
  error: null,
  hasLoadedFileSystem: false,

  resetForUser: () => {
    clearProblemCache();
    set({
      fileSystem: [],
      activeFileId: null,
      expandedFolders: [],
      isLoading: false,
      error: null,
      hasLoadedFileSystem: false,
    });
  },

  // Fetch initial file tree
  loadFileSystem: async ({ force = false } = {}) => {
    if (loadFileSystemPromise) {
      return loadFileSystemPromise;
    }

    if (!force) {
      const { hasLoadedFileSystem, isLoading } = get();
      if (hasLoadedFileSystem || isLoading) {
        return hasLoadedFileSystem;
      }
    }

    set({ isLoading: true, error: null });

    loadFileSystemPromise = (async () => {
      let lastError = null;

      for (
        let attempt = 0;
        attempt <= FILE_SYSTEM_RETRY_DELAYS_MS.length;
        attempt += 1
      ) {
        try {
          const response = await fileService.getFileSystem();
          set({
            fileSystem: Array.isArray(response.data) ? response.data : [],
            isLoading: false,
            error: null,
            hasLoadedFileSystem: true,
          });
          return true;
        } catch (error) {
          lastError = error;
          if (
            attempt === FILE_SYSTEM_RETRY_DELAYS_MS.length ||
            !shouldRetryFileSystemLoad(error)
          ) {
            break;
          }

          await wait(FILE_SYSTEM_RETRY_DELAYS_MS[attempt]);
        }
      }

      const message =
        lastError?.response?.data?.message ||
        lastError?.message ||
        "Failed to load file system.";

      set({
        fileSystem: [],
        activeFileId: null,
        error: message,
        isLoading: false,
        hasLoadedFileSystem: false,
      });
      console.error("Failed to load file system", lastError);
      return false;
    })();

    try {
      return await loadFileSystemPromise;
    } finally {
      loadFileSystemPromise = null;
    }
  },

  setActiveFile: async (fileId) => {
    set({ activeFileId: fileId });

    const file = findTreeNode(get().fileSystem, fileId);
    if (file && file.type === "file") {
      try {
        await get().getProblemWithCache(fileId);
      } catch (err) {
        console.error("Failed to load problem details", err);
      }
    }
  },

  getProblemWithCache: async (
    fileId,
    { forceRefresh = false, syncTreeOnCacheHit = true } = {},
  ) => {
    const key = normalizeFileId(fileId);
    if (!forceRefresh) {
      const cached = getCachedProblem(fileId);
      if (cached) {
        if (syncTreeOnCacheHit) {
          set((state) => ({
            fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
              ...item,
              ...cached,
              id: item.id,
              name: item.name,
              type: item.type,
              parentId: item.parentId,
            })),
          }));
        }
        return cached;
      }
    }

    const inFlight = problemInFlightRequests.get(key);
    if (inFlight) {
      return inFlight;
    }

    const requestPromise = fileService
      .getProblem(fileId)
      .then((response) => {
        const problemData = response.data;
        setCachedProblem(fileId, problemData);

        set((state) => ({
          fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
            ...item,
            ...problemData,
            id: item.id,
            name: item.name,
            type: item.type,
            parentId: item.parentId,
          })),
        }));

        return problemData;
      })
      .finally(() => {
        problemInFlightRequests.delete(key);
      });

    problemInFlightRequests.set(key, requestPromise);
    return requestPromise;
  },

  peekProblemCache: (fileId) => getCachedProblem(fileId),

  prefetchProblem: async (fileId) => {
    if (!fileId) {
      return;
    }

    const file = findTreeNode(get().fileSystem, fileId);
    if (!file || file.type !== "file") {
      return;
    }

    try {
      await get().getProblemWithCache(fileId, { syncTreeOnCacheHit: false });
    } catch (error) {
      console.error(`Failed to prefetch problem ${fileId}`, error);
    }
  },

  prefetchAround: async (currentFileId, siblingFileIds, windowSize = 3) => {
    if (
      !currentFileId ||
      !Array.isArray(siblingFileIds) ||
      siblingFileIds.length === 0
    ) {
      return;
    }

    const currentId = normalizeFileId(currentFileId);
    const normalizedSiblings = siblingFileIds.map((id) => normalizeFileId(id));
    const currentIndex = normalizedSiblings.findIndex((id) => id === currentId);
    if (currentIndex < 0) {
      return;
    }

    const prefetchIds = [];
    for (let offset = 1; offset <= windowSize; offset += 1) {
      const prevId = normalizedSiblings[currentIndex - offset];
      const nextId = normalizedSiblings[currentIndex + offset];

      if (prevId) {
        prefetchIds.push(prevId);
      }
      if (nextId) {
        prefetchIds.push(nextId);
      }
    }

    await Promise.allSettled(
      prefetchIds.map((id) => get().prefetchProblem(id)),
    );
  },

  invalidateProblemCache: (fileId) => {
    if (!fileId) {
      return;
    }

    const key = normalizeFileId(fileId);
    problemCache.delete(key);
    problemInFlightRequests.delete(key);
  },

  toggleFolder: (folderId) =>
    set((state) => {
      const isExpanded = state.expandedFolders.includes(folderId);
      return {
        expandedFolders: isExpanded
          ? state.expandedFolders.filter((id) => id !== folderId)
          : [...state.expandedFolders, folderId],
      };
    }),

  // Clear expanded folders to reduce clutter
  clearExpandedFolders: () => set({ expandedFolders: [] }),

  // Add Item (API Call)
  addItem: async (parentId, name, type, link) => {
    try {
      set({ error: null });
      const res = await fileService.createFileNode(name, type, parentId, link);
      const newItem = res.data;
      // Removed: Backend uses 'id' (Postgres), not '_id' (Mongo)

      set((state) => {
        const addItemRecursive = (items) => {
          // If adding to root (parentId null)
          if (!parentId) return [...items, newItem];

          return items.map((item) => {
            if (item.id === parentId) {
              return { ...item, children: [...(item.children || []), newItem] };
            }
            if (item.children) {
              return { ...item, children: addItemRecursive(item.children) };
            }
            return item;
          });
        };

        // Special handling if parentId is null (add to root)
        if (!parentId) {
          return { fileSystem: [...state.fileSystem, newItem] };
        }

        return { fileSystem: addItemRecursive(state.fileSystem) };
      });
      return newItem; // Return the created item for usage
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message });
      console.error("Failed to add item", error);
      return null;
    }
  },

  deleteItem: async (itemId) => {
    try {
      await fileService.deleteFileNode(itemId);
      get().invalidateProblemCache(itemId);
      set((state) => ({
        fileSystem: removeTreeNode(state.fileSystem, itemId),
      }));
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  },

  // Update Content (solutions)
  updateFileContent: async (fileId, solutionType, newContent) => {
    // Optimistic update
    set((state) => {
      return {
        fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
          ...item,
          solutionEntries: normalizeSolutionEntries(item).map((entry) =>
            entry.id === solutionType ? { ...entry, code: newContent } : entry,
          ),
          solutions: {
            ...item.solutions,
            [solutionType]: newContent,
          },
        })),
      };
    });
    syncProblemCacheFromTree(get, fileId);

    // Debounced API call appropriate here, but for now direct call
    try {
      await fileService.updateProblem(fileId, {
        solutionEntries: normalizeSolutionEntries(
          findTreeNode(get().fileSystem, fileId),
        ).map((entry) =>
          entry.id === solutionType ? { ...entry, code: newContent } : entry,
        ),
      });
      syncProblemCacheFromTree(get, fileId);
    } catch (error) {
      console.error("Failed to save content", error);
    }
  },

  updateFileNotes: async (fileId, notes) => {
    // Optimistic
    set((state) => {
      return {
        fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
          ...item,
          notes,
        })),
      };
    });
    syncProblemCacheFromTree(get, fileId);

    await fileService.updateProblem(fileId, { notes });
    syncProblemCacheFromTree(get, fileId);
  },

  updateFileLink: async (fileId, link) => {
    // Optimistic
    set((state) => {
      return {
        fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
          ...item,
          link,
        })),
      };
    });
    syncProblemCacheFromTree(get, fileId);

    await fileService.updateFileNode(fileId, { link });
    syncProblemCacheFromTree(get, fileId);
  },

  updateFileAnalysis: async (fileId, analysis) => {
    // Optimistic
    set((state) => {
      return {
        fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
          ...item,
          analysis,
        })),
      };
    });
    syncProblemCacheFromTree(get, fileId);

    await fileService.updateProblem(fileId, { analysis });
    syncProblemCacheFromTree(get, fileId);
  },

  mergeProblemDetails: (fileId, details) => {
    set((state) => ({
      fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
        ...item,
        ...details,
        solutionEntries:
          details.solutionEntries ??
          item.solutionEntries ??
          defaultSolutionEntries(),
        analysis: {
          time: details.analysis?.time ?? item.analysis?.time ?? "",
          space: details.analysis?.space ?? item.analysis?.space ?? "",
          explanation:
            details.analysis?.explanation ?? item.analysis?.explanation ?? "",
        },
        solutions: {
          brute: details.solutions?.brute ?? item.solutions?.brute ?? "",
          better: details.solutions?.better ?? item.solutions?.better ?? "",
          optimal: details.solutions?.optimal ?? item.solutions?.optimal ?? "",
        },
      })),
    }));
    syncProblemCacheFromTree(get, fileId);
  },

  updateFileFlags: async (fileId, flags) => {
    set((state) => ({
      fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
        ...item,
        ...flags,
      })),
    }));

    await fileService.updateFileNode(fileId, flags);
  },

  toggleFileRevision: async (fileId) => {
    const current = findTreeNode(get().fileSystem, fileId);
    if (!current) {
      return;
    }

    await get().updateFileFlags(fileId, { isRevised: !current.isRevised });
  },

  toggleFileSolved: async (fileId) => {
    const current = findTreeNode(get().fileSystem, fileId);
    if (!current) {
      return;
    }

    await get().updateFileFlags(fileId, { isSolved: !current.isSolved });
  },

  toggleFileImportant: async (fileId) => {
    const current = findTreeNode(get().fileSystem, fileId);
    if (!current) {
      return;
    }

    await get().updateFileFlags(fileId, { isImportant: !current.isImportant });
  },

  updateSolutionEntries: async (fileId, solutionEntries) => {
    set((state) => ({
      fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
        ...item,
        solutionEntries,
      })),
    }));
    syncProblemCacheFromTree(get, fileId);

    await fileService.updateProblem(fileId, { solutionEntries });
    syncProblemCacheFromTree(get, fileId);
  },

  renameItem: async (fileId, newName) => {
    // Optimistic
    set((state) => {
      return {
        fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
          ...item,
          name: newName,
        })),
      };
    });
    syncProblemCacheFromTree(get, fileId);

    await fileService.updateFileNode(fileId, { name: newName });
    syncProblemCacheFromTree(get, fileId);
  },
}));

export default useFileStore;
