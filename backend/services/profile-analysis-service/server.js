const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./config/env");

const profileRoutes = require("./src/routes/profileRoutes");

const app = express();
const PORT = process.env.PROFILE_SERVICE_PORT || 5006;
const MONGO_URI = process.env.MONGO_URI;

const parsedPort = Number(PORT);
if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error(`[profile-analysis-service] Invalid port value: ${PORT}`);
}

if (!String(MONGO_URI || "").trim()) {
  throw new Error(
    "[profile-analysis-service] Missing required env var: MONGO_URI",
  );
}

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/profile-analysis", profileRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Profile Analysis Service Running" });
});

// Connect to MongoDB then start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Profile Analysis Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
