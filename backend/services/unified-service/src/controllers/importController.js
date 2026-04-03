const { importProblemFromUrl } = require("../services/problemImportService");
const { fetchGFGProblem } = require("../services/gfg/gfgScraper.service");
const {
  createRevisionWorkspaceFolder,
  parseRevisionListText,
} = require("../revision-list/revisionListParser");
const { getUserIdFromReq } = require("../shared/requestContext");

exports.importProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const importedProblem = await importProblemFromUrl({ url, userId });
    return res.json(importedProblem);
  } catch (error) {
    console.error("Import Error:", error);
    return res.status(400).json({ message: error.message || "Failed to import problem" });
  }
};

exports.importGFGProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    const problem = await fetchGFGProblem(url);
    return res.json({
      title: problem.title || "",
      description: problem.description || "",
      examples: problem.examples || [],
      constraints: problem.constraints || "",
      difficulty: problem.difficulty || "",
    });
  } catch (error) {
    console.error("GFG import error:", error);
    return res.status(400).json({
      message: error.message || "Failed to import GFG problem",
    });
  }
};

exports.importLeetCodeList = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text, platform } = req.body;
    const result = parseRevisionListText({ text, platform });
    return res.json(result);
  } catch (error) {
    const message = error.message || "Failed to build revision list";
    const statusCode =
      /no problems/i.test(message) || /paste problem text/i.test(message) ? 400 : 400;

    console.error("Revision list import error:", message);
    return res.status(statusCode).json({ message });
  }
};

exports.createWorkspaceFolderFromRevisionList = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { folderName, problems } = req.body;
    const result = await createRevisionWorkspaceFolder({
      userId,
      folderName,
      problems,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error.message || "Failed to create workspace folder";
    console.error("Revision list workspace import error:", message);
    return res.status(400).json({ message });
  }
};
