# Student Productivity Dashboard

A clean, mobile-first dashboard for students to manage tasks, daily planner blocks, and quick notes. Built with Next.js 14 (App Router), Tailwind, and Supabase.

## Features
- To-do list with priorities, status, and due dates
- Daily planner (time-blocking)
- Quick notes with pin/unpin
- Dark-mode friendly UI
- Supabase persistence with RLS per user

## Getting started
1. Duplicate env template:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

2. Apply database schema in Supabase SQL editor:
   - Open `supabase-schema.sql` and run it.

3. Install deps and run dev server (from this folder):
   ```bash
   npm install
   npm run dev
   ```

## Structure
- `app/page.tsx` — server component, fetches user data and renders dashboard
- `app/client.tsx` — client-side interactivity and optimistic updates
- `app/actions.ts` — server actions for CRUD
- `lib/supabase/` — typed Supabase clients and DB types
- `supabase-schema.sql` — tables + RLS

## Notes
- Authentication: relies on Supabase Auth; redirects to `/auth/login` if not signed in. Adjust route or embed your auth UI as needed.
- Styling: Tailwind-powered with a minimal dark palette. Tweak `app/globals.css` and `tailwind.config.ts`.
- Portfolio-ready: add a small landing page or screenshots if you want a public-facing showcase.
