# 5-Minute Video Script - AlgoNote AI

## 0:00 - 0:30 | Intro + Open Project
Hi, I am Nitish, and this is AlgoNote AI, a full-stack interview prep platform I built.

The goal of this project is to reduce context switching during DSA preparation by combining problem solving, notes, revision tracking, and recommendation workflows in one place.

In this short walkthrough, I will cover:
1. Project overview and code structure
2. High-level design and trade-offs
3. How I used AI during development
4. A quick demo

---

## 0:30 - 1:20 | Open Project and Walk Through Code
Here is the repository structure.

At the top level, I have:
- `client/` for the React frontend
- `backend/` for gateway and microservices
- `docker-compose.yml` for local and deployment orchestration

In `client/`, major areas are:
- pages for dashboard, folders, problem editor, playlist sheets, leetcode-list, and profile analysis
- components for reusable UI blocks
- services for API calls
- store for global state management with Zustand

In `backend/`, I split responsibilities into focused services:
- `gateway` for auth and routing
- `unified-service` for files, problems, and AI analyze routes
- `youtube-playlist-service` for playlist import and sheet generation
- `profile-analysis-service` for LeetCode profile stats, recommendations, and revisions

---

## 1:20 - 2:20 | High-Level Design and Trade-offs
The architecture is gateway plus microservices.

Design intent:
1. Keep domains separated by responsibility
2. Make scaling easier for heavier flows like playlist processing
3. Keep service APIs focused and easier to maintain

Trade-offs:
1. Compared to a monolith, this adds operational complexity because there are multiple services, ports, and service-to-service calls.
2. In return, it improves modularity and allows independent evolution of features.
3. I use PostgreSQL for structured core entities and MongoDB for revision tracking where flexibility is helpful.

For auth, Clerk protects user flows, and the gateway forwards user context to downstream services for user-scoped operations.

---

## 2:20 - 3:10 | How I Used AI While Building
I used AI in two ways: product features and developer acceleration.

Product features:
1. Playlist service uses OpenRouter to map YouTube video titles to likely LeetCode problems.
2. Unified service exposes an AI analyze endpoint for complexity hints.

Developer acceleration:
1. AI helped speed up repetitive scaffolding, documentation drafting, and route wiring.
2. I still validated architecture, endpoint behavior, and integration logic manually.
3. So AI improved speed, but final engineering decisions and verification were done by me.

---

## 3:10 - 4:40 | Quick Demo
Now a quick product demo.

Step 1: Dashboard and Explorer
I open the dashboard and navigate the workspace-style folder/file tree.

Step 2: Problem Workspace
I open a problem and show brute, better, and optimal solution sections, along with notes and complexity fields.

Step 3: LeetCode Import
I paste a LeetCode URL and import metadata and problem details into the editor.

Step 4: Playlist Flow
I submit a YouTube playlist URL, let the system generate a sheet, then add that sheet to the explorer in one click.

Step 5: Profile Analysis
I enter a LeetCode username, fetch profile stats, generate recommendations by weak areas, and import them into the workspace.

This creates a complete loop: discover, organize, solve, revise.

---

## 4:40 - 5:00 | Closing
To summarize, AlgoNote AI is built as a production-oriented interview prep product, not just a notes app.

It combines structured practice workflows, intelligent imports, and recommendation-driven revision with a scalable architecture.

Thank you for watching.

---

## Optional Loom Recording Tips
- Keep the repo open in VS Code and one browser tab for the running app.
- Zoom editor font slightly for readability.
- Follow the timestamps loosely and stay natural.
- If a flow is slow, mention "this runs async in background" and jump to prepared data.
