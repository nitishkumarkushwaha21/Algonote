import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  FilePenLine,
  House,
  LayoutPanelLeft,
  ScrollText,
  PanelLeftClose,
  Shapes,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import useFileStore from "../../store/useFileStore";
import SidebarTreeItem from "./SidebarTreeItem";

const COLLAPSED_WIDTH = 68;
const DEFAULT_WIDTH = 324;
const MIN_WIDTH = 280;
const MAX_WIDTH = 430;

const AppSidebar = () => {
  const {
    addItem,
    error,
    expandedFolders,
    fileSystem,
    isLoading,
    setActiveFile,
    toggleFolder,
  } = useFileStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, event.clientX),
      );
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [isResizing]);

  const navItems = useMemo(
    () => [
      { id: "home", icon: House, label: "Home", path: "/" },
      { id: "about", icon: BookOpen, label: "About", path: "/heropage" },
      {
        id: "playlist",
        icon: Shapes,
        label: "Playlist",
        path: "/playlist",
      },
      {
        id: "leetcode-list",
        icon: ScrollText,
        label: "Revision List",
        path: "/leetcode-list",
      },
      {
        id: "profile",
        icon: ChartNoAxesColumn,
        label: "Profile",
        path: "/profile-analysis",
      },
    ],
    [],
  );

  const rootItems = fileSystem.filter((item) => item.parentId == null);
  const collapsedRootItems = rootItems.slice(0, 8);

  const createRootItem = async (type) => {
    const label = type === "file" ? "file" : "folder";
    const name = window.prompt(`Enter ${label} name:`);
    if (!name) {
      return;
    }

    const created = await addItem(null, name, type);
    if (!created) {
      window.alert(`Could not create ${label}. Check backend and try again.`);
    }
  };

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleCollapsedItemClick = (item) => {
    setIsCollapsed(false);

    if (item.type === "folder") {
      if (!expandedFolders.includes(item.id)) {
        toggleFolder(item.id);
      }
      navigate(`/folder/${item.id}`);
      return;
    }

    setActiveFile(item.id);
    navigate(`/problem/${item.id}`);
  };

  const currentWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <aside
      className="relative flex h-full shrink-0 border-r border-white/8 bg-[#050b14] text-white"
      style={{ width: `${currentWidth}px` }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_16%)]" />
      <div className="relative flex h-full min-w-0 flex-1 flex-col bg-[#050b14]">
        <div
          className={`flex items-center border-b border-white/8 ${
            isCollapsed ? "h-18 justify-center" : "h-18 justify-between px-4"
          }`}
        >
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.65)]" />
                <div className="min-w-0">
                  <h2 className="truncate text-[18px] font-semibold tracking-[-0.05em] text-white/96">
                    <span className="text-emerald-200">Algo</span>
                    <span className="text-white">Note</span>
                  </h2>
                </div>
              </div>
              <div className="mt-2 h-px w-28 bg-gradient-to-r from-emerald-300/55 via-cyan-300/20 to-transparent" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/8 bg-white/[0.03] text-white/70 transition hover:border-white/16 hover:bg-white/[0.06] hover:text-white"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <LayoutPanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </div>

        <div className="basis-[40%] px-3 py-3">
          {isCollapsed ? (
            <div className="space-y-2">
              {navItems.map(({ id, icon: Icon, label, path }) => {
                const isActive = isActivePath(path);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                      isActive
                        ? "border-emerald-300/18 bg-white/[0.08] text-white shadow-[0_10px_25px_rgba(0,0,0,0.24)]"
                        : "border-transparent bg-transparent text-white/45 hover:border-white/10 hover:bg-white/[0.05] hover:text-white/85"
                    }`}
                    title={label}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-1">
              <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/24">
                Navigate
              </div>
              <div className="space-y-1">
                {navItems.map(({ id, icon: Icon, label, path }) => {
                  const isActive = isActivePath(path);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => navigate(path)}
                      className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-2 transition ${
                        isActive
                          ? "border-white/8 bg-white/[0.07] text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                          : "border-transparent text-white/55 hover:border-white/7 hover:bg-white/[0.035] hover:text-white/90"
                      }`}
                      title={label}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{label}</span>
                      {isActive && <ChevronRight size={13} className="ml-auto text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-[1_1_60%] overflow-y-auto border-t border-white/6 px-3 pb-3 pt-3">
          {isCollapsed ? (
            <div className="space-y-2">
              {collapsedRootItems.map((item) => {
                const initial = item.name?.trim()?.charAt(0)?.toUpperCase() || "?";
                const isFolder = item.type === "folder";

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCollapsedItemClick(item)}
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                      isFolder
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/30 hover:bg-emerald-500/14"
                        : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-500/14"
                    }`}
                    title={item.name}
                  >
                    {isFolder ? initial : <FilePenLine size={16} />}
                  </button>
                );
              })}
            </div>
          ) : isLoading ? (
            <div className="px-3 py-4 text-sm text-white/45">Loading files...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-300">
              Failed to load files: {error}
            </div>
          ) : fileSystem.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-white/45">
              No files yet. Create your first folder or file from Explorer.
            </div>
          ) : (
            <div className="px-1">
              {!isCollapsed && (
                <div className="mb-3 px-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/24">
                    Explorer
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {fileSystem.map((item) => (
                  <SidebarTreeItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            type="button"
            aria-label="Resize sidebar"
            onMouseDown={() => setIsResizing(true)}
            className="absolute inset-y-0 right-0 z-20 w-1.5 cursor-col-resize bg-transparent transition hover:bg-blue-500/30"
          />
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
