import React from "react";
import { UserButton } from "@clerk/react";
import { Search, SlidersHorizontal } from "lucide-react";

const DashboardTopBar = ({
  searchValue,
  filterValue,
  themeValue,
  loginCount,
  onSearchChange,
  onFilterChange,
  onThemeChange,
}) => {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="min-w-0">
        <h1 className="font-mono text-[1.18rem] font-semibold tracking-[-0.03em] text-white">
          Home
        </h1>
        <p className="mt-0.5 text-[12px] text-white/42">
          Total logins: <span className="text-sky-200/80">{loginCount ?? "..."}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden w-72 md:block">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/34"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search folders..."
            className="h-9 w-full rounded-xl border border-white/10 bg-[#0c121c] pr-3 pl-9 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-blue-400/24"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/34"
          />
          <select
            value={filterValue}
            onChange={(event) => onFilterChange(event.target.value)}
            className="h-9 appearance-none rounded-xl border border-white/10 bg-[#0c121c] pr-8 pl-9 text-sm text-white outline-none transition-colors focus:border-blue-400/24"
          >
            <option value="all">All folders</option>
            <option value="with-items">With items</option>
            <option value="empty">Empty</option>
          </select>
        </div>

        <div className="relative hidden md:block">
          <select
            value={themeValue}
            onChange={(event) => onThemeChange(event.target.value)}
            className="h-9 appearance-none rounded-xl border border-white/10 bg-[#0c121c] px-3 text-sm text-white outline-none transition-colors focus:border-blue-400/24"
          >
            <option value="default">Defalut theme</option>
            <option value="sky">Soft sky blue</option>
            <option value="green">Grey + white</option>
          </select>
        </div>

        <div className="flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.03] px-2.5">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox:
                  "h-7 w-7 ring-1 ring-white/10 shadow-[0_0_18px_rgba(59,130,246,0.10)]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
