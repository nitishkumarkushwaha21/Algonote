# Deployment Guide (Fresh Docker Setup)

This deployment matches the current architecture:

- `unified-service`
- `youtube-playlist-service`
- `profile-analysis-service`
- `gateway`
- `client`
- `mongodb`

## 1) Prerequisites

- Docker Engine + Compose plugin installed
- Root `.env` file present (copy from `.env.example`)

## 2) Required Environment Variables

Set these values in root `.env`:

- `DATABASE_URL`
- `MONGO_URI` (used outside compose; compose overrides to internal mongo)
- `YOUTUBE_API_KEY`
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

## 3) Build and Start

From repository root:

```bash
docker compose up -d --build
```

## 4) Check Health

```bash
docker compose ps
docker compose logs -f gateway
```

Expected external endpoints:

- Frontend: `http://localhost`
- Gateway API: `http://localhost:5001`

## 5) Update Deployment

```bash
docker compose pull
docker compose up -d --build --remove-orphans
```

## 6) Stop

```bash
docker compose down
```

## 7) Full Reset (including Mongo data)

```bash
docker compose down -v
```

## Notes

- Services use healthchecks and start only when dependencies are healthy.
- Backend internal service discovery uses Docker service names.
- No legacy split services (`file-service`, `problem-service`, `ai-service`) are used in this deployment.
