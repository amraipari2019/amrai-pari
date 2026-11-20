# Amrai Pari Foundation — Website & Admin

Bilingual (English / বাংলা) website and admin panel for **Amrai Pari Foundation**, Mirpur-13, Dhaka.
_Everyone Deserves a Chance._

**To put it online, follow [SETUP.md](SETUP.md)** (GitHub → Supabase → Vercel, ~30 minutes).

## What's inside

**Public site** (English at `/…`, Bangla at `/bn/…`): Home, About, Programs, Projects, Impact, Events (with
registration), Gallery, Team, Contribute, Get involved (volunteer form), Partner with us, Request assistance,
Contact, FAQ, Privacy, Terms, sitemap and robots.

**Admin panel** at `/admin`:

- **Inbox** — volunteer applications, assistance requests, messages, partnership inquiries and event
  registrations. Filter by status, add private notes, download as CSV.
- **Website content** — programs, projects, events, gallery albums (bulk photo upload), team, FAQ, impact
  figures, partners. Every text field has English and Bangla side by side.
- **Site settings** — contact details, mission/vision/story, registration details, bKash/Nagad/bank details.
- **Staff & roles** — invite staff by email; six roles (Super admin, Content manager, Program manager,
  Finance manager, Volunteer coordinator, Viewer).
- **Activity log** — every staff change, recorded by the database.

Security is enforced inside Supabase with Row Level Security, so even someone bypassing the website can't read
form submissions or change content without the right role.

## Commands

| Command                       | What it does                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                 | Development server with live reload                                  |
| `npm run build` / `npm start` | Production build / run it                                            |
| `npm run lint`                | Code-style and common-bug checks                                     |
| `npm run typecheck`           | TypeScript checks                                                    |
| `npm test`                    | Unit tests (form validation, translations, dates)                    |
| `npm run test:db`             | Runs the SQL in an in-memory Postgres and checks every security rule |

## Editing

- Interface text: `messages/en.json` and `messages/bn.json` (every key must exist in both — `npm test` checks).
- Page content: from `/admin`. Changes show on the site immediately.
- Brand colours: top of `src/app/globals.css` (sampled from the logo).
- Admin fields: `src/lib/admin/resources.ts` (add the column in SQL first).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it's built and
[docs/REQUIRED-INFORMATION.md](docs/REQUIRED-INFORMATION.md) for details still needed from the Foundation.
