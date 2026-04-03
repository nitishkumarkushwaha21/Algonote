import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  FolderKanban,
  Link2,
  Loader2,
  Sparkles,
  X,
  Youtube,
} from "lucide-react";

const PlaylistHeroSection = ({
  isGenerating,
  playlistUrl,
  onSubmit,
  onUrlChange,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <section className="py-2">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-3xl font-semibold tracking-[-0.06em] text-white sm:text-[3rem]"
          >
            Import a playlist into a clean problem sheet.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-3 max-w-2xl text-sm leading-7 text-[#afbdd3] sm:text-base"
          >
            Paste one DSA playlist URL. We’ll generate a sheet you can review and add to your workspace.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            onSubmit={onSubmit}
            className="relative mt-7 rounded-[28px] border border-white/10 bg-[#101a28]/88 p-4 shadow-[0_18px_45px_rgba(3,10,24,0.16)] transition-[border-color,transform,box-shadow] duration-300 hover:border-white/16 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(3,10,24,0.22)]"
          >
            <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_46%)] blur-2xl" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                <Youtube size={14} className="text-white/72" />
                Playlist URL
              </div>

              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-sm font-semibold tracking-[-0.01em] text-white/70 transition hover:text-white"
              >
                <span className="underline-offset-4 hover:underline">Help ?</span>
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="relative block flex-1">
                <Youtube
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/32 transition-colors duration-300"
                />
                <input
                  type="url"
                  value={playlistUrl}
                  onChange={(event) => onUrlChange(event.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                  disabled={isGenerating}
                  required
                  className="h-14 w-full rounded-2xl border border-white/12 bg-[linear-gradient(180deg,#1a2331_0%,#18212e_100%)] pr-4 pl-11 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-slate-500 hover:border-white/15 hover:bg-[linear-gradient(180deg,#1b2533_0%,#192331_100%)] focus:border-sky-300/30 focus:bg-[#1d2635] focus:shadow-[0_0_0_1px_rgba(125,211,252,0.1),0_0_20px_rgba(56,189,248,0.08)]"
                />
              </label>

              <button
                type="submit"
                disabled={isGenerating || !playlistUrl.trim()}
                className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white px-5 text-sm font-semibold text-black shadow-[0_10px_24px_rgba(255,255,255,0.06)] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/35 disabled:text-black/60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    Generate Sheet
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
              className="relative ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-[#0c121b] shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f91ad]">
                    Help
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-[-0.04em] text-white">
                    How playlist import works
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

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <p className="max-w-md text-sm leading-7 text-[#a8b6cc]">
                  Paste one playlist, generate the sheet, then review it before adding it to your workspace.
                </p>

                <div className="mt-6 rounded-[26px] border border-white/10 bg-[#111823] p-5">
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-[#0d141d] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/18 bg-[#111925]">
                        <Link2 size={18} className="text-sky-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Step 01
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Paste playlist
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="h-8 w-px bg-white/12" />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-[#0d141d] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/18 bg-[#111925]">
                        <Sparkles size={18} className="text-emerald-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Step 02
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Generate sheet
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <div className="h-8 w-px bg-white/12" />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-[#0d141d] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/18 bg-[#111925]">
                        <FolderKanban size={18} className="text-cyan-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Step 03
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Review and add
                        </div>
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

export default PlaylistHeroSection;
