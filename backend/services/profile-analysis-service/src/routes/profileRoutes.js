const express = require("express");
const router = express.Router();
const {
  analyzeProfile,
  addRevision,
  getRevisions,
  deleteRevision,
  getRecommendations,
  importWeakAreas,
} = require("../controllers/profileController");

// Recommendations
// POST /api/profile-analysis/recommendations
router.post("/recommendations", express.json(), getRecommendations);

// Import weak areas to Explorer (creates folder structure via file-service)
// POST /api/profile-analysis/import-weak-areas
router.post("/import-weak-areas", express.json(), importWeakAreas);

// Profile analysis (LeetCode stats fetch)
// GET /api/profile-analysis/:username
router.get("/:username", analyzeProfile);

// Revision CRUD
// POST /api/profile-analysis/revision
router.post("/revision", addRevision);

// GET /api/profile-analysis/revision/:username
router.get("/revision/:username", getRevisions);

// DELETE /api/profile-analysis/revision/:id
router.delete("/revision/:id", deleteRevision);

module.exports = router;
