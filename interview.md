# AlgoNote — Complete Interview Preparation Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Full System Architecture](#2-full-system-architecture)
3. [Exact Code Flow for Every Feature](#3-exact-code-flow-for-every-feature)
4. [Line-by-Line Deep Dive: Critical Files](#4-line-by-line-deep-dive-critical-files)
5. [Design Decisions & Why](#5-design-decisions--why)
6. [Infrastructure & DevOps](#6-infrastructure--devops)
7. [40+ Interview Q&As](#7-40-interview-qas)

---

## 1. Project Overview

**AlgoNote** (internally also called LazyNote) is a full-stack, multi-user DSA (Data Structures & Algorithms) revision workspace. It enables competitive programmers and interview candidates to:

- Organize LeetCode/GFG problems in a hierarchical file-tree workspace
- Import entire YouTube DSA playlists and auto-generate problem sheets using AI
- Parse raw revision lists (pasted text or `.txt` files) into structured workspace folders
- Analyze their LeetCode profile, identify weak areas, and receive curated recommendations
- Write solutions with a Monaco code editor, track complexity, and save freeform notes
- Mark problems as solved / revised / important and navigate between them sequentially

**Tech Stack Summary:**

| Layer              | Technology                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Frontend           | React 19, Vite 7, Tailwind CSS v4, Zustand, Axios, Monaco Editor, Framer Motion, Chart.js |
| Auth               | Clerk (JWT-based, OAuth/Google supported)                                                 |
| API Gateway        | Express 5, http-proxy-middleware, @clerk/express                                          |
| Core Service       | Express 5, Sequelize 6, PostgreSQL (Neon serverless)                                      |
| YouTube/AI Service | Express 5, Sequelize, YouTube Data API v3, OpenRouter (DeepSeek model)                    |
| Profile Service    | Express 4, Mongoose 8, MongoDB                                                            |
| Deployment         | Docker Compose, AWS EC2, Nginx (reverse proxy + SPA serving)                              |

---

## 2. Full System Architecture

### 2.1 Service Map

```
Browser (React SPA)
    │
    │  HTTP /api/*  (dev: Vite proxy → :5001)
    │              (prod: Nginx → Docker container :5001)
    ▼
┌─────────────────────────────────────────────────┐
│              GATEWAY  (port 5001)               │
│   Clerk auth middleware → requireAuth()         │
│   Sets x-user-id header on all proxied requests │
│                                                 │
│  /api/files  ──────────────────────────────────►│
│  /api/problems ─────────────────────────────────│─► UNIFIED-SERVICE (port 5007)
│  /api/ai ───────────────────────────────────────│   PostgreSQL (Neon)
│  /api/stats ────────────────────────────────────│
│                                                 │
│  /api/youtube-playlist ─────────────────────────│─► YOUTUBE-PLAYLIST-SERVICE (port 5005)
│                                                 │   PostgreSQL (Neon) + YouTube API + OpenRouter AI
│  /api/profile-analysis ─────────────────────────│─► PROFILE-ANALYSIS-SERVICE (port 5006)
└─────────────────────────────────────────────────┘   MongoDB (Docker container)
```

### 2.2 Data Stores

| Store             | Used By                  | Tables/Collections                                                         | Purpose                            |
| ----------------- | ------------------------ | -------------------------------------------------------------------------- | ---------------------------------- |
| PostgreSQL (Neon) | unified-service          | `FileNodes`, `problem_details_v2`, `LoginEvents`, `leetcode_problem_cache` | File tree, problem data, analytics |
| PostgreSQL (Neon) | youtube-playlist-service | `learning_sheets`, `sheet_problems`                                        | YouTube-imported DSA sheets        |
| MongoDB (Docker)  | profile-analysis-service | `revisions`                                                                | Per-user revision watchlists       |

### 2.3 Frontend Route Map

```
/              → DashboardPage     (root folders grid)
/folder/:id   → FolderDetailsPage  (items table inside a folder)
/problem/:id  → ProblemEditorPage  (Monaco editor + metadata + notes)
/playlist     → PlaylistSheetsPage (YouTube import UI)
/leetcode-list → LeetCodeListPage  (paste revision list UI)
/profile-analysis → ProfileAnalysisPage (LeetCode stats + recommendations)
/heropage     → HeroPage           (public landing)
/sign-in/*    → LoginPage (custom) + SignInPage (Clerk)
/sign-up/*    → SignUpPageCustom + SignUpPage (Clerk)
/sign-in/sso-callback/* → OAuthCallbackPage
```

---

## 3. Exact Code Flow for Every Feature

### 3.1 Authentication Flow

**File: `client/src/main.jsx`**

```
ClerkProvider wraps the entire app with publishableKey from VITE_CLERK_PUBLISHABLE_KEY.
BrowserRouter provides React Router context.
App renders inside StrictMode.
```

**File: `client/src/App.jsx`**

```
ClerkLoading → shows spinner
ClerkLoaded  → renders Routes

ProtectedLayout checks useAuth().isSignedIn:
  - If NOT signed in AND path === "/" → renders HeroPage
  - If NOT signed in AND any other path → Navigate to /sign-in
  - If signed in → renders <AuthSetup /> + <AppLayout /> (sidebar + <Outlet />)
```

**File: `client/src/components/auth/AuthSetup.jsx`**

```
Effect 1: When auth loads, calls setAuthTokenGetter(getToken) and setAuthUserIdGetter(userId)
          These inject Clerk JWT and userId into every Axios request via interceptors.

Effect 2: When userId changes (user switch / logout):
          - Calls resetForUser() to clear Zustand store
          - Calls loadFileSystem({ force: true }) to reload user-scoped data

Effect 3: On sign-in (once per sessionId):
          - Calls statsService.recordLogin(sessionId)
          - Dispatches custom DOM event "algonote:login-count-updated" for live counter
```

**File: `client/src/services/api.js` — Axios interceptor**

```javascript
api.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    const token = await authTokenGetter(); // Clerk JWT
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (authUserIdGetter) {
    const userId = await authUserIdGetter();
    config.headers["x-user-id"] = userId;
  }
  return config;
});
```

**Gateway `server.js` — Auth middleware**

```javascript
app.use(clerkMiddleware()); // attaches Clerk context to req
app.use("/api", requireAuth(), (req, res, next) => {
  const { userId } = getAuth(req);
  req.authUserId = userId; // persists for proxy injection
  next();
});
// Then on each proxied request:
proxyReq.setHeader("x-user-id", req.authUserId);
```

**Downstream services** read `req.headers["x-user-id"]` to scope all DB queries:

```javascript
// shared/requestContext.js
function getUserIdFromReq(req) {
  return req.headers["x-user-id"];
}
```

---

### 3.2 File System / Workspace Feature

**Create a folder (Dashboard → "New Folder" modal → submit)**

```
1. User types name in CreateRootFolderModal, hits submit
2. DashboardPage.handleCreateFolder() → useFileStore.addItem(null, name, "folder")
3. addItem() → fileService.createFileNode(name, "folder", null, undefined)
4. Axios POST /api/files → Gateway (auth check) → unified-service /api/files POST
5. fileController.createFileNode():
   a. Extracts userId from x-user-id header
   b. Calls FileNode.create({ userId, name, type: "folder", parentId: null })
   c. If sequence drift error, resets sequence and retries
   d. Returns 201 with created node
6. addItem() receives new node, optimistically inserts it into fileSystem[] in Zustand
7. DashboardPage re-renders, new SlateFolderCard appears
```

**Create a problem file (FolderDetailsPage → paste LeetCode URL → Enter/button)**

```
1. User pastes e.g. "https://leetcode.com/problems/two-sum/"
2. onProblemInputKeyDown (Enter) → handleCreateProblem()
3. extractProblemNameFromLink(link) → parses slug → "Two Sum" (title-cased)
4. addItem(currentFolder.id, "Two Sum", "file", link)
5. POST /api/files with parentId = folder ID
6. Backend fileController:
   a. Creates FileNode (type: "file", parentId: folder, link: url)
   b. Immediately also calls createProblemForFile({ fileId, title, userId })
      → Problem.findOrCreate in problem_details_v2 with defaults
7. Returns new file node
8. Zustand store inserts into correct folder's children array
9. navigate(`/problem/${created.id}`) → opens ProblemEditorPage
```

**Load file system on login**

```
loadFileSystem() deduplicates concurrent calls using a module-level Promise variable:
  if (loadFileSystemPromise) return loadFileSystemPromise;  // deduplicate

Retry logic: FILE_SYSTEM_RETRY_DELAYS_MS = [500, 1200, 2500, 4000, 6000, 8000, 10000]
Retries only on 502 / ERR_NETWORK / ECONNABORTED (cold-start scenarios with Neon serverless)

Backend: GET /api/files → fileController.getFileSystem():
  FileNode.findAll({ where: { userId }, raw: true })
  Then buildTree(null) recursively assembles parent→children structure
  Returns nested JSON array
```

---

### 3.3 Problem Editor Feature

**File: `client/src/pages/problem/ProblemEditorPage.jsx`**

```
On mount (id changes):
  1. setActiveFile(id) in Zustand → triggers getProblem(fileId) fetch → merges into store
  2. Local state isProblemLoading=true

Layout (react-resizable-panels):
  Left panel: ProblemMetadataPanel (description, link, import button, tags)
  Right panel:
    Top: ProblemSolutionTabs (tab selector: Optimal / Brute / Better / custom)
         CodeEditor (Monaco) for active tab
    Bottom bar: ProblemComplexityFields (Time/Space dropdowns + Prev/Next navigation)

If isNotesFile (name ends in .txt):
  Entire right panel is replaced with NotesEditorPanel (contentEditable div, color picker)
```

**Import a LeetCode problem statement**

```
1. User pastes URL in link input, clicks "Import"
2. isImporting=true, fileService.importProblem(url)
3. POST /api/problems/import → importController.importProblem()
4. importProblemFromUrl({ url, userId }):
   a. Detects source: isLeetCodeProblemUrl or isValidGFGProblemUrl
   b. Checks Problem table for cached import (same userId + source + sourceUrl)
   c. If cache hit → returns formatCachedProblem()
   d. If LeetCode: extractLeetCodeSlug → getLeetCodeQuestion(slug) via GraphQL
      → formatLeetCodeImport() → returns {title, difficulty, description (HTML), codeSnippets, tags}
   e. If GFG: fetchGFGProblem(url) → Cheerio scraping with rate limiting
5. Returns problem data to frontend
6. buildImportedProblemState(problemData) → sets local state
7. updateProblem(fileId, { ...importedState }) → persists to DB
8. updateFileLink(fileId, url) → updates FileNode.link
```

**Save solution code (debounced optimistic update)**

```
1. Monaco onChange fires → updateFileContent(fileId, activeTab, newCode)
2. Optimistic update: Zustand immediately updates solutionEntries[activeTab].code
3. API call: PUT /api/problems/:fileId with { solutionEntries }
4. Backend updateProblemByFileId() finds problem, updates solutionEntries JSON column
```

**AI complexity analysis**

```
1. User clicks "Analyze" → fileService.analyzeCode(code, language)
2. POST /api/ai/analyze → aiController.analyzeCode()
3. Creates OpenAI client with baseURL: "https://openrouter.ai/api/v1"
4. Sends prompt requesting JSON { time, space, explanation }
5. Extracts JSON from response with regex /\{[\s\S]*\}/
6. Returns to frontend → updateFileAnalysis(fileId, analysis)
7. Optimistic update in Zustand, persisted via PUT /api/problems/:fileId
```

---

### 3.4 YouTube Playlist Import Feature

**File: `backend/services/youtube-playlist-service/src/controllers/playlistController.js`**

```
POST /api/youtube-playlist/import:

1. Extract userId from x-user-id header
2. Validate playlistUrl
3. fetchPlaylistVideos(playlistUrl):
   - Extract playlist ID from URL query param "list"
   - YouTube Data API v3 /playlistItems with pagination (50 per page)
   - Returns [{ videoTitle, videoUrl }]

4. Create LearningSheet record in DB (userId, name=playlistTitle, playlist_url)

5. For each video, run AI pipeline with mapWithConcurrency(videos, worker, 4):
   a. extractLeetCodeFrontendId(videoTitle) → try "#123" patterns
   b. extractSlugCandidatesFromTitle(videoTitle) → slug candidates from title parts
   c. findProblemCandidatesByTitle(videoTitle) → token matching against LeetCode catalog
   d. identifyLeetCodeProblem(videoTitle, { candidateProblems }) via OpenRouter/DeepSeek:
      - Sends structured prompt with cleaned title + top-8 candidate problems
      - Model returns { title, titleSlug, confidence }
   e. If confidence >= 0.5:
      - fetchProblemBySlug(titleSlug) → LeetCode GraphQL for full details
      - Create SheetProblem record (sheet_id, title, title_slug, difficulty, description, confidence_score, youtube_link)

6. Returns { sheetId, sheetName, totalVideos, savedProblems }
```

**Create folder from sheet**

```
POST /api/youtube-playlist/sheet/:id/create-folder:

1. Fetch sheet + its problems from DB
2. For each problem:
   a. POST /api/files → create file node (name=title, parentId=sheetFolder, link=leetcodeLink)
   b. POST /api/problems → create problem record with description, difficulty, starterCode

This uses requestJsonWithFallback() to try multiple URL candidates
for the file service (handles Docker networking edge cases)
```

---

### 3.5 Revision List (LeetCode List) Import Feature

**File: `backend/services/unified-service/src/revision-list/revisionListParser.js`**

```
POST /api/problems/leetcode-list:

1. parseRevisionListText({ text, platform }):
   - Split text by newlines
   - Filter ignorable lines (headers like "Search questions", empty lines)
   - State machine parsing:
     - isUrlLine → attach to currentProblem.link
     - isAcceptanceLine → skip (e.g., "57.5%")
     - isDifficultyLine → attach to currentProblem.difficulty
     - extractTitleFromLine → handles "142. Title", "• Title", plain "Title"
   - On each new title: push finalizeProblem(currentProblem)
   - finalizeProblem: infer platform from link, build leetcode URL from slug if missing

2. Deduplication: Set keyed by "platform:slug"
3. Returns { count, problems[], stats: {easy, medium, hard, needsLink} }

POST /api/problems/leetcode-list/create-folder:

createRevisionWorkspaceFolder({ userId, folderName, problems }):
  1. Create root folder (folderName)
  2. For each problem, create file node (parentId=root, name=title, link=link)
  3. Returns created file count
```

---

### 3.6 Profile Analysis Feature

**File: `backend/services/profile-analysis-service/src/controllers/profileController.js`**

```
GET /api/profile-analysis/:username:

1. Validate x-user-id header (ownerUserId)
2. fetchLeetCodeProfile(username):
   - POST to LeetCode GraphQL endpoint
   - Query: allQuestionsCount + matchedUser.submitStats
   - Extract: totalSolved, easySolved, mediumSolved, hardSolved
   - Compute acceptanceRate = (totalSolved / totalAvailable) * 100
3. Return profile stats JSON

Frontend ProfileAnalysisPage:
  - Calls buildTopics(easy, medium, hard) → heuristic distribution across 10 DSA topics
  - Calls calculateVerdict() → score = easy*1 + medium*2 + hard*3 (max 1500)
    Score 0-40: Beginner, 40-70: Intermediate, 70+: SDE Interview Ready
  - Separates topics into strongTopics (above average) and weakTopics (below average)
  - Calls getRecommendations({ weakAreas: weakTopicNames })

POST /api/profile-analysis/recommendations:
  - recommendationService.getTopicWiseRecommendations()
  - Maps weak areas to curated DSA topic names via TOPIC_MAP
  - Round-robin picks problems from each topic's shuffled question bank
  - Returns grouped { [topic]: [{ name, difficulty, leetcodeUrl, comment }] }

POST /api/profile-analysis/revision:
  - Revision.findOneAndUpdate with upsert=true
  - Unique index: { ownerUserId, username, problemName }
  - Prevents duplicates across user's revision watchlist

POST /api/profile-analysis/import-weak-areas:
  - Creates "Weak Areas" root folder
  - Groups problems by topic, creates topic subfolder per group
  - Creates one file per problem via file service HTTP calls
```

---

## 4. Line-by-Line Deep Dive: Critical Files

### 4.1 `backend/gateway/server.js` — The API Gateway

```javascript
// Line: app.use(cors())
// Decision: CORS enabled at gateway level. Individual services don't need it
// since they're never called directly from the browser.

// Line: // app.use(express.json()); // Removed to avoid body parsing issues with proxy
// CRITICAL: If the gateway parsed the body, it would consume the stream,
// and http-proxy-middleware couldn't forward the raw body to downstream services.
// Body parsing stays in each microservice.

// Auth branching logic:
if (hasClerkConfig) {
  app.use(clerkMiddleware());         // Attaches Clerk's req.auth context
  app.use("/api", requireAuth(), ...) // Blocks unauthenticated requests
} else if (enableDevAuthFallback) {
  // Dev mode: reads x-user-id from request header or defaults to "local-dev-user"
  // Allows local development without Clerk credentials
}

// createServiceProxy():
// timeout / proxyTimeout both set to 600_000ms (10 minutes)
// Reason: YouTube playlist imports can take 3-5 minutes for large playlists
// proxyReq.setHeader("x-user-id", req.authUserId) → injects auth into downstream

// Route registration — notice target includes the full prefix:
app.use("/api/files", createServiceProxy(`${FILE_SERVICE}/api/files`));
// Express strips "/api/files" from the path before passing to proxy.
// So if the gateway receives "/api/files/123", the proxy sees "/api/files/123"
// relative to the target, producing http://unified-service:5007/api/files/123. Correct!
```

### 4.2 `client/src/store/useFileStore.js` — Zustand Store

```javascript
// Module-level variable — NOT inside the store:
let loadFileSystemPromise = null;
// Purpose: If two components call loadFileSystem() simultaneously on mount,
// only one HTTP request fires. Both await the same promise.

// loadFileSystem() retry logic:
FILE_SYSTEM_RETRY_DELAYS_MS = [500, 1200, 2500, 4000, 6000, 8000, 10000];
// Exponential-ish backoff for 502 / network errors
// Critical for Neon serverless PostgreSQL cold starts

// setActiveFile(fileId):
// Always refetches problem details (getProblem) when navigating to a file.
// Reason: fileSystem tree is a shallow load (no solution code, descriptions).
// The full problem data lives in problem_details_v2, fetched on demand.

// updateFileContent (optimistic updates):
set((state) => ({
  fileSystem: updateTreeNode(state.fileSystem, fileId, (item) => ({
    ...item,
    solutionEntries: normalizeSolutionEntries(item).map((entry) =>
      entry.id === solutionType ? { ...entry, code: newContent } : entry,
    ),
  })),
}));
// UI updates instantly; API call happens after.
// If API fails, the state stays "dirty" — no rollback implemented
// (acceptable: data is saved on next change or reload)

// normalizeSolutionEntries():
// Handles legacy schema migration — old records had brute_solution / better_solution / optimal_solution columns
// New records use solutionEntries: JSON array [{ id, label, code }]
// The normalizer bridges both formats transparently
```

### 4.3 `client/src/utils/fileTree.js` — Recursive Tree Utilities

```javascript
// findTreeNode(nodes, targetId):
// DFS through nested folder/file tree.
// Converts IDs to String for comparison (avoids integer/string mismatch from DB)

// updateTreeNode(nodes, targetId, updater):
// Immutable update — returns a new array with updated node at any depth.
// Used by every Zustand update (solutions, notes, flags, renames)
// Pattern: nodes.map(node => node.id === targetId ? updater(node) : recurse)

// removeTreeNode(nodes, targetId):
// Filters out target, then recursively cleans children
// Used for delete operations

// Why not use a flat Map/object for the store?
// The tree structure maps directly to the UI (sidebar tree items, folder detail table)
// and to the API response format. Converting to/from a flat map adds complexity
// without meaningful performance gain at typical user data scales (< 500 files).
```

### 4.4 `backend/services/unified-service/src/config/database.js` — DNS Workaround

```javascript
// This file patches Node.js's DNS resolution to force IPv4.
// Problem: Neon serverless PostgreSQL sometimes fails with ETIMEDOUT on Docker/AWS EC2
// because Node.js 20's "Happy Eyeballs" algorithm prefers IPv6, and Docker networking
// doesn't handle IPv6 well.

// Patch 1: Custom dns.lookup that always resolves to IPv4:
resolver.resolve4(hostname, (err, addresses) => {
  callback(null, addresses[0], 4);
});

// Patch 2: Override net.Socket.prototype.connect to add family:4:
portOrOpts = Object.assign({}, portOrOpts, { family: 4 });
// Forces all TCP connections to use IPv4

// Also: Dockerfile uses --dns-result-order=ipv4first flag as a belt-and-suspenders fix
```

### 4.5 `backend/services/youtube-playlist-service/src/services/openrouterService.js` — AI Identification

````javascript
// The prompt design is critical:
// 1. Passes BOTH the original video title AND a cleaned version (parentheticals removed)
// 2. Passes up to 8 "candidate problems" pre-identified by local heuristics
//    (slug extraction + token matching against LeetCode catalog)
// 3. Instructs the model to prefer candidates, refuse to hallucinate
// 4. Uses response_format: { type: "json_object" } to force structured output

// parseModelJson handles markdown-wrapped JSON (```json\n{...}\n```)
// Falls back to extracting first { } block if full parse fails

// Why DeepSeek (via OpenRouter) over GPT-3.5?
// - Significantly cheaper per token
// - JSON mode is reliable
// - Performance is adequate for title→slug mapping

// Confidence threshold in playlistController: >= 0.5 to save a problem
// Below threshold → problem is silently skipped (not saved to sheet)
````

### 4.6 `client/src/utils/problemSources.js` — URL Intelligence

```javascript
// detectProblemSource(link):
// Parses URL hostname to detect "leetcode" or "gfg"
// Wrapped in try/catch for malformed URLs
// Returns null for unrecognized domains

// extractProblemNameFromLink(link):
// For LeetCode: regex match /leetcode\.com\/problems\/([^/]+)/
// Then titleCaseFromSlug: "two-sum" → "Two Sum"
// For GFG: finds "problem" or "problems" path segment, takes next segment

// isNotesFileName(name): /\.txt$/i test
// Files ending in .txt render as the full-screen NotesEditorPanel
// instead of the Monaco code editor — separate UX entirely

// getFileVisualType(item):
// Returns "notes" | "leetcode" | "gfg" | "manual"
// Used to choose the correct icon in sidebar tree and folder items table
```

---

## 5. Design Decisions & Why

### 5.1 Why Microservices?

**Decision:** Separate the backend into 4 services (gateway, unified, playlist, profile).

**Reasoning:**

- The YouTube playlist import is a long-running, CPU/IO-bound operation (minutes). Isolating it prevents a blocked event loop from affecting file CRUD operations.
- The profile analysis service uses MongoDB (document store fits unstructured revision notes), while everything else uses PostgreSQL. Different data stores → different services.
- The gateway is a pure routing concern with no business logic, making auth changes non-breaking for downstream services.
- Independent deployment: can update the AI playlist logic without touching the file system service.

**Tradeoff acknowledged:** Network overhead between services (HTTP calls for `importWeakAreas` and `createFolderFromSheet`), complexity in DNS configuration, need for health-check orchestration.

### 5.2 Why `unified-service` Merges File + Problem + AI?

**Decision:** Originally separate file-service, problem-service, AI-service — merged into one.

**Reasoning:** The three share the same PostgreSQL database and are tightly coupled (FileNode FK to Problem). Running them as separate processes required cross-service DB sharing, which negated the isolation benefit. Merging reduced latency (no inter-service HTTP for linked entities), simplified connection pooling (max: 2 connections on Neon free tier), and eliminated deployment complexity.

### 5.3 Why Zustand Over Redux?

**Decision:** Single Zustand store for the file system.

**Reasoning:**

- The file system is the only truly shared global state (sidebar, folder page, editor all read it).
- Zustand's subscribe-based model allows mutation logic to live alongside state (addItem, updateFileContent in the same store).
- No boilerplate: no actions, reducers, selectors — just functions that call `set()`.
- The `loadFileSystemPromise` pattern (deduplication) is trivial in Zustand, would require middleware in Redux.

### 5.4 Why Optimistic Updates?

**Decision:** All write operations update Zustand state before the API call resolves.

**Reasoning:** The UI feels instantaneous. Monaco editor writes (typing code) would be unusable with a ~200ms round-trip delay on every keystroke. For low-risk operations (flag toggles, renames), the chance of failure is near zero. For high-risk ones (create/delete), the API call happens quickly enough that the optimistic state rarely diverges.

**Risk:** No rollback on failure. Acknowledged as acceptable for this use case.

### 5.5 Why `x-user-id` Header Instead of JWT Parsing in Every Service?

**Decision:** Gateway validates JWT with Clerk, extracts userId, forwards as plain `x-user-id` header to downstream services.

**Reasoning:** Downstream services don't need the Clerk SDK. They're internal (not exposed to the internet — `expose` not `ports` in docker-compose). The gateway is the single trust boundary. This reduces bundle size and cold-start time for each service. Security is maintained because only Docker internal networking can reach the downstream ports.

### 5.6 Why Two Different Auth Forms (Custom LoginPage + Clerk SignInPage)?

**Decision:** `LoginPage.jsx` is a fully custom React form using Clerk's JS API directly. `SignInPage.jsx` wraps Clerk's pre-built component.

**Reasoning:** The custom form allows complete CSS control matching the brand aesthetic (`auth-page` CSS with the hero image split layout). The Clerk component (`<SignIn />`) handles edge cases like MFA, password reset flows, and forgotten password — routed to `/sign-in/forgot-password/*` and handled by `SignInPage` (Clerk component). Both ultimately call the same Clerk SDK methods.

### 5.7 Why MongoDB for Revision Tracking?

**Decision:** Profile analysis service uses Mongoose/MongoDB while everything else uses Postgres.

**Reasoning:** Revision entries are user-keyed documents with no relational constraints. MongoDB's flexible schema means adding fields (tags, notes) requires no migration. The `ownerUserId + username + problemName` compound unique index prevents duplicates without schema-level FKs. Query patterns are simple (find all by user, delete by id) — no joins needed.

### 5.8 Why Vite's Code-Splitting (manualChunks)?

**Decision:** Monaco editor, Clerk, Chart.js, framer-motion each get their own chunk.

**Reasoning:** Monaco Editor alone is ~2MB. Without splitting, the entire vendor bundle would be downloaded before the app renders. With splitting, the browser can cache Monaco separately (it rarely changes), and users loading simple pages (dashboard) don't download Monaco at all.

### 5.9 Why Retry Logic With Exponential Backoff?

**Decision:** Both the Axios client and the Zustand `loadFileSystem` implement retry with delays `[500, 1200, 2500, 4000, 6000, 8000]`.

**Reasoning:** Neon serverless PostgreSQL "cold starts" (first connection after idle period) can take 2-4 seconds and returns a 502 or connection refused. Without retries, users would see an error on their first load. The retry window covers the typical cold-start time.

### 5.10 Why `resetFileNodeSequence()` in fileController?

**Decision:** On PostgreSQL sequence drift (autoincrement out of sync), detect and reset the sequence automatically.

**Reasoning:** When data was bulk-migrated from local to Neon using `migrate-db.js`, the sequence wasn't always reset properly. Rather than requiring manual `ALTER SEQUENCE` commands, the controller catches the `id: id must be unique` error, queries `MAX(id)`, resets the sequence, and retries. This is a self-healing mechanism for a known deployment hazard.

---

## 6. Infrastructure & DevOps

### 6.1 Docker Compose Architecture

```yaml
# Start order enforced by depends_on with condition: service_healthy
mongodb → unified-service → (youtube-playlist-service, profile-analysis-service) → gateway → client(nginx)
# Networking: Docker internal DNS
# unified-service:5007, mongodb:27017 — resolvable by service name
# Only gateway exposes port 5001 to host; client exposes port 80

# Health checks:
# unified-service: GET /health → { status: "ok" }
# others: GET / → 200
# gateway: GET / → "AlgoNote AI Gateway Running"

# client: nginx:alpine serves pre-built React dist
# Not built in Docker — built locally first (or via deploy.sh)
```

### 6.2 deploy.sh Flow

```bash
1. Validate DEPLOY_HOST env var
2. (Optional) npm run build in client/ (SKIP_FRONTEND_BUILD=true to skip)
3. SSH mkdir on remote EC2 at DEPLOY_PATH
4. tar -czf excluding node_modules, .git, .env (unless SYNC_ENV=true)
   | ssh | tar -xzf on remote
5. On remote via SSH heredoc:
   a. docker system prune -af (disk cleanup)
   b. Check MIN_FREE_MB (default 1200MB) — fail if insufficient
   c. docker compose down --remove-orphans
   d. docker compose up -d --build --remove-orphans
   e. docker system prune -af (post-build cleanup)
   f. docker compose ps && logs --tail=50
```

### 6.3 Nginx Configuration (Production)

```nginx
# Root: serve React SPA with fallback to index.html (for client-side routing)
location / { try_files $uri /index.html; }

# /api: proxy to gateway container (Docker DNS resolves "gateway")
location /api/ {
    proxy_pass http://gateway:5001;
    proxy_read_timeout 600s;  # handles long playlist imports
}
```

### 6.4 Database Migration Script

`backend/migrate-db.js` — one-time script to copy data from local PostgreSQL to Neon:

1. Connects to both local and remote Sequelize instances
2. `force: true` sync on remote (drops and recreates tables)
3. Bulk copies FileNodes, Problems, Playlists, Sheets, SheetProblems
4. Fixes sequences: `ALTER SEQUENCE "TableName_id_seq" RESTART WITH <max+1>`

---

## 7. 40+ Interview Q&As

### Architecture & System Design

**Q1: Walk me through the end-to-end request flow when a logged-in user opens their dashboard.**

A: The React app (served by Nginx on port 80) loads. `AuthSetup` fires, calling `setAuthTokenGetter(getToken)` and `setAuthUserIdGetter(userId)`. `loadFileSystem()` is called, which makes `GET /api/files` through the Vite proxy (dev) or Nginx proxy (prod) to port 5001 (gateway). The Axios interceptor attaches `Authorization: Bearer <Clerk JWT>` and `x-user-id: <userId>`. The gateway's `clerkMiddleware` validates the JWT, `requireAuth()` checks it, then the proxy forwards to `unified-service:5007/api/files`. The unified service reads `x-user-id`, queries `FileNode.findAll({ where: { userId } })`, builds a nested tree with `buildTree(null)`, and returns it. The gateway proxies the response back. Zustand stores it in `fileSystem`, the dashboard renders `SlateFolderCard` components for each root folder.

---

**Q2: Why did you choose a gateway pattern instead of having the frontend call each service directly?**

A: Several reasons. First, single auth boundary: Clerk JWT validation happens once in the gateway; no other service needs the Clerk SDK. Second, the frontend only needs to know one base URL (`/api`), not four service URLs. Third, the downstream services are on an internal Docker network with no public ports — they're unreachable without going through the gateway. Fourth, cross-cutting concerns like CORS, timeout configuration, and the `x-user-id` injection are handled centrally.

---

**Q3: How does the system handle Neon serverless cold starts?**

A: Three layers. First, the Axios client (`api.js`) retries on 502/network errors with delays `[500, 1200, 2500, 4000, 6000, 8000]ms`. Second, `useFileStore.loadFileSystem()` has its own retry loop with up to 7 attempts and delays up to 10 seconds. Third, each service (`unified-service`, `youtube-playlist-service`) has a `startServer()` function with up to 10 retries and 8-second delays between attempts — the server itself won't start until the database is reachable. This covers the typical 2-4 second Neon cold-start window.

---

**Q4: Describe the concurrent playlist import architecture.**

A: The playlist controller uses a custom `mapWithConcurrency(items, worker, 4)` function — NOT `Promise.all()`. It maintains a queue and a pool of 4 concurrent workers. Each worker pops items from the queue and processes them. This bounds concurrency to 4 simultaneous LeetCode GraphQL requests + 4 OpenRouter AI calls, preventing rate limiting. `Promise.all` would fire all N requests simultaneously (N could be 100+ videos), which would get blocked by rate limits immediately.

---

**Q5: How do you prevent one user from reading another user's data?**

A: The `x-user-id` header is injected by the gateway after Clerk JWT validation — users cannot self-assign a different userId. All database queries include `{ where: { userId } }` — e.g., `FileNode.findAll({ where: { userId } })`, `Problem.findOne({ where: { fileId, userId } })`. For MongoDB revisions: `Revision.find({ ownerUserId, username })`. Even delete operations check userId: `FileNode.destroy({ where: { id, userId } })`. A user can only affect rows they own.

---

**Q6: How does the YouTube service identify LeetCode problems from video titles?**

A: Three-stage pipeline. Stage 1 (local heuristics): Extract problem number from title patterns like "LeetCode #123", "Problem 123", "123." using regex. Extract slug candidates by splitting on `|/:`, stripping noise words. Stage 2 (catalog matching): Load LeetCode's `/api/problems/all/` JSON (cached in memory), tokenize both the video title and all problem titles, compute overlap score. Return top-8 candidates. Stage 3 (AI confirmation): Send cleaned title + candidates to DeepSeek via OpenRouter. Model selects the best match or returns null with confidence 0. Problems with confidence >= 0.5 are saved to the sheet.

---

### Frontend

**Q7: How does Zustand compare to Redux for this use case?**

A: Zustand has zero boilerplate — no actions, reducers, or selectors. State and mutations live in the same `create()` call. The `set()` function handles immutability with a simple merge/replacement. For this app, the file system is the primary global state, and all mutations are co-located in `useFileStore`. Redux would require: action creators, a reducer switch, selector memoization — roughly 5x more code for the same behavior. Zustand's module-level `loadFileSystemPromise` pattern (deduplication across concurrent callers) would need middleware or sagas in Redux.

---

**Q8: Explain the optimistic update pattern and its risks.**

A: When a user edits solution code, `updateFileContent()` immediately calls `set()` to update the Zustand store (UI reflects the change instantly), then fires the API call. If the API succeeds, nothing additional happens — the UI is already correct. If the API fails, the store retains the "dirty" state. The risk is state divergence (UI shows data the server rejected). For this app, this is acceptable because: (a) writes rarely fail in normal operation, (b) the user sees their code, which is correct from their perspective, (c) a page refresh will reload from the server (the next `loadFileSystem` force-load on user switch resets everything). A production system might implement rollback via storing the previous value and calling `set()` with it in the catch block.

---

**Q9: How does the sidebar tree handle multi-level nesting?**

A: `SidebarTreeItem` is recursive — it renders itself for each child when the folder is expanded. The `expandedFolders` array in Zustand tracks which folder IDs are open. `isExpanded = expandedFolders.includes(item.id)`. When a folder is clicked, `toggleFolder(id)` either adds or removes the ID. Children are rendered as `{isExpanded && item.children.map(child => <SidebarTreeItem item={child} depth={depth+1} />)}`. Indentation is `paddingLeft: ${depth * 14 + 14}px`.

---

**Q10: How does the revision list parser handle noisy input?**

A: The parser (`revisionListParser.js`) uses a line-by-line state machine. It classifies each line: `isIgnorableLine` (headers, empty), `isUrlLine` (/^https?:\/\//), `isAcceptanceLine` (/^\d+\.\d+?%$/), `isDifficultyLine` (matches DIFFICULTY_MAP), or a title line. When a title is detected, the current problem is finalized and a new one starts. URLs attach to the most recent problem. Difficulty lines attach if the current problem has no difficulty yet. Title extraction handles numbered formats ("142. Title"), bullet formats ("• Title"), and plain text. This handles copy-pasted content from LeetCode's problem list page without any configuration.

---

**Q11: What is `manualChunks` in Vite and why did you configure it?**

A: `manualChunks` in Vite's Rollup config controls how the bundle is split. Without it, all node_modules land in a single `vendor.js`. Monaco Editor (~2MB), Clerk (~400KB), Chart.js, and Framer Motion are large but rarely change. By assigning them to separate chunks (`vendor-monaco`, `vendor-clerk`, etc.), the browser can cache each independently. When you update your app code, only the app chunk is invalidated — users don't re-download Monaco. The app chunk itself becomes smaller, improving first meaningful paint for pages that don't use Monaco (dashboard, playlist page).

---

**Q12: How does the ProblemEditorPage handle "Notes" files differently from problem files?**

A: `isNotesFileName(activeFile?.name)` checks if the name ends in `.txt`. If true, the entire right panel (Monaco editor + solution tabs + complexity fields) is replaced with `NotesEditorPanel`. The notes editor is a `contentEditable` div (not Monaco) — appropriate for freeform prose with color formatting via `document.execCommand`. It autosaves on every `input` event by calling `updateFileNotes(fileId, content)`. Notes files have no problem metadata, no complexity analysis, no AI button.

---

**Q13: Explain how sequential problem navigation (Prev/Next) is implemented.**

A: In `ProblemEditorPage`, `findParentFolder(fileSystem, id)` walks the tree to find the folder containing the current file. `siblingProblems` is the list of all file-type children of that folder, sorted by ID numerically. `currentProblemIndex` is found with `findIndex`. `nextProblem` and `previousProblem` are at `index+1` and `index-1`. Clicking Prev/Next calls `setActiveFile(adjacentId)` and `navigate(/problem/${adjacentId})`. The bottom bar's `ProblemComplexityFields` receives `hasPrev`, `hasNext` booleans and disables buttons at boundaries.

---

### Backend

**Q14: Why does the gateway NOT parse JSON with `express.json()`?**

A: `http-proxy-middleware` forwards the raw request body stream to the upstream service. If `express.json()` runs first, it reads and parses the request body stream. Streams in Node.js can only be read once — the middleware has already consumed it, so there's nothing left to proxy. The downstream service would receive an empty body. The fix is simple: don't parse the body at the gateway. Each downstream service handles its own `express.json()`.

---

**Q15: How does the GFG scraper work?**

A: `fetchGFGProblem(url)` validates the URL against known GFG hostnames. It applies rate limiting (`GFG_DELAY_MS`, default 2500ms between requests). It fetches the HTML with Axios (with a desktop User-Agent header). Cheerio loads the HTML. `findPrimaryContentRoot($)` tries CSS selectors like `div.problem-statement`, `article`, `main` — picks the first one with >200 chars of text. `extractDifficulty()` looks for elements with class names matching "difficulty", "level", "tag", "badge". `extractExamples()` uses a regex to find "Example N" blocks and parses Input/Output/Explanation from each. `normalizeWhitespace()` handles `\u00a0` (non-breaking space), multiple blank lines, and whitespace normalization.

---

**Q16: How does the LeetCode problem cache work?**

A: The `LeetCodeProblemCache` table stores `titleSlug`, `title`, `difficulty`, `content`, `exampleTestcases` with a unique index on `titleSlug`. In `leetcodeListService.js`, `fetchAndCacheProblem(titleSlug)` first checks the cache: `LeetCodeProblemCache.findOne({ where: { titleSlug } })`. If found and complete (has title + difficulty), it returns the cached data. If not, it calls LeetCode's GraphQL API, saves to cache with `upsert`, and returns the data. This reduces LeetCode API calls when importing lists with repeated problems across different users.

---

**Q17: Explain `findOrCreate` usage and why it's important.**

A: Sequelize's `findOrCreate` atomically checks for an existing record and creates one if absent, returning `[instance, created]`. Used in `createProblemForFile` and `findOrCreateProblem`. Without it, a race condition exists: check → not found → create, but another request could create between the check and create. `findOrCreate` uses a database-level unique constraint + single SQL transaction to prevent duplicates. The Problem table has a unique index on `[userId, fileId]`.

---

**Q18: What is the `revision-list` `createRevisionWorkspaceFolder` function's role?**

A: After parsing a revision list, the user can click "Add to Workspace." This calls `POST /api/problems/leetcode-list/create-folder`. The backend creates a root FileNode folder (`folderName`), then iterates over `problems[]`, creating one FileNode (type: file, link: problem.link) per problem. It returns counts of created files. The frontend then calls `loadFileSystem({ force: true })` to refresh the tree. This is backend-side folder creation to keep the file creation logic server-controlled (auth, sequence handling, problem record creation).

---

**Q19: How does the Revision model prevent duplicate entries?**

A: The Mongoose schema has a compound unique index:

```javascript
RevisionSchema.index(
  { ownerUserId: 1, username: 1, problemName: 1 },
  { unique: true },
);
```

The `addRevision` controller uses `findOneAndUpdate` with `upsert: true` — if the document exists, it updates; if not, it creates. This means calling "Add to Revision" twice for the same problem is idempotent — no error, no duplicate.

---

**Q20: Why does the profile service make HTTP calls to the file service instead of direct DB calls?**

A: The profile service (`importWeakAreas`) needs to create FileNodes and Problem records. Those tables belong to the unified service's PostgreSQL database. Direct DB connection would require sharing credentials and a second connection pool, breaking service isolation. Instead, it makes HTTP POST calls to `/api/files` on the unified service (using the `x-user-id` header for auth). This respects service boundaries and business logic stays in the correct service (e.g., sequence drift recovery in fileController).

---

### Data Models

**Q21: Explain the FileNode and Problem dual-table design.**

A: `FileNode` stores the tree structure: `id, userId, name, type (file|folder), parentId, link, isSolved, isRevised, isImportant`. It self-references for the tree (`hasMany FileNode as children`). `Problem` (in `problem_details_v2`) stores the content: `userId, fileId, notes, solutionEntries (JSON), time_complexity, space_complexity, description, tags, codeSnippets, etc.` They're linked by `fileId`. The separation keeps the tree (frequently queried for sidebar/navigation) lightweight. Full problem content is loaded on demand (`getProblem(fileId)`).

---

**Q22: Why use JSON columns for `solutionEntries`, `tags`, `codeSnippets`, `examples`?**

A: These fields are arrays/objects with no relational query needs. No filtering by individual tag, no joins on solution entries. Storing as JSON avoids normalizing into separate tables (e.g., ProblemTag, ProblemSolution) and the joins that come with them. PostgreSQL's JSON column type supports indexing if needed later. For the current scale (hundreds of problems per user), JSON is simpler and faster than normalized tables.

---

**Q23: Explain the `normalizeLegacySolutions` function and backward compatibility.**

A: Initially, solutions were stored as `brute_solution`, `better_solution`, `optimal_solution` text columns. The UI was refactored to support arbitrary solution tabs (stored as `solutionEntries: [{id, label, code}]`). `normalizeLegacySolutions()` bridges the two: if `solutionEntries` is non-empty, use it directly. Otherwise, synthesize from the legacy columns. This migration is handled transparently at read time — no DB migration script needed. Old records work with the new UI immediately.

---

### Auth & Security

**Q24: How does the dev auth fallback work?**

A: If `NODE_ENV=development` AND `ENABLE_DEV_AUTH_FALLBACK=true` AND no `CLERK_SECRET_KEY` is set, the gateway uses a simple middleware that reads `req.header("x-user-id")` (or defaults to `"local-dev-user"`). This allows running the full stack locally without Clerk credentials. In production, this branch is unreachable — `isProduction` requires `CLERK_SECRET_KEY`, and the startup validation throws if it's missing.

---

**Q25: What would happen if someone sent a fake `x-user-id` header to the gateway?**

A: In production, `clerkMiddleware()` validates the JWT from the `Authorization: Bearer` header. `requireAuth()` rejects requests without a valid JWT. The `x-user-id` is then set by the gateway from the validated Clerk token (`getAuth(req).userId`), not from the incoming request headers. Any client-sent `x-user-id` header is ignored/overwritten. The downstream services trust the header because it originates from the gateway on the internal Docker network, not from external clients.

---

**Q26: How does Google OAuth work in this app?**

A: `LoginPage.jsx` calls `signIn.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl: "/sign-in/sso-callback", actionCompleteRedirectUrl: "/" })`. Clerk handles the OAuth flow, redirecting to Google and back to `/sign-in/sso-callback`. `OAuthCallbackPage` renders `<AuthenticateWithRedirectCallback />` which completes the Clerk session. Then `ClerkLoaded` in `App.jsx` sees `isSignedIn=true`, `ProtectedLayout` renders, `AuthSetup` fires the bootstrap sequence.

---

### Performance & Scalability

**Q27: What bottlenecks exist in the current architecture?**

A: Several. (1) Neon connection pool max=2 per service — limits concurrent DB operations, cold starts add latency. (2) YouTube playlist import is synchronous — the HTTP request stays open for the full duration (potentially 5+ minutes). No job queue or webhook pattern. (3) LeetCode GraphQL calls are serial within the AI pipeline (rate limited). (4) Profile analysis uses heuristic topic distribution (not real topic data from LeetCode) — accuracy is approximate. (5) No server-side caching of file trees (Redis would help at scale).

---

**Q28: How would you add real-time collaboration to this app?**

A: The current architecture is request/response only. For real-time: add WebSockets (Socket.io) to the unified service. When one user updates a problem, emit a `problem:updated` event with the fileId and new data. Other clients subscribed to that fileId update their local Zustand state. Challenges: handling conflicts (two users editing same code block), authentication (verify WebSocket connection identity via Clerk token), and horizontal scaling (need Redis pub/sub to broadcast across multiple service instances).

---

**Q29: The YouTube import can take minutes. How would you improve this with a job queue?**

A: Replace the synchronous import with a job queue (Bull/BullMQ + Redis). POST /import creates a job and returns `{ jobId }` immediately. A worker process picks up the job, runs the full pipeline, updates the DB, and marks the job complete. The frontend polls `GET /import/status/:jobId` or uses SSE/WebSocket for push. Benefits: HTTP request completes in <100ms (no timeout risk), multiple playlists can be imported concurrently, failed jobs can retry automatically, users can close the browser and the import continues.

---

**Q30: How does the app handle concurrent file system updates?**

A: Currently optimistic + last-write-wins. If two browser tabs update the same problem simultaneously, the second PUT wins at the DB level. Zustand state in each tab diverges until a reload. For a DSA study tool with typically one active session, this is acceptable. Production solution: add a `version` field to Problem, include it in updates (`UPDATE WHERE version=X`), reject with 409 Conflict if version mismatch, then re-fetch on conflict.

---

### Testing & Quality

**Q31: What tests would you add first?**

A: Priority order: (1) Unit tests for pure utilities — `revisionListParser.js`, `fileTree.js`, `problemSources.js`. These have no side effects and are critical parsing logic. (2) Integration tests for `fileController.createFileNode` — verify the sequence recovery path. (3) Integration tests for `importProblemFromUrl` — mock LeetCode GraphQL, verify both LeetCode and GFG paths. (4) E2E test for the auth flow — sign in, load dashboard, create folder, navigate to problem. Tools: Jest for unit/integration (already have `"test": "echo Error"` placeholder), Playwright or Cypress for E2E.

---

**Q32: How would you make the LeetCode GraphQL integration testable?**

A: Extract the HTTP call into an injectable dependency. Instead of calling `axios.post(LEETCODE_GRAPHQL_URL)` directly, accept a `fetchFn` parameter (defaulting to the real axios call). In tests, inject a mock `fetchFn` that returns fixture data. This makes the business logic (`formatLeetCodeImport`, `extractLeetCodeSlug`) testable without network calls. Alternatively, use `nock` or `msw` to intercept axios requests at the network layer.

---

### Debugging & Operations

**Q33: If a user reports "my file disappeared," how would you debug?**

A: Check order: (1) `GET /api/files` response — is the file in the tree? If yes, likely a frontend rendering bug (filter logic in `FolderDetailsPage`, sidebar state). (2) If not in API response — query `FileNodes` table directly: `SELECT * FROM "FileNodes" WHERE name = '...' AND "userId" = '...'`. (3) If deleted — check if the delete operation (`DELETE /api/files/:id`) fired accidentally (e.g., a bug in the rename/delete context menu). (4) Check `userId` mismatch — was the file created under a different account? (5) Check the `parentId` — was the parent folder deleted, cascading to children? (Sequelize's `CASCADE` on the self-reference FK).

---

**Q34: How would you monitor the production system?**

A: Add: (1) Structured logging with correlation IDs (e.g., Pino) — log userId, route, duration, status for every request. (2) Health check endpoints (`/health`) already exist — set up uptime monitoring (UptimeRobot, Datadog) to alert on failure. (3) Error tracking (Sentry) — capture unhandled promise rejections, especially in the AI pipeline. (4) Database connection pool monitoring — alert when pool is exhausted (max: 2 on Neon). (5) Docker container metrics (CPU/memory) via `docker stats` or cAdvisor. (6) Log drain from Docker's `json-file` driver (max 10MB × 3 files configured).

---

### Edge Cases

**Q35: What happens if LeetCode blocks the GraphQL request (403)?**

A: The `postLeetCodeGraphQL` function in `leetcodeService.js` catches 403 responses and throws a specific error: "LeetCode blocked the GraphQL request. Add LEETCODE_COOKIE/LEETCODE_CSRFTOKEN in the backend env." The `leetcodeListService` falls back from the API path to HTML scraping (`fetchListViaScraping`), which uses a browser-like User-Agent and Referer header. If scraping also fails with 403, the error message tells the operator to set cookie environment variables — a documented operational procedure.

---

**Q36: What happens when a YouTube video title doesn't match any LeetCode problem?**

A: `identifyLeetCodeProblem` returns `{ confidence: 0, titleSlug: null }`. The playlist controller checks `if (!aiResult || !aiResult.titleSlug || aiResult.confidence < 0.5)` — the video is silently skipped. It does NOT create a SheetProblem record. The final response includes `totalVideos` (all videos) and `savedProblems` (only matched ones) — the difference shows the user how many couldn't be identified. This is surfaced in the success message: "X problems mapped from Y videos."

---

**Q37: What happens if the user pastes a GFG URL into the problem link input?**

A: `detectProblemSource(link)` returns `"gfg"`. `extractProblemNameFromLink` finds the slug after `/problems/` in the GFG path. The file is created with the GFG problem name. The icon in `FolderItemsTable` and `SidebarTreeItem` will show `FilePenLine` with emerald color (GFG styling). When the user clicks "Import" in `ProblemEditorPage`, `importProblemFromUrl` detects GFG, calls `fetchGFGProblem(url)` (the Cheerio scraper), and returns description, examples, and constraints.

---

**Q38: What happens if two users import the same YouTube playlist simultaneously?**

A: Each request creates a new `LearningSheet` record scoped to their `userId`. The AI pipeline runs independently for each user. LeetCode GraphQL calls may hit rate limits faster (8 concurrent from two users), but the `mapWithConcurrency(4)` per-user limit still applies. Each user gets their own `SheetProblem` records with their `userId`. No data sharing — full isolation at the data layer.

---

**Q39: How does the `requestJsonWithFallback` function handle Docker networking edge cases?**

A: `buildServiceUrlCandidates` builds a list of URL candidates for the file service: the explicit env var, `UNIFIED_SERVICE_URL`, `http://127.0.0.1:5007`, `http://localhost:5007`, `http://unified-service:5007`. `requestJsonWithFallback` tries each in order, catching errors and continuing to the next. This handles: (a) running locally without Docker (127.0.0.1 works), (b) running in Docker where the service name resolves via Docker DNS (`unified-service:5007`), (c) misconfigured env vars (falls through to defaults).

---

**Q40: How does the `LoginEvent` table prevent double-counting logins?**

A: `LoginEvent` has a unique constraint on `sessionId`. `statsController.recordLogin` tries `LoginEvent.create({ userId, sessionId })`. If it throws `UniqueConstraintError`, a session was already recorded — it finds the existing record and returns it with `created: false`. The response status is 201 (created) or 200 (already existed). The frontend (`AuthSetup.jsx`) checks `sessionStorage` for `algonote-login-recorded:${sessionId}` before calling the endpoint — preventing duplicate API calls within the same browser tab session. Together: one login event per unique Clerk session.

---

**Q41: Explain the `LOGIN_BASE_COUNT = 10` constant in statsController.**

A: This seeds the login counter with 10 baseline logins — so the dashboard shows "Total logins: 10" even before any users have logged in. It's a minor UX decision to avoid showing "Total logins: 0" which looks abandoned. `totalLogins = LOGIN_BASE_COUNT + (await LoginEvent.count())` — the real count always adds on top. An honest but deliberately non-zero baseline.

---

**Q42: How does the `SlateFolderCard` support three visual themes?**

A: The card uses CSS custom properties (`--sfc-border`, `--sfc-card-bg`, etc.) defined on `.sfc-card`. Three CSS classes (`theme-sky`, `theme-green`, default) each redefine these variables with different color values. The theme class is toggled by the `theme` prop passed from `DashboardPage`, which reads from `localStorage` (persisted per-device). The Tailwind config doesn't know about this — it's pure CSS variable switching for runtime theming without JavaScript-in-CSS approaches.

---

**Q43: Why does the `VerdictSection` use SVG circles instead of a CSS progress ring?**

A: SVG `stroke-dasharray` / `stroke-dashoffset` gives precise control over arc length at any radius. The formula: `circumference = 2π * r`, `strokeDashoffset = circumference - (score/100) * circumference`. The circle is rotated `-90deg` so the arc starts at the top. The color of the stroke changes based on score thresholds (red < 40, amber 40-70, emerald >= 70). CSS-only approaches (`conic-gradient`, `clip-path`) are less cross-browser reliable for circular progress and harder to animate with `transition: strokeDashoffset`.

---

**Q44: What are the three biggest technical risks in this project?**

A: (1) LeetCode API dependency — LeetCode can change their GraphQL schema or start requiring auth for all endpoints. Mitigation: the scraping fallback, problem cache, and ability to manually set `LEETCODE_COOKIE`. (2) OpenRouter/DeepSeek availability — the entire YouTube playlist import feature depends on AI availability and cost. Mitigation: graceful degradation (problems that fail AI identification are skipped, not errored). (3) Neon serverless cold starts — 4-8 second delays on first DB connection can cause user-visible errors. Mitigation: retry logic at multiple layers, but not a complete fix for extreme cases.

---

**Q45: If you had to scale this to 10,000 users, what would you change first?**

A: In priority order: (1) **Connection pooling**: Add PgBouncer between services and Neon — the current max:2 pool would be immediately exhausted. (2) **Async playlist import**: Move to a job queue (Bull + Redis) so imports don't block HTTP workers. (3) **File tree caching**: Cache `GET /api/files` responses in Redis with TTL=60s, invalidated on any write for that userId. (4) **CDN for static assets**: Serve the React build and Monaco Editor chunks from CloudFront to reduce Nginx load. (5) **Read replicas**: Point read-heavy operations (getFileSystem, getProblem) to a Neon read replica. (6) **Horizontal gateway scaling**: Multiple gateway containers behind an ALB, with session stickiness not required (stateless).

---

_End of AlgoNote Interview Preparation Guide_

---

## 8. Extra Practice Questions (Requested)

### 8.1 Left File Tree Panel — Possible Interview Questions (5)

**Q1:** How is the left file tree state managed across the app, and why did you choose that approach?

A: I manage it in a single Zustand store, so sidebar, folder page, and editor all read from one source of truth. I chose this because tree updates like add, rename, delete, and move are easier when state logic is centralized.

**Q2:** How do you handle recursive rendering for nested folders and files in the sidebar without performance issues?

A: I use a recursive sidebar item component and render children only when a folder is expanded. This keeps the DOM smaller and avoids unnecessary rendering for collapsed branches.

**Q3:** What happens in the full request flow when a user creates a new folder or file from the left panel?

A: Frontend calls file API, gateway validates auth, then unified service creates the file node in PostgreSQL. If the node is a problem file, it also initializes linked problem details. After API success, the UI updates the tree immediately.

**Q4:** How do you keep the left panel in sync when a file is renamed, moved, marked solved/revised, or deleted?

A: I do optimistic updates in the store first for instant UI feedback, then persist through API calls. On errors or user switches, I reload the file system from backend to re-sync clean state.

**Q5:** What edge cases did you handle for the file tree (duplicate names, stale data, concurrent requests, sequence issues), and how?

A: I handle stale data with forced reloads and retry logic. I avoid duplicate fetch races with a shared in-flight promise. On backend, I added sequence reset handling for rare ID drift errors after migrations.

### 8.2 Hero Page 5-Card Transition Box — Possible Interview Questions (5)

**Q1:** Why did you design the hero section with a 5-step card transition flow instead of a static block of text?

A: A step flow tells the product story faster: problem, approach, build, value, and outcome. It is easier for users and interviewers to understand compared to one long paragraph.

**Q2:** What are the 5 project steps shown on the hero cards (for example: idea, architecture, build, integrations, deployment), and how do they match the real project journey?

A: The 5 steps are idea and problem, architecture choice, core feature build, external integrations, and deployment and scaling. This matches my actual build order in the project.

**Q3:** How did you implement the card transition behavior (animation timing, trigger, and responsive behavior) so it feels smooth on desktop and mobile?

A: I used timed transitions with motion utilities and kept durations short so the flow feels responsive. On mobile, spacing and typography are simplified and cards stack cleanly to keep the experience readable.

**Q4:** How do you ensure the hero card transitions are accessible (keyboard usage, reduced motion support, readable contrast, semantic structure)?

A: I keep semantic heading structure, strong color contrast, and focus-friendly navigation. For motion-sensitive users, reduced-motion settings should disable heavy transitions and keep content fully readable.

**Q5:** If you had to improve this hero transition section further, what would you change to increase clarity, engagement, and conversion to sign-in?

A: I would add clearer step labels, tighter copy, and one strong CTA per card. I would also A/B test transition speed and CTA placement to improve sign-in conversion.
