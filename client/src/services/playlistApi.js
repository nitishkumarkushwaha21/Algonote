import api from "./api";

/**
 * playlistApi — all API calls for the YouTube Playlist feature.
 * Routes through the existing Vite proxy → gateway (port 5001) → playlist service (port 5005).
 */

const playlistApi = {
  /**
   * Trigger playlist import.
   * POST /api/youtube-playlist/import
   * Returns: { sheetId, sheetName, totalVideos, savedProblems }
   */
  importPlaylist: (playlistUrl) =>
    api.post("/youtube-playlist/import", { playlistUrl }),

  /**
   * Fetch all sheets for the listing page.
   * GET /api/youtube-playlist/sheets
   */
  getAllSheets: () => api.get("/youtube-playlist/sheets"),

  /**
   * Fetch a single sheet with all its problems.
   * GET /api/youtube-playlist/sheet/:id
   */
  getSheet: (sheetId) => api.get(`/youtube-playlist/sheet/${sheetId}`),

  /**
   * Delete a sheet and all its problems.
   * DELETE /api/youtube-playlist/sheet/:id
   */
  deleteSheet: (sheetId) => api.delete(`/youtube-playlist/sheet/${sheetId}`),

  /**
   * Create a folder in the file explorer from a sheet.
   * Creates one folder (sheet name) + one file per problem, pre-populated with data.
   * POST /api/youtube-playlist/sheet/:id/create-folder
   */
  createFolderFromSheet: (sheetId) =>
    api.post(`/youtube-playlist/sheet/${sheetId}/create-folder`),
};

export default playlistApi;
