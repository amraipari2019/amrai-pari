import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/**
 * Privileged Supabase client that BYPASSES Row Level Security.
 * Server-only (the "server-only" import breaks the build if a client
 * component imports this). Use sparingly — e.g. writing audit logs or
 * storing public form submissions after server-side validation.
 */
export function createAdminClient() {
  const env = serverEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
