# AlgoNote — Interview Revision Document

> A full-stack LeetCode revision manager with a microservices backend, Docker-based deployment, and a modern React frontend.

---

## 1. What Is This Project?

**AlgoNote** is a personal LeetCode revision tool that lets you:
- Organize DSA problems in a custom file-explorer (like VS Code's sidebar)
- Import problems directly from LeetCode via their public API
- Write and save brute / better / optimal solutions and personal notes
- Convert a YouTube DSA playlist into a structured study sheet (using AI under the hood)
- Track your LeetCode profile stats (Easy / Medium / Hard solved), get topic-wise recommendations, and maintain a revision list

---

## 2. Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React (Vite)** | SPA framework |
| **React Router v6** | Client-side routing |
| **Zustand** | Global state management |
| **Axios** | HTTP client |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **TailwindCSS** | Utility-first styling |
| **Nginx** | Serves the built frontend inside Docker |

### Backend
| Technology | Role |
|---|---|
| **Node.js + Express** | REST API for every service |
| **http-proxy-middleware** | API Gateway for routing |
| **Sequelize (ORM)** | PostgreSQL ORM for structured data |
| **Neon PostgreSQL** | Cloud PostgreSQL (file tree + problems) |
| **Mongoose** | MongoDB ODM for revision storage |
| **MongoDB** | Stores revision list (NoSQL) |
| **Axios** | Inter-service HTTP calls |
| **html-to-text** | Converts LeetCode HTML descriptions to plain text |

### Infrastructure / DevOps
| Technology | Role |
|---|---|
| **Docker** | Containerization of every service |
| **Docker Compose** | Multi-container orchestration |
| **Docker Hub** | Image registry (`nikuku/algonote-*`) |

### External APIs
| API | Used For |
|---|---|
| **LeetCode GraphQL API** | Fetch problem metadata (title, description, tags, code snippets) |
| **YouTube Data API** | Fetch all video titles and URLs from a playlist |
| **OpenRouter (DeepSeek AI)** | Identify which LeetCode problem a YouTube video title refers to |

---

## 3. Architecture Overview

```
Browser (React SPA — port 80)
        │
        ▼
  [API Gateway — port 5001]
  (http-proxy-middleware)
        │
   ┌────┼────────────────────────────────┐
   │    │                                │
   ▼    ▼               ▼               ▼               ▼
[File  [Problem     [YouTube-       [Profile        [AI
Svc    Svc          Playlist Svc    Analysis Svc    Svc]
5002]  5003]        5005]           5006]           5004]
  │       │              │               │
  │(calls)│              │(calls)        │(calls)
  └───────┘         ┌────┴────┐    ┌────┴────┐
              [LeetCode   [YouTube   [LeetCode
              GraphQL]    API]       GraphQL]
                           │
                     [OpenRouter AI]

Databases:
  Neon PostgreSQL  ← File-service + Problem-service + YouTube-playlist-service
  MongoDB          ← Profile-analysis-service (revisions)
```

---

## 4. Service-by-Service Breakdown

---

### 4.1 API Gateway (Port 5001)
**File:** `backend/gateway/server.js`

The single entry point for all frontend requests. It uses `http-proxy-middleware` to forward requests to the correct downstream service.

| Route Prefix | Forwarded To |
|---|---|
| `/api/files` | file-service:5002 |
| `/api/problems` | problem-service:5003 |
| `/api/youtube-playlist` | youtube-playlist-service:5005 |
| `/api/profile-analysis` | profile-analysis-service:5006 |
| `/api/ai` | ai-service:5004 |

**Key design decision:** The gateway does NOT parse the request body (`express.json()` is commented out) because adding a body parser here would consume the stream before the proxy could forward it.

---

### 4.2 File Service (Port 5002)
**DB:** Neon PostgreSQL via Sequelize  
**Model:** `FileNode` (table: `FileNodes`)

Manages the **file-explorer tree** — a self-referencing structure of folders and files.

#### FileNode Model Fields
```
id          — Auto-increment primary key
name        — Problem/folder name
type        — ENUM('file', 'folder')
parentId    — Self-referencing FK (null = root)
link        — LeetCode URL (optional)
isSolved    — Boolean
isRevised   — Boolean
```

#### API Routes
| Method | Route | What It Does |
|---|---|---|
| `GET` | `/api/files` | Returns the entire tree recursively built from flat DB rows |
| `POST` | `/api/files` | Creates a file or folder. If `type='file'`, also calls problem-service to create an empty problem entry |
| `PUT` | `/api/files/:id` | Update name/link/isSolved/isRevised. If renaming a file, propagates the new name to problem-service |
| `DELETE` | `/api/files/:id` | Deletes the node. Also calls problem-service to delete the linked problem data |

#### Key Logic — Tree Building
```javascript
const buildTree = (parentId) => {
  return nodes
    .filter(node => node.parentId === parentId)
    .map(node => ({
      ...node,
      children: node.type === 'folder' ? buildTree(node.id) : undefined,
    }));
};
const tree = buildTree(null); // root nodes have parentId = null
```

The flat list from PostgreSQL is recursively assembled into a nested JSON tree in memory on every GET call.

---

### 4.3 Problem Service (Port 5003)
**DB:** Neon PostgreSQL via Sequelize  
**Model:** `Problem` (table: `problem_details_v2`)

Stores all the **rich content** for each problem — solutions, notes, and LeetCode metadata.

#### Problem Model Key Fields
```
fileId           — FK to FileNode.id (the link between services)
title, slug, difficulty
description      — Full HTML content from LeetCode
exampleTestcases
codeSnippets     — JSON array of { lang, code }
tags             — JSON array of topic tags
notes            — Personal notes (TEXT)
brute_solution, better_solution, optimal_solution  — Code (TEXT)
time_complexity, space_complexity
```

#### API Routes
| Method | Route | What It Does |
|---|---|---|
| `GET` | `/api/problems/:fileId` | Finds or creates a problem entry, returns nested JSON (`solutions: { brute, better, optimal }`) |
| `POST` | `/api/problems` | Creates an empty problem entry for a new file |
| `PUT` | `/api/problems/:fileId` | Partial update — only updates fields that are provided |
| `DELETE` | `/api/problems/:fileId` | Deletes the problem entry |
| `POST` | `/api/problems/import` | Accepts a LeetCode URL, extracts the slug, calls LeetCode GraphQL, returns problem data |

#### LeetCode Import Flow
```
User pastes LeetCode URL
       ↓
Extract slug from URL (e.g., "two-sum")
       ↓
POST to LeetCode GraphQL API:
  query { question(titleSlug: "two-sum") {
    title, content, difficulty, exampleTestcases,
    codeSnippets { lang, code }, topicTags { name }
  }}
       ↓
Convert HTML description → clean text (html-to-text)
       ↓
Return { title, slug, difficulty, description (HTML),
         descriptionText (clean), codeSnippets, tags }
       ↓
Frontend calls PUT /api/problems/:fileId to save the data
```

**Connection resilience:** On startup, the service retries PostgreSQL connection up to 10 times with 8-second delays (handles Neon cold-start latency).

---

### 4.4 YouTube Playlist Service (Port 5005)
**DB:** Neon PostgreSQL via Sequelize  
**Models:** `LearningSheet`, `SheetProblem`

The most complex service — converts a YouTube DSA playlist into a structured study sheet.

#### The Full 4-Step Import Pipeline

```
Step 1: YouTube API
  POST /api/youtube-playlist/import { playlistUrl }
     ↓ fetchPlaylistVideos(url)
  YouTube Data API → list of { videoTitle, videoUrl }
  
Step 2: Create LearningSheet record in DB
  sheet = { name: "DSA Sheet — Mar 9, 2026", playlist_url }
  
Step 3: For each video (sequential loop)
  3a. identifyLeetCodeProblem(videoTitle) via OpenRouter (DeepSeek AI)
      → Returns { titleSlug, title, difficulty, confidence: 0–1 }
      → Skip if confidence < 0.5
      
  3b. fetchProblemBySlug(titleSlug) via LeetCode GraphQL
      → Returns { title, description, difficulty, starterCode, ... }
      
  3c. SheetProblem.create({
        sheet_id, title, title_slug, leetcode_link,
        youtube_link, difficulty, description,
        starter_code, confidence_score
      })

Step 4: Return { sheetId, sheetName, totalVideos, savedProblems }
```

#### API Routes
| Method | Route | What It Does |
|---|---|---|
| `POST` | `/api/youtube-playlist/import` | Full 4-step pipeline above |
| `GET` | `/api/youtube-playlist/sheets` | Lists all generated sheets |
| `GET` | `/api/youtube-playlist/sheet/:id` | Get one sheet with all problems |
| `DELETE` | `/api/youtube-playlist/sheet/:id` | Delete sheet + all its problems |
| `POST` | `/api/youtube-playlist/sheet/:id/create-folder` | Creates a folder in file-service for the sheet, and a file for each problem (pre-populated with LeetCode data) |

#### Create-Folder-From-Sheet Flow
```
Fetch sheet + problems from DB
       ↓
POST /api/files → Create folder (named after sheet)
       ↓
For each problem:
  POST /api/files → Create file (name = problem title, link = leetcode_link)
  (file-service auto-calls problem-service to create empty Problem record)
       ↓
  PUT /api/problems/:fileId → Populate with stored data
  (title, slug, difficulty, description, codeSnippets)
       ↓
Navigate user to Dashboard — new folder appears in file explorer
```

---

### 4.5 Profile Analysis Service (Port 5006)
**DB (mixed):** MongoDB via Mongoose (revisions), LeetCode GraphQL (live stats)

Handles LeetCode profile stats, a personal revision list, and topic-based recommendations.

#### API Routes
| Method | Route | What It Does |
|---|---|---|
| `GET` | `/api/profile-analysis/:username` | Calls LeetCode GraphQL to get solved counts, ranking, acceptance rate |
| `POST` | `/api/profile-analysis/revision` | Upserts a revision entry (problem + username + difficulty) in MongoDB |
| `GET` | `/api/profile-analysis/revision/:username` | Gets all revisions for a username, sorted by newest first |
| `DELETE` | `/api/profile-analysis/revision/:id` | Removes a revision entry |
| `POST` | `/api/profile-analysis/recommendations` | Returns topic-wise problem recommendations based on weak areas |
| `POST` | `/api/profile-analysis/import-weak-areas` | Creates a `Weak Areas` folder in the file explorer, with topic subfolders and problem files |

#### Profile Stats GraphQL Query
```graphql
query getUserProfile($username: String!) {
  allQuestionsCount { difficulty, count }
  matchedUser(username: $username) {
    username
    profile { ranking, reputation }
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty, count }
    }
  }
}
```
Returns: `{ totalSolved, easySolved, mediumSolved, hardSolved, acceptanceRate, ranking }`

#### Recommendation Logic (Pure Algorithm)
1. Accepts `weakAreas` array (e.g., `["graph", "dynamic programming"]`)
2. Maps them to curated topics using `TOPIC_MAP` (e.g., `"graph"` → `["Graphs", "BFS", "DFS"]`)
3. Looks up problems from a static `QUESTION_BANK` (dataset bundled in the service)
4. Round-robin picks from all matching topics to hit the `limit` (default: 20)
5. Returns `{ [topic]: [{ name, difficulty, leetcodeUrl }] }`

#### Import Weak Areas → File Explorer
```
POST /api/profile-analysis/import-weak-areas
  { problems: [{ topic, problemName, difficulty, leetcodeUrl }] }
       ↓
Create root "Weak Areas" folder in file-service
       ↓
For each UNIQUE topic:
  Create topic subfolder (e.g., "Dynamic Programming")
       ↓
For each problem:
  Create problem file under its topic folder
  (file-service auto-creates the problem entry too)
       ↓
Return { weakAreasFolderId, topicsCreated, filesCreated }
```

---

## 5. Frontend Architecture

### Routing (React Router v6)
```
/                     → Dashboard.jsx
/folder/:id           → FolderView.jsx
/problem/:id          → ProblemWorkspace (component)
/playlist             → PlaylistFeaturePage.jsx
/profile-analysis     → ProfileAnalysisPage.jsx
```

All routes are nested under a shared `Layout` component (sidebar + main area).

### State Management — Zustand (`useFileStore`)

The entire file system is loaded once on app start and kept in Zustand store memory. All mutations do **optimistic updates** (update UI first, API call second).

| Store Action | What It Does |
|---|---|
| `loadFileSystem()` | GET /api/files → loads full tree |
| `setActiveFile(id)` | Sets active file AND fetches fresh problem details |
| `addItem(parentId, name, type)` | POST /api/files, adds to tree |
| `deleteItem(id)` | DELETE /api/files/:id, removes from tree |
| `updateFileContent(id, type, code)` | Optimistic update → PUT /api/problems/:id |
| `updateFileNotes(id, notes)` | Optimistic update → PUT /api/problems/:id |
| `updateFileAnalysis(id, analysis)` | Optimistic update → PUT /api/problems/:id |
| `toggleFileRevision(id)` | Toggle `isRevised` → PUT /api/files/:id |
| `renameItem(id, name)` | Optimistic rename → PUT /api/files/:id |

### Key Pages Explained

#### Dashboard (/)
- Shows all root-level folders as cards in a grid
- "New Folder" button → animated modal → calls `addItem(null, name, 'folder')`

#### FolderView (/folder/:id)
- Uses recursive `findNode()` to locate the current folder in the Zustand tree
- Shows children in a table with: Name, Status (Revised/Pending), Last Revised, Actions
- **Inline rename** on Enter key
- **Toggle Revision** button per file item
- **Reset All Revisions** button
- **Search** to filter children by name

#### ProblemWorkspace (/problem/:id)
- The main editor — shows problem description, code snippets, solution editor
- Users can write Brute / Better / Optimal solutions in separate tabs
- Notes editor for freeform text
- Import from LeetCode button (triggers the `/api/problems/import` flow)

#### PlaylistFeaturePage (/playlist)
- URL input form → calls `playlistApi.importPlaylist(url)` → waits (can take minutes)
- Lists all previously generated sheets with expand/collapse
- Each sheet card shows Easy/Medium/Hard counts
- **"Add to Explorer"** button calls `createFolderFromSheet` which chains: DB fetch → file-service → problem-service calls
- Delete sheet button

#### ProfileAnalysisPage (/profile-analysis)
- Username input → fetches LeetCode stats via `/api/profile-analysis/:username`
- Displays solved counts + ranking
- Revision list: add/remove problems to track
- Recommendations section: selects weak areas → POST `/api/profile-analysis/recommendations`
- **"Import to Explorer"** button → POST `/api/profile-analysis/import-weak-areas` → creates folder structure

---

## 6. How Docker Connects Everything

```yaml
# docker-compose.yml (simplified)
services:
  mongodb:          port 27017
  client:           port 80   (Nginx serving built React app)
  gateway:          port 5001  (env: FILE_SERVICE_URL=http://file-service:5002, ...)
  file-service:     port 5002  (env_file: .env for DB creds)
  problem-service:  port 5003  (sleeps 25s then starts, waits for Neon DB)
  ai-service:       port 5004
  youtube-playlist-service: port 5005  (sleeps 50s — extra time for Neon)
  profile-analysis-service: port 5006  (MONGO_URI=mongodb://mongodb:27017/algonote)

networks:
  algonote-net: bridge  ← all containers share this network
```

- Services communicate by **container name** (e.g., `http://file-service:5002`) instead of localhost
- The `sleep` commands let the database connections stabilize before services start
- `dns: [8.8.8.8, 8.8.4.4]` on DB-connected services ensures Neon's hostname resolves properly inside Docker

---

## 7. Data Flow Diagrams

### Flow 1: Opening a Problem
```
User clicks file in sidebar
       ↓
FolderView → navigate('/problem/:id')
       ↓
ProblemWorkspace mounts
       ↓
useFileStore.setActiveFile(id)
       ↓
GET /api/problems/:fileId (via gateway → problem-service)
       ↓
Sequelize: Problem.findOrCreate({ where: { fileId } })
       ↓
Returns { title, description, solutions, notes, codeSnippets, tags }
       ↓
Merged into Zustand store → UI renders editor + content
```

### Flow 2: Saving a Solution
```
User types in solution editor (onSave / debounce)
       ↓
updateFileContent(fileId, 'brute', code)
       ↓
Optimistic: Update Zustand state immediately (no loading spinner)
       ↓
PUT /api/problems/:fileId { solutions: { brute: code } }
  via gateway → problem-service
       ↓
problem.update({ brute_solution: code })
       ↓
Returns updated row → confirms save
```

### Flow 3: YouTube Playlist Import
```
User pastes playlist URL → clicks "Generate Sheet"
       ↓
POST /api/youtube-playlist/import { playlistUrl }
       ↓
fetchPlaylistVideos(url) → YouTube Data API
  → [{ videoTitle: "Two Sum - LeetCode", videoUrl }, ...]
       ↓
LearningSheet.create({ name, playlist_url })
       ↓
For each video (sequential):
  identifyLeetCodeProblem(videoTitle) → OpenRouter (DeepSeek AI)
    → { titleSlug: "two-sum", confidence: 0.95 }
  if confidence >= 0.5:
    fetchProblemBySlug("two-sum") → LeetCode GraphQL
    SheetProblem.create({ title, difficulty, description, ... })
       ↓
Response: { sheetId, savedProblems: 42, totalVideos: 50 }
       ↓
User clicks "Add to Explorer" on the sheet card
       ↓
POST /api/youtube-playlist/sheet/:id/create-folder
  → axios.post(file-service, { name: sheetName, type: 'folder' })
  → for each problem:
      axios.post(file-service, { name: title, type: 'file', link: leetcodeLink })
      axios.put(problem-service, { title, slug, difficulty, description, ... })
       ↓
navigate('/') → user sees new folder in dashboard
```

### Flow 4: Profile Analysis + Recommendations
```
User enters LeetCode username
       ↓
GET /api/profile-analysis/:username
       ↓
POST to LeetCode GraphQL (getUserProfile query)
       ↓
Returns { totalSolved, easySolved, mediumSolved, hardSolved, ranking, acceptanceRate }
       ↓
Frontend displays stats
       ↓
User selects weak areas (e.g., "Graphs", "DP")
       ↓
POST /api/profile-analysis/recommendations { weakAreas: ["graph", "dynamic programming"] }
       ↓
Server maps to TOPIC_MAP → selects from QUESTION_BANK (static JSON)
Round-robin across topics, shuffled, up to limit=20
       ↓
Returns { Graphs: [...], "Dynamic Programming": [...] }
       ↓
User clicks "Import to Explorer"
       ↓
POST /api/profile-analysis/import-weak-areas { problems: [...] }
       ↓
Creates: "Weak Areas" (root) → "Graphs" (subfolder) → "Two Sum" (file)
```

---

## 8. Key Design Decisions (To Explain in Interview)

| Decision | Why |
|---|---|
| **Microservices** | Each concern is independently deployable and scalable. file-service and problem-service can be updated separately |
| **Two databases (PostgreSQL + MongoDB)** | PostgreSQL for structured/relational data (file tree + problems with schema). MongoDB for flexible, schema-less revision tracking |
| **Neon PostgreSQL** | Serverless PostgreSQL — scales to zero when idle. The `sleep` hack on startup accounts for Neon's cold-start delay |
| **Zustand over Redux** | Simpler API, no boilerplate, works well for this scale. Optimistic updates make the UI feel instant |
| **Optimistic updates** | Update UI state immediately before the API call completes → no loading spinners for common operations |
| **Gateway doesn't parse body** | `express.json()` consumes the Node.js request stream, making proxy forwarding impossible. Body parsing is done inside each downstream service |
| **Self-referencing FileNode** | Allows infinite nesting depth with a single table and a simple `parentId` column |
| **`findOrCreate` pattern** | Creates a problem entry automatically if it doesn't exist, preventing 404s when navigating to a file that hasn't been opened before |
| **Confidence filtering in playlist import** | Skips AI matches with < 50% confidence to avoid polluting sheets with unrelated videos |

---

## 9. Improvement Suggestions

### Existing Features — Can Be Made Better

1. **Debounced Auto-Save in ProblemWorkspace**
   - Currently saves on every keystroke or explicit save. Add a 1-2 second debounce to reduce API calls significantly.

2. **Revision Toggle Animation**
   - The `isRevised` toggle works but `toggleFileRevision` body is currently empty in the store — verify this is connected. Add a visual checkmark animation on toggle.

3. **Tree Rebuild on Every GET**
   - `buildTree()` runs in memory on every GET /api/files call. For large trees, this can be slow. Consider caching the tree or returning a flat list and letting the frontend build it.

4. **Playlist Import Progress**
   - The import can take several minutes for long playlists. Add Server-Sent Events (SSE) or WebSocket to stream progress updates (e.g., "Processing video 12/50...") instead of a static spinner.

5. **Error Recovery on Folder Creation from Sheet**
   - If one file fails to create during `createFolderFromSheet`, the error is swallowed and the rest continue. Add a summary of failed files in the response so the user can retry.

---

### New Features That Would Improve the Project

1. **Daily Revision Reminders (Spaced Repetition)**
   - Track when a problem was last revised (`isRevised` timestamp). Surface problems due for re-revision using SM-2 or Leitner spaced repetition algorithm. Could add a "Due Today" section on the dashboard.

2. **Problem Statistics Dashboard**
   - Show a breakdown per folder: X solved, Y revised, Z total. Add an overall progress ring on the Dashboard. Difficulty breakdown (Easy/Medium/Hard) per topic folder.

3. **Multi-Language Code Editor (Monaco)**
   - Replace the simple textarea with Monaco Editor (VS Code's engine). Provides syntax highlighting, autocomplete, and language support.

4. **Tags & Search Across All Problems**
   - Global search across all problem titles + tags. Filter by difficulty, solved status, or topic tags. Currently there's only per-folder search.

5. **Collaborative / Shareable Sheets**
   - Generate a share link for a playlist-generated sheet so others can import the same problem set.

6. **Offline Mode (PWA)**
   - Cache the file tree and problem data in IndexedDB. Let users write solutions offline and sync when back online.

7. **Time-Spent Tracking per Problem**
   - Track how long a user spends on each problem. This surfaces which problems are genuinely hard for them (vs just skipped).

---

## 10. Quick-Reference: Port Map

| Service | Port | DB |
|---|---|---|
| React Frontend (Nginx) | 80 | — |
| API Gateway | 5001 | — |
| File Service | 5002 | Neon PostgreSQL |
| Problem Service | 5003 | Neon PostgreSQL |
| AI Service | 5004 | — |
| YouTube Playlist Service | 5005 | Neon PostgreSQL |
| Profile Analysis Service | 5006 | MongoDB |
| MongoDB | 27017 | (self) |
