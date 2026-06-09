# ExpenseWise

ExpenseWise is a personal expense tracking web app built with TanStack Start, React, and Supabase. It helps users record expenses, organize categories, and visualize spending trends.

## Features

- Email/password and Google sign-in
- Personal dashboard with summary cards and charts
- Expense CRUD with search, filters, date range, and sorting
- Category management with default and custom categories
- Supabase-backed authentication, data storage, and RLS policies

## Tech Stack

- TanStack Start + TanStack Router
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- TanStack Query
- Supabase

## Getting Started

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure environment variables

Create a `.env` file in the repository root with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Run the app

```bash
npm run dev
```

The app starts with Vite's development server.

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — create production client/server bundles
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run format` — format files with Prettier

## Database

Supabase migrations are located in `supabase/migrations`.

They create `profiles`, `categories`, and `expenses` tables, configure row-level security, and seed default categories for new users.
