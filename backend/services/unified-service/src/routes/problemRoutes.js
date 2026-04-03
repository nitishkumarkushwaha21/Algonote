const express = require("express");
const {
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} = require("../controllers/problemController");
const {
  importProblem,
  importGFGProblem,
  importLeetCodeList,
  createWorkspaceFolderFromRevisionList,
} = require("../controllers/importController");

const router = express.Router();

router.get("/:fileId", getProblem);
router.post("/", createProblem);
router.put("/:fileId", updateProblem);
router.delete("/:fileId", deleteProblem);
router.post("/import", importProblem);
router.post("/gfg", importGFGProblem);
router.post("/leetcode-list", importLeetCodeList);
router.post("/leetcode-list/create-folder", createWorkspaceFolderFromRevisionList);

module.exports = router;
