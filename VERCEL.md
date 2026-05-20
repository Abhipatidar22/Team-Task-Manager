# Vercel Deployment Runbook

This project is now configured for Vercel deployment.

## What Vercel builds

- Frontend: `apps/web` via `@vercel/static-build`
- API: `api/index.ts` via `@vercel/node`

The app still requires an external PostgreSQL database.

## Node version

This repo includes [.nvmrc](.nvmrc) and the root [package.json](package.json) `engines.node` to keep Vercel on a Node version compatible with Vite.

## Step-by-step

### 1) Push the code to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new GitHub repo and push:

```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

### 2) Create a Vercel project

- Vercel → **New Project** → **Import Git Repository**
- Select your repository

### 3) Set environment variables

In the Vercel dashboard, go to your project settings and add:

- `DATABASE_URL` = your Postgres connection string
- `JWT_SECRET` = a long random string
- `NODE_ENV=production` (optional)

### 5) Deploy

- Trigger a deploy from Vercel
- Watch logs for:
  - static build success for `apps/web`
  - Node function deployment success for `/api`

### 6) Run database migrations

Vercel does not run Prisma migrations automatically. From your local machine or CI, run:

```bash
npx prisma migrate deploy -w apps/api
```

### 7) Open the live app

- Go to the Vercel project URL
- Signup → create a project → add members → create/assign tasks

## Troubleshooting

### Prisma can’t connect / migrations fail

- Confirm `DATABASE_URL` is set in Vercel environment variables
- `DATABASE_URL` must start with `postgresql://`

### UI loads but API fails

- Confirm `/api` is routed to `api/index.ts`
- Confirm `JWT_SECRET` is set

### DB access

- Vercel does not host Postgres. Use an external database provider such as Supabase, Neon, or any PostgreSQL host.
