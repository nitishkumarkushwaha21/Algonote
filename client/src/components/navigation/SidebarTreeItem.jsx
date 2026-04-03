import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FilePenLine,
  FileText,
  FolderTree,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useFileStore from "../../store/useFileStore";
import { getFileVisualType } from "../../utils/problemSources";

const SidebarTreeItem = ({ item, depth = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeFileId,
    deleteItem,
    expandedFolders,
    renameItem,
    setActiveFile,
    toggleFolder,
  } = useFileStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nextName, setNextName] = useState(item.name);

  const isExpanded = expandedFolders.includes(item.id);
  const isFolder = item.type === "folder";
  const fileVisualType = getFileVisualType(item);
  const isActive =
    (item.type === "file" && String(activeFileId) === String(item.id)) ||
    (item.type === "folder" && location.pathname === `/folder/${item.id}`);

  useEffect(() => {
    if (!showContextMenu) {
      return undefined;
    }

    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  const handleSelect = (event) => {
    event.stopPropagation();

    if (item.type === "folder") {
      toggleFolder(item.id);
      navigate(`/folder/${item.id}`);
      return;
    }

    setActiveFile(item.id);
    navigate(`/problem/${item.id}`);
  };

  const handleRenameSubmit = async (event) => {
    event.preventDefault();

    if (nextName.trim() && nextName !== item.name) {
      await renameItem(item.id, nextName.trim());
    }

    setIsRenaming(false);
  };

  const handleDelete = async (event) => {
    event.stopPropagation();
    if (window.confirm(`Delete ${item.type} "${item.name}"?`)) {
      await deleteItem(item.id);
    }
    setShowContextMenu(false);
  };

  return (
    <div className="relative">
      <div
        className={`group relative flex cursor-pointer select-none items-center gap-2 overflow-hidden border px-3 text-sm transition-all ${
          isFolder ? "rounded-[11px]" : "rounded-[9px]"
        } ${
          isActive
            ? "border-white/8 bg-white/[0.06] font-medium text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
            : "border-transparent text-white/72 hover:border-white/6 hover:bg-white/[0.032] hover:text-white"
        }`}
        style={{
          paddingLeft: `${depth * 14 + 14}px`,
          paddingTop: isFolder ? "0.48rem" : "0.22rem",
          paddingBottom: isFolder ? "0.48rem" : "0.22rem",
        }}
        onClick={handleSelect}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setShowContextMenu((prev) => !prev);
        }}
      >
        <span
          className={`absolute bottom-1.5 left-1 top-1.5 w-[2px] rounded-full transition-opacity ${
            isActive
              ? item.type === "folder"
                ? "bg-emerald-300/90 opacity-100"
                : "bg-cyan-300/90 opacity-100"
              : "opacity-0 group-hover:opacity-60"
          }`}
        />

        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-white/28">
          {isFolder ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : null}
        </span>

        <span className="shrink-0">
          {isFolder ? (
            <FolderTree
              size={16}
              className={isActive ? "text-emerald-300" : "text-emerald-400/80"}
            />
          ) : fileVisualType === "notes" ? (
            <FileText
              size={15}
              className={isActive ? "text-sky-300" : "text-sky-400/85"}
            />
          ) : fileVisualType === "gfg" ? (
            <FilePenLine
              size={15}
              className={isActive ? "text-emerald-300" : "text-emerald-400/85"}
            />
          ) : fileVisualType === "leetcode" ? (
            <FilePenLine
              size={15}
              className={isActive ? "text-amber-300" : "text-amber-300/80"}
            />
          ) : (
            <FilePenLine
              size={15}
              className={isActive ? "text-cyan-300" : "text-[#d8e3f2]/72"}
            />
          )}
        </span>

        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex-1">
            <input
              type="text"
              value={nextName}
              onChange={(event) => setNextName(event.target.value)}
              onBlur={() => {
                setNextName(item.name);
                setIsRenaming(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setNextName(item.name);
                  setIsRenaming(false);
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-2 py-1 text-sm text-white outline-none"
              autoFocus
            />
          </form>
        ) : (
          <span className="min-w-0 flex-1 truncate tracking-[-0.01em]">
            {item.name}
          </span>
        )}

        {!isRenaming && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowContextMenu((prev) => !prev);
            }}
            className="rounded-[9px] border border-white/8 bg-white/[0.035] p-1.5 text-white/48 opacity-70 transition hover:border-white/14 hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
            title="More"
          >
            <MoreHorizontal size={13} />
          </button>
        )}
      </div>

      {showContextMenu && (
        <div className="absolute right-2 top-11 z-50 min-w-28 rounded-2xl border border-white/10 bg-[#0b111b] p-1.5 shadow-[0_18px_48px_rgba(0,0,0,0.46)]">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowContextMenu(false);
              setIsRenaming(true);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white"
          >
            <Edit2 size={12} />
            Rename
          </button>
          <button
            onClick={handleDelete}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/12"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      )}

      {item.type === "folder" && isExpanded && item.children?.length > 0 && (
        <div>
          {item.children.map((child) => (
            <SidebarTreeItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarTreeItem;
