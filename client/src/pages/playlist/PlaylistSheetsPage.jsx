import React, { useCallback, useEffect, useState } from "react";
import { ArrowUpDown, Layers3, Loader2, Search, Youtube } from "lucide-react";
import PlaylistHeroSection from "../../components/playlist/PlaylistHeroSection";
import PlaylistImportStatus from "../../components/playlist/PlaylistImportStatus";
import PlaylistSheetCard from "../../components/playlist/PlaylistSheetCard";
import playlistApi from "../../services/playlistApi";

const PlaylistSheetsPage = () => {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [sheetSearch, setSheetSearch] = useState("");
  const [sheetSort, setSheetSort] = useState("newest");

  const loadSheets = useCallback(async () => {
    try {
      const { data } = await playlistApi.getAllSheets();
      setSheets(data.sheets || []);
    } catch (_error) {
      setSheets([]);
    } finally {
      setIsLoadingSheets(false);
    }
  }, []);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!playlistUrl.trim()) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const { data } = await playlistApi.importPlaylist(playlistUrl.trim());
      setSuccessInfo(data);
      setPlaylistUrl("");
      await loadSheets();
    } catch (error) {
      const message =
        error.response?.data?.error || error.message || "Something went wrong";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm("Delete this sheet and all its problems?")) {
      return;
    }

    try {
      await playlistApi.deleteSheet(sheetId);
      setSheets((prev) => prev.filter((sheet) => sheet.id !== sheetId));
    } catch (_error) {
      window.alert("Failed to delete sheet.");
    }
  };

  const handleRename = async (sheetId, name) => {
    const trimmedName = name.trim();
    const { data } = await playlistApi.renameSheet(sheetId, trimmedName);
    setSheets((prev) =>
      prev.map((sheet) =>
        sheet.id === sheetId ? { ...sheet, ...(data.sheet || {}), name: trimmedName } : sheet,
      ),
    );
  };

  const visibleSheets = [...sheets]
    .filter((sheet) => {
      const query = sheetSearch.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        sheet.name?.toLowerCase().includes(query) ||
        sheet.playlist_url?.toLowerCase().includes(query)
      );
    })
    .sort((left, right) => {
      if (sheetSort === "name") {
        return (left.name || "").localeCompare(right.name || "");
      }

      if (sheetSort === "problems") {
        return (right.problem_count || 0) - (left.problem_count || 0);
      }

      return new Date(right.created_at) - new Date(left.created_at);
    });

  return (
    <div className="relative min-h-full overflow-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_34%_8%,rgba(59,130,246,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.035),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-7 pb-12">
        <PlaylistHeroSection
          isGenerating={isGenerating}
          playlistUrl={playlistUrl}
          onSubmit={handleGenerate}
          onUrlChange={setPlaylistUrl}
        />

        <PlaylistImportStatus
          error={error}
          isGenerating={isGenerating}
          successInfo={successInfo}
        />

        <section>
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/72">
                <Layers3 size={18} />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                  Generated Sheets
                </h2>
                <p className="mt-1 text-sm text-[#a8b6cc]">
                  Search, rename, review, and add to workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:min-w-[460px] lg:grid-cols-[1fr_170px]">
              <label className="relative block">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />
                <input
                  type="text"
                  value={sheetSearch}
                  onChange={(event) => setSheetSearch(event.target.value)}
                  placeholder="Search sheets or playlist URLs..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-[#181d27]/92 pr-4 pl-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-white/25 focus:bg-[#1d2330]"
                />
              </label>

              <label className="relative block">
                <ArrowUpDown
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />
                <select
                  value={sheetSort}
                  onChange={(event) => setSheetSort(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-[#181d27]/92 pr-4 pl-11 text-sm text-white outline-none transition focus:border-white/25 focus:bg-[#1d2330]"
                >
                  <option value="newest" className="bg-[#11151d] text-white">
                    Newest first
                  </option>
                  <option value="name" className="bg-[#11151d] text-white">
                    Name
                  </option>
                  <option value="problems" className="bg-[#11151d] text-white">
                    Problem count
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-300/16 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
              {visibleSheets.length} visible
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
              {sheets.length} total
            </span>
          </div>

          {isLoadingSheets ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <span className="text-lg">Loading your sheets...</span>
            </div>
          ) : visibleSheets.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#141922]/88 py-20 text-center">
              <Youtube size={48} className="mx-auto mb-4 text-slate-500" />
              <h3 className="mb-2 text-xl font-medium text-white">
                {sheets.length === 0 ? "No generated sheets yet" : "No matching sheets"}
              </h3>
              <p className="text-base text-slate-400">
                {sheets.length === 0
                  ? "Import a playlist above and your first study sheet will show up here."
                  : "Try a different search term or sort option."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {visibleSheets.map((sheet) => (
                <PlaylistSheetCard
                  key={sheet.id}
                  sheet={sheet}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      </div>
    </div>
  );
};

export default PlaylistSheetsPage;
