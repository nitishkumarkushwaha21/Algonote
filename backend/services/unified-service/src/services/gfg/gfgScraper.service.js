const axios = require("axios");
const cheerio = require("cheerio");
const { htmlToText } = require("html-to-text");

const GFG_DELAY_MS = Number(process.env.GFG_SCRAPE_DELAY_MS || 2500);
const GFG_HOSTS = new Set([
  "www.geeksforgeeks.org",
  "geeksforgeeks.org",
  "practice.geeksforgeeks.org",
]);

let lastRequestAt = 0;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function applyRateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < GFG_DELAY_MS) {
    await wait(GFG_DELAY_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

function normalizeWhitespace(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function isValidGFGProblemUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      GFG_HOSTS.has(parsed.hostname) &&
      /\/problems?\//i.test(parsed.pathname)
    );
  } catch (_error) {
    return false;
  }
}

function buildSlugFromUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const problemIndex = segments.findIndex((segment) =>
      /^problems?$/i.test(segment),
    );

    const rawSlug =
      problemIndex >= 0 && problemIndex + 1 < segments.length
        ? segments[problemIndex + 1]
        : segments.filter((segment) => !/^\d+$/.test(segment)).at(-1) || "";

    return rawSlug.trim().toLowerCase();
  } catch (_error) {
    return "";
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToParagraphs(text = "") {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      if (/\n/.test(block)) {
        return `<pre>${escapeHtml(block)}</pre>`;
      }

      return `<p>${escapeHtml(block)}</p>`;
    })
    .join("");
}

function parseExampleBlock(block) {
  const cleanedBlock = normalizeWhitespace(block);
  if (!cleanedBlock) {
    return null;
  }

  const extractPart = (label, nextLabels) => {
    const pattern = new RegExp(
      `${label}\\s*:?\\s*([\\s\\S]*?)(?=${nextLabels.join("|")}|$)`,
      "i",
    );
    const match = cleanedBlock.match(pattern);
    return match ? normalizeWhitespace(match[1]) : "";
  };

  const input = extractPart("Input", [
    "Output\\s*:?",
    "Explanation\\s*:?",
    "Constraints?\\s*:?",
    "Example\\s*\\d*\\s*:?",
  ]);
  const output = extractPart("Output", [
    "Explanation\\s*:?",
    "Constraints?\\s*:?",
    "Example\\s*\\d*\\s*:?",
  ]);
  const explanation = extractPart("Explanation", [
    "Constraints?\\s*:?",
    "Example\\s*\\d*\\s*:?",
  ]);

  return {
    label: /^Example\s*\d+/i.test(cleanedBlock)
      ? cleanedBlock.match(/^Example\s*\d+/i)?.[0] || "Example"
      : "Example",
    input,
    output,
    explanation,
    text: cleanedBlock,
  };
}

function extractExamples(text) {
  const examples = [];
  const examplePattern =
    /Example\s*\d*\s*:?\s*([\s\S]*?)(?=(?:Example\s*\d*\s*:?)|(?:Constraints?\s*:?)|(?:Expected\s+[A-Za-z ]*:?)|(?:Company Tags?\s*:?)|(?:Topic Tags?\s*:?)|$)/gi;

  let match = examplePattern.exec(text);
  while (match) {
    const parsed = parseExampleBlock(match[0]);
    if (parsed) {
      examples.push(parsed);
    }
    match = examplePattern.exec(text);
  }

  return examples;
}

function extractConstraints(text) {
  const match = text.match(
    /Constraints?\s*:?\s*([\s\S]*?)(?=(?:Expected\s+[A-Za-z ]*:?)|(?:Company Tags?\s*:?)|(?:Topic Tags?\s*:?)|(?:Related Articles?\s*:?)|$)/i,
  );

  return match ? normalizeWhitespace(match[1]) : "";
}

function extractDifficulty($, root) {
  const selectorCandidates = [
    '[class*="difficulty"]',
    '[class*="level"]',
    '[class*="tag"]',
    '[class*="badge"]',
  ];

  for (const selector of selectorCandidates) {
    const match = $(selector)
      .toArray()
      .map((node) => normalizeWhitespace($(node).text()))
      .find((value) => /^(easy|medium|hard|basic|school)$/i.test(value));

    if (match) {
      return match;
    }
  }

  const rootText = normalizeWhitespace(root.text());
  return rootText.match(/\b(Easy|Medium|Hard|Basic|School)\b/i)?.[1] || "";
}

function findPrimaryContentRoot($) {
  const selectors = [
    "div.problem-statement",
    '[class*="problem-statement"]',
    '[class*="problem_content"]',
    '[class*="problem-content"]',
    "article",
    "main",
  ];

  for (const selector of selectors) {
    const candidate = $(selector).first();
    if (candidate.length && normalizeWhitespace(candidate.text()).length > 200) {
      return candidate;
    }
  }

  const articleLikeNode = $("body")
    .find("div, article, section")
    .toArray()
    .map((node) => $(node))
    .find((node) => normalizeWhitespace(node.text()).length > 400);

  return articleLikeNode || $("body");
}

function extractEmbeddedProblemData($) {
  const scriptText = $("script")
    .toArray()
    .map((node) => $(node).html() || "")
    .find((text) => text.includes('"pageProps"') && text.includes("problemData"));

  if (!scriptText) {
    return null;
  }

  try {
    const parsed = JSON.parse(scriptText);
    return (
      parsed?.props?.pageProps?.initialState?.problemData?.allData?.probData ||
      parsed?.props?.pageProps?.initialState?.problemApi?.queries &&
        Object.values(parsed.props.pageProps.initialState.problemApi.queries)
          .map((entry) => entry?.data)
          .find((entry) => entry?.problem_name && entry?.problem_question) ||
      null
    );
  } catch (_error) {
    return null;
  }
}

function extractDescription(text, title) {
  let description = text;

  if (title) {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    description = description.replace(new RegExp(`^${escapedTitle}\\s*`, "i"), "");
  }

  description = description.replace(/\b(Easy|Medium|Hard|Basic|School)\b\s*/, "");

  const splitMatch = description.match(
    /([\s\S]*?)(?=(?:Example\s*\d*\s*:?)|(?:Constraints?\s*:?)|(?:Expected\s+[A-Za-z ]*:?)|(?:Company Tags?\s*:?)|(?:Topic Tags?\s*:?)|$)/i,
  );

  return normalizeWhitespace(splitMatch ? splitMatch[1] : description);
}

function buildExamplesText(examples) {
  return examples
    .map((example, index) => {
      const lines = [`Example ${index + 1}:`];
      if (example.input) lines.push(`Input: ${example.input}`);
      if (example.output) lines.push(`Output: ${example.output}`);
      if (example.explanation) lines.push(`Explanation: ${example.explanation}`);
      if (!example.input && !example.output && !example.explanation) {
        lines.push(example.text);
      }
      return lines.join("\n");
    })
    .join("\n\n")
    .trim();
}

function buildDescriptionHtml({ description, examples, constraints, difficulty }) {
  const parts = [];

  if (difficulty) {
    parts.push(`<p><strong>Difficulty:</strong> ${escapeHtml(difficulty)}</p>`);
  }

  if (description) {
    parts.push(textToParagraphs(description));
  }

  if (examples.length > 0) {
    parts.push("<h3>Examples</h3>");
    parts.push(
      examples
        .map(
          (example) => `<pre>${escapeHtml(buildExamplesText([example]))}</pre>`,
        )
        .join(""),
    );
  }

  if (constraints) {
    parts.push("<h3>Constraints</h3>");
    parts.push(`<pre>${escapeHtml(constraints)}</pre>`);
  }

  return parts.join("");
}

async function fetchGFGProblem(url) {
  if (!isValidGFGProblemUrl(url)) {
    throw new Error("Invalid GeeksforGeeks problem URL");
  }

  await applyRateLimit();

  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.google.com/",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const embeddedProblem = extractEmbeddedProblemData($);
  if (embeddedProblem?.problem_name && embeddedProblem?.problem_question) {
    const title = normalizeWhitespace(embeddedProblem.problem_name);
    const difficulty = normalizeWhitespace(
      embeddedProblem.difficulty ||
        embeddedProblem.problem_level_text ||
        embeddedProblem.problem_level ||
        "",
    );
    const statementHtml = embeddedProblem.problem_question || "";
    const descriptionHtml = statementHtml;
    const descriptionText = normalizeWhitespace(
      htmlToText(statementHtml, { wordwrap: 130 }),
    );
    const examples = extractExamples(descriptionText);
    const constraints = extractConstraints(descriptionText);

    return {
      source: "gfg",
      sourceUrl: url,
      slug: normalizeWhitespace(embeddedProblem.slug || buildSlugFromUrl(url)),
      title,
      description: descriptionText,
      examples,
      constraints,
      difficulty,
      exampleTestcases: buildExamplesText(examples),
      descriptionHtml: buildDescriptionHtml({
        description: descriptionText,
        examples,
        constraints,
        difficulty,
      }),
    };
  }

  const title = normalizeWhitespace($("h1").first().text());
  const root = findPrimaryContentRoot($);
  const rootText = normalizeWhitespace(root.text());

  if (!title || !rootText || rootText.length < 120) {
    throw new Error("Could not detect a valid GeeksforGeeks problem page");
  }

  const description = extractDescription(rootText, title);
  const examples = extractExamples(rootText);
  const constraints = extractConstraints(rootText);
  const difficulty = extractDifficulty($, root);

  if (!description && examples.length === 0) {
    throw new Error("Could not extract problem details from the GFG page");
  }

  return {
    source: "gfg",
    sourceUrl: url,
    slug: buildSlugFromUrl(url),
    title,
    description,
    examples,
    constraints,
    difficulty,
    exampleTestcases: buildExamplesText(examples),
    descriptionHtml: buildDescriptionHtml({
      description,
      examples,
      constraints,
      difficulty,
    }),
  };
}

module.exports = {
  buildExamplesText,
  buildSlugFromUrl,
  fetchGFGProblem,
  isValidGFGProblemUrl,
};
