const express = require("express");
const router = express.Router();
const {
  analyzeProfile,
  addRevision,
  getRevisions,
  deleteRevision,
  getRecommendations,
  getTopicQuestions,
  importWeakAreas,
} = require("../controllers/profileController");

// Recommendations
// POST /api/profile-analysis/recommendations
router.post("/recommendations", express.json(), getRecommendations);

// Topic question bank
// POST /api/profile-analysis/topic-questions
router.post("/topic-questions", express.json(), getTopicQuestions);

// Import weak areas to Explorer (creates folder structure via file-service)
// POST /api/profile-analysis/import-weak-areas
router.post("/import-weak-areas", express.json(), importWeakAreas);

// Revision CRUD
// POST /api/profile-analysis/revision
router.post("/revision", express.json(), addRevision);

// GET /api/profile-analysis/revision/:username
router.get("/revision/:username", getRevisions);

// DELETE /api/profile-analysis/revision/:id
router.delete("/revision/:id", deleteRevision);

// Profile analysis (LeetCode stats fetch)
// GET /api/profile-analysis/:username
router.get("/:username", analyzeProfile);

module.exports = router;
