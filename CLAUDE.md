# عقارات جرمانا — 3qarat Jaramana

Professional real estate platform for the Arabic market (Syria/Damascus area). Arabic-first with full English support and RTL/LTR switching.

## Project Structure

```
apps/web/        — React + Vite public-facing website (localhost:5173)
apps/admin/      — React + Vite admin dashboard (localhost:5174)
apps/mobile/     — React Native + Expo mobile app
packages/shared/ — Shared types, Supabase client, utilities, i18n
supabase/        — DB migrations, Edge Functions, seed data
api/             — Vercel Edge Functions (sitemap proxy)
```

**Monorepo**: pnpm workspaces. Node ≥20, pnpm ≥9.15.0.

## Dev Commands

```bash
pnpm dev:web          # Start website dev server (localhost:5173)
pnpm dev:admin        # Start admin dev server (localhost:5174)
pnpm dev:mobile       # Start Expo dev server
pnpm build:web        # Build website for production
pnpm build:admin      # Build admin for production
pnpm typecheck        # Run TypeScript checks across all packages
pnpm lint             # ESLint across all packages
pnpm format           # Prettier formatting
pnpm types:gen        # Regenerate database.types.ts from local Supabase
```

## Supabase Local Dev

```bash
supabase start         # Start local Supabase (Docker required)
supabase db push       # Apply migrations to local DB
supabase db reset      # Reset DB + re-apply migrations + seed
supabase gen types typescript --local > packages/shared/src/types/database.types.ts
```

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

```bash
# Supabase service role (server-side / Edge Functions only)
SUPABASE_SERVICE_ROLE_KEY=

# Web/Admin (Vite prefix)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_APP_URL=https://3qaratjaramana.com

# Mobile (Expo prefix)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_APP_URL=
```

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18, Tailwind CSS, Framer Motion, Lucide React |
| Routing | React Router v6 (web/admin), Expo Router v4 (mobile) |
| Server state | TanStack React Query v5 |
| Client state | Zustand v4 (with persist middleware) |
| Forms | React Hook Form + Zod |
| Database | Supabase JS v2 (direct client, no REST layer) |
| i18n | i18next + react-i18next |
| Maps | @react-google-maps/api (web), react-native-maps (mobile) |
| Admin extras | @tanstack/react-table, recharts, react-dropzone |
| Mobile extras | @gorhom/bottom-sheet, expo-notifications, expo-location |
| SEO | react-helmet-async, qrcode.react |
| Utilities | date-fns, clsx, tailwind-merge |

## packages/shared — What Lives Here

Do not duplicate this logic in apps. Import via `@shared/*` path alias.

```
packages/shared/src/
├── types/
│   ├── app.types.ts        # Domain types: User, Property, Appointment, etc.
│   ├── api.types.ts        # API response types, filters, pagination
│   └── database.types.ts   # Auto-generated — NEVER edit manually
├── supabase/
│   ├── client.ts           # createSupabaseClient, createSupabaseAdminClient
│   └── queries/
│       ├── properties.ts   # buildPropertiesQuery, buildPropertyBySlugQuery, etc.
│       ├── users.ts
│       └── admin.ts
├── utils/
│   ├── format.ts           # formatPrice, getLocalizedText, etc.
│   ├── validation.ts       # Zod schemas (reused by web, admin, mobile)
│   └── whatsapp.ts         # WhatsApp integration helpers
└── i18n/
    ├── config.ts           # i18next init
    ├── ar.json             # Arabic translations
    └── en.json             # English translations
```

Package exports: `.` | `./types` | `./supabase` | `./utils` | `./i18n`

## RTL/LTR Architecture

- Language stored in Zustand `uiStore` + persisted to localStorage/AsyncStorage
- `document.documentElement.dir` updated on language change (`rtl`/`ltr`)
- `document.documentElement.lang` updated to `ar`/`en`
- **All Tailwind classes MUST use logical properties**: `ms-*`/`me-*`/`ps-*`/`pe-*` — never `ml-*`/`mr-*`/`pl-*`/`pr-*`
- Arabic font: Cairo (Google Fonts), English font: Inter
- RTL-aware components: Drawer slides from correct side, Pagination arrows flip
- Dark mode: `class` strategy on `<html>` element

## State Management

### Zustand Stores (same shape across web/admin/mobile)

**authStore** — User auth + profile:
- `user: User | null`, `session: Session | null`, `loading`, `initialized`
- `initialize()` called on app boot; listens to `supabase.auth.onAuthStateChange()`
- Methods: `setSession()`, `loadProfile()`, `login()`, `register()`, `logout()`, `updateProfile()`

**uiStore** — Theme + language:
- `theme: 'light' | 'dark'`, `language: 'ar' | 'en'`
- `mobileMenuOpen: boolean` (web only)
- Persists to localStorage/AsyncStorage; triggers `dir`/class updates on change

**comparisonStore** (web only) — Client-side property comparison:
- `items: PropertyWithRelations[]` — max 4 items
- Methods: `addToComparison()`, `removeFromComparison()`, `clearComparison()`, `isInComparison()`, `getShareUrl()`
- Persisted to localStorage; IDs encoded in URL params for sharing

### TanStack React Query

Used for all server data. Key hooks (in `apps/web/src/hooks/` and `apps/admin/src/hooks/`):
- `useProperties(filters)` — paginated list, staleTime 2 min
- `useInfiniteProperties(filters)` — infinite scroll
- `useProperty(slug)` — single property detail, staleTime 5 min
- `useFeaturedProperties(limit)` — staleTime 10 min
- `useNearbyProperties(lat, lng, excludeId)` — calls `supabase.rpc('get_nearby_properties')`
- `useFavorites()`, `useLocations()`, `useCategories()`

## Data Access Pattern

All queries flow through `@shared/supabase/queries/*`. **Never write inline Supabase queries in components.**

```typescript
// Shared query builder pattern
const PROPERTY_SELECT = `
  *,
  category:categories(*),
  location:locations(*),
  images:property_images(...),
  videos:property_videos(...),
  agent:users!properties_agent_id_fkey(...)
`
export function buildPropertiesQuery(supabase, filters: PropertyFilters) {
  // Returns chainable Supabase query with .eq/.ilike/.order/.range applied
}
```

## Database Schema (Key Tables)

Migrations in `supabase/migrations/` (applied in order):

1. **initial_schema** — Core tables:
   - `users` (extends auth.users)
   - `locations` (hierarchical: country → city → district)
   - `categories`
   - `properties` (with slug column for SEO)
   - `property_images` (storage_path refs Supabase Storage)
   - `property_videos` (YouTube/Cloudflare Stream URLs only — no file storage)
   - `appointments`, `notifications`, `favorites`, `saved_searches`
   - `property_analytics` (WhatsApp clicks + shares)
   - `property_views` (view history)

2. **rls_policies** — Row-Level Security:
   - Public read for published properties
   - Agents/admins can create/edit properties
   - Users manage their own favorites/appointments

3. **storage_buckets** — `property-images` and `property-videos` (public)

4. **functions** — PostgreSQL:
   - `get_nearby_properties(lat, lng, radius_km, limit)` PostGIS query
   - Timestamp triggers (created_at, updated_at)

## Edge Functions (Deno, in supabase/functions/)

- **process-image** — Validates image upload, returns public URL
- **send-notification** — Sends push notifications (Expo/Firebase)
- **upload-youtube** — Validates YouTube/Cloudflare Stream URLs
- **generate-sitemap** — Generates SEO sitemap.xml with hreflang for ar/en

## App Routing

### Web (React Router v6, lazy-loaded routes)
All routes wrapped in `<Layout>` (Header + Outlet + Footer):
- `/` → HomePage
- `/properties` → PropertiesPage
- `/property/:slug` → PropertyDetailPage
- `/compare` → ComparisonPage
- `/auth` → AuthPage
- `/profile` → ProfilePage (protected)
- `/map` → MapPage
- `*` → NotFoundPage

### Admin (React Router v6)
- `/login` → LoginPage (public)
- Protected routes under `<AdminGuard>` + `<AdminLayout>` (sidebar):
  `/dashboard`, `/properties`, `/properties/new`, `/properties/:id/edit`, `/properties/:id/analytics`, `/users`, `/appointments`, `/categories`, `/locations`, `/notifications`

### Mobile (Expo Router v4, file-based)
- `(tabs)/` — Bottom tab nav: index, search, favorites, profile
- `property/[id]` — Property detail
- `auth/login`, `auth/register`
- `appointments/`, `notifications/`

## Component Conventions

- **UI primitives** in `components/ui/`: Button, Input, Select, Modal, Badge, Avatar, Spinner, Skeleton, Pagination, EmptyState
  - Use `cn()` utility (clsx + tailwind-merge) for class merging
  - Variant prop: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
  - Size prop: `'sm' | 'md' | 'lg'`
- **Feature components** in `components/property/`: hook into data via custom hooks, never call Supabase directly
- **SEO**: wrap pages in `<SEO title=... description=... />` component (uses react-helmet-async)

## Tailwind Color System

Custom palette (defined in `tailwind.config.ts` for both web and admin):
- `primary-*` — Golden brown (primary-500 ≈ `#C4A35A`), shades 50–950
- `secondary-*` — Deep blue (secondary-800 ≈ `#1B3A5C`), shades 50–950
- `dark-*` — Slate gray scale, shades 50–950

Custom animations: `fade-in`, `slide-up`, `slide-in-right`, `slide-in-left`, `shimmer`, `count-up`
Custom shadows: `card`, `card-hover`, `gold`

## Code Formatting

- **Prettier** (`.prettierrc`): `semi: true`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: 'es5'`, `printWidth: 100`, + `prettier-plugin-tailwindcss`
- **ESLint**: TypeScript parser, React hooks plugin, `max-warnings: 0`
- TypeScript: strict mode, `moduleResolution: bundler`, target ES2022

## Key Design Decisions

- **SEO slugs**: Properties use human-readable slugs (e.g., `apartment-for-sale-jaramana-125`), not UUIDs — never expose raw UUIDs in URLs
- **Video storage**: Only YouTube/Cloudflare Stream URLs stored; no video files uploaded to Supabase Storage
- **Comparison**: Client-side only (localStorage + URL params) — no DB table for comparisons
- **QR codes**: Generated client-side via `qrcode.react` — not stored anywhere
- **Analytics**: `property_analytics` table tracks WhatsApp clicks + shares only; views tracked in `property_views`, favorites in `favorites`, appointments in `appointments`
- **No REST API**: All data access goes through Supabase JS client with RLS enforcing authorization
- **database.types.ts**: Auto-generated file — always run `pnpm types:gen` after schema changes, never edit manually
- **Shared queries**: Business query logic belongs in `packages/shared/src/supabase/queries/`, not in app-level hooks

## Deployment

- **Web/Admin**: Vercel — `vercel.json` in repo root
  - Web build: `pnpm --filter @3qarat/web build` → `apps/web/dist`
  - SPA rewrite: all non-API routes → `/index.html`
  - `/sitemap.xml` proxied to `/api/sitemap` (Vercel Edge Function)
  - Security headers configured: nosniff, deny frames, XSS protection
  - Asset caching: 1 year for static assets, on-demand revalidation for HTML
- **Mobile**: Expo EAS Build / Expo Go for development
- **Supabase**: Hosted project; migrations applied via Supabase CLI or MCP tools

## Vite Build Chunking

Manual chunk splitting to optimize loading:

**Web**: `react-vendor` (react/router), `query-vendor` (@tanstack/react-query), `ui-vendor` (framer-motion/swiper), `i18n-vendor` (i18next)

**Admin**: `react`, `query`, `table` (@tanstack/react-table), `charts` (recharts), `router`
