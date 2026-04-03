const DIFFICULTY_MAP = new Map([
  ["easy", "Easy"],
  ["easy.", "Easy"],
  ["med", "Medium"],
  ["med.", "Medium"],
  ["medium", "Medium"],
  ["medium.", "Medium"],
  ["hard", "Hard"],
  ["hard.", "Hard"],
]);

const HEADER_PATTERNS = [
  /^search questions$/i,
  /^leetcode problem list$/i,
  /^gfg problem list$/i,
  /^revision list$/i,
];

function normalizeDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return DIFFICULTY_MAP.get(normalized) || "";
}

function slugifyTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLeetCodeLink(title) {
  const slug = slugifyTitle(title);
  return slug ? `https://leetcode.com/problems/${slug}/` : "";
}

function inferPlatformFromLink(link) {
  const value = String(link || "").toLowerCase();
  if (value.includes("leetcode.com")) {
    return "leetcode";
  }
  if (value.includes("geeksforgeeks.org")) {
    return "gfg";
  }
  return "";
}

function isIgnorableLine(line) {
  const value = String(line || "").trim();
  if (!value) {
    return true;
  }

  return HEADER_PATTERNS.some((pattern) => pattern.test(value));
}

function isDifficultyLine(line) {
  return Boolean(normalizeDifficulty(line));
}

function isAcceptanceLine(line) {
  return /^\d+(?:\.\d+)?%$/.test(String(line || "").trim());
}

function isUrlLine(line) {
  return /^https?:\/\/\S+$/i.test(String(line || "").trim());
}

function extractTitleFromLine(line) {
  const value = String(line || "").trim();
  if (!value || isUrlLine(value) || isAcceptanceLine(value) || isDifficultyLine(value)) {
    return "";
  }

  const numberedMatch = value.match(/^(?:\d+[\).\s-]+)(.+)$/);
  if (numberedMatch?.[1]) {
    return numberedMatch[1].trim();
  }

  const bulletMatch = value.match(/^(?:[-*•]\s+)(.+)$/);
  if (bulletMatch?.[1]) {
    return bulletMatch[1].trim();
  }

  if (/^[A-Za-z0-9]/.test(value) && value.length >= 3) {
    return value;
  }

  return "";
}

function finalizeProblem(problem, requestedPlatform) {
  const platform =
    inferPlatformFromLink(problem.link) ||
    requestedPlatform ||
    "leetcode";

  const resolvedLink =
    problem.link ||
    (platform === "leetcode" ? buildLeetCodeLink(problem.title) : "");

  return {
    title: problem.title,
    platform,
    difficulty: problem.difficulty || "",
    link: resolvedLink,
    slug: platform === "leetcode" ? slugifyTitle(problem.title) : "",
    needsLink: !resolvedLink,
  };
}

function parseRevisionListText({ text, platform }) {
  const rawText = String(text || "");
  if (!rawText.trim()) {
    throw new Error("Paste problem text or upload a .txt file");
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !isIgnorableLine(line));

  const parsedProblems = [];
  let currentProblem = null;

  for (const line of lines) {
    if (isUrlLine(line)) {
      if (currentProblem) {
        currentProblem.link = line;
      }
      continue;
    }

    if (isAcceptanceLine(line)) {
      continue;
    }

    if (isDifficultyLine(line)) {
      if (currentProblem && !currentProblem.difficulty) {
        currentProblem.difficulty = normalizeDifficulty(line);
      }
      continue;
    }

    const title = extractTitleFromLine(line);
    if (!title) {
      continue;
    }

    if (currentProblem?.title) {
      parsedProblems.push(finalizeProblem(currentProblem, platform));
    }

    currentProblem = {
      title,
      difficulty: "",
      link: "",
    };
  }

  if (currentProblem?.title) {
    parsedProblems.push(finalizeProblem(currentProblem, platform));
  }

  const dedupedProblems = [];
  const seenKeys = new Set();

  for (const problem of parsedProblems) {
    const key = `${problem.platform}:${problem.slug || problem.link || problem.title.toLowerCase()}`;
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    dedupedProblems.push(problem);
  }

  if (dedupedProblems.length === 0) {
    throw new Error("No problems were found in the pasted text");
  }

  const stats = dedupedProblems.reduce(
    (accumulator, problem) => {
      if (problem.difficulty === "Easy") accumulator.easy += 1;
      if (problem.difficulty === "Medium") accumulator.medium += 1;
      if (problem.difficulty === "Hard") accumulator.hard += 1;
      if (problem.needsLink) accumulator.needsLink += 1;
      return accumulator;
    },
    { easy: 0, medium: 0, hard: 0, needsLink: 0 },
  );

  console.info(
    `[revision-list] Parsed ${dedupedProblems.length} problems for platform=${platform || "auto"}`,
  );

  return {
    count: dedupedProblems.length,
    problems: dedupedProblems,
    stats,
  };
}

async function createRevisionWorkspaceFolder({ userId, folderName, problems }) {
  const trimmedFolderName = String(folderName || "").trim();
  if (!trimmedFolderName) {
    throw new Error("Folder name is required");
  }

  if (!Array.isArray(problems) || problems.length === 0) {
    throw new Error("No problems provided for workspace import");
  }

  return sequelize.transaction(async (transaction) => {
    const folderNode = await FileNode.create(
      {
        userId,
        name: trimmedFolderName,
        type: "folder",
        parentId: null,
      },
      { transaction },
    );

    for (const problem of problems) {
      const fileNode = await FileNode.create(
        {
          userId,
          name: problem.title,
          type: "file",
          parentId: folderNode.id,
          link: problem.link || "",
        },
        { transaction },
      );

      await Problem.create(
        {
          userId,
          fileId: fileNode.id,
          title: problem.title || "",
          slug: problem.slug || "",
          source:
            problem.platform === "gfg"
              ? "gfg"
              : problem.platform === "leetcode"
                ? "leetcode"
                : "manual",
          sourceUrl: problem.link || "",
          difficulty: problem.difficulty || "",
          description: "",
          exampleTestcases: "",
          constraints: "",
          examples: [],
          codeSnippets: [],
          tags: [],
          notes: "",
          brute_solution: "",
          better_solution: "",
          optimal_solution: "",
          time_complexity: "",
          space_complexity: "",
          solutionEntries: [
            {
              id: "optimal",
              label: "Optimal",
              code: "",
            },
          ],
        },
        { transaction },
      );
    }

    return {
      folderId: folderNode.id,
      folderName: folderNode.name,
      createdCount: problems.length,
    };
  });
}

module.exports = {
  buildLeetCodeLink,
  createRevisionWorkspaceFolder,
  parseRevisionListText,
  slugifyTitle,
};
const sequelize = require("../config/database");
const FileNode = require("../models/FileNode");
const Problem = require("../models/Problem");
