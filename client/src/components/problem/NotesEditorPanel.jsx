import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Palette, X } from "lucide-react";

const NOTE_COLORS = [
  { label: "White", value: "#f8fafc" },
  { label: "Blue", value: "#93c5fd" },
  { label: "Green", value: "#86efac" },
  { label: "Yellow", value: "#fde68a" },
  { label: "Pink", value: "#f9a8d4" },
  { label: "Orange", value: "#fdba74" },
];

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeInitialHtml = (value = "") => {
  if (!value) {
    return "";
  }

  const trimmed = String(value).trim();
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) {
    return trimmed;
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => `<div>${line ? escapeHtml(line) : "<br>"}</div>`)
    .join("");
};

const NotesEditorPanel = ({
  title,
  notes,
  onChange,
  onClose,
  onRename,
}) => {
  const editorRef = useRef(null);
  const initialHtml = useMemo(() => normalizeInitialHtml(notes), [notes]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title || "");

  useEffect(() => {
    setDraftTitle(title || "");
  }, [title]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== initialHtml) {
      editor.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const applyColor = (color) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("foreColor", false, color);
    onChange(editor.innerHTML);
  };

  const submitRename = async () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setDraftTitle(title || "");
      setIsRenaming(false);
      return;
    }

    await onRename(nextTitle);
    setIsRenaming(false);
  };

  return (
    <div className="relative flex h-full bg-neutral-950">
      <div className="hidden flex-1 bg-[radial-gradient(circle_at_24%_18%,rgba(59,130,246,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] lg:block" />

      <aside className="w-full max-w-[880px] border-l border-white/10 bg-[#0d121b] shadow-[-18px_0_50px_rgba(0,0,0,0.34)] animate-[slideInRight_280ms_ease-out]">
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(28px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        <div className="flex h-full flex-col">
          <div className="border-b border-white/8 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/18 bg-blue-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200/90">
                  <FileText size={13} />
                  Notes File
                </div>
                <div className="flex items-center gap-12">
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          submitRename();
                        }
                        if (event.key === "Escape") {
                          setDraftTitle(title || "");
                          setIsRenaming(false);
                        }
                      }}
                      className="w-full max-w-[420px] border-b border-white/30 bg-transparent px-0 py-1 text-2xl font-semibold tracking-[-0.02em] text-white outline-none focus:border-blue-300/70"
                    />
                  ) : (
                    <>
                      <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-white">
                        {title}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsRenaming(true)}
                        className="border-none bg-transparent p-0 text-sm font-medium text-white/58 underline-offset-4 transition hover:text-white/82 hover:underline"
                        title="Rename notes"
                      >
                        rename
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm text-white/50">
                  Autosaves while you write.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/68 transition hover:border-white/18 hover:bg-white/[0.08] hover:text-white"
                  title="Close notes"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/56">
                <Palette size={12} />
                Text color
              </div>
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => applyColor(color.value)}
                  className="h-8 w-8 rounded-full border border-white/12 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition hover:scale-105 hover:border-white/24"
                  style={{ background: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 px-6 py-5">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => onChange(event.currentTarget.innerHTML)}
              className="h-full min-h-[320px] overflow-y-auto rounded-[28px] border border-white/10 bg-white/[0.035] px-5 py-4 text-[15px] leading-8 text-white outline-none focus:border-blue-400/30 focus:bg-white/[0.045]"
              style={{ whiteSpace: "pre-wrap" }}
              data-placeholder="Write notes here..."
            />
            <style>{`
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: rgba(255,255,255,0.32);
              }
            `}</style>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default NotesEditorPanel;
