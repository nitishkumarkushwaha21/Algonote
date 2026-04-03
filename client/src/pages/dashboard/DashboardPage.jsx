import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRootFolderModal from "../../components/dashboard/CreateRootFolderModal";
import DashboardTopBar from "../../components/dashboard/DashboardTopBar";
import SlateFolderCard from "../../components/dashboard/SlateFolderCard";
import { DashboardSkeleton } from "../../components/skeletons/ContentSkeletons";
import { statsService } from "../../services/api";
import useFileStore from "../../store/useFileStore";

const FOLDER_THEME_STORAGE_KEY = "algonote-folder-card-theme";
const LOGIN_COUNT_FALLBACK = 10;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { addItem, deleteItem, fileSystem, renameItem, isLoading, hasLoadedFileSystem } = useFileStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [folderTheme, setFolderTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    return window.localStorage.getItem(FOLDER_THEME_STORAGE_KEY) || "default";
  });
  const [loginCount, setLoginCount] = useState(LOGIN_COUNT_FALLBACK);

  const rootFolders = fileSystem.filter((item) => item.type === "folder");
  const visibleFolders = rootFolders.filter((folder) => {
    const matchesSearch = folder.name
      .toLowerCase()
      .includes(searchValue.trim().toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (filterValue === "with-items") {
      return (folder.children || []).length > 0;
    }

    if (filterValue === "empty") {
      return (folder.children || []).length === 0;
    }

    return true;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOLDER_THEME_STORAGE_KEY, folderTheme);
    }
  }, [folderTheme]);

  useEffect(() => {
    let isMounted = true;

    statsService
      .getLoginStats()
      .then(({ data }) => {
        if (isMounted) {
          setLoginCount(data.totalLogins ?? LOGIN_COUNT_FALLBACK);
        }
      })
      .catch((error) => {
        console.error("Failed to load login stats", error);
        if (isMounted) {
          setLoginCount(LOGIN_COUNT_FALLBACK);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleLoginCountUpdated = (event) => {
      const nextCount = event.detail?.totalLogins;
      if (typeof nextCount === "number") {
        setLoginCount(nextCount);
      }
    };

    window.addEventListener("algonote:login-count-updated", handleLoginCountUpdated);
    return () => {
      window.removeEventListener(
        "algonote:login-count-updated",
        handleLoginCountUpdated,
      );
    };
  }, []);

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!newFolderName.trim()) {
      return;
    }

    try {
      await addItem(null, newFolderName, "folder");
      setIsCreateModalOpen(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Failed to create folder", error);
    }
  };

  const handleRenameFolder = async (folder, nextName) => {
    const name = nextName?.trim();
    if (!name || name === folder.name) {
      return;
    }

    try {
      await renameItem(folder.id, name);
    } catch (error) {
      console.error("Failed to rename folder", error);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}" and its contents?`)) {
      return;
    }

    try {
      await deleteItem(folder.id);
    } catch (error) {
      console.error("Failed to delete folder", error);
    }
  };

  return (
    <div className="relative h-full overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),#060b14] p-8">
      <CreateRootFolderModal
        isOpen={isCreateModalOpen}
        value={newFolderName}
        onChange={setNewFolderName}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <DashboardTopBar
        searchValue={searchValue}
        filterValue={filterValue}
        themeValue={folderTheme}
        loginCount={loginCount}
        onSearchChange={setSearchValue}
        onFilterChange={setFilterValue}
        onThemeChange={setFolderTheme}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {isLoading && !hasLoadedFileSystem ? (
          <div className="contents">
            <DashboardSkeleton />
          </div>
        ) : (
          <>
            {visibleFolders.map((folder) => (
              <SlateFolderCard
                key={folder.id}
                folder={{
                  ...folder,
                  files: (folder.children || []).length,
                  created: folder.createdAt || Date.now(),
                }}
                theme={folderTheme}
                onOpen={() => navigate(`/folder/${folder.id}`)}
                onRename={(_folderId, nextName) => handleRenameFolder(folder, nextName)}
                onDelete={() => handleDeleteFolder(folder)}
              />
            ))}

            <div
              onClick={() => setIsCreateModalOpen(true)}
              className="group flex min-h-[138px] cursor-pointer flex-col justify-between rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-white/50 transition-all hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-white/[0.03] hover:text-white/78"
            >
              <div className="flex justify-end">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-2xl leading-none text-white/58 transition group-hover:border-blue-400/20 group-hover:bg-blue-500/[0.08] group-hover:text-blue-200">
                  +
                </div>
              </div>

              <div>
                <div className="font-mono text-[1.05rem] font-semibold tracking-[-0.03em] text-white/90">
                  New Folder
                </div>
                <div className="mt-2 text-sm text-white/42">
                  Create a fresh workspace entry point.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
