# BioHack — replit.md

## Overview

BioHack is a biohacking habit-tracker mobile app built with **Expo / React Native** and **Expo Router**. Users can create and manage daily habits across six categories (Training, Recovery, Nutrition, Mental, Personal, Work), track streaks, view a calendar heatmap, browse performance recipes, and receive smart nudge notifications. The app ships with a lightweight **Express** backend. All habit data lives on-device in **AsyncStorage**.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK ~54, React Native 0.81, React 19
- **Navigation**: Expo Router (file-based routing). The entry point is `expo-router/entry`. The main tab layout lives under `app/(tabs)/` with four screens: `index` (Today), `calendar`, `recipes`, `profile`.
- **State management**:
  - **HabitsContext** (`context/HabitsContext.tsx`) — stores all habit data in-memory + persists to `AsyncStorage` under the key `@biohack_habits`. Provides helpers: `toggleHabit`, `addHabit`, `editHabit`, `removeHabit`, `getStreak`, `isCompletedToday`, `getTodayProgress`, `getCompletedDays`.
  - **ThemeContext** (`context/ThemeContext.tsx`) — manages dark/light colour scheme, persisted to `AsyncStorage` under `@biohack_theme`. Defaults to dark mode.
  - **TanStack Query** (`@tanstack/react-query` v5) — wired up via `QueryClientProvider` in the root layout for future API data fetching. Currently unused for habits.
- **Styling**: All styling uses React Native `StyleSheet`. Colour tokens are centralised in `constants/colors.ts` (dark + light palettes). The Outfit font family (Google Fonts) is loaded at startup via `@expo-google-fonts/outfit`.
- **Tab bar**: Adapts at runtime — uses `expo-router/unstable-native-tabs` with SF Symbols on iOS when Liquid Glass is available; falls back to a custom `BlurView`-backed cross-platform tab bar otherwise.
- **Animations / gestures**: `react-native-reanimated`, `react-native-gesture-handler` (swipe-to-delete on habit rows), `expo-haptics` for tactile feedback.

### Backend (Express)

- **Runtime**: Node.js with TypeScript (`tsx` for dev, `esbuild` for prod).
- **Entry point**: `server/index.ts` → registers CORS middleware, mounts routes from `server/routes.ts`, serves a static landing page HTML for browser visits.
- **Routes**: `server/routes.ts` is currently a scaffold (`/api` prefix convention). No real API endpoints are implemented yet.
- **Storage layer**: `server/storage.ts` exports a `MemStorage` class (in-memory `Map`) implementing `IStorage` (getUser / getUserByUsername / createUser). This is a placeholder — real persistence should swap in a Drizzle + Postgres implementation.
- **CORS**: Dynamic allow-list built from `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` env vars, plus any `localhost` origin.

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle-kit` for migrations).
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` from the environment. Schema lives in `shared/schema.ts`.
- **Current schema**: A single `users` table (`id` UUID PK, `username` unique text, `password` text). Habit data is not yet in the database — it lives in AsyncStorage on the client.
- **Migrations output**: `./migrations/` directory (managed by `drizzle-kit push` / `db:push` script).
- **Validation**: `drizzle-zod` generates Zod schemas from Drizzle table definitions.

### Shared Code

- `shared/schema.ts` — database table definitions and Zod insert schemas shared between server and (potentially) client. Imported via the `@shared/*` TypeScript path alias.

### API Client

- `lib/query-client.ts` — configures the TanStack Query client and provides `apiRequest()` (wraps Expo's `fetch`) and `getApiUrl()` (reads `EXPO_PUBLIC_DOMAIN` env var to determine the backend URL).

### Build & Deployment

- **Dev**: `npm run expo:dev` starts Expo with Metro proxied through the Replit dev domain. `npm run server:dev` starts the Express server with `tsx`.
- **Prod**: `npm run expo:static:build` (via `scripts/build.js`) bundles the Expo app as a static web bundle and serves it from Express. `npm run server:build` compiles the server with `esbuild` to `server_dist/`.
- **Environment variables required**: `DATABASE_URL`, `EXPO_PUBLIC_DOMAIN`, `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS`.

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| **PostgreSQL** (via `pg` + Drizzle ORM) | Relational database; currently only a `users` table is defined. Provisioned via `DATABASE_URL`. |
| **AsyncStorage** (`@react-native-async-storage/async-storage`) | Client-side persistence for habits and theme preference. |
| **TanStack Query v5** | Server-state caching layer for future API calls. |
| **Expo SDK ~54** | Mobile runtime, device APIs (haptics, image picker, location, clipboard, sharing, linear gradient, blur, splash screen). |
| **Expo Router ~6** | File-based navigation for React Native. |
| **Expo Google Fonts / Outfit** | Custom typeface loaded at app startup. |
| **react-native-reanimated ~4** | Declarative animations. |
| **react-native-gesture-handler ~2.28** | Swipe gesture support (habit rows). |
| **react-native-keyboard-controller** | Keyboard-aware scroll view. |
| **expo-glass-effect / expo-blur** | Visual effects for tab bar on iOS. |
| **Express v5** | Lightweight HTTP server for API + static asset serving. |
| **esbuild** | Server-side TypeScript bundler for production. |
| **drizzle-zod + zod** | Runtime validation schemas generated from Drizzle table definitions. |
| **patch-package** | Applied via `postinstall` to patch any npm packages as needed. |