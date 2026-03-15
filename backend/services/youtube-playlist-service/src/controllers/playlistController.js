const { fetchPlaylistVideos } = require("../services/youtubeService");
const { identifyLeetCodeProblem } = require("../services/openrouterService");
const { fetchProblemBySlug } = require("../services/leetcodeService");
const LearningSheet = require("../models/LearningSheet");
const SheetProblem = require("../models/SheetProblem");
const axios = require("axios");

const FILE_SERVICE_URL =
  (process.env.FILE_SERVICE_URL || "http://file-service:5002") + "/api/files";
const PROBLEM_SERVICE_URL =
  (process.env.PROBLEM_SERVICE_URL || "http://problem-service:5003") +
  "/api/problems";

/**
 * POST /api/youtube-playlist/import
 * Body: { playlistUrl: string }
 *
 * Full pipeline:
 *  1. Fetch video list from YouTube API
 *  2. For each video title → ask OpenAI to identify LeetCode problem
 *  3. Fetch full problem data from LeetCode GraphQL
 *  4. Store sheet + problems in PostgreSQL
 *  5. Return { sheetId }
 */
async function importPlaylist(req, res) {
  const { playlistUrl } = req.body;

  if (!playlistUrl || !playlistUrl.trim()) {
    return res.status(400).json({ error: "playlistUrl is required" });
  }

  try {
    // ── Step 1: Fetch playlist videos from YouTube ──────────────────────
    console.log(`[Playlist Import] Fetching videos from: ${playlistUrl}`);
    const videos = await fetchPlaylistVideos(playlistUrl);

    if (!videos || videos.length === 0) {
      return res
        .status(404)
        .json({ error: "No videos found in this playlist" });
    }
    console.log(`[Playlist Import] Found ${videos.length} videos`);

    // ── Step 2: Create the Learning Sheet record ─────────────────────────
    const sheetName = `DSA Sheet — ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;

    const sheet = await LearningSheet.create({
      name: sheetName,
      playlist_url: playlistUrl,
    });

    // ── Step 3: Process each video through OpenAI + LeetCode ─────────────
    const results = [];

    for (const video of videos) {
      try {
        console.log(`[Playlist Import] Processing: "${video.videoTitle}"`);

        // Step 3.1 — Ask DeepSeek (via OpenRouter) to identify the LeetCode problem
        const identified = await identifyLeetCodeProblem(video.videoTitle);

        // Skip if no slug returned, or confidence is too low (not a LeetCode video)
        if (
          !identified ||
          !identified.titleSlug ||
          identified.confidence < 0.5
        ) {
          console.log(
            `[Playlist Import] Skipping "${video.videoTitle}" — no match or low confidence (${identified?.confidence ?? 0})`,
          );
          continue;
        }

        // Step 3.2 — Fetch full problem from LeetCode GraphQL
        const problemData = await fetchProblemBySlug(identified.titleSlug);

        if (!problemData) {
          // Only save minimal entry if AI was highly confident (≥0.8)
          // so we don't pollute the sheet with questionable matches
          if (identified.confidence >= 0.8) {
            const saved = await SheetProblem.create({
              sheet_id: sheet.id,
              title: identified.title,
              title_slug: identified.titleSlug,
              leetcode_link: `https://leetcode.com/problems/${identified.titleSlug}/`,
              youtube_link: video.videoUrl,
              difficulty: identified.difficulty,
              description: "",
              starter_code: "",
              confidence_score: identified.confidence,
            });
            results.push(saved);
          } else {
            console.log(
              `[Playlist Import] Skipping "${video.videoTitle}" — LeetCode fetch failed and confidence too low`,
            );
          }
          continue;
        }

        // Step 3.3 — Persist to database
        const saved = await SheetProblem.create({
          sheet_id: sheet.id,
          title: problemData.title,
          title_slug: problemData.titleSlug,
          leetcode_link: problemData.leetcodeLink,
          youtube_link: video.videoUrl,
          difficulty: problemData.difficulty,
          description: problemData.description,
          starter_code: problemData.starterCode,
          confidence_score: identified.confidence,
        });

        results.push(saved);
      } catch (innerErr) {
        console.error(
          `[Playlist Import] Error on video "${video.videoTitle}":`,
          innerErr.message,
        );
        // Swallow per-video errors so one failure doesn't abort the whole import
      }
    }

    console.log(
      `[Playlist Import] Done. Saved ${results.length} problems for sheet ${sheet.id}`,
    );

    // ── Step 4: Return the sheet ID ───────────────────────────────────────
    return res.status(201).json({
      sheetId: sheet.id,
      sheetName: sheet.name,
      totalVideos: videos.length,
      savedProblems: results.length,
    });
  } catch (err) {
    console.error("[Playlist Import] Fatal error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
}

/**
 * GET /api/youtube-playlist/sheet/:id
 * Returns a single sheet with all its problems.
 */
async function getSheet(req, res) {
  const { id } = req.params;

  try {
    const sheet = await LearningSheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    const problems = await SheetProblem.findAll({
      where: { sheet_id: id },
      order: [["id", "ASC"]],
    });

    return res.json({ sheet, problems });
  } catch (err) {
    console.error("[Get Sheet] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch sheet" });
  }
}

/**
 * GET /api/youtube-playlist/sheets
 * Returns all sheets (for listing).
 */
async function getAllSheets(req, res) {
  try {
    const sheets = await LearningSheet.findAll({
      order: [["id", "DESC"]],
    });
    return res.json({ sheets });
  } catch (err) {
    console.error("[Get All Sheets] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch sheets" });
  }
}

/**
 * DELETE /api/youtube-playlist/sheet/:id
 * Deletes a sheet and all its problems.
 */
async function deleteSheet(req, res) {
  const { id } = req.params;

  try {
    await SheetProblem.destroy({ where: { sheet_id: id } });
    await LearningSheet.destroy({ where: { id } });
    return res.json({ message: "Sheet deleted successfully" });
  } catch (err) {
    console.error("[Delete Sheet] Error:", err.message);
    return res.status(500).json({ error: "Failed to delete sheet" });
  }
}

/**
 * POST /api/youtube-playlist/sheet/:id/create-folder
 * Creates a folder in the file explorer for this sheet,
 * and a file for each problem. Each file is pre-populated
 * with the problem data (description, starter code, difficulty, etc.)
 * so it opens ready-to-use in the ProblemWorkspace editor.
 */
async function createFolderFromSheet(req, res) {
  const { id } = req.params;
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1 ── Fetch the sheet + its problems ─────────────────────────────────
    const sheet = await LearningSheet.findByPk(id);
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    const problems = await SheetProblem.findAll({
      where: { sheet_id: id },
      order: [["id", "ASC"]],
    });

    if (!problems.length) {
      return res
        .status(400)
        .json({ error: "Sheet has no problems to create files for" });
    }

    // 2 ── Create folder in file-service ──────────────────────────────────
    const folderRes = await axios.post(
      FILE_SERVICE_URL,
      {
        name: sheet.name,
        type: "folder",
        parentId: null,
      },
      {
        headers: { "x-user-id": userId },
      },
    );
    const folderId = folderRes.data.id;
    console.log(
      `[Create Folder] Created folder "${sheet.name}" with id ${folderId}`,
    );

    // 3 ── Create a file for each problem ─────────────────────────────────
    let filesCreated = 0;
    const createdFiles = [];

    for (const problem of problems) {
      try {
        // Create the file node (file-service auto-creates the problem entry too)
        const fileRes = await axios.post(
          FILE_SERVICE_URL,
          {
            name: problem.title,
            type: "file",
            parentId: folderId,
            link: problem.leetcode_link || "",
          },
          {
            headers: { "x-user-id": userId },
          },
        );
        const fileId = fileRes.data.id;

        // Give the auto-creation a moment to complete
        await new Promise((r) => setTimeout(r, 150));

        // Build codeSnippets array from the stored starter_code
        const codeSnippets = problem.starter_code
          ? [
              {
                lang: "JavaScript",
                langSlug: "javascript",
                code: problem.starter_code,
              },
              {
                lang: "Python3",
                langSlug: "python3",
                code: problem.starter_code,
              },
            ]
          : [];

        // Update the problem entry with all stored data
        await axios.put(
          `${PROBLEM_SERVICE_URL}/${fileId}`,
          {
            title: problem.title,
            slug: problem.title_slug,
            difficulty: problem.difficulty,
            description: problem.description || "",
            exampleTestcases: "",
            tags: [],
            codeSnippets,
          },
          {
            headers: { "x-user-id": userId },
          },
        );

        filesCreated++;
        createdFiles.push({ fileId, title: problem.title });
        console.log(
          `[Create Folder] Created file "${problem.title}" (fileId ${fileId})`,
        );
      } catch (innerErr) {
        console.error(
          `[Create Folder] Failed for problem "${problem.title}":`,
          innerErr.message,
        );
      }
    }

    return res.status(201).json({
      folderId,
      folderName: sheet.name,
      filesCreated,
      files: createdFiles,
    });
  } catch (err) {
    console.error("[Create Folder] Fatal error:", err.message);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
}

module.exports = {
  importPlaylist,
  getSheet,
  getAllSheets,
  deleteSheet,
  createFolderFromSheet,
};
