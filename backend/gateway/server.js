const express = require("express");
const cors = require("cors");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { clerkMiddleware, requireAuth, getAuth } = require("@clerk/express");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;
const hasClerkConfig = Boolean(process.env.CLERK_SECRET_KEY);
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const enableDevAuthFallback =
  isDevelopment && process.env.ENABLE_DEV_AUTH_FALLBACK === "true";

const parsedPort = Number(PORT);
if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error(`[gateway] Invalid PORT value: ${PORT}`);
}

if (isProduction) {
  const missing = [
    "UNIFIED_SERVICE_URL",
    "PLAYLIST_SERVICE_URL",
    "PROFILE_SERVICE_URL",
  ].filter((key) => !String(process.env[key] || "").trim());

  if (missing.length > 0) {
    throw new Error(
      `[gateway] Missing required env vars in production: ${missing.join(", ")}`,
    );
  }
}

if (!hasClerkConfig && !enableDevAuthFallback) {
  throw new Error(
    "[gateway] Missing CLERK_SECRET_KEY. For local-only fallback auth, run with NODE_ENV=development and ENABLE_DEV_AUTH_FALLBACK=true.",
  );
}

app.use(cors());
// app.use(express.json()); // Removed to avoid body parsing issues with proxy

if (hasClerkConfig) {
  app.use(clerkMiddleware());

  app.use("/api", requireAuth(), (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.authUserId = userId;
    next();
  });
} else if (enableDevAuthFallback) {
  console.warn(
    "[gateway] Clerk keys missing. Running in development fallback auth mode.",
  );
  app.use("/api", (req, _res, next) => {
    // Keep downstream services usable in local dev when Clerk is not configured.
    req.authUserId = req.header("x-user-id") || "local-dev-user";
    next();
  });
}

const DEFAULT_UNIFIED_SERVICE = "http://127.0.0.1:5007";
const UNIFIED_SERVICE =
  process.env.UNIFIED_SERVICE_URL || DEFAULT_UNIFIED_SERVICE;
// File/Problem/AI are served by unified-service in the current architecture.
const FILE_SERVICE = UNIFIED_SERVICE;
const PROBLEM_SERVICE = UNIFIED_SERVICE;
const AI_SERVICE = UNIFIED_SERVICE;
const PLAYLIST_SERVICE =
  process.env.PLAYLIST_SERVICE_URL || "http://127.0.0.1:5005";
const PROFILE_SERVICE =
  process.env.PROFILE_SERVICE_URL || "http://127.0.0.1:5006";

const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 600_000); // 10 minutes

function createServiceProxy(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: PROXY_TIMEOUT_MS,
    proxyTimeout: PROXY_TIMEOUT_MS,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.authUserId) {
          proxyReq.setHeader("x-user-id", req.authUserId);
        }
      },
      error: (err, req, res) => {
        if (res.headersSent) return;
        res.status(502).json({
          error: "Bad Gateway",
          message: err?.message || "Upstream proxy error",
        });
      },
    },
  });
}

// Routes
// Express strips the mount path before proxying, so include each service prefix in target.
app.use("/api/files", createServiceProxy(`${FILE_SERVICE}/api/files`));
app.use("/api/problems", createServiceProxy(`${PROBLEM_SERVICE}/api/problems`));
app.use("/api/ai", createServiceProxy(`${AI_SERVICE}/api/ai`));
app.use(
  "/api/youtube-playlist",
  createServiceProxy(`${PLAYLIST_SERVICE}/api/youtube-playlist`),
);
app.use(
  "/api/profile-analysis",
  createServiceProxy(`${PROFILE_SERVICE}/api/profile-analysis`),
);

app.get("/", (req, res) => {
  res.send("AlgoNote AI Gateway Running");
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});
