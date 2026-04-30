const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
  dotenv.config();
}

console.log(
  "[profile-analysis-service] Environment:",
  process.env.NODE_ENV || "development",
);

const requiredEnv = ["MONGO_URI"];

const missing = requiredEnv.filter((key) => !String(process.env[key] || "").trim());

if (missing.length > 0) {
  throw new Error(
    `[profile-analysis-service] Missing required env vars: ${missing.join(", ")}`,
  );
}
