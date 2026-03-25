import { create } from "zustand";
import { fileService } from "../services/api";
import {
  findTreeNode,
  removeTreeNode,
  updateTreeNode,
} from "../utils/fileTree";

const FILE_SYSTEM_RETRY_DELAYS_MS = [500, 1200, 2500, 4000, 6000];
let loadFileSystemPromise = null;

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

const useFileStore = create((set, get) => ({
  fileSystem: [], // Initially empty, loaded from API
  activeFileId: null,
  expandedFolders: [],
  isLoading: false,
  error: null,
  hasLoadedFileSystem: false,

  resetForUser: () =>
    set({
      fileSystem: [],
      activeFileId: null,
      expandedFolders: [],
      isLoading: false,
      error: null,
      hasLoadedFileSystem: false,
    }),

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
    // When selecting a file, ensure we have its latest content/problem details
    // We could eager load or lazy load. For now, we find it in tree, if content is missing, we might need to fetch.
    // However, our getFileSystem might be shallow? Use getProblem for details.

    // Find file type
    const file = findTreeNode(get().fileSystem, fileId);
    if (file && file.type === "file") {
      // Always fetch full problem details to ensure we have latest data
      try {
        const res = await fileService.getProblem(fileId);
        // Merge problem details into store
        set((state) => ({
          fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
            ...item,
            ...res.data,
            id: item.id,
            name: item.name,
            type: item.type,
            parentId: item.parentId,
          })),
        }));
        console.log("✅ Problem data refreshed for file:", fileId);
      } catch (err) {
        console.error("Failed to load problem details", err);
      }
    }
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

    // Debounced API call appropriate here, but for now direct call
    try {
      await fileService.updateProblem(fileId, {
        solutionEntries: normalizeSolutionEntries(
          findTreeNode(get().fileSystem, fileId),
        ).map((entry) =>
          entry.id === solutionType ? { ...entry, code: newContent } : entry,
        ),
      });
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

    await fileService.updateProblem(fileId, { notes });
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

    await fileService.updateFileNode(fileId, { link });
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

    await fileService.updateProblem(fileId, { analysis });
  },

  mergeProblemDetails: (fileId, details) =>
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
    })),

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

    await fileService.updateProblem(fileId, { solutionEntries });
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

    await fileService.updateFileNode(fileId, { name: newName });
  },
}));

export default useFileStore;
