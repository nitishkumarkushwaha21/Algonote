const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
  dotenv.config();
}

console.log(
  "[youtube-playlist-service] Environment:",
  process.env.NODE_ENV || "development",
);

const requiredEnv = ["DATABASE_URL", "YOUTUBE_API_KEY"];

const missing = requiredEnv.filter((key) => !String(process.env[key] || "").trim());

if (missing.length > 0) {
  throw new Error(
    `[youtube-playlist-service] Missing required env vars: ${missing.join(", ")}`,
  );
}

if (
  !String(process.env.OPENROUTER_API_KEY || "").trim() &&
  !String(process.env.OPENAI_API_KEY || "").trim()
) {
  throw new Error(
    "[youtube-playlist-service] Missing AI API key. Set OPENROUTER_API_KEY or OPENAI_API_KEY.",
  );
}
