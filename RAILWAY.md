# Railway Deployment Runbook

This project deploys as **one Railway service** (API + built frontend).

## What Railway runs

- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`

These are pinned in `nixpacks.toml`.

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

### 2) Create a Railway project

- Railway → **New Project** → **Deploy from GitHub repo**
- Select your repository

### 3) Add a PostgreSQL database

- In the Railway project: **New** → **Database** → **PostgreSQL**

### 4) Set required environment variables

In your **service** (the Node app) → **Variables**, set:

- `DATABASE_URL` = the Postgres connection string from the Railway Postgres database
- `JWT_SECRET` = a long random string

Optional:
- `NODE_ENV=production`

### 5) Deploy

- Trigger a deploy (Railway will do this automatically on push)
- Watch logs for:
  - `prisma migrate deploy` success
  - `API listening on port ...`

### 6) Open the live app

- Go to the service → **Domains** → open the provided URL
- Signup → create a project → add members → create/assign tasks

## Troubleshooting

### Prisma can’t connect / migrations fail

- Confirm `DATABASE_URL` is set on the **service** (not only on the database plugin)
- `DATABASE_URL` must start with `postgresql://`

### App starts but UI doesn’t load

- Confirm the build step ran successfully (`npm run build`)
- This app serves the built frontend from `apps/web/dist` at runtime

### JWT errors

- Ensure `JWT_SECRET` is set; otherwise tokens will be invalid across redeploys
