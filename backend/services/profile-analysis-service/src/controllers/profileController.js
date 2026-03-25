const axios = require("axios");
const Revision = require("../models/Revision");
const {
  getTopicWiseRecommendations,
} = require("../services/recommendationService");

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";

function requireUserScope(req, res) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

// GraphQL query for public profile stats
const USER_STATS_QUERY = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

const fetchLeetCodeProfile = async (username) => {
  const { data: body } = await axios.post(
    LEETCODE_GRAPHQL,
    { query: USER_STATS_QUERY, variables: { username } },
    {
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
    },
  );

  if (body.errors) {
    throw new Error(`User "${username}" not found on LeetCode.`);
  }

  const user = body.data?.matchedUser;
  if (!user) throw new Error(`User "${username}" not found on LeetCode.`);

  const stats = user.submitStats?.acSubmissionNum || [];

  const getCount = (diff) =>
    stats.find((s) => s.difficulty === diff)?.count ?? 0;

  const totalSolved = getCount("All");
  const easySolved = getCount("Easy");
  const mediumSolved = getCount("Medium");
  const hardSolved = getCount("Hard");

  // Compute acceptance rate from allQuestionsCount totals
  const totalAvailable =
    body.data?.allQuestionsCount?.find((q) => q.difficulty === "All")?.count ??
    1;
  const acceptanceRate = ((totalSolved / totalAvailable) * 100).toFixed(1);

  return {
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    acceptanceRate,
    ranking: user.profile?.ranking ?? 0,
    contributionPoints: user.profile?.reputation ?? 0,
    reputation: user.profile?.reputation ?? 0,
  };
};

function getAuthenticatedUserId(req) {
  return req.headers["x-user-id"];
}

/**
 * GET /api/profile-analysis/:username
 */
const analyzeProfile = async (req, res) => {
  const ownerUserId = requireUserScope(req, res);
  if (!ownerUserId) {
    return;
  }

  const { username } = req.params;
  if (!username?.trim())
    return res.status(400).json({ error: "Username is required." });

  try {
    const data = await fetchLeetCodeProfile(username.trim());
    return res.json(data);
  } catch (err) {
    console.error("analyzeProfile error:", err.message);
    if (err.message.includes("not found"))
      return res.status(404).json({ error: err.message });
    if (err.code === "ECONNABORTED")
      return res
        .status(504)
        .json({ error: "LeetCode API timed out. Please try again." });
    return res
      .status(502)
      .json({ error: "Could not reach LeetCode. Please try again." });
  }
};

/**
 * POST /api/profile-analysis/revision
 */
const addRevision = async (req, res) => {
  const ownerUserId = requireUserScope(req, res);
  if (!ownerUserId) {
    return;
  }

  const { username, problemName, difficulty, leetcodeUrl } = req.body;
  if (!username || !problemName || !difficulty)
    return res
      .status(400)
      .json({ error: "username, problemName, and difficulty are required." });

  try {
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedProblemName = problemName.trim();

    const revision = await Revision.findOneAndUpdate(
      {
        ownerUserId,
        username: normalizedUsername,
        problemName: normalizedProblemName,
      },
      {
        ownerUserId,
        username: normalizedUsername,
        problemName: normalizedProblemName,
        difficulty,
        leetcodeUrl: leetcodeUrl || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res
      .status(201)
      .json({ message: "Added to revision", data: revision });
  } catch (err) {
    console.error("addRevision error:", err.message);
    return res.status(500).json({ error: "Failed to save revision." });
  }
};

/**
 * GET /api/profile-analysis/revision/:username
 */
const getRevisions = async (req, res) => {
  const ownerUserId = requireUserScope(req, res);
  if (!ownerUserId) {
    return;
  }

  const { username } = req.params;
  if (!username)
    return res.status(400).json({ error: "Username is required." });
  try {
    const revisions = await Revision.find({
      ownerUserId,
      username: username.toLowerCase().trim(),
    }).sort({ createdAt: -1 });
    return res.json({ data: revisions });
  } catch (err) {
    console.error("getRevisions error:", err.message);
    return res.status(500).json({ error: "Failed to fetch revisions." });
  }
};

/**
 * DELETE /api/profile-analysis/revision/:id
 */
const deleteRevision = async (req, res) => {
  const ownerUserId = requireUserScope(req, res);
  if (!ownerUserId) {
    return;
  }

  try {
    const deleted = await Revision.findOneAndDelete({
      _id: req.params.id,
      ownerUserId,
    });
    if (!deleted) return res.status(404).json({ error: "Revision not found." });
    return res.json({ message: "Removed from revision", data: deleted });
  } catch (err) {
    console.error("deleteRevision error:", err.message);
    return res.status(500).json({ error: "Failed to delete revision." });
  }
};

/**
 * POST /api/profile-analysis/recommendations
 * Body: { weakAreas: string[], limit?: number }
 */
const getRecommendations = async (req, res) => {
  const ownerUserId = requireUserScope(req, res);
  if (!ownerUserId) {
    return;
  }

  try {
    const weakAreas = Array.isArray(req.body?.weakAreas)
      ? req.body.weakAreas
      : [];
    const limit = Number(req.body?.limit || 20);

    const data = getTopicWiseRecommendations({ weakAreas, limit });
    return res.json({ data });
  } catch (err) {
    console.error("getRecommendations error:", err.message);
    return res.status(500).json({ error: "Failed to build recommendations." });
  }
};

const FILE_SERVICE_URL =
  (process.env.FILE_SERVICE_URL ||
    process.env.UNIFIED_SERVICE_URL ||
    "http://127.0.0.1:5007") + "/api/files";

/**
 * POST /api/profile-analysis/import-weak-areas
 * Body: { problems: [{ topic, problemName, difficulty, leetcodeUrl }] }
 *
 * Creates a "Weak Areas" folder (or reuses it) with topic subfolders
 * and one file per problem — mirrors how playlist createFolderFromSheet works.
 */
const importWeakAreas = async (req, res) => {
  const userId = requireUserScope(req, res);
  if (!userId) {
    return;
  }

  const { problems } = req.body;
  if (!Array.isArray(problems) || problems.length === 0) {
    return res.status(400).json({ error: "problems array is required." });
  }

  try {
    // 1 — Create (or reuse) the root "Weak Areas" folder
    const folderRes = await axios.post(
      FILE_SERVICE_URL,
      {
        name: "Weak Areas",
        type: "folder",
        parentId: null,
      },
      {
        headers: { "x-user-id": userId },
      },
    );
    const weakAreasFolderId = folderRes.data.id;
    console.log(`[importWeakAreas] Root folder id: ${weakAreasFolderId}`);

    // 2 — Group problems by topic and create subfolders + files
    const topicMap = {}; // topic -> folderId
    const created = [];

    for (const prob of problems) {
      const topic = (prob.topic || "General").trim();
      const name = (prob.problemName || prob.name || "").trim();
      const link = prob.leetcodeUrl || prob.url || "";

      if (!name) continue;

      // Ensure topic subfolder exists
      if (!topicMap[topic]) {
        const tRes = await axios.post(
          FILE_SERVICE_URL,
          {
            name: topic,
            type: "folder",
            parentId: weakAreasFolderId,
          },
          {
            headers: { "x-user-id": userId },
          },
        );
        topicMap[topic] = tRes.data.id;
        console.log(
          `[importWeakAreas] Topic folder "${topic}" id: ${tRes.data.id}`,
        );
      }

      // Create the problem file
      try {
        const fRes = await axios.post(
          FILE_SERVICE_URL,
          {
            name,
            type: "file",
            parentId: topicMap[topic],
            link,
          },
          {
            headers: { "x-user-id": userId },
          },
        );
        created.push({ name, fileId: fRes.data.id, topic, link });
      } catch (e) {
        console.error(
          `[importWeakAreas] File creation failed for "${name}":`,
          e.message,
        );
      }
    }

    return res.status(201).json({
      weakAreasFolderId,
      topicsCreated: Object.keys(topicMap).length,
      filesCreated: created.length,
      files: created,
    });
  } catch (err) {
    console.error("[importWeakAreas] error:", err.message);
    return res.status(500).json({ error: err.message || "Import failed." });
  }
};

module.exports = {
  analyzeProfile,
  addRevision,
  getRevisions,
  deleteRevision,
  getRecommendations,
  importWeakAreas,
};
