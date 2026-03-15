import React, { useEffect, useState } from "react";
import {
  Folder,
  FileCode,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  MoreHorizontal,
  X,
  Youtube,
  BarChart2,
  Home,
  UserPlus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import useFileStore from "../../store/useFileStore";

const FileItem = ({ item, depth = 0 }) => {
  const navigate = useNavigate();
  const {
    toggleFolder,
    setActiveFile,
    activeFileId,
    expandedFolders,
    deleteItem,
    renameItem,
  } = useFileStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const isExpanded = expandedFolders.includes(item.id);
  const isActive = activeFileId === item.id;

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showContextMenu]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.type === "folder") {
      toggleFolder(item.id);
      navigate(`/folder/${item.id}`);
    } else {
      setActiveFile(item.id);
      navigate(`/problem/${item.id}`);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm(`Delete ${item.type} "${item.name}"?`)) {
      await deleteItem(item.id);
    }
    setShowContextMenu(false);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    setIsRenaming(true);
    setShowContextMenu(false);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== item.name) {
      await renameItem(item.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setNewName(item.name);
    setIsRenaming(false);
  };

  return (
    <div className="relative">
      <div
        className={`
          flex items-center py-1.5 px-2 cursor-pointer text-base select-none relative group transition-colors
          ${isActive ? "bg-neutral-800 text-white font-medium" : "text-gray-300 hover:bg-neutral-800"}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="mr-1.5 opacity-70">
          {item.type === "folder" &&
            (isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            ))}
        </span>

        <span className="mr-2">
          {item.type === "folder" ? (
            <Folder size={18} className="text-blue-500" />
          ) : (
            <FileCode size={18} className="text-orange-500" />
          )}
        </span>

        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRenameCancel}
              onKeyDown={(e) => e.key === "Escape" && handleRenameCancel()}
              className="bg-neutral-700 text-white px-1 py-0.5 text-sm rounded w-full"
              autoFocus
            />
          </form>
        ) : (
          <span className="flex-1">{item.name}</span>
        )}

        {!isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded transition-opacity"
            title="More"
          >
            <MoreHorizontal size={12} />
          </button>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div className="absolute right-2 top-8 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-50 py-1 min-w-24">
          <button
            onClick={handleRename}
            className="w-full text-left px-3 py-1 hover:bg-neutral-700 text-sm flex items-center gap-2"
          >
            <Edit2 size={12} /> Rename
          </button>
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-1 hover:bg-red-600 text-sm flex items-center gap-2 text-red-400"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {/* Render children recursively if folder is expanded */}
      {item.type === "folder" && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ onClose }) => {
  const { fileSystem, loadFileSystem, addItem, isLoading, error } =
    useFileStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isPlaylistActive = location.pathname === "/playlist";
  const isProfileActive = location.pathname === "/profile-analysis";

  useEffect(() => {
    loadFileSystem();
  }, [loadFileSystem]);

  const handleAddFile = async () => {
    const name = prompt("Enter file name:");
    if (name) {
      const created = await addItem(null, name, "file");
      if (!created) {
        alert("Could not create file. Check backend services and try again.");
      }
    }
    setShowAddMenu(false);
  };

  const handleAddFolder = async () => {
    const name = prompt("Enter folder name:");
    if (name) {
      const created = await addItem(null, name, "folder");
      if (!created) {
        alert("Could not create folder. Check backend services and try again.");
      }
    }
    setShowAddMenu(false);
  };

  // Close context menus when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowAddMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="h-full bg-neutral-900 border-r border-neutral-800 select-none flex flex-col w-72 min-w-[18rem]">
      <div
        className="flex items-center justify-between p-3 border-b border-neutral-800 cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => navigate("/")}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-gray-300 uppercase tracking-wider">
          <Home size={16} />
          <span>Home (Explorer)</span>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(!showAddMenu);
            }}
            className="p-1.5 hover:bg-neutral-700 rounded text-gray-400 hover:text-white transition-colors"
            title="New Item"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 hover:bg-neutral-700 rounded text-gray-400 hover:text-white transition-colors"
            title="Close Explorer"
          >
            <X size={18} />
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-10 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-50 py-1 min-w-32">
              <button
                onClick={handleAddFile}
                className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-sm flex items-center gap-2 text-gray-200"
              >
                <FileCode size={14} className="text-orange-500" /> New File
              </button>
              <button
                onClick={handleAddFolder}
                className="w-full text-left px-4 py-2 hover:bg-neutral-700 text-sm flex items-center gap-2 text-gray-200"
              >
                <Folder size={14} className="text-blue-500" /> New Folder
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 pr-1">
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-gray-400">
            Loading files...
          </div>
        ) : error ? (
          <div className="px-3 py-2 text-sm text-red-400">
            Failed to load files: {error}
          </div>
        ) : fileSystem.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            No files yet. Use + to create your first file or folder.
          </div>
        ) : (
          <div className="space-y-1">
            {fileSystem.map((item) => (
              <FileItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Playlist & Analysis Feature Nav ── */}
      <div className="border-t border-neutral-800 p-3 space-y-3 sticky bottom-20 bg-neutral-900">
        <button
          onClick={() => navigate("/profile-analysis")}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            isProfileActive
              ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm"
              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
          }`}
          title="Profile Analysis"
        >
          <BarChart2 size={16} />
          Profile Analysis
        </button>
        <button
          onClick={() => navigate("/playlist")}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            isPlaylistActive
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
              : "text-gray-300 hover:bg-neutral-800 hover:text-white"
          }`}
          title="AI Playlist Sheet Generator"
        >
          <Youtube size={16} />
          Playlist Sheets
        </button>
      </div>

      {/* ── Account Nav (Dummy UI) ── */}
      <div className="border-t border-neutral-800 p-3 mt-auto sticky bottom-0 bg-neutral-900">
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-neutral-800 hover:text-white transition-all"
          title="Login / Sign Up"
          onClick={() => alert("Login backend not implemented yet!")}
        >
          <UserPlus size={16} className="text-emerald-400" />
          Login / Sign Up
        </button>
      </div>
    </div>
  );
};

export default FileExplorer;
