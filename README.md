# Team Task Manager (Full-Stack)

Minimal full-stack app for project + team + task management with role-based access (Admin/Member).

## Tech

- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express + TypeScript
- DB: PostgreSQL via Prisma ORM
- Auth: JWT (Bearer token)

## Local setup

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `apps/api/.env` (copy from `apps/api/.env.example`) and set:

- `DATABASE_URL`
- `JWT_SECRET`

### 3) Migrate DB

Start a local Postgres using Docker (recommended):

```bash
npm run db:up
```

If you don't have Docker, you can also use a hosted Postgres (e.g., Railway Postgres):
- Create a Railway Postgres database
- Copy its connection string into `apps/api/.env` as `DATABASE_URL`

Then run the migration:

```bash
npm run prisma:migrate:dev -w api
```

### 4) Run dev servers

Run both with one command:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to the backend.

## API overview

Base path: `/api`

- `POST /auth/signup` { name, email, password }
- `POST /auth/login` { email, password }
- `GET /auth/me`

- `GET /projects`
- `POST /projects` { name }
- `GET /projects/:projectId`
- `PATCH /projects/:projectId` { name } (Admin)
- `DELETE /projects/:projectId` (Admin)

- `GET /projects/:projectId/members`
- `POST /projects/:projectId/members` { email, role? } (Admin)
- `PATCH /projects/:projectId/members/:memberId` { role } (Admin)
- `DELETE /projects/:projectId/members/:memberId` (Admin)

- `GET /projects/:projectId/tasks`
- `POST /projects/:projectId/tasks` { title, description?, status?, dueDate?, assignedToId? }
- `PATCH /projects/:projectId/tasks/:taskId` (role-checked)
- `DELETE /projects/:projectId/tasks/:taskId` (Admin or creator)

- `GET /dashboard`

## Railway deployment (mandatory)

This repo is Railway-friendly as a single service:

- `npm run build` builds the web app and the API
- `npm start` runs `prisma migrate deploy` and starts the API
- The API serves the built frontend from `apps/web/dist` when present

### Steps

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Add a PostgreSQL database (Railway plugin) and copy its connection string.
4. In the Railway service → Variables, set:
   - `DATABASE_URL` (from the Railway Postgres plugin)
   - `JWT_SECRET` (your own secret)
5. Deploy. Railway will run `npm install`, `npm run build`, then `npm start`.

Open the deployed URL and you should see the UI.

## Roles

- When you create a project, you become `ADMIN`.
- Only `ADMIN` can add members or change roles.
- Members can create tasks and (by default) assign tasks only to themselves.
