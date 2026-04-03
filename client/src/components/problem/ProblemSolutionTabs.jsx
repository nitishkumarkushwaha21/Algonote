import React, { useState } from "react";
import { clsx } from "clsx";
import { Pencil, Plus, Trash2 } from "lucide-react";

const ProblemSolutionTabs = ({
  activeTab,
  solutions,
  onAdd,
  onChange,
  onDelete,
  onRename,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 bg-[#111111] px-4 py-2">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overflow-y-visible">
        {solutions.map((tab, index) => (
          <div
            key={tab.id}
            className={clsx(
              "flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              activeTab === tab.id
                ? "border-violet-400/36 bg-violet-500/[0.11] text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-transparent bg-transparent text-white/44 hover:bg-white/[0.04] hover:text-white/72",
            )}
          >
            <div
              onClick={() => {
                if (editingId !== tab.id) {
                  onChange(tab.id);
                }
              }}
              className="max-w-40 cursor-pointer truncate"
            >
              {editingId === tab.id ? (
                <input
                  autoFocus
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  onBlur={() => {
                    if (draftLabel.trim()) {
                      onRename(tab.id, draftLabel.trim());
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                    if (event.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  className="w-28 border-b border-white/20 bg-transparent text-sm text-white outline-none focus:border-blue-300/60"
                />
              ) : (
                tab.label
              )}
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setEditingId(tab.id);
                  setDraftLabel(tab.label);
                }}
                className="rounded p-0.5 text-white/34 transition hover:bg-white/6 hover:text-white"
                title="Rename solution"
              >
              <Pencil size={11} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(tab.id)}
                disabled={solutions.length === 1}
                className="rounded p-0.5 text-white/34 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                title="Delete solution"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/76 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
      >
        <Plus size={14} />
        Add Solution
      </button>
    </div>
  );
};

export default ProblemSolutionTabs;
