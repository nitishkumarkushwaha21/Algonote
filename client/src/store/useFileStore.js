import { create } from "zustand";
import { fileService } from "../services/api";

const useFileStore = create((set, get) => ({
  fileSystem: [], // Initially empty, loaded from API
  activeFileId: null,
  expandedFolders: [],
  isLoading: false,
  error: null,

  resetForUser: () =>
    set({
      fileSystem: [],
      activeFileId: null,
      expandedFolders: [],
      isLoading: false,
      error: null,
    }),

  // Fetch initial file tree
  loadFileSystem: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fileService.getFileSystem();
      set({
        fileSystem: Array.isArray(response.data) ? response.data : [],
        isLoading: false,
      });
      return true;
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({
        fileSystem: [],
        activeFileId: null,
        error: message,
        isLoading: false,
      });
      console.error("Failed to load file system", error);
      return false;
    }
  },

  setActiveFile: async (fileId) => {
    set({ activeFileId: fileId });
    // When selecting a file, ensure we have its latest content/problem details
    // We could eager load or lazy load. For now, we find it in tree, if content is missing, we might need to fetch.
    // However, our getFileSystem might be shallow? Use getProblem for details.

    // Find file type
    const findFile = (items) => {
      for (const item of items) {
        if (item.id == fileId) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(get().fileSystem);
    if (file && file.type === "file") {
      // Always fetch full problem details to ensure we have latest data
      try {
        const res = await fileService.getProblem(fileId);
        // Merge problem details into store
        const updateRecursive = (items) =>
          items.map((item) => {
            if (item.id == fileId) {
              return {
                ...item,
                ...res.data,
                // Ensure we preserve the file metadata
                id: item.id,
                name: item.name,
                type: item.type,
                parentId: item.parentId,
              };
            }
            if (item.children)
              return { ...item, children: updateRecursive(item.children) };
            return item;
          });
        set((state) => ({ fileSystem: updateRecursive(state.fileSystem) }));
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
      set((state) => {
        const deleteRecursive = (items) => {
          return items
            .filter((item) => item.id !== itemId)
            .map((item) => {
              if (item.children) {
                return { ...item, children: deleteRecursive(item.children) };
              }
              return item;
            });
        };
        return { fileSystem: deleteRecursive(state.fileSystem) };
      });
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  },

  // Update Content (solutions)
  updateFileContent: async (fileId, solutionType, newContent) => {
    // Optimistic update
    set((state) => {
      const updateRecursive = (items) => {
        return items.map((item) => {
          if (item.id == fileId) {
            return {
              ...item,
              solutions: {
                ...item.solutions,
                [solutionType]: newContent,
              },
            };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { fileSystem: updateRecursive(state.fileSystem) };
    });

    // Debounced API call appropriate here, but for now direct call
    try {
      await fileService.updateProblem(fileId, {
        solutions: { [solutionType]: newContent },
      });
    } catch (error) {
      console.error("Failed to save content", error);
    }
  },

  updateFileNotes: async (fileId, notes) => {
    // Optimistic
    set((state) => {
      const updateRecursive = (items) => {
        return items.map((item) => {
          if (item.id == fileId) {
            return { ...item, notes };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { fileSystem: updateRecursive(state.fileSystem) };
    });

    await fileService.updateProblem(fileId, { notes });
  },

  updateFileLink: async (fileId, link) => {
    // Optimistic
    set((state) => {
      const updateRecursive = (items) => {
        return items.map((item) => {
          if (item.id == fileId) {
            return { ...item, link };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { fileSystem: updateRecursive(state.fileSystem) };
    });

    await fileService.updateFileNode(fileId, { link });
  },

  updateFileAnalysis: async (fileId, analysis) => {
    // Optimistic
    set((state) => {
      const updateRecursive = (items) => {
        return items.map((item) => {
          if (item.id == fileId) {
            return { ...item, analysis };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { fileSystem: updateRecursive(state.fileSystem) };
    });

    await fileService.updateProblem(fileId, { analysis });
  },

  toggleFileRevision: async (fileId) => {
    // ... (existing code)
  },

  renameItem: async (fileId, newName) => {
    // Optimistic
    set((state) => {
      const updateRecursive = (items) => {
        return items.map((item) => {
          if (item.id == fileId) {
            return { ...item, name: newName };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      return { fileSystem: updateRecursive(state.fileSystem) };
    });

    await fileService.updateFileNode(fileId, { name: newName });
  },
}));

export default useFileStore;
