# Amrai Pari Foundation — Architecture & Development Plan

## 1. Stack (pinned, mutually compatible)

| Layer                   | Choice                                                                     | Why                                                                              |
| ----------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Framework               | **Next.js 16.4** (App Router, Turbopack, Cache Components)                 | Server rendering for SEO, Server Actions for secure forms, first-class on Vercel |
| UI                      | React 19.3, **Tailwind CSS 4.3**, shadcn/ui-style components, Lucide icons | Fast to build, consistent, accessible; no heavy UI kit                           |
| Language                | TypeScript (strict)                                                        | Catches errors before they reach visitors                                        |
| i18n                    | **next-intl 4**                                                            | English at `/…`, Bengali at `/bn/…`; translations in `messages/*.json`           |
| Database / Auth / Files | **Supabase** (Postgres + RLS, Auth, Storage) via `@supabase/ssr`           | One managed service; security enforced inside the database                       |
| Validation              | **Zod 4**                                                                  | One schema validates on the server and drives bilingual form error messages      |
| Spam protection         | Cloudflare Turnstile + honeypot field + database rate limit                | Free, privacy-friendly                                                           |
| Tests                   | Vitest + Testing Library; Playwright planned for user journeys             |                                                                                  |
| Hosting                 | Vercel + Supabase cloud                                                    |                                                                                  |

### Key decisions explained (plain language)

- **Bilingual URLs.** English is the default with clean URLs (`/about`). Bengali lives under `/bn` (`/bn/about`).
  Search engines see two proper language versions, and the switcher keeps you on the same page.
- **Bilingual database content.** Every translatable column exists twice: `title_en`, `title_bn`. This is the simplest
  model for non-technical admins (two side-by-side fields in each form) and easy to query. If a Bengali field is empty,
  the site falls back to English rather than showing a blank.
- **Security lives in the database, not in hidden buttons.** Each Supabase table gets Row Level Security policies that
  check the signed-in user's role. Even if someone bypasses the website, Postgres refuses unauthorised reads/writes.
  Server Actions check permissions again before any change, and sensitive changes write to `audit_logs`.
- **Two Supabase clients.** The normal client acts _as the user_ (RLS applies). The "admin" client uses the secret key
  and can only be imported on the server (`server-only` guard breaks the build otherwise).
- **Public forms never expose data.** Visitors can submit (through a validated server action), but only authorised roles
  can read volunteer applications, assistance requests, messages or registrations.
- **No online payments.** The Contribute page only displays payment details that admins enter. No card/PIN/OTP fields.
- **No invented facts.** `src/config/site.ts` holds only verified facts; unknown values are `null` and render as clearly
  marked placeholders. Impact numbers appear publicly only after an admin marks them _verified_.
- **Brand colours come from the logo** (navy lettering, green bands, red crescent, sky field, gold ring) and are
  defined once in `src/app/globals.css`, so a future rebrand is a one-file change.

### How the pieces fit (as built)

- **Public reads** go through `src/lib/data/public.ts`: cookie-less Supabase queries wrapped in `"use cache"`
  and tagged (`programs`, `events`…). Admin saves call `updateTag()` so visitors see edits immediately.
  Without Supabase keys every query returns empty and pages show friendly placeholders.
- **Public forms** (`src/lib/forms/actions.ts`) validate with Zod, check a honeypot + timing (+ Turnstile if
  configured), then insert as an anonymous visitor. RLS allows insert but never read.
- **Admin** (`src/app/admin`) uses the signed-in user's session, so RLS decides what each role sees.
  Content types and inboxes are declared once in `src/lib/admin/resources.ts`; generic pages render them.
- **Permissions** live in the `role_permissions` table. RLS (`has_permission()`) and the admin UI both read it.

## 2. Folder structure

```
amrai-pari-foundation/
├── messages/                 # en.json, bn.json — all UI text (a test enforces matching keys)
├── public/brand/             # official logo (source + optimised PNGs)
├── docs/                     # architecture, required info; later admin guide, deployment, backups
├── supabase/                 # (Phase 4) migrations/*.sql, seed.sql, config.toml
├── tests/                    # Vitest unit/component tests; e2e/ (Playwright) later
└── src/
    ├── proxy.ts              # runs before each request: language routing; (Phase 4) session refresh + /admin guard
    ├── i18n/                 # routing.ts, request.ts, navigation.ts (locale-aware Link/redirect)
    ├── config/site.ts        # verified org facts + safe fallbacks
    ├── lib/
    │   ├── env.ts            # validated environment variables
    │   ├── utils.ts          # cn() class helper
    │   ├── supabase/         # client.ts (browser), server.ts (user session), admin.ts (secret, server-only)
    │   ├── validation/       # (Phase 4+) Zod schemas per form
    │   └── auth/             # (Phase 4+) roles and permission checks
    ├── components/
    │   ├── ui/               # buttons, inputs, cards, dialogs (shadcn-style)
    │   ├── layout/           # header, footer, nav, language switcher
    │   ├── sections/         # homepage & page sections
    │   └── forms/            # public forms
    └── app/
        ├── layout.tsx        # pass-through root
        ├── [locale]/         # PUBLIC SITE (en / bn)
        │   ├── page.tsx      # /
        │   ├── about/ programs/[slug]/ projects/[slug]/ impact/ get-involved/ contribute/
        │   ├── events/[slug]/ gallery/[slug]/ team/ contact/ faq/ privacy-policy/
        │   ├── terms-and-conditions/ volunteer/register/ partnership/ assistance/request/
        │   └── not-found.tsx, error.tsx
        ├── admin/            # DASHBOARD (Phase 5) — own layout, English UI, edits both languages
        ├── auth/             # login, callback, password reset
        ├── sitemap.ts, robots.ts
        └── api/              # only where Server Actions don't fit (e.g. signed upload URLs)
```

## 3. Roles (Phase 4–5)

`super_admin`, `content_manager`, `program_manager`, `finance_manager`, `volunteer_coordinator`, `viewer`.
A permission matrix (role × module × action) lives in code and is mirrored by a SQL helper `has_permission()` used in
RLS policies, so the browser, the server and the database all enforce the same rules.

## 4. Required credentials & configuration

See `.env.example`. Needed before Phase 4: a Supabase project (URL, publishable key, secret key). Before Phase 6:
Cloudflare Turnstile keys; optionally a Resend API key for email notifications. Before Phase 8: Vercel account and the
domain name. Secrets go only in `.env.local` (local) and Vercel environment settings (production) — never in Git.

## 5. Phase plan

| Phase | Deliverable                                                                               | Status                      |
| ----- | ----------------------------------------------------------------------------------------- | --------------------------- |
| 1     | Next.js + TS + Tailwind, deps, structure, i18n routing, brand tokens, env template, tests | **Done**                    |
| 2     | Design-system components, header/footer, responsive nav, full bilingual infrastructure    | **Done**                    |
| 3     | All pages + extra routes with placeholders, SEO metadata, sitemap/robots                  | **Done**                    |
| 4     | Supabase schema, migrations, RLS, auth, seed data                                         | **Done**                    |
| 5     | Admin dashboard, RBAC, CMS modules, audit logs                                            | **Done**                    |
| 6     | Storage uploads, forms → database, reference numbers, email notifications                 | **Done**                    |
| 7     | Tests: unit, form validation, RLS (`npm run test:db`), responsive checks                  | **Done**                    |
| 8     | Vercel + production Supabase, deployment / backup docs (`SETUP.md`)                       | **Done** — go-live is yours |
