const titleCaseFromSlug = (slug = "") =>
  slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const detectProblemSource = (link = "") => {
  try {
    const parsed = new URL(link);
    const host = parsed.hostname.toLowerCase();

    if (host.endsWith("leetcode.com") && /\/problems\//i.test(parsed.pathname)) {
      return "leetcode";
    }

    if (
      (host === "geeksforgeeks.org" ||
        host === "www.geeksforgeeks.org" ||
        host === "practice.geeksforgeeks.org") &&
      /\/problems?\//i.test(parsed.pathname)
    ) {
      return "gfg";
    }
  } catch (_error) {
    return null;
  }

  return null;
};

export const extractProblemNameFromLink = (link = "") => {
  const source = detectProblemSource(link);
  if (!source) {
    return "";
  }

  try {
    const parsed = new URL(link);
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (source === "leetcode") {
      const match = link.match(/leetcode\.com\/problems\/([^/]+)/i);
      return match?.[1] ? titleCaseFromSlug(match[1]) : "";
    }

    const problemIndex = segments.findIndex((segment) => /^problems?$/i.test(segment));
    const slug =
      problemIndex >= 0 && problemIndex + 1 < segments.length
        ? segments[problemIndex + 1]
        : segments.filter((segment) => !/^\d+$/.test(segment)).at(-1) || "";

    return titleCaseFromSlug(slug);
  } catch (_error) {
    return "";
  }
};

export const getProblemSourceLabel = (source) => {
  if (source === "leetcode") {
    return "LeetCode";
  }

  if (source === "gfg") {
    return "GFG";
  }

  return "Problem";
};

export const isNotesFileName = (name = "") => /\.txt$/i.test(String(name).trim());

export const stripNotesExtension = (name = "") =>
  String(name).replace(/\.txt$/i, "").trim();

export const ensureNotesFileName = (name = "") => {
  const baseName = stripNotesExtension(name);
  return baseName ? `${baseName}.txt` : "Notes.txt";
};

export const getFileVisualType = (item = {}) => {
  if (isNotesFileName(item?.name)) {
    return "notes";
  }

  return detectProblemSource(item?.link || "") || "manual";
};
