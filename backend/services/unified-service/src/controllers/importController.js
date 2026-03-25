const { htmlToText } = require("html-to-text");
const { getLeetCodeQuestion } = require("../services/leetcodeService");
const { getUserIdFromReq } = require("../shared/requestContext");

exports.importLeetCodeProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const parts = url.split("/").filter((part) => part !== "");
    const slugIndex = parts.indexOf("problems");

    if (slugIndex === -1 || slugIndex + 1 >= parts.length) {
      return res.status(400).json({ message: "Invalid LeetCode URL" });
    }

    const slug = parts[slugIndex + 1];
    console.log(`Fetching LeetCode problem: ${slug}`);

    const questionData = await getLeetCodeQuestion(slug);
    if (!questionData) {
      return res
        .status(404)
        .json({ message: "Problem not found regarding this slug" });
    }

    const cleanDescription = htmlToText(questionData.content, {
      wordwrap: 130,
    });
    const resolvedDescription =
      questionData.content ||
      (questionData.isPaidOnly
        ? `<p>This LeetCode problem appears to be premium or gated, so Algo Note could import the metadata but not the full statement content.</p>`
        : `<p>Algo Note imported the problem metadata, but LeetCode did not return statement content for this question.</p>`);
    const resolvedDescriptionText =
      cleanDescription ||
      (questionData.isPaidOnly
        ? "This LeetCode problem appears to be premium or gated, so Algo Note could import the metadata but not the full statement content."
        : "Algo Note imported the problem metadata, but LeetCode did not return statement content for this question.");

    return res.json({
      title: questionData.title,
      slug: questionData.titleSlug,
      difficulty: questionData.difficulty,
      description: resolvedDescription,
      descriptionText: resolvedDescriptionText,
      isPaidOnly: Boolean(questionData.isPaidOnly),
      exampleTestcases: questionData.exampleTestcases || "",
      codeSnippets: questionData.codeSnippets || [],
      tags: questionData.topicTags || [],
    });
  } catch (error) {
    console.error("Import Error:", error);
    return res.status(500).json({ message: "Failed to import problem" });
  }
};
