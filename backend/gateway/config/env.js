const path = require("path");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
  dotenv.config();
}

console.log("[gateway] Environment:", process.env.NODE_ENV || "development");

const isDevelopment = process.env.NODE_ENV !== "production";
const isProduction = process.env.NODE_ENV === "production";
const enableDevAuthFallback =
  isDevelopment && process.env.ENABLE_DEV_AUTH_FALLBACK === "true";

function requireEnv(keys, serviceName) {
  const missing = keys.filter((key) => !String(process.env[key] || "").trim());

  if (missing.length > 0) {
    throw new Error(
      `[${serviceName}] Missing required env vars: ${missing.join(", ")}`,
    );
  }
}

if (isProduction) {
  requireEnv(
    ["UNIFIED_SERVICE_URL", "PLAYLIST_SERVICE_URL", "PROFILE_SERVICE_URL"],
    "gateway",
  );
}

if (!String(process.env.CLERK_SECRET_KEY || "").trim() && !enableDevAuthFallback) {
  throw new Error(
    "[gateway] Missing CLERK_SECRET_KEY. For local-only fallback auth, run with NODE_ENV=development and ENABLE_DEV_AUTH_FALLBACK=true.",
  );
}

if (
  String(process.env.CLERK_SECRET_KEY || "").trim() &&
  !String(process.env.CLERK_PUBLISHABLE_KEY || "").trim()
) {
  throw new Error(
    "[gateway] Missing CLERK_PUBLISHABLE_KEY while Clerk auth is enabled.",
  );
}
