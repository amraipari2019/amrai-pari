# Going live: GitHub → Supabase → Vercel

About 30 minutes. You need a GitHub account and an email address. Everything below is on free plans.
Do the steps in order.

---

## 1. Put the code on GitHub

1. On GitHub, click **New repository**. Name it `amrai-pari-foundation`, choose **Private**, and don't add a README.
2. In a terminal inside this folder:

   ```bash
   git init
   git add .
   git commit -m "Amrai Pari Foundation website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/amrai-pari-foundation.git
   git push -u origin main
   ```

   `.env.local` and `node_modules` are ignored automatically — your keys never go to GitHub.

Optional automatic checks: before the first commit, create the folder `.github/workflows/` and move
`docs/github-ci.yml` into it as `ci.yml`. GitHub will then run lint, types, tests, database rules and a build on every push.

## 2. Create the Supabase project

1. Go to <https://supabase.com> → **New project**. Name: `amrai-pari`. Region: **Singapore** (closest to Dhaka).
   Save the database password somewhere safe.
2. Open **SQL Editor → New query**. Paste all of `supabase/migrations/0001_init.sql` and click **Run**.
3. New query again. Paste `supabase/seed.sql` and click **Run**. (Adds the three programs, starter FAQs and the founder.)
4. **Project Settings → API Keys**. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key → `SUPABASE_SECRET_KEY` (keep private)

### Authentication settings

5. **Authentication → Sign In / Providers**: turn **off** “Allow new users to sign up”. Staff are added by invitation only.
6. **Authentication → URL Configuration**: set **Site URL** to your live address (e.g. `https://amrai-pari-foundation.vercel.app`).
   Add the same address followed by `/**` under **Redirect URLs**, plus `http://localhost:3000/**` for testing.
7. **Authentication → Emails → Templates**. Replace the link in two templates so it works with the website:

   **Invite user**

   ```html
   <h2>You've been invited to the Amrai Pari admin</h2>
   <p>
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/account"
       >Accept the invitation and set your password</a
     >
   </p>
   ```

   **Reset password**

   ```html
   <h2>Reset your password</h2>
   <p>
     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/account"
       >Choose a new password</a
     >
   </p>
   ```

### Create the first admin (you)

8. **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, tick
   **Auto confirm user**. The **first account ever created becomes Super admin** automatically.
   Everyone after that starts as Viewer; invite them from **/admin → Staff & roles**.

## 3. Deploy on Vercel (connected to GitHub)

1. Go to <https://vercel.com> → sign in with GitHub → **Add New → Project** → import `amrai-pari-foundation`.
2. Before clicking Deploy, open **Environment Variables** and add every value from `.env.example`:

   | Name                                   | Value                                                      |
   | -------------------------------------- | ---------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                 | `https://<your-project>.vercel.app` (or your domain later) |
   | `NEXT_PUBLIC_SUPABASE_URL`             | from step 2.4                                              |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from step 2.4                                              |
   | `SUPABASE_SECRET_KEY`                  | from step 2.4                                              |

   The rest are optional (see below).

3. Click **Deploy**. From now on, every `git push` to `main` updates the live site automatically.
4. Visit `/admin`, sign in, and fill in **Site settings** (phone, email, address, mission, payment details).

### Custom domain (optional)

Vercel → Project → **Settings → Domains** → add `amraipari.org` (or similar) and follow the DNS instructions.
Then update `NEXT_PUBLIC_SITE_URL` in Vercel and the **Site URL** in Supabase to the new domain, and redeploy.

## 4. Optional extras

- **Spam protection** — <https://dash.cloudflare.com> → Turnstile → add site → copy the two keys into
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Without them, forms still use a hidden honeypot
  field and a timing check.
- **Email alerts for new forms** — <https://resend.com> → API key → set `RESEND_API_KEY`,
  `NOTIFICATION_EMAIL_FROM` (an address on a domain you verified in Resend) and `NOTIFICATION_EMAIL_TO`
  (comma-separated staff emails). Assistance-request emails never include the person's details.

After changing environment variables in Vercel, redeploy (**Deployments → … → Redeploy**).

## Working on it locally

```bash
npm install
cp .env.example .env.local   # paste your Supabase keys
npm run dev                  # http://localhost:3000  ·  admin: http://localhost:3000/admin
```

## Backups

Supabase free projects pause after 7 days with no visits and keep daily backups only on paid plans.
Once a month, download a copy: **Database → Backups** (paid) or run
`npx supabase db dump --db-url "<connection string>" -f backup.sql` (connection string: **Project Settings → Database**).
Images live in **Storage → media**; download that folder too.
