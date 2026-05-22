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

For local development, use PostgreSQL via Docker or a hosted PostgreSQL database.

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/team_task_manager?schema=public"
JWT_SECRET="your-secret"
```

### 3) Migrate DB

If using Postgres, start a local Postgres using Docker (recommended):

```bash
npm run db:up
```

If you don't have Docker, you can also use a hosted PostgreSQL database:
- Create a hosted Postgres database
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

## Deployment

This repo is ready for deployment on Railway or any Node host that supports `npm install` and `npm start`.

### Railway deployment

1. Push this repo to your Git provider.
2. In Railway, create a new project and connect the repository.
3. Set these environment variables in Railway:
   - `DATABASE_URL` = your Postgres connection string
   - `JWT_SECRET` = a long random secret
   - `CORS_ORIGIN` = optional, the frontend origin if using CORS
   - `PORT` = optional (defaults to `3000`)
4. Set the build command to:

```bash
npm run build
```

5. Set the start command to:

```bash
npm start
```

### Production notes

- The frontend is built from `apps/web`.
- The backend runs from `apps/api` and serves the frontend from `web/dist` when built.
- Railway will host the Node server and connect it to your PostgreSQL database.

> Note: Prisma migrations must be deployed before the app is used in production:
>
> ```bash
> npm run prisma:migrate:deploy -w apps/api
> ```

## Roles

- When you create a project, you become `ADMIN`.
- Only `ADMIN` can add members or change roles.
- Members can create tasks and (by default) assign tasks only to themselves.
