const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
  dotenv.config();
}

console.log(
  "[unified-service] Environment:",
  process.env.NODE_ENV || "development",
);

const requiredEnv = ["DATABASE_URL"];

const missing = requiredEnv.filter((key) => !String(process.env[key] || "").trim());

if (missing.length > 0) {
  throw new Error(
    `[unified-service] Missing required env vars: ${missing.join(", ")}`,
  );
}
