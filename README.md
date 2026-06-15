# عقارات جرمانا — 3qarat Jaramana

Professional real estate platform for the Syrian/Damascus market. Fully bilingual (Arabic/English, RTL/LTR), with a public-facing website, admin dashboard, and cross-platform mobile app — all backed by a single Supabase instance.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Apps & Features](#apps--features)
  - [Web App](#web-app-appsweb)
  - [Admin Dashboard](#admin-dashboard-appsadmin)
  - [Mobile App](#mobile-app-appsmobile)
- [Shared Package](#shared-package-packagesshared)
- [Database](#database)
- [Edge Functions](#edge-functions)
- [CI/CD & Deployment](#cicd--deployment)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Dev Commands](#dev-commands)

---

## Overview

| | |
|---|---|
| **Framework (Web/Admin)** | React 18 + Vite + TailwindCSS |
| **Framework (Mobile)** | React Native + Expo 56 + Expo Router v4 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **State Management** | Zustand |
| **Data Fetching** | TanStack React Query v5 |
| **i18n** | i18next — Arabic (RTL) + English (LTR) |
| **Deployment** | Vercel (web + admin) + EAS Build (mobile) |
| **Languages** | Arabic, English |
| **User Roles** | `user` · `agent` · `admin` |

---

## Project Structure

```
3qaratJaramana/
├── apps/
│   ├── web/              React + Vite — public website (localhost:5173)
│   ├── admin/            React + Vite — admin dashboard (localhost:5174)
│   └── mobile/           React Native + Expo — iOS & Android app
├── packages/
│   └── shared/           Shared types, Supabase client, queries, i18n, utils
├── supabase/
│   ├── migrations/       4 SQL migration files
│   ├── functions/        3 Supabase Edge Functions (Deno)
│   ├── seed.sql          Seed data (categories, locations, sample properties)
│   └── config.toml
├── api/
│   └── sitemap.ts        Vercel Edge Function — /sitemap.xml wrapper
├── .github/workflows/    CI (typecheck + build) + Vercel deploy
├── vercel.json           Vercel config for web app
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Apps & Features

### Web App (`apps/web`)

Public-facing website with 8 pages and 28+ components.

**Pages:**

| Route | Page | Description |
|---|---|---|
| `/` | HomePage | Hero section, featured properties, latest listings, popular locations |
| `/properties` | PropertiesPage | Full property listing with URL-synced filters + pagination |
| `/property/:slug` | PropertyDetailPage | Images, video, details, nearby properties, booking form |
| `/compare` | ComparisonPage | Side-by-side comparison (localStorage + shareable URL params) |
| `/auth` | AuthPage | Login / Register via Supabase Auth |
| `/profile` | ProfilePage | Favorites, appointments, saved searches |
| `*` | NotFoundPage | 404 |

**Key Components:**

- `PropertyCard` — listing card with image, price badge, stats
- `PropertyFilters` — filter panel (type, category, location, price range, bedrooms) — state synced to URL
- `PropertyImageSlider` — full-screen image carousel (Swiper)
- `PropertyVideoPlayer` — YouTube / Cloudflare Stream embed
- `AppointmentBooking` — book a viewing with date/time picker
- `NearbyProperties` — Haversine-based nearby listings
- `PropertyQR` — QR code generated client-side via `qrcode.react`
- `PropertyShare` — native share + WhatsApp deep link
- `PropertyMap` — Google Maps marker for the property location
- `FavoriteButton` — optimistic toggle with TanStack Query mutation

**Zustand Stores:**

| Store | State |
|---|---|
| `authStore` | Supabase session, user profile, role |
| `uiStore` | Language (`ar`/`en`), dark mode — persisted to `localStorage` |
| `comparisonStore` | Compared property slugs — synced to `localStorage` + URL |

**Tech highlights:**
- `react-helmet-async` for per-page SEO meta tags
- `framer-motion` for page transitions and component animations
- All Tailwind classes use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) for RTL support
- `document.documentElement.dir` toggled on language change

---

### Admin Dashboard (`apps/admin`)

Protected admin panel with 10 pages, accessible only to users with `admin` role.

**Pages:**

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Admin-only authentication |
| `/` | DashboardPage | Stats overview with Recharts charts |
| `/properties` | PropertiesManagementPage | Table with search, sort, featured toggle, status dropdown |
| `/properties/new` | PropertyFormPage | Create property — bilingual fields, image dropzone, video URLs |
| `/properties/:id/edit` | PropertyFormPage | Edit existing property |
| `/properties/:id/analytics` | PropertyAnalyticsPage | Views, favorites, appointments, WhatsApp clicks, shares + charts |
| `/users` | UsersPage | User list with role management |
| `/appointments` | AppointmentsPage | All appointments + CSV export |
| `/categories` | CategoriesPage | CRUD for property categories |
| `/locations` | LocationsPage | CRUD for locations (country → city → district) |
| `/notifications` | NotificationsPage | Send broadcast or targeted push notifications |

**Analytics available per property:**
- Total views / daily views chart (last 30 days)
- Favorites count
- Appointments count
- WhatsApp click count
- Share count
- Most-viewed properties table
- Most-requested areas bar chart

---

### Mobile App (`apps/mobile`)

React Native app with Expo Router v4 file-based navigation.

**Tab Screens:**

| Tab | Screen | Description |
|---|---|---|
| Home | `(tabs)/index.tsx` | Featured + latest properties, search shortcut |
| Search | `(tabs)/search.tsx` | Full-text search + sale/rent filter |
| Favorites | `(tabs)/favorites.tsx` | Saved properties (requires login) |
| Profile | `(tabs)/profile.tsx` | User info, language/theme toggle, logout |

**Other Screens:**

| Route | Screen | Description |
|---|---|---|
| `/property/[id]` | PropertyDetail | Image carousel, stats, CTAs (Call, WhatsApp, Share), favorite toggle |
| `/auth/login` | Login | Email + password login |
| `/auth/register` | Register | Full name + email + password registration |
| `/appointments` | Appointments | User's booked viewings |
| `/notifications` | Notifications | In-app notifications with read/unread state |

**Mobile-specific features:**
- Expo Push Notifications (`expo-notifications`)
- Supabase Realtime for live notification delivery
- RTL via `I18nManager.forceRTL` (Arabic)
- `AsyncStorage` for language + auth persistence
- `expo-font` with Cairo (AR) and Inter (EN) fonts

---

## Shared Package (`packages/shared`)

All apps import from `@3qarat/shared`.

```
packages/shared/src/
├── types/
│   ├── database.types.ts     Auto-generated Supabase types
│   ├── app.types.ts          Domain types (PropertyWithRelations, User, Appointment, …)
│   └── api.types.ts          API response/request types
├── supabase/
│   ├── client.ts             Supabase client factory
│   └── queries/
│       ├── properties.ts     Property queries + filters builder
│       ├── users.ts          User profile queries
│       └── admin.ts          Admin-only queries
├── i18n/
│   ├── config.ts             i18next setup
│   ├── ar.json               Arabic translations
│   └── en.json               English translations
└── utils/
    ├── format.ts             formatPrice, formatArea, formatDate, getLocalizedText, getYouTubeEmbedUrl
    ├── whatsapp.ts           buildWhatsAppContactLink
    └── validation.ts         Zod schemas
```

---

## Database

### Tables

| Table | Description |
|---|---|
| `users` | User profiles linked to `auth.users` — role, language preference, Expo push token |
| `locations` | Hierarchical locations (country → city → district) with slug, lat/lng |
| `categories` | Property categories (شقق، فلل، أراضي، …) with slug and icon |
| `properties` | Main listings — bilingual fields, slug, price, area, bedrooms/bathrooms, amenities (JSONB) |
| `property_images` | Images stored in Supabase Storage (`property-images` bucket) |
| `property_videos` | YouTube Unlisted / Cloudflare Stream URLs only — no file uploads |
| `favorites` | User ↔ property many-to-many |
| `appointments` | Viewing bookings — status: `pending` / `confirmed` / `cancelled` / `completed` |
| `property_views` | View tracking — `session_id` + `device_hash` only, no IP address |
| `property_analytics` | WhatsApp clicks + share counts per property |
| `notifications` | In-app + push notifications — bilingual title/body |
| `saved_searches` | User's saved filter sets (JSONB) |

### Storage Buckets

| Bucket | Access | Max Size | Allowed Types |
|---|---|---|---|
| `property-images` | Public | 10 MB | jpeg, png, webp, gif |
| `avatars` | Public | 5 MB | jpeg, png, webp |

### Key Database Functions

| Function | Purpose |
|---|---|
| `public.user_role()` | Returns current user's role for use in RLS policies |
| `public.handle_new_user()` | Auto-creates `users` row on `auth.users` insert |
| `public.generate_property_slug()` | Generates `apartment-for-sale-jaramana-125` style slugs |
| `public.increment_view_count(property_id)` | Atomic view counter increment |
| `public.increment_analytics(property_id, event_type)` | WhatsApp click / share counter |
| `public.get_nearby_properties(lat, lng, radius_km, limit, exclude_id)` | Haversine distance query (no PostGIS) |
| `public.get_property_analytics(property_id)` | Returns views, favorites, appointments, clicks, shares |
| `public.get_dashboard_stats()` | Admin dashboard summary stats |
| `public.get_property_views_per_day(property_id, days)` | Daily view chart data |
| `public.get_most_viewed_properties(limit)` | Top viewed properties |

### Row-Level Security

RLS is enabled on all 12 tables. Key rules:

- **Public** can read active locations, categories, and non-draft properties
- **Users** can manage their own favorites, appointments, saved searches, and notifications
- **Agents** can create/edit their own properties and view appointments for their listings
- **Admins** have full read/write access to all tables

---

## Edge Functions

All functions live in `supabase/functions/` and run on Deno.

### `generate-sitemap`
Generates a dynamic XML sitemap with all published property slugs, locations, and categories. Includes `hreflang` links for Arabic and English. Cached for 1 hour (stale-while-revalidate: 24 hours). Exposed via Vercel Edge Function at `/sitemap.xml`.

### `process-image`
Retrieves the public URL of an uploaded image from the `property-images` bucket. Designed as a hook point for CDN integration (Cloudflare Images, Imgix) for resize/WebP conversion.

### `send-notification`
Sends in-app and push notifications. Accepts a `user_ids` array or a `broadcast: true` flag. Inserts rows into the `notifications` table and calls the Expo Push API for users with a registered `expo_push_token`.

---

## CI/CD & Deployment

### GitHub Actions

**`ci.yml`** — runs on every push and PR to `main`:
1. TypeScript typecheck across `@3qarat/web`, `@3qarat/admin`, `@3qarat/shared`
2. Production build for web + admin (on `main` pushes only)

**`deploy-web.yml`** — runs on push to `main`:
- Deploys `apps/web` to Vercel via `amondnet/vercel-action`

### Vercel

| App | Build Command | Output |
|---|---|---|
| Web | `pnpm --filter @3qarat/web build` | `apps/web/dist` |
| Admin | `pnpm --filter @3qarat/admin build` | `apps/admin/dist` |

`vercel.json` rewrites:
- `/sitemap.xml` → `/api/sitemap` (Edge Function)
- All other routes → `/index.html` (SPA fallback)

Security headers applied to all routes: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`.

### Mobile

Built with **EAS Build** (Expo Application Services) for iOS and Android distribution.

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9.15
- Docker (for local Supabase)
- Expo Go app (for mobile development)

### 1. Clone & install

```bash
git clone https://github.com/KinanKassab/3qaratJaramana.git
cd 3qaratJaramana
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all values — see Environment Variables section below
```

### 3. Start local Supabase

```bash
supabase start
supabase db reset   # applies all 4 migrations + seed data
```

### 4. Generate TypeScript types

```bash
pnpm types:gen
```

### 5. Start development servers

```bash
pnpm dev:web     # http://localhost:5173
pnpm dev:admin   # http://localhost:5174
pnpm dev:mobile  # Expo — scan QR with Expo Go
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Supabase (server-side / Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=

# Web App (apps/web) — VITE_ prefix required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_APP_URL=https://3qaratjaramana.com

# Mobile App (apps/mobile) — EXPO_PUBLIC_ prefix required
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_APP_URL=https://3qaratjaramana.com
```

> **Note:** Google Maps API Key is optional for development — Map-related features will be disabled without it. All other features work without it.

---

## Dev Commands

```bash
# Development
pnpm dev:web          # Start web app (localhost:5173)
pnpm dev:admin        # Start admin dashboard (localhost:5174)
pnpm dev:mobile       # Start Expo dev server

# Production builds
pnpm build:web        # Build web for production
pnpm build:admin      # Build admin for production
pnpm preview:web      # Preview production web build locally

# Code quality
pnpm typecheck        # TypeScript check — all packages
pnpm lint             # ESLint — all packages
pnpm format           # Prettier — all packages

# Supabase
supabase start                    # Start local Supabase (Docker)
supabase db push                  # Apply pending migrations
supabase db reset                 # Reset DB + re-apply all migrations + seed
pnpm types:gen                    # Regenerate database.types.ts from local Supabase
```

---

## Seed Data

The `supabase/seed.sql` file loads:

- **6 categories:** Apartments · Villas · Houses · Land · Commercial · Offices
- **12+ locations:** Syria → Damascus + Rif Dimashq → Jaramana, Mazzeh, Kafr Sousa, Douma, Harasta, and more
- **20 sample properties** across all categories and locations
- **3 sample agent users**

---

## Design Decisions

| Decision | Rationale |
|---|---|
| SEO slugs (not UUIDs) | Human-readable URLs improve SEO and sharing |
| Videos as URLs only | No video storage costs; YouTube Unlisted / Cloudflare Stream handles hosting |
| Comparison client-side | No DB table needed; localStorage + URL params cover all use cases |
| QR codes client-side | `qrcode.react` generates instantly; zero storage cost |
| No IP address in `property_views` | Privacy compliance; `session_id` + `device_hash` is sufficient for deduplication |
| Haversine over PostGIS | Simpler setup; accurate enough for city-scale distance queries |
| `public.user_role()` function | Keeps RLS policies readable and avoids repeating auth lookups |
