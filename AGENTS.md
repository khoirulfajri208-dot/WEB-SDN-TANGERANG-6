# Base44 Dev Environment

## Stack
Vite + React 19 + Express (single-process) TypeScript app. The Express server
(`server.ts`) hosts the API endpoints AND serves Vite in middleware mode, all on
port 3000. Dev command: `tsx server.ts` (run via `bun run dev`).

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Uses `node:22-slim`; installs `bun` globally, `bun install` for deps, then `bun run dev`.
- Source is bind-mounted at `/app`; `node_modules` lives in a named volume.
- `DISABLE_HMR=true` is set (file watching off) to match the original AI Studio setup.
  Edits that change config/startup need a container `restart` to take effect; React
  source edits likewise won't hot-reload — call `reload_preview` after changes.

## Health
`GET /api/health` returns `{ status: "ok", aiEnabled: <bool> }`.

## External host access
`vite.config.ts` sets `server.host: true` and `server.allowedHosts: true` so the
preview's external hostname is accepted. Without `allowedHosts: true` Vite returns
403 "Blocked request" for the preview origin even in middleware mode.

## Secrets
- `GEMINI_API_KEY` (optional): Google Gemini key. The app boots WITHOUT it and falls
  back to local heuristic responses for all `/api/ai/*` endpoints. Provide it for real
  AI results. Delivered via `/run/base44/app.env`; placeholders in `.env.base44-defaults`.
- `APP_URL` (optional): public app URL; defaults to `http://localhost:3000`.

## Notes
- `package.json` lists `vite` in both `dependencies` and `devDependencies` (harmless bun warning).
- API endpoints: `/api/ai/scan-receipt`, `/api/ai/predict-procurement`,
  `/api/ai/assistant`, `/api/ai/draft-berita-acara`.
