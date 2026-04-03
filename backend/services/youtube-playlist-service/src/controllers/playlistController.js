const { fetchPlaylistVideos } = require("../services/youtubeService");
const { identifyLeetCodeProblem } = require("../services/openrouterService");
const axios = require("axios");
const {
  fetchProblemBySlug,
  fetchProblemByFrontendId,
  findProblemCandidatesByTitle,
} = require("../services/leetcodeService");
const LearningSheet = require("../models/LearningSheet");
const SheetProblem = require("../models/SheetProblem");

const DEFAULT_UNIFIED_SERVICE_URL = "http://127.0.0.1:5007";

function buildServiceUrlCandidates(value, fallbackPath) {
  const explicit = String(value || "").trim();
  const unified = String(process.env.UNIFIED_SERVICE_URL || "").trim();

  const candidates = [
    explicit,
    unified,
    DEFAULT_UNIFIED_SERVICE_URL,
    "http://localhost:5007",
    "http://unified-service:5007",
  ]
    .filter(Boolean)
    .map((base) => {
      let normalizedBase = base;

      if (!/^https?:\/\//i.test(normalizedBase)) {
        if (/^[a-z0-9.-]+:\d+$/i.test(normalizedBase)) {
          normalizedBase = `http://${normalizedBase}`;
        } else {
          return null;
        }
      }

      return (
        normalizedBase
          .replace(/\/+$/, "")
          .replace(/\/api\/(files|problems)$/, "") + fallbackPath
      );
    })
    .filter(Boolean);

  return [...new Set(candidates)];
}

const FILE_SERVICE_URLS = buildServiceUrlCandidates(
  process.env.FILE_SERVICE_URL,
  "/api/files",
);
const PROBLEM_SERVICE_URLS = buildServiceUrlCandidates(
  process.env.PROBLEM_SERVICE_URL,
  "/api/problems",
);

async function requestJson(url, options = {}) {
  try {
    const response = await axios({
      url,
      proxy: false,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      data: options.body ? JSON.parse(options.body) : undefined,
      timeout: 30000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      const data = response.data;
      const message =
        (data && typeof data === "object" && (data.error || data.message)) ||
        response.statusText ||
        "Request failed";
      throw new Error(message);
    }

    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Request failed";
    throw new Error(message);
  }
}

async function requestJsonWithFallback(urls, options = {}) {
  let lastError = null;

  for (const url of urls) {
    try {
      return await requestJson(url, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Request failed");
}

async function mapWithConcurrency(items, worker, concurrency = 4) {
  const queue = [...items];
  const results = [];

  async function runWorker() {
    while (queue.length > 0) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker()),
  );

  return results;
}

function toSlug(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function extractSlugCandidatesFromTitle(videoTitle) {
  const candidates = [];
  const unique = new Set();

  const fromUrl = [
    ...videoTitle.matchAll(/leetcode\.com\/problems\/([a-z0-9-]+)/gi),
  ]
    .map((m) => m[1]?.toLowerCase())
    .filter(Boolean);

  const pieces = videoTitle
    .split(/[|:]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4);

  for (const raw of [...fromUrl, ...pieces]) {
    const cleaned = raw
      .replace(/\([^)]*\)/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(
        /\b(leetcode|problem|solution|tutorial|explained|dsa|hindi|english|shorts?)\b/gi,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const slug = toSlug(cleaned.replace(/^\d+[\.)\-:\s]+/, ""));
    if (!slug || slug.length < 3 || unique.has(slug)) continue;

    unique.add(slug);
    candidates.push(slug);
  }

  return candidates;
}

function extractLeetCodeFrontendId(videoTitle) {
  const patterns = [
    /(?:leetcode|lc)\s*#?\s*(\d{1,4})\b/i,
    /\b(?:problem|ques(?:tion)?)\s*#?\s*(\d{1,4})\b/i,
    /\b#(\d{1,4})\b/,
    /\b(\d{1,4})\s*[.\-:|]\s*[a-z]/i,
  ];

  for (const pattern of patterns) {
    const match = videoTitle.match(pattern);
    if (!match?.[1]) continue;

    const id = String(match[1]).trim();
    const numeric = Number(id);
    if (!numeric || numeric < 1 || numeric > 4000) continue;
    return String(numeric);
  }

  return null;
}

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
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
      userId,
      name: sheetName,
      playlist_url: playlistUrl,
    });

    // ── Step 3: Process each video through OpenAI + LeetCode ─────────────
    const results = [];
    const savedSlugs = new Set();

    for (const video of videos) {
      try {
        console.log(`[Playlist Import] Processing: "${video.videoTitle}"`);

        let identified = null;
        let problemData = null;
        let matchConfidence = 0;

        // Step 3.1 - Build deterministic candidate list from title keywords.
        const titleCandidates = await findProblemCandidatesByTitle(
          video.videoTitle,
          8,
        );
        const topCandidate = titleCandidates[0] || null;

        // Step 3.2 - Strong deterministic signal: explicit LeetCode problem id.
        if (!problemData) {
          const frontendId =
            extractLeetCodeFrontendId(video.videoTitle) ||
            (topCandidate?.score >= 0.9 ? topCandidate.frontendId : null);

          if (frontendId) {
            const byId = await fetchProblemByFrontendId(frontendId);
            if (byId) {
              problemData = byId;
              matchConfidence = Math.max(matchConfidence, 0.9);
              identified = {
                title: byId.title,
                titleSlug: byId.titleSlug,
                difficulty: byId.difficulty,
                confidence: matchConfidence,
              };
              console.log(
                `[Playlist Import] ID/candidate fallback matched "${video.videoTitle}" -> ${byId.titleSlug}`,
              );
            }
          }
        }

        // Step 3.3 - High-quality deterministic title match.
        if (!problemData && topCandidate?.score >= 0.96) {
          const byTopTitle = await fetchProblemBySlug(topCandidate.titleSlug);
          if (byTopTitle) {
            problemData = byTopTitle;
            matchConfidence = Math.max(matchConfidence, topCandidate.score);
            identified = {
              title: byTopTitle.title,
              titleSlug: byTopTitle.titleSlug,
              difficulty: byTopTitle.difficulty,
              confidence: matchConfidence,
            };
            console.log(
              `[Playlist Import] Title candidate matched "${video.videoTitle}" -> ${byTopTitle.titleSlug} (${topCandidate.score})`,
            );
          }
        }

        // Step 3.4 - Ask DeepSeek with candidate context to reduce hallucinations.
        if (!problemData) {
          identified = await identifyLeetCodeProblem(video.videoTitle, {
            candidateProblems: titleCandidates,
          });
          matchConfidence = Math.max(
            matchConfidence,
            identified?.confidence ?? 0,
          );

          if (identified?.titleSlug) {
            problemData = await fetchProblemBySlug(identified.titleSlug);
          }

          if (!problemData && identified?.frontendId) {
            const byAiId = await fetchProblemByFrontendId(
              identified.frontendId,
            );
            if (byAiId) {
              problemData = byAiId;
              matchConfidence = Math.max(matchConfidence, 0.82);
            }
          }
        }

        // Fallback: derive likely slug candidates from title text
        if (!problemData) {
          const slugCandidates = extractSlugCandidatesFromTitle(
            video.videoTitle,
          );
          for (const slug of slugCandidates) {
            if (slug === identified?.titleSlug) continue;
            const candidateProblem = await fetchProblemBySlug(slug);
            if (candidateProblem) {
              problemData = candidateProblem;
              matchConfidence = Math.max(matchConfidence, 0.55);
              if (!identified || !identified.titleSlug) {
                identified = {
                  title: candidateProblem.title,
                  titleSlug: candidateProblem.titleSlug,
                  difficulty: candidateProblem.difficulty,
                  confidence: matchConfidence,
                };
              }
              console.log(
                `[Playlist Import] Fallback matched "${video.videoTitle}" -> ${candidateProblem.titleSlug}`,
              );
              break;
            }
          }
        }

        // Fallback: choose best fuzzy candidate if score is reasonably strong.
        if (!problemData && topCandidate?.score >= 0.62) {
          const byBestCandidate = await fetchProblemBySlug(
            topCandidate.titleSlug,
          );
          if (byBestCandidate) {
            problemData = byBestCandidate;
            matchConfidence = Math.max(matchConfidence, topCandidate.score);
            if (!identified || !identified.titleSlug) {
              identified = {
                title: byBestCandidate.title,
                titleSlug: byBestCandidate.titleSlug,
                difficulty: byBestCandidate.difficulty,
                confidence: matchConfidence,
              };
            }
            console.log(
              `[Playlist Import] Fuzzy fallback matched "${video.videoTitle}" -> ${byBestCandidate.titleSlug} (${topCandidate.score})`,
            );
          }
        }

        // Skip if we still don't have a match and AI confidence is low.
        if (
          !problemData &&
          (!identified || !identified.titleSlug || matchConfidence < 0.5)
        ) {
          console.log(
            `[Playlist Import] Skipping "${video.videoTitle}" — no match or low confidence (${matchConfidence})`,
          );
          continue;
        }

        if (problemData && savedSlugs.has(problemData.titleSlug)) {
          console.log(
            `[Playlist Import] Duplicate slug skipped for "${video.videoTitle}" -> ${problemData.titleSlug}`,
          );
          continue;
        }

        if (!problemData) {
          // Only save minimal entry if AI was highly confident (≥0.8)
          // so we don't pollute the sheet with questionable matches
          if (matchConfidence >= 0.8) {
            const saved = await SheetProblem.create({
              userId,
              sheet_id: sheet.id,
              title: identified.title,
              title_slug: identified.titleSlug,
              leetcode_link: `https://leetcode.com/problems/${identified.titleSlug}/`,
              youtube_link: video.videoUrl,
              difficulty: identified.difficulty,
              description: "",
              starter_code: "",
              confidence_score: matchConfidence,
            });
            results.push(saved);
            savedSlugs.add(identified.titleSlug);
          } else {
            console.log(
              `[Playlist Import] Skipping "${video.videoTitle}" — LeetCode fetch failed and confidence too low`,
            );
          }
          continue;
        }

        // Step 3.3 — Persist to database
        const saved = await SheetProblem.create({
          userId,
          sheet_id: sheet.id,
          title: problemData.title,
          title_slug: problemData.titleSlug,
          leetcode_link: problemData.leetcodeLink,
          youtube_link: video.videoUrl,
          difficulty: problemData.difficulty,
          description: problemData.description,
          starter_code: problemData.starterCode,
          confidence_score: matchConfidence,
        });

        results.push(saved);
        savedSlugs.add(problemData.titleSlug);
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
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sheet = await LearningSheet.findOne({ where: { id, userId } });
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    const problems = await SheetProblem.findAll({
      where: { sheet_id: id, userId },
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
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sheets = await LearningSheet.findAll({
      where: { userId },
      order: [["id", "DESC"]],
    });
    return res.json({ sheets });
  } catch (err) {
    console.error("[Get All Sheets] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch sheets" });
  }
}

async function renameSheet(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};
  const userId = req.headers["x-user-id"];
  const trimmedName = String(name || "").trim();

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!trimmedName) {
    return res.status(400).json({ error: "Sheet name is required" });
  }

  try {
    const sheet = await LearningSheet.findOne({ where: { id, userId } });
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    sheet.name = trimmedName;
    await sheet.save();

    return res.json({ sheet });
  } catch (err) {
    console.error("[Rename Sheet] Error:", err.message);
    return res.status(500).json({ error: "Failed to rename sheet" });
  }
}

/**
 * DELETE /api/youtube-playlist/sheet/:id
 * Deletes a sheet and all its problems.
 */
async function deleteSheet(req, res) {
  const { id } = req.params;
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await SheetProblem.destroy({ where: { sheet_id: id, userId } });
    await LearningSheet.destroy({ where: { id, userId } });
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
    const sheet = await LearningSheet.findOne({ where: { id, userId } });
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    const problems = await SheetProblem.findAll({
      where: { sheet_id: id, userId },
      order: [["id", "ASC"]],
    });

    if (!problems.length) {
      return res
        .status(400)
        .json({ error: "Sheet has no problems to create files for" });
    }

    // 2 ── Create folder in file-service ──────────────────────────────────
    const folderRes = await requestJsonWithFallback(FILE_SERVICE_URLS, {
      method: "POST",
      body: JSON.stringify({
        name: sheet.name,
        type: "folder",
        parentId: null,
      }),
      headers: { "x-user-id": userId },
    });
    const folderId = folderRes.id;
    console.log(
      `[Create Folder] Created folder "${sheet.name}" with id ${folderId}`,
    );

    // 3 ── Create a file for each problem ─────────────────────────────────
    const fileResults = await mapWithConcurrency(
      problems,
      async (problem) => {
        try {
          // Create the file node (file-service auto-creates the problem entry too)
          const fileRes = await requestJsonWithFallback(FILE_SERVICE_URLS, {
            method: "POST",
            body: JSON.stringify({
              name: problem.title,
              type: "file",
              parentId: folderId,
              link: problem.leetcode_link || "",
            }),
            headers: { "x-user-id": userId },
          });
          const fileId = fileRes.id;

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
          const problemUrls = PROBLEM_SERVICE_URLS.map(
            (baseUrl) => `${baseUrl}/${fileId}`,
          );

          await requestJsonWithFallback(problemUrls, {
            method: "PUT",
            body: JSON.stringify({
              title: problem.title,
              slug: problem.title_slug,
              difficulty: problem.difficulty,
              description: problem.description || "",
              exampleTestcases: "",
              tags: [],
              codeSnippets,
            }),
            headers: { "x-user-id": userId },
          });

          console.log(
            `[Create Folder] Created file "${problem.title}" (fileId ${fileId})`,
          );

          return { ok: true, fileId, title: problem.title };
        } catch (innerErr) {
          console.error(
            `[Create Folder] Failed for problem "${problem.title}":`,
            innerErr.message,
          );

          return {
            ok: false,
            title: problem.title,
            error: innerErr.message,
          };
        }
      },
      4,
    );

    const createdFiles = fileResults
      .filter((result) => result.ok)
      .map(({ fileId, title }) => ({ fileId, title }));
    const filesCreated = createdFiles.length;

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
  renameSheet,
  createFolderFromSheet,
};
