import React from "react";

const pulse = "animate-pulse rounded-xl bg-white/[0.06]";

const SkeletonBlock = ({ className = "" }) => (
  <div className={`${pulse} ${className}`.trim()} />
);

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: 7 }).map((_, index) => (
      <div
        key={index}
        className="min-h-[138px] rounded-2xl border border-white/8 bg-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <div className="flex h-full flex-col justify-between gap-5">
          <div className="flex items-start justify-between gap-3">
            <SkeletonBlock className="h-10 w-16 rounded-md bg-blue-200/10" />
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>

          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-3 w-18" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const FolderDetailsSkeleton = () => (
  <div className="relative flex h-full flex-col bg-neutral-900 text-gray-200">
    <div className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,12,18,0.98)_0%,rgba(0,0,0,0.94)_100%)] px-6 py-4">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl" />
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
          <SkeletonBlock className="h-9 flex-1 max-w-md rounded-xl" />
          <SkeletonBlock className="h-9 flex-1 max-w-xs rounded-xl" />
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-8 w-22 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-auto p-6">
      <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/[0.02]">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-white/6 px-5 py-4">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-3 w-16 justify-self-end" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-white/5 px-5 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-4 w-4 rounded-sm" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBlock className="h-7 w-28 rounded-full" />
            <SkeletonBlock className="h-3 w-20" />
            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const ProblemEditorSkeleton = () => (
  <div className="h-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_26%),#090909] p-0">
    <div className="flex h-full">
      <div className="hidden h-full w-[40%] min-w-[320px] border-r border-white/6 bg-neutral-900 lg:block">
        <div className="h-full overflow-y-auto p-6">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-3">
                <SkeletonBlock className="h-8 w-56" />
                <div className="flex gap-2">
                  <SkeletonBlock className="h-6 w-16 rounded-full" />
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
              </div>
              <SkeletonBlock className="h-9 w-20 rounded-xl" />
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-10 flex-1 rounded-xl" />
              <SkeletonBlock className="h-10 w-34 rounded-xl" />
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
            <div className="space-y-4">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-[92%]" />
              <SkeletonBlock className="h-4 w-[84%]" />
              <SkeletonBlock className="h-24 w-full rounded-2xl" />
              <SkeletonBlock className="h-4 w-[88%]" />
              <SkeletonBlock className="h-4 w-[76%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col bg-[#0d0d0d]">
        <div className="border-b border-white/6 bg-[#111111] px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-9 w-28 rounded-lg" />
              ))}
            </div>
            <SkeletonBlock className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <div className="flex-1 bg-[#1e1e1e] p-4">
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonBlock
                key={index}
                className={`h-4 ${index % 3 === 0 ? "w-[78%]" : index % 3 === 1 ? "w-[92%]" : "w-[66%]"}`}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-white/6 bg-[#101010] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 flex-1 rounded-lg" />
            <SkeletonBlock className="h-10 flex-1 rounded-lg" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-10 w-20 rounded-lg" />
              <SkeletonBlock className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

