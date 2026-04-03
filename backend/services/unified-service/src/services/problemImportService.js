const { htmlToText } = require("html-to-text");
const Problem = require("../models/Problem");
const { getLeetCodeQuestion } = require("./leetcodeService");
const {
  fetchGFGProblem,
  isValidGFGProblemUrl,
} = require("./gfg/gfgScraper.service");

function isLeetCodeProblemUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      /leetcode\.com$/i.test(parsed.hostname) &&
      /\/problems\//i.test(parsed.pathname)
    );
  } catch (_error) {
    return false;
  }
}

function extractLeetCodeSlug(url) {
  const parts = String(url)
    .split("/")
    .filter((part) => part !== "");
  const slugIndex = parts.indexOf("problems");

  if (slugIndex === -1 || slugIndex + 1 >= parts.length) {
    return "";
  }

  return parts[slugIndex + 1];
}

function formatLeetCodeImport(questionData, url) {
  const cleanDescription = htmlToText(questionData.content || "", {
    wordwrap: 130,
  });
  const descriptionHtml =
    questionData.content ||
    (questionData.isPaidOnly
      ? "<p>This LeetCode problem appears to be premium or gated, so Algo Note could import the metadata but not the full statement content.</p>"
      : "<p>Algo Note imported the problem metadata, but LeetCode did not return statement content for this question.</p>");
  const descriptionText =
    cleanDescription ||
    (questionData.isPaidOnly
      ? "This LeetCode problem appears to be premium or gated, so Algo Note could import the metadata but not the full statement content."
      : "Algo Note imported the problem metadata, but LeetCode did not return statement content for this question.");

  return {
    source: "leetcode",
    sourceUrl: url,
    title: questionData.title,
    slug: questionData.titleSlug,
    difficulty: questionData.difficulty,
    description: descriptionHtml,
    descriptionHtml,
    descriptionText,
    isPaidOnly: Boolean(questionData.isPaidOnly),
    exampleTestcases: questionData.exampleTestcases || "",
    codeSnippets: questionData.codeSnippets || [],
    tags: questionData.topicTags || [],
    examples: [],
    constraints: "",
  };
}

function formatCachedProblem(problem) {
  return {
    source: problem.source || "manual",
    sourceUrl: problem.sourceUrl || "",
    title: problem.title || "",
    slug: problem.slug || "",
    difficulty: problem.difficulty || "",
    description: problem.description || "",
    descriptionHtml: problem.description || "",
    descriptionText: htmlToText(problem.description || "", { wordwrap: 130 }),
    exampleTestcases: problem.exampleTestcases || "",
    codeSnippets: problem.codeSnippets || [],
    tags: problem.tags || [],
    examples: problem.examples || [],
    constraints: problem.constraints || "",
  };
}

async function findCachedImport({ userId, url, source }) {
  return Problem.findOne({
    where: {
      userId,
      source,
      sourceUrl: url,
    },
    order: [["updatedAt", "DESC"]],
  });
}

async function importProblemFromUrl({ url, userId }) {
  if (!url) {
    throw new Error("URL is required");
  }

  const normalizedUrl = String(url).trim();
  let source = null;

  if (isLeetCodeProblemUrl(normalizedUrl)) {
    source = "leetcode";
  } else if (isValidGFGProblemUrl(normalizedUrl)) {
    source = "gfg";
  } else {
    throw new Error("Unsupported problem URL. Use a LeetCode or GFG problem link.");
  }

  if (userId) {
    const cachedProblem = await findCachedImport({
      userId,
      url: normalizedUrl,
      source,
    });
    if (cachedProblem?.title && cachedProblem?.description) {
      return formatCachedProblem(cachedProblem);
    }
  }

  if (source === "leetcode") {
    const slug = extractLeetCodeSlug(normalizedUrl);
    if (!slug) {
      throw new Error("Invalid LeetCode URL");
    }

    const questionData = await getLeetCodeQuestion(slug);
    if (!questionData) {
      throw new Error("Problem not found regarding this slug");
    }

    return formatLeetCodeImport(questionData, normalizedUrl);
  }

  const gfgProblem = await fetchGFGProblem(normalizedUrl);
  return {
    source: gfgProblem.source,
    sourceUrl: gfgProblem.sourceUrl,
    title: gfgProblem.title,
    slug: gfgProblem.slug,
    difficulty: gfgProblem.difficulty || "",
    description: gfgProblem.descriptionHtml || gfgProblem.description,
    descriptionHtml: gfgProblem.descriptionHtml || "",
    descriptionText: gfgProblem.description,
    exampleTestcases: gfgProblem.exampleTestcases || "",
    codeSnippets: [],
    tags: [],
    examples: gfgProblem.examples || [],
    constraints: gfgProblem.constraints || "",
  };
}

module.exports = {
  importProblemFromUrl,
  isLeetCodeProblemUrl,
};
