# Student Productivity Dashboard

A clean, mobile-first dashboard for students to manage tasks, daily planner blocks, and quick notes. Built with Next.js 14 (App Router), Tailwind, NextAuth, and Drizzle ORM on Aiven PostgreSQL.

## Features
- To-do list with priorities, status, and due dates
- Daily planner (time-blocking)
- Quick notes with pin/unpin
- Dark-mode friendly UI
- GitHub OAuth + NextAuth sessions persisted in Postgres

## Getting started
1. Duplicate env template:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill `DATABASE_URL` (Aiven connection string), `AUTH_SECRET` (generate via `openssl rand -base64 32`), `GITHUB_ID`, `GITHUB_SECRET`.

2. Install deps and apply schema to Aiven:
   ```bash
   npm install
   npm run db:push
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

## Structure
- app/page.tsx - server component, fetches user data and renders dashboard
- app/client.tsx - client-side interactivity and optimistic updates
- app/actions.ts - server actions for CRUD with Drizzle
- auth.ts - NextAuth config with Drizzle adapter
- lib/db/ - Drizzle client and schema
- drizzle.config.ts - Drizzle Kit config

## Notes
- Unauthenticated users are redirected to `/api/auth/signin` (NextAuth default page).
- Aiven typically requires TLS; `lib/db/index.ts` enables SSL by default.
- Use `npm run db:generate` if you want migration SQL snapshots in `./drizzle`.
