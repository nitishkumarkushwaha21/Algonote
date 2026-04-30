const express = require("express");
const cors = require("cors");
require("./config/env");
const sequelize = require("./src/config/database");

// Import models to register them with Sequelize
require("./src/models/LearningSheet");
require("./src/models/SheetProblem");

const playlistRoutes = require("./src/routes/playlistRoutes");

const app = express();
const PORT = process.env.PLAYLIST_SERVICE_PORT || 5005;
const isProduction = process.env.NODE_ENV === "production";

const parsedPort = Number(PORT);
if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error(`[youtube-playlist-service] Invalid port value: ${PORT}`);
}

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/youtube-playlist", playlistRoutes);

app.get("/", (req, res) => {
  res.json({ message: "YouTube Playlist Service Running" });
});

// Sync database tables and start server — retries handle Neon cold-start delay
const MAX_RETRIES = 10;
const RETRY_DELAY = 8000;

async function initializeDatabase() {
  if (isProduction) {
    await sequelize.authenticate();
    console.log(
      "PostgreSQL (algonote) connection verified for YouTube Playlist Service",
    );
    return;
  }

  await sequelize.sync({ alter: true });
  console.log(
    "PostgreSQL (algonote) synced - learning_sheets & sheet_problems tables ready",
  );
}

async function startServer(attempt = 1) {
  try {
    await initializeDatabase();
    app.listen(PORT, () =>
      console.log(`YouTube Playlist Service running on port ${PORT}`),
    );
  } catch (err) {
    const msg = err.parent?.message || err.message || String(err);
    console.error(
      `DB connect attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`,
    );
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(() => startServer(attempt + 1), RETRY_DELAY);
    } else {
      console.error("All DB connection attempts failed. Exiting.");
      process.exit(1);
    }
  }
}

startServer();
