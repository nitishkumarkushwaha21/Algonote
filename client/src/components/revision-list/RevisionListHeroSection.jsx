import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardPaste,
  FileText,
  FolderKanban,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const platformOptions = [
  { value: "leetcode", label: "LeetCode" },
  { value: "gfg", label: "GFG" },
  { value: "mixed", label: "Mixed" },
];

const RevisionListHeroSection = ({
  exampleText,
  inputText,
  platform,
  sourceName,
  isImporting,
  onSubmit,
  onTextChange,
  onPlatformChange,
  onFileChange,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <section className="py-2">
        <div className="max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-[3rem]"
          >
            Turn a raw revision list into a clean workspace set.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-3 max-w-3xl text-sm leading-7 text-[#b5c8c1] sm:text-base"
          >
            Paste copied problem text or upload a `.txt` file. We’ll clean the
            list, keep useful metadata, and prepare it for your workspace.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            onSubmit={onSubmit}
            className="relative mt-7 rounded-[28px] border border-white/10 bg-[#101a1c]/90 p-4 shadow-[0_18px_45px_rgba(3,10,24,0.16)]"
          >
            <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_18%_30%,rgba(52,211,153,0.12),transparent_42%)] blur-2xl" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                <FileText size={14} className="text-white/72" />
                Revision Input
              </div>

              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-sm font-semibold tracking-[-0.01em] text-white/70 transition hover:text-white"
              >
                <span className="underline-offset-4 hover:underline">Help ?</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {platformOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPlatformChange(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    platform === option.value
                      ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <textarea
                value={inputText}
                onChange={(event) => onTextChange(event.target.value)}
                placeholder={exampleText}
                disabled={isImporting}
                className="min-h-[280px] w-full rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,#182226_0%,#151f24_100%)] px-4 py-4 text-sm leading-7 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-slate-500 hover:border-white/15 focus:border-emerald-300/30 focus:bg-[#182328] focus:shadow-[0_0_0_1px_rgba(110,231,183,0.08),0_0_20px_rgba(52,211,153,0.06)]"
              />
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/[0.08]">
                  <Upload size={15} />
                  Upload .txt
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>

                <div className="text-sm text-white/48">
                  {sourceName ? `Loaded: ${sourceName}` : "Paste text or upload a file"}
                </div>
              </div>

              <button
                type="submit"
                disabled={isImporting || !inputText.trim()}
                className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white px-5 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(255,255,255,0.06)] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/35 disabled:text-black/60"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Building List
                  </>
                ) : (
                  <>
                    Build Revision List
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      <AnimatePresence>
        {isHelpOpen ? (
          <div className="fixed inset-0 z-50">
            <motion.button
              type="button"
              aria-label="Close help"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[#020611]/70 backdrop-blur-[2px]"
              onClick={() => setIsHelpOpen(false)}
            />

            <motion.aside
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 96, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-[#0d1316] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#89a69d]">
                    Help
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-[-0.04em] text-white">
                    How revision list import works
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition hover:bg-white/[0.08] hover:text-white"
                  title="Close help"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="max-w-md text-sm leading-6 text-[#b5c8c1]">
                  Paste the raw list, let Algo Note clean it, then review the
                  parsed items before adding them to your workspace.
                </p>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-[#11191c] p-4">
                  <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#0d1417] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/18 bg-[#11181b]">
                      <ClipboardPaste size={17} className="text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#89a69d]">
                        Step 01
                      </div>
                      <div className="mt-0.5 text-[15px] font-semibold text-white">
                        Paste or upload
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-3">
                    <div className="h-6 w-px bg-white/12" />
                  </div>

                  <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#0d1417] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-300/18 bg-[#11181b]">
                      <Sparkles size={17} className="text-teal-300" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#89a69d]">
                        Step 02
                      </div>
                      <div className="mt-0.5 text-[15px] font-semibold text-white">
                        Clean and parse
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-3">
                    <div className="h-6 w-px bg-white/12" />
                  </div>

                  <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#0d1417] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/18 bg-[#11181b]">
                      <Link2 size={17} className="text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#89a69d]">
                        Step 03
                      </div>
                      <div className="mt-0.5 text-[15px] font-semibold text-white">
                        Check links and metadata
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-3">
                    <div className="h-6 w-px bg-white/12" />
                  </div>

                  <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#0d1417] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/18 bg-[#11181b]">
                      <FolderKanban size={17} className="text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#89a69d]">
                        Step 04
                      </div>
                      <div className="mt-0.5 text-[15px] font-semibold text-white">
                        Add to workspace
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default RevisionListHeroSection;
