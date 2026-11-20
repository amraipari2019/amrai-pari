// Runs the real migration + seed in an in-memory Postgres (PGlite) with Supabase
// stand-ins, then checks every Row Level Security rule as visitor, viewer,
// coordinator and super admin.  Run: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const db = new PGlite();
const ok = (m) => console.log("PASS", m);
const fail = (m) => { console.log("FAIL", m); process.exitCode = 1; };

// --- minimal Supabase stand-ins
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated;
`);
const sql = fs.readFileSync(`${root}/migrations/0001_init.sql`, "utf8");
await db.exec(sql); ok("migration runs");
await db.exec(sql); ok("migration is re-runnable");
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
               grant usage, select on all sequences in schema public to anon, authenticated;
               grant select, insert, update, delete on storage.objects to authenticated;`);
await db.exec(fs.readFileSync(`${root}/seed.sql`, "utf8")); ok("seed runs");
await db.exec(fs.readFileSync(`${root}/seed.sql`, "utf8")); ok("seed re-runnable");

const U1 = "11111111-1111-1111-1111-111111111111", U2 = "22222222-2222-2222-2222-222222222222";
await db.exec(`insert into auth.users (id,email) values ('${U1}','owner@x.org'),('${U2}','helper@x.org')`);
const roles = (await db.query(`select email, role from profiles order by email`)).rows;
JSON.stringify(roles) === JSON.stringify([{email:"helper@x.org",role:"viewer"},{email:"owner@x.org",role:"super_admin"}]) ? ok("first user super_admin, next viewer") : fail(JSON.stringify(roles));

async function as(role, uid, fn) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role;`); }
}
const tryq = async (q) => { try { return { rows: (await db.query(q)).rows }; } catch (e) { return { error: e.message }; } };

// anon visitor
await as("anon", null, async () => {
  const p = await tryq(`select slug from programs`); p.rows?.length === 3 ? ok("anon sees 3 published programs") : fail("anon programs " + JSON.stringify(p));
  const partners = await tryq(`select * from partners`); partners.rows?.length === 0 ? ok("anon can't see unpublished partners") : fail("partners");
  const ins = await tryq(`insert into volunteer_applications (reference, full_name, phone, consent) values ('VOL-1','A','01711111111', true)`);
  !ins.error ? ok("anon can submit volunteer form") : fail(ins.error);
  const read = await tryq(`select * from volunteer_applications`); read.rows?.length === 0 ? ok("anon can't read submissions") : fail("anon read subs " + JSON.stringify(read));
  const noConsent = await tryq(`insert into volunteer_applications (reference, full_name, phone, consent) values ('VOL-2','A','01711111111', false)`);
  noConsent.error ? ok("consent=false rejected") : fail("consent false accepted");
  const upd = await tryq(`update programs set title_en='hacked' returning id`); (upd.error || upd.rows.length === 0) ? ok("anon can't edit content") : fail("anon edited");
  const s = await tryq(`update site_settings set bkash_number='0' returning id`); (s.error || s.rows.length===0) ? ok("anon can't edit settings") : fail("anon settings");
  const reg = await tryq(`insert into event_registrations (reference, event_id, full_name, phone) values ('R1', gen_random_uuid(), 'x','01711111111')`);
  reg.error ? ok("registration needs open published event") : fail("reg allowed");
  const pr = await tryq(`select * from profiles`); pr.rows?.length === 0 || pr.error ? ok("anon can't list staff") : fail("profiles visible");
});

// viewer
await as("authenticated", U2, async () => {
  const subs = await tryq(`select * from volunteer_applications`); subs.rows?.length === 0 ? ok("viewer can't read volunteers") : fail("viewer reads volunteers");
  const ins = await tryq(`insert into programs (slug,title_en) values ('x','X')`); ins.error ? ok("viewer can't create programs") : fail("viewer created");
  const esc = await tryq(`update profiles set role='super_admin' where id='${U2}' returning id`); (esc.error || esc.rows.length===0) ? ok("viewer can't promote self") : fail("self-promotion!");
  const all = await tryq(`select * from programs where not is_published`); !all.error ? ok("viewer reads drafts (content:read)") : fail(all.error);
  const st = await tryq(`insert into storage.objects (bucket_id,name) values ('media','a.jpg')`); st.error ? ok("viewer can't upload") : fail("viewer upload");
});

// super admin
await as("authenticated", U1, async () => {
  const subs = await tryq(`select * from volunteer_applications`); subs.rows?.length === 1 ? ok("super admin reads volunteers") : fail("sa read " + JSON.stringify(subs));
  const up = await tryq(`update volunteer_applications set status='contacted' returning id`); up.rows?.length === 1 ? ok("super admin updates status") : fail(JSON.stringify(up));
  const ins = await tryq(`insert into events (slug,title_en,starts_at,is_published,registration_open) values ('camp','Camp', now()+interval '3 day', true, true) returning id`);
  ins.rows ? ok("super admin creates event") : fail(ins.error);
  const bad = await tryq(`insert into programs (slug,title_en) values ('Bad Slug','X')`); bad.error ? ok("bad slug rejected") : fail("bad slug ok");
  const promo = await tryq(`update profiles set role='volunteer_coordinator' where id='${U2}' returning id`); promo.rows?.length===1 ? ok("super admin changes roles") : fail(JSON.stringify(promo));
  const st = await tryq(`insert into storage.objects (bucket_id,name) values ('media','a.jpg')`); !st.error ? ok("super admin uploads") : fail(st.error);
  const s = await tryq(`update site_settings set phone='01700000000' returning id`); s.rows?.length===1 ? ok("super admin edits settings") : fail(JSON.stringify(s));
});

await as("anon", null, async () => {
  const ev = (await db.query(`select id from events`)).rows[0].id;
  const reg = await tryq(`insert into event_registrations (reference, event_id, full_name, phone) values ('R2', '${ev}', 'x','01711111111')`);
  !reg.error ? ok("anon registers for open event") : fail(reg.error);
});

// volunteer coordinator (U2 promoted)
await as("authenticated", U2, async () => {
  const subs = await tryq(`select * from volunteer_applications`); subs.rows?.length === 1 ? ok("coordinator reads volunteers") : fail("coord");
  const ast = await tryq(`select * from assistance_requests`); ast.rows?.length === 0 ? ok("coordinator can't read assistance requests") : fail("coord ast");
  const set = await tryq(`update site_settings set phone='1' returning id`); (set.error || set.rows.length===0) ? ok("coordinator can't edit settings") : fail("coord settings");
  const au = await tryq(`select * from audit_logs`); au.rows?.length === 0 ? ok("coordinator can't read audit log") : fail("audit visible");
});
const logs = (await db.query(`select actor_email, action, table_name from audit_logs order by id`)).rows;
logs.some(l => l.table_name === "site_settings" && l.actor_email === "owner@x.org") ? ok(`audit log records staff changes (${logs.length} entries)`) : fail(JSON.stringify(logs));
const faqCount = (await db.query(`select count(*)::int n from faqs`)).rows[0].n;
faqCount === 4 ? ok("seed doesn't duplicate FAQs") : fail("faqs " + faqCount);
