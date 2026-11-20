import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/admin/resources";

export type Staff = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  can: (module: Module, action: "read" | "write") => boolean;
};

/**
 * The signed-in staff member and their permissions, read from the database
 * (the same role_permissions table that Row Level Security uses).
 * Cached per request.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;

  const { data: perms } = await supabase
    .from("role_permissions")
    .select("module, action")
    .eq("role", profile.role);
  const set = new Set((perms ?? []).map((p) => `${p.module}:${p.action}`));
  return {
    id: profile.id,
    email: profile.email ?? "",
    fullName: profile.full_name ?? profile.email ?? "",
    role: profile.role,
    can: (module, action) => set.has(`${module}:${action}`),
  };
});

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?reason=inactive");
  return staff;
}

export async function requirePermission(module: Module, action: "read" | "write") {
  const staff = await requireStaff();
  if (!staff.can(module, action)) redirect("/admin?denied=1");
  return staff;
}
