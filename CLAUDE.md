# عقارات جرمانا — 3qarat Jaramana

Professional real estate platform for the Arabic market (Syria/Damascus area).

## Project Structure

```
apps/web        — React + Vite website (public-facing)
apps/admin      — React + Vite admin dashboard
apps/mobile     — React Native + Expo mobile app
packages/shared — Shared types, Supabase client, utilities, i18n
supabase/       — DB migrations, Edge Functions, seed data
```

## Dev Commands

```bash
pnpm dev:web          # Start website dev server (localhost:5173)
pnpm dev:admin        # Start admin dev server (localhost:5174)
pnpm dev:mobile       # Start Expo dev server
pnpm build:web        # Build website for production
pnpm build:admin      # Build admin for production
pnpm typecheck        # Run TypeScript checks across all packages
pnpm types:gen        # Regenerate database.types.ts from local Supabase
```

## Supabase Local Dev

```bash
supabase start         # Start local Supabase (Docker required)
supabase db push       # Apply migrations to local DB
supabase db reset      # Reset DB + re-apply migrations + seed
supabase gen types typescript --local > packages/shared/src/types/database.types.ts
```

## RTL/LTR Architecture

- Language is stored in Zustand `uiStore` and `AsyncStorage` (mobile)
- `document.documentElement.dir` is set to `rtl`/`ltr` when language changes
- All Tailwind classes use logical properties: `ms-*`/`me-*`/`ps-*`/`pe-*`
- Arabic font: Cairo (Google Fonts), English font: Inter
- RTL-aware components: Drawer (slides from correct side), Pagination arrows

## Environment Setup

Copy `.env.example` to `.env` and fill in Supabase credentials and API keys.

## Key Design Decisions

- **SEO slugs**: Properties use human-readable slugs (e.g., `apartment-for-sale-jaramana-125`), not UUIDs
- **Video storage**: Only YouTube/Cloudflare Stream URLs stored, no video files in Supabase Storage
- **Comparison**: Client-side only (localStorage + URL params), no DB table
- **QR codes**: Generated client-side via `qrcode.react`, no storage
- **Analytics**: `property_analytics` table tracks WhatsApp clicks + shares; views/favorites/appointments from their respective tables
