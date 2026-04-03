const express = require("express");
const { getLoginStats, recordLogin } = require("../controllers/statsController");

const router = express.Router();

router.get("/logins", getLoginStats);
router.post("/logins", recordLogin);

module.exports = router;
