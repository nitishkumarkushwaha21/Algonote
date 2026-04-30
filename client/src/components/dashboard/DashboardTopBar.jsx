import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { ChevronDown, LogOut, Search, SlidersHorizontal } from "lucide-react";

const DashboardTopBar = ({
  searchValue,
  filterValue,
  themeValue,
  loginCount,
  onSearchChange,
  onFilterChange,
  onThemeChange,
}) => {
  const clerk = useClerk();
  const { user } = useUser();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  const displayName = useMemo(() => {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();

    if (first || last) {
      return [first, last].filter(Boolean).join(" ");
    }

    return user?.primaryEmailAddress?.emailAddress || "User";
  }, [user]);

  const initials = useMemo(() => {
    const source =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      user?.primaryEmailAddress?.emailAddress ||
      "U";

    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [user]);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await clerk.signOut({ redirectUrl: "/sign-in" });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="min-w-0">
        <h1 className="font-mono text-[1.18rem] font-semibold tracking-[-0.03em] text-white">
          Home
        </h1>
        <p className="mt-0.5 text-[12px] text-white/42">
          Total logins:{" "}
          <span className="text-sky-200/80">{loginCount ?? "..."}</span>
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

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 text-white/90 transition hover:border-white/18 hover:bg-white/[0.06]"
            title={displayName}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/30 to-cyan-300/20 text-[11px] font-semibold text-sky-100 ring-1 ring-white/12">
              {initials}
            </span>
            <ChevronDown size={14} className="text-white/55" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-11 z-50 min-w-56 rounded-2xl border border-white/12 bg-[#0b111b] p-2 shadow-[0_18px_48px_rgba(0,0,0,0.48)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <p className="truncate text-sm font-medium text-white/95">
                  {displayName}
                </p>
                <p className="truncate text-xs text-white/50">
                  {user?.primaryEmailAddress?.emailAddress || ""}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-2 flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-white/82 transition hover:border-red-300/25 hover:bg-red-500/10 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-65"
              >
                <LogOut size={14} />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
