const axios = require("axios");
const cheerio = require("cheerio");
const pLimit = require("p-limit");
const LeetCodeProblemCache = require("../models/LeetCodeProblemCache");
const {
  DEFAULT_HEADERS,
  getFavoriteQuestionList,
  getLeetCodeQuestion,
} = require("../services/leetcodeService");

const LEETCODE_BASE_URL = "https://leetcode.com";
const MAX_CONCURRENCY = 5;
const VALID_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function extractListSlug(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(String(url).trim());
  } catch (_error) {
    throw new Error("Invalid URL");
  }

  if (!/^(www\.)?leetcode\.com$/i.test(parsedUrl.hostname)) {
    throw new Error("Invalid URL");
  }

  const match = parsedUrl.pathname.match(
    /^(?:\/u\/[^/]+)?\/problem-list\/([^/]+)\/?$/i,
  );
  if (!match?.[1]) {
    throw new Error("Invalid URL");
  }

  return match[1];
}

function isValidTitleSlug(slug) {
  return VALID_SLUG_PATTERN.test(String(slug || "").trim());
}

function normalizeTitleSlugs(slugs) {
  return [...new Set((slugs || []).map((slug) => String(slug || "").trim().toLowerCase()))]
    .filter(Boolean)
    .filter(isValidTitleSlug);
}

function mapListQuestion(question) {
  return {
    title: question?.title || "",
    titleSlug: question?.titleSlug || "",
    difficulty: question?.difficulty || "",
  };
}

function extractProblemSlugsFromHtml(html) {
  const markup = String(html || "");
  const discovered = [];
  const pathPattern =
    /(?:https?:\/\/leetcode\.com)?\/problems\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?/gi;
  const titleSlugPattern = /"titleSlug"\s*:\s*"([a-z0-9]+(?:-[a-z0-9]+)*)"/gi;
  const questionSlugPattern =
    /"questionTitleSlug"\s*:\s*"([a-z0-9]+(?:-[a-z0-9]+)*)"/gi;

  for (const pattern of [pathPattern, titleSlugPattern, questionSlugPattern]) {
    for (const match of markup.matchAll(pattern)) {
      if (match?.[1]) {
        discovered.push(match[1]);
      }
    }
  }

  return normalizeTitleSlugs(discovered);
}

async function fetchListViaApi(listSlug) {
  const favoriteQuestionList = await getFavoriteQuestionList(listSlug);
  const questions = favoriteQuestionList?.questions || [];

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("LeetCode API returned an empty list");
  }

  console.info(`[leetcode-list] Source=api slug=${listSlug} count=${questions.length}`);

  return {
    source: "api",
    title: favoriteQuestionList?.name || listSlug,
    questions: questions.map(mapListQuestion),
  };
}

async function fetchListViaScraping(listUrl, listSlug) {
  let response;

  try {
    response = await axios.get(listUrl, {
      headers: {
        ...DEFAULT_HEADERS,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      timeout: 15000,
    });
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error(
        "LeetCode blocked the scraping fallback. Add LEETCODE_COOKIE/LEETCODE_CSRFTOKEN in the backend env or use a machine/network that can reach LeetCode.",
      );
    }
    throw error;
  }
  const $ = cheerio.load(response.data || "");
  const collectedSlugs = extractProblemSlugsFromHtml(response.data);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const match = String(href || "").match(/^\/problems\/([a-z0-9-]+)\/?$/i);
    if (match?.[1]) {
      collectedSlugs.push(match[1]);
    }
  });

  const titleSlugs = normalizeTitleSlugs(collectedSlugs);

  if (titleSlugs.length === 0) {
    throw new Error(
      "Private list or scraping fallback could not find any problem slugs",
    );
  }

  console.info(`[leetcode-list] Source=scraping slug=${listSlug} count=${titleSlugs.length}`);

  return {
    source: "scraping",
    title: listSlug,
    questions: titleSlugs.map((titleSlug) => ({
      title: "",
      titleSlug,
      difficulty: "",
    })),
  };
}

async function resolveListQuestions({ listUrl, listSlug }) {
  try {
    return await fetchListViaApi(listSlug);
  } catch (error) {
    console.warn(
      `[leetcode-list] API failed for slug=${listSlug}. Falling back to scraping. ${error.message}`,
    );
    try {
      return await fetchListViaScraping(listUrl, listSlug);
    } catch (scrapeError) {
      throw new Error(scrapeError.message || error.message);
    }
  }
}

function hasUsableCache(problem) {
  return Boolean(
    problem &&
      problem.titleSlug &&
      problem.title &&
      problem.difficulty,
  );
}

function formatProblemOutput(problem) {
  const exampleLines = String(problem.exampleTestcases || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    title: problem.title,
    titleSlug: problem.titleSlug,
    difficulty: problem.difficulty,
    content: problem.content,
    examples: exampleLines,
    link: problem.link || `${LEETCODE_BASE_URL}/problems/${problem.titleSlug}/`,
  };
}

async function fetchAndCacheProblem(titleSlug) {
  const question = await getLeetCodeQuestion(titleSlug);
  if (!question?.titleSlug) {
    throw new Error(`Problem details not found for slug "${titleSlug}"`);
  }

  const cachedPayload = {
    titleSlug: question.titleSlug,
    title: question.title || "",
    difficulty: question.difficulty || "",
    content: question.content || "",
    exampleTestcases: question.exampleTestcases || "",
    link: `${LEETCODE_BASE_URL}/problems/${question.titleSlug}/`,
  };

  await LeetCodeProblemCache.upsert(cachedPayload);
  return cachedPayload;
}

async function hydrateProblems(titleSlugs) {
  const cachedProblems = await LeetCodeProblemCache.findAll({
    where: { titleSlug: titleSlugs },
    raw: true,
  });
  const cachedBySlug = new Map(
    cachedProblems
      .filter(hasUsableCache)
      .map((problem) => [problem.titleSlug, problem]),
  );
  const limit = pLimit(MAX_CONCURRENCY);

  const hydratedBySlug = new Map(cachedBySlug);
  const missingSlugs = titleSlugs.filter((titleSlug) => !hydratedBySlug.has(titleSlug));

  const fetchedProblems = await Promise.all(
    missingSlugs.map((titleSlug) =>
      limit(async () => {
        const fetched = await fetchAndCacheProblem(titleSlug);
        hydratedBySlug.set(titleSlug, fetched);
      }),
    ),
  );

  void fetchedProblems;

  return titleSlugs
    .map((titleSlug) => hydratedBySlug.get(titleSlug))
    .filter(Boolean)
    .map(formatProblemOutput);
}

async function importLeetCodeList({ url }) {
  const listUrl = String(url || "").trim();
  if (!listUrl) {
    throw new Error("URL is required");
  }

  const listSlug = extractListSlug(listUrl);
  const listData = await resolveListQuestions({ listUrl, listSlug });
  const titleSlugs = normalizeTitleSlugs(
    listData.questions.map((question) => question.titleSlug),
  );

  if (titleSlugs.length === 0) {
    throw new Error("Private list or no valid problem slugs found");
  }

  const problems = await hydrateProblems(titleSlugs);

  if (problems.length === 0) {
    throw new Error("Could not import any problems from this list");
  }

  return {
    listSlug,
    source: listData.source,
    count: problems.length,
    problems,
  };
}

module.exports = {
  extractListSlug,
  importLeetCodeList,
  isValidTitleSlug,
  normalizeTitleSlugs,
};
