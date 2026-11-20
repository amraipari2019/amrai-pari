import { z } from "zod";

/**
 * Environment variables, validated at first use so a missing value fails
 * loudly with a clear message instead of a confusing runtime error.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NOTIFICATION_EMAIL_FROM: z.string().optional(),
  NOTIFICATION_EMAIL_TO: z.string().optional(),
});

export function publicEnv() {
  // Next.js only inlines NEXT_PUBLIC_* when referenced literally.
  return publicSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  });
}

export function serverEnv() {
  return serverSchema.parse(process.env);
}

/** True once real Supabase keys are present (placeholders from .env.example don't count). */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return (
    /^https:\/\/.+/.test(url) && !url.includes("your-project-ref") && key.length > 0 && !key.endsWith("_xxx")
  );
}

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
