import React, { useState, useEffect, useRef } from "react";
import useFileStore from "../store/useFileStore";
import { Folder, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const { fileSystem, addItem, renameItem, deleteItem } = useFileStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Filter root level items
  const rootFolders = fileSystem.filter((item) => item.type === "folder");

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      // parentId null for root folders
      await addItem(null, newFolderName, "folder");
      setShowCreateModal(false);
      setNewFolderName("");
    } catch (error) {
      console.error("Failed to create folder", error);
    }
  };

  const handleRenameFolder = async (folder) => {
    const name = prompt("Rename folder:", folder.name);
    if (!name || !name.trim() || name.trim() === folder.name) return;
    try {
      await renameItem(folder.id, name.trim());
    } catch (error) {
      console.error("Failed to rename folder", error);
    }
  };

  const handleDeleteFolder = async (folder) => {
    const ok = confirm(`Delete folder "${folder.name}" and its contents?`);
    if (!ok) return;
    try {
      await deleteItem(folder.id);
    } catch (error) {
      console.error("Failed to delete folder", error);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <AnimatePresence>
        {showCreateModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-96 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4 text-white">
                New Root Folder
              </h2>
              <form onSubmit={handleCreateFolder}>
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 uppercase font-bold mb-2">
                    Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Dynamic Programming"
                    className="w-full bg-neutral-800 border-none rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rootFolders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
            className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-blue-600/50 hover:bg-neutral-800/50 transition-all cursor-pointer group relative"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId((prev) =>
                  prev === folder.id ? null : folder.id,
                );
              }}
              className="absolute top-2 right-2 p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-neutral-700 transition-colors"
              title="Folder actions"
            >
              <MoreVertical size={18} />
            </button>

            {openMenuId === folder.id && (
              <div
                ref={menuRef}
                className="absolute top-12 right-2 z-20 bg-neutral-950 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-36"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleRenameFolder(folder);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-neutral-800 flex items-center gap-2"
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleDeleteFolder(folder);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-900/30 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}

            <div className="mb-4 text-blue-500 group-hover:scale-110 transition-transform origin-left">
              <Folder size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              {folder.name}
            </h3>
            <p className="text-sm text-gray-500">
              {folder.children ? folder.children.length : 0} items
            </p>
          </div>
        ))}

        {/* Add Folder Card */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="border border-dashed border-neutral-800 p-6 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-600 cursor-pointer transition-colors"
        >
          <span className="text-4xl mb-2">+</span>
          <span className="font-medium">New Folder</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
