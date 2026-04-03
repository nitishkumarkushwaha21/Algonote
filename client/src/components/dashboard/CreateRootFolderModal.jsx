import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const CreateRootFolderModal = ({
  isOpen,
  value,
  onChange,
  onClose,
  onSubmit,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-96 rounded-[24px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.46)]"
          >
            <h2 className="mb-2 font-mono text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
              New Folder
            </h2>
            <p className="mb-5 text-sm text-white/42">
              Create a fresh workspace tile for a new topic or sheet.
            </p>
            <form onSubmit={onSubmit}>
              <div className="mb-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-white/36">
                  Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  placeholder="e.g. Dynamic Programming"
                  className="w-full rounded-xl border border-white/18 bg-[#0c121c] px-4 py-2.5 text-white outline-none transition focus:border-white/30"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-white/46 transition-colors hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!value.trim()}
                  className="rounded-xl border border-white/18 bg-white/[0.10] px-4 py-2 font-medium text-white transition-colors hover:bg-white/[0.16] disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateRootFolderModal;
