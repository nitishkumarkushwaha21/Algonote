import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  FolderKanban,
  House,
  Link2,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  inputChannels,
  productPillars,
  workflowSteps,
  workspaceArchitectureSteps,
} from "./heroContent";
import treeImage from "../../../tree.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8091af]";

const logoLetters = ["A", "l", "g", "o", "N", "o", "t", "e"];

const WorkspaceArchitectureSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % workspaceArchitectureSteps.length);
    }, 1700);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeStep = workspaceArchitectureSteps[activeIndex];
  const progressPercent = Math.round(
    ((activeIndex + 1) / workspaceArchitectureSteps.length) * 100,
  );
  const activeStageSummary = {
    "paste-link": "The workflow begins from a single problem source.",
    "build-sheet": "The link is turned into a structured revision layout.",
    "fetch-context": "The statement and metadata arrive before you start solving.",
    "paste-solution": "Your code and notes join the same workspace system.",
    "revision-set": "The set is ready to revisit later as part of revision.",
  };

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
        <h2 className="text-[2.9rem] font-semibold tracking-[-0.055em] text-white sm:text-[4rem]">
          A calmer system view for the main workspace flow.
        </h2>
        <p className="mt-4 text-base leading-8 text-[#9db0cb] sm:text-lg">
          Follow how a single problem moves from input to a structured,
          revision-ready set inside the same workspace.
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[38px] border border-white/8 bg-[#070b13] shadow-[0_40px_120px_rgba(2,6,23,0.42)]"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            </div>
          </div>

          <div className="px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="grid gap-5 xl:grid-cols-[repeat(5,minmax(0,1fr))]">
              {workspaceArchitectureSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === workspaceArchitectureSteps.length - 1;
                const isActive = index === activeIndex;
                const isComplete = index < activeIndex;
                const isQuiet = !isActive && !isComplete;

                return (
                  <div key={step.id} className="relative min-w-0">
                    {!isLast ? (
                      <div className="pointer-events-none absolute left-[calc(100%+8px)] top-[54px] z-20 hidden w-10 xl:block">
                        <div className="relative h-px bg-white/10">
                          <motion.div
                            className="absolute inset-y-0 left-0 h-px"
                            animate={{
                              width: isComplete ? "100%" : isActive ? "100%" : "28%",
                              opacity: isComplete || isActive ? 1 : 0.45,
                            }}
                            transition={{ duration: 0.55, ease: "easeInOut" }}
                            style={{
                              background: isComplete || isActive
                                ? step.accent
                                : "rgba(148,163,184,0.28)",
                              boxShadow: isComplete || isActive
                                ? `0 0 12px ${step.accent}`
                                : "none",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <motion.div
                      className="min-h-[220px] rounded-[28px] border px-5 py-6 transition"
                      animate={{
                        borderColor: isActive
                          ? step.accent
                          : isComplete
                            ? "rgba(255,255,255,0.14)"
                            : "rgba(255,255,255,0.08)",
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.05)"
                          : isComplete
                            ? "rgba(255,255,255,0.035)"
                            : "rgba(255,255,255,0.025)",
                        opacity: isQuiet ? 0.72 : 1,
                        y: isActive ? -4 : 0,
                      }}
                      transition={{ duration: 0.45, ease: "easeInOut" }}
                      style={{
                        boxShadow: isActive
                          ? `0 0 0 1px ${step.accent}33, 0 0 28px ${step.accent.replace(/0\.\d+\)/, "0.18)")}`
                          : isComplete
                            ? `0 10px 22px ${step.accent.replace(/0\.\d+\)/, "0.08)")}`
                            : "none",
                      }}
                    >
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-[#05070b]"
                        animate={{
                          borderColor: isActive
                            ? `${step.accent.replace(/0\.\d+\)/, "0.3)")}`
                            : isComplete
                              ? "rgba(255,255,255,0.14)"
                              : "rgba(255,255,255,0.08)",
                          boxShadow: isActive
                            ? `0 0 24px ${step.accent.replace(/0\.\d+\)/, "0.18)")}`
                            : "none",
                        }}
                        transition={{ duration: 0.45, ease: "easeInOut" }}
                        style={{
                          willChange: "transform, box-shadow",
                        }}
                      >
                        <Icon
                          size={20}
                          color={
                            isActive || isComplete
                              ? step.accent
                              : "rgba(255,255,255,0.72)"
                          }
                        />
                      </motion.div>

                      <div className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#73839d]">
                        {step.order}
                      </div>
                      <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                        {step.title}
                      </div>
                      <div
                        className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        style={{
                          color: isActive
                            ? step.accent
                            : isComplete
                              ? "rgba(196,214,235,0.9)"
                              : "rgba(143,157,181,0.8)",
                        }}
                      >
                        {step.description}
                      </div>
                      <div className="mt-10 text-[11px] uppercase tracking-[0.16em] text-[#5f6c82]">
                        {step.label}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-5 border-t border-white/8 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#7f8da5]">
                Active Stage
              </div>
              <div className="mt-2 text-sm text-white/92">
                {activeStep?.title}: {activeStageSummary[activeStep?.id]}
              </div>
            </div>

            <div className="min-w-[260px] flex-1 lg:max-w-[42%]">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#7f8da5]">
                <span>Sequence Progress</span>
                <span className="text-sky-300">{progressPercent}% Complete</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HeroPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(58,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/heropage"
            className="inline-flex items-center gap-4 rounded-full border border-emerald-300/14 bg-[#061018]/92 px-5 py-3 text-sm font-semibold text-white/92 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/18 bg-[linear-gradient(180deg,rgba(52,211,153,0.18),rgba(16,185,129,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_24px_rgba(52,211,153,0.12)]">
              <span className="text-[1.05rem] font-semibold text-emerald-300">{`</>`}</span>
            </span>
            <span className="inline-flex items-center text-[1.15rem] font-semibold tracking-[-0.06em] sm:text-[1.32rem]">
              <motion.span
                className="mr-1 text-emerald-300/72"
                animate={{
                  opacity: [0.42, 0.82, 0.42],
                  textShadow: [
                    "0 0 0 rgba(52,211,153,0)",
                    "0 0 10px rgba(52,211,153,0.18)",
                    "0 0 0 rgba(52,211,153,0)",
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                {"<"}
              </motion.span>
              {logoLetters.map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    textShadow:
                      [
                        "0 0 0 rgba(52,211,153,0)",
                        "0 0 12px rgba(52,211,153,0.3)",
                        "0 0 6px rgba(52,211,153,0.18)",
                      ],
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.05,
                    textShadow: {
                      duration: 2.4,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: index * 0.05,
                    },
                  }}
                  style={{
                    color: index < 4 ? "#9ae6b4" : "#dcfce7",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              <motion.span
                className="ml-1 text-emerald-300/72"
                animate={{
                  opacity: [0.42, 0.82, 0.42],
                  textShadow: [
                    "0 0 0 rgba(52,211,153,0)",
                    "0 0 10px rgba(52,211,153,0.18)",
                    "0 0 0 rgba(52,211,153,0)",
                  ],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.18 }}
              >
                {"/>"}
              </motion.span>
              <motion.span
                className="ml-2 inline-block text-emerald-300"
                animate={{ opacity: [1, 0.15, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                _
              </motion.span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/84 transition-[transform,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <House size={14} />
              Home
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200/40 bg-white px-4 py-2 text-sm font-semibold text-[#06111f] shadow-[0_10px_30px_rgba(255,255,255,0.08)] transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#f7fff9] hover:shadow-[0_14px_38px_rgba(52,211,153,0.22)]"
            >
              Create account
              <ArrowRight size={15} />
            </Link>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,0.98fr)] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-3xl"
              >
                <h1 className="max-w-5xl text-[3.12rem] font-semibold leading-[0.965] tracking-[-0.064em] text-white sm:text-[4.3rem] xl:text-[5.45rem]">
                  Turn scattered coding problems into a revision system you can actually return to.
                </h1>

                <p className="mt-5 max-w-[44rem] text-[1rem] leading-7 text-[#afbdd3] sm:text-[1.1rem]">
                  Collect problems from different sources, organize them into
                  one workspace, and come back later with your notes, code, and
                  revision context still in place.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.06 }}
                className="relative min-h-[420px] lg:min-h-[460px]"
              >
                <div className="absolute -inset-10 rounded-[48px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.14),transparent_62%)] blur-3xl" />
                <div className="absolute inset-0 hidden lg:block">
                  <div className="absolute left-[2%] top-[8%] rounded-[28px] border border-white/10 bg-[#0c1729]/90 px-5 py-4 shadow-[0_22px_70px_rgba(0,0,0,0.26)] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                        <Link2 size={18} className="text-sky-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Source
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Problem Links
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute right-[1%] top-[14%] rounded-[28px] border border-white/10 bg-[#101427]/88 px-5 py-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                        <Youtube size={18} className="text-violet-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Source
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Playlists
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-[7%] bottom-[10%] rounded-[28px] border border-white/10 bg-[#0d1a28]/90 px-5 py-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                        <ClipboardList size={18} className="text-cyan-300" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f91ad]">
                          Source
                        </div>
                        <div className="mt-1 text-base font-semibold text-white">
                          Raw Lists
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-[43%] flex h-[252px] w-[252px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sky-300/18 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),rgba(10,20,35,0.88)_58%,rgba(10,20,35,0.98)_100%)] shadow-[0_0_90px_rgba(56,189,248,0.14)]">
                    <div className="absolute inset-5 rounded-full border border-white/8" />
                    <div className="relative z-10 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04]">
                        <FolderKanban size={26} className="text-emerald-300" />
                      </div>
                      <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#8aa0c1]">
                        Workspace
                      </div>
                      <div className="mt-2 max-w-[12ch] text-[1.35rem] font-semibold leading-8 text-white">
                        Notes, code, revision
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[20%] top-[24%] h-px w-[28%] rotate-[18deg] bg-gradient-to-r from-sky-400/70 to-transparent" />
                    <div className="absolute right-[19%] top-[29%] h-px w-[22%] -rotate-[20deg] bg-gradient-to-l from-violet-300/70 to-transparent" />
                    <div className="absolute left-[24%] bottom-[21%] h-px w-[26%] -rotate-[24deg] bg-gradient-to-r from-cyan-300/70 to-transparent" />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <motion.div
              {...fadeUp}
              className="rounded-[30px] border border-sky-300/10 bg-[linear-gradient(135deg,#0a1628_0%,#0d1b33_100%)] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:p-8"
            >
              <div className={sectionLabelClass}>Input Channels</div>
              <div className="mt-3 max-w-3xl text-[2.55rem] font-semibold tracking-[-0.055em] text-white sm:text-[3.35rem]">
                Start from the source you already use.
              </div>
              <div className="mt-4 max-w-2xl text-base leading-7 text-[#a8b6cc]">
                The product should adapt to your prep habits, not force you
                into a fresh manual setup every time you want to revise.
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {inputChannels.map((channel, index) => {
                  const Icon = channel.icon;

                  return (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.42, delay: index * 0.06 }}
                      className="rounded-[26px] border border-white/12 p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-white hover:shadow-[0_18px_40px_rgba(255,255,255,0.08)]"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))",
                        boxShadow: `0 16px 36px ${channel.accent.replace(/0\.\d+\)/, "0.08)")}`,
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#08101b]"
                        style={{ boxShadow: `0 0 0 1px ${channel.accent}20` }}
                      >
                        <Icon size={20} color={channel.accent} />
                      </div>
                      <div className="mt-4 text-lg font-semibold text-white">
                        {channel.title}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#a8b6cc]">
                        {channel.description}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <WorkspaceArchitectureSection />
          </section>

          <section
            id="how-it-works"
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
          >
            <motion.div
              {...fadeUp}
              className="rounded-[34px] border border-white/8 bg-[#f5f8fd] px-6 py-8 text-[#07111f] shadow-[0_30px_80px_rgba(2,6,23,0.16)] sm:px-8"
            >
              <div className={sectionLabelClass}>How It Works</div>
              <div className="mt-3 max-w-3xl text-[2.5rem] font-semibold tracking-[-0.055em] text-[#07111f] sm:text-[3.2rem]">
                A simpler loop from collection to revision.
              </div>
              <div className="mt-4 max-w-2xl text-base leading-7 text-[#42556f]">
                The experience is strongest when it removes friction, keeps your
                material structured, and makes repeat practice easy.
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <motion.article
                      key={step.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-slate-500 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50">
                          <Icon size={20} className="text-sky-300" />
                        </div>
                        <div className="text-sm font-semibold text-sky-700">
                          Step 0{index + 1}
                        </div>
                      </div>
                      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[#07111f]">
                        {step.title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-[#51657f]">
                        {step.description}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <motion.div
              {...fadeUp}
              className="rounded-[34px] border border-emerald-200 bg-[linear-gradient(180deg,#f2fbf6_0%,#e7f8ee_100%)] px-6 py-8 text-[#062116] shadow-[0_28px_80px_rgba(5,46,22,0.12)] sm:px-8"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Why Algo Note
              </div>
              <div className="mt-3 max-w-3xl text-[2.2rem] font-semibold tracking-[-0.05em] text-[#062116] sm:text-[2.9rem]">
                A workspace built for solving now and revising later.
              </div>
              <div className="mt-4 max-w-2xl text-base leading-7 text-[#426556]">
                Keep every imported problem connected to its notes, code, and
                revision context so your prep system stays useful over time.
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45 }}
                  className="rounded-[30px] border border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f7fdf9_100%)] p-6 shadow-[0_18px_46px_rgba(5,46,22,0.08)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-emerald-900 hover:shadow-[0_24px_50px_rgba(5,46,22,0.12)]"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="max-w-xl">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        {productPillars[0].eyebrow}
                      </div>
                      <h2 className="mt-3 text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#062116] sm:text-[2rem]">
                        {productPillars[0].title}
                      </h2>
                      <p className="mt-4 max-w-xl text-[0.98rem] leading-7 text-[#4a6759]">
                        {productPillars[0].description}
                      </p>
                    </div>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
                      <FolderKanban size={24} className="text-emerald-600" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "One workspace", value: "Code, notes, revision" },
                      { label: "No rebuild", value: "Context stays attached" },
                      { label: "Built to return", value: "Repeat practice friendly" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[20px] border border-emerald-100 bg-white px-4 py-3"
                      >
                        <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-700">
                          {item.label}
                        </div>
                        <div className="mt-2 text-[0.92rem] font-medium leading-6 text-[#163629]">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.article>

                <div className="grid gap-4">
                  {productPillars.slice(1).map((pillar, index) => {
                    const Icon = pillar.icon;

                    return (
                      <motion.article
                        key={pillar.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.45, delay: 0.08 + index * 0.06 }}
                        className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_44px_rgba(5,46,22,0.08)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-emerald-900 hover:shadow-[0_24px_48px_rgba(5,46,22,0.16)]"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
                          <Icon size={20} className="text-emerald-600" />
                        </div>
                        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          {pillar.eyebrow}
                        </div>
                        <h2 className="mt-3 text-xl font-semibold leading-8 text-[#062116]">
                          {pillar.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-[#4a6759]">
                          {pillar.description}
                        </p>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </section>

          <section className="relative mt-14 min-h-screen overflow-hidden border-t border-white/8">
            <motion.div
              {...fadeUp}
              className="relative min-h-screen"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[#06111f] via-[#06111f]/72 to-transparent sm:h-40" />
              <img
                src={treeImage}
                alt="Landscape tree"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,31,0.02)_0%,rgba(6,17,31,0.1)_18%,rgba(6,17,31,0.22)_42%,rgba(6,17,31,0.5)_76%,rgba(6,17,31,0.82)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(192,132,252,0.18),transparent_24%),radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_28%)]" />

              <div className="relative mx-auto flex min-h-screen max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
                <div className="w-full">
                  <div className="rounded-[28px] border border-white/10 bg-[#07111c]/44 px-6 py-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-[5px] sm:px-8 sm:py-6 lg:flex lg:items-end lg:justify-between lg:gap-10">
                    <div className="max-w-3xl">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4e0ef]">
                        Ready To Start
                      </div>
                      <div className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                        Build a revision workspace you can keep coming back to.
                      </div>
                      <div className="mt-3 max-w-2xl text-sm leading-7 text-[#d7e3f3] sm:text-base">
                        Start with one source, import it into Algo Note, and keep
                        your next round of practice attached to the same place.
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HeroPage;
