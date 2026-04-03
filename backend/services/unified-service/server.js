const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./src/config/database");

require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
require("dotenv").config();

const fileRoutes = require("./src/routes/fileRoutes");
const problemRoutes = require("./src/routes/problemRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const statsRoutes = require("./src/routes/statsRoutes");

const app = express();
const PORT = process.env.UNIFIED_SERVICE_PORT || process.env.PORT || 5007;
const isProduction = process.env.NODE_ENV === "production";

const parsedPort = Number(PORT);
if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error(`[unified-service] Invalid port value: ${PORT}`);
}

if (!String(process.env.DATABASE_URL || "").trim()) {
  throw new Error("[unified-service] Missing required env var: DATABASE_URL");
}

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "unified-service" });
});

app.use("/api/files", fileRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);

const MAX_RETRIES = 10;
const RETRY_DELAY = 8000;

async function initializeDatabase() {
  if (isProduction) {
    await sequelize.authenticate();
    console.log(
      "PostgreSQL (algonote) connection verified for Unified Service",
    );
    return;
  }

  await sequelize.sync({ alter: true });
  console.log("PostgreSQL (algonote) synced for Unified Service");
}

async function startServer(attempt = 1) {
  try {
    await initializeDatabase();
    app.listen(PORT, () =>
      console.log(`Unified Service running on port ${PORT}`),
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
