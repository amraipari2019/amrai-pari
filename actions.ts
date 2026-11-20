"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, requireStaff } from "@/lib/auth/session";
import { TAGS } from "@/lib/data/public";
import { fromDhakaInput } from "@/lib/admin/datetime";
import { columnsFor, getContentResource, getInboxKind, roleLabels } from "@/lib/admin/resources";
import { siteUrl } from "@/lib/env";

export type ActionState = { error?: string; ok?: string } | null;

function friendly(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That web address is already used. Choose a different one.";
  if (error.code === "42501") return "Your role doesn't allow this change.";
  if (error.code === "23514") return "One of the values isn't allowed. Check the web address and options.";
  return error.message;
}

// ---------------------------------------------------------------- content
export async function saveContent(
  resourceKey: string,
  id: string | null,
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const resource = getContentResource(resourceKey);
  if (!resource) return { error: "Unknown content type." };
  await requirePermission(resource.module, "write");

  const payload: Record<string, unknown> = {};
  for (const field of resource.fields) {
    for (const col of columnsFor(field)) {
      const raw = fd.get(col);
      const value = typeof raw === "string" ? raw.trim() : "";
      switch (field.type) {
        case "checkbox":
          payload[col] = raw === "on";
          break;
        case "number":
          payload[col] = value === "" ? (col === "sort_order" ? 0 : null) : Number(value);
          if (payload[col] !== null && Number.isNaN(payload[col]))
            return { error: `${field.label} must be a number.` };
          break;
        case "datetime":
          payload[col] = fromDhakaInput(value);
          break;
        case "slug":
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value))
            return { error: "Web address: use lowercase letters, numbers and single dashes only." };
          payload[col] = value;
          break;
        default:
          payload[col] = value === "" ? null : value;
      }
      const isRequiredCol = field.required && (!field.bilingual || col.endsWith("_en"));
      if (isRequiredCol && (payload[col] === null || payload[col] === "")) {
        return { error: `${field.label}${field.bilingual ? " (English)" : ""} is required.` };
      }
    }
  }

  const supabase = await createClient();
  const query = id
    ? supabase.from(resource.table).update(payload).eq("id", id).select("id").single()
    : supabase.from(resource.table).insert(payload).select("id").single();
  const { data, error } = await query;
  if (error) return { error: friendly(error) };

  updateTag(resource.tag);
  revalidatePath(`/admin/content/${resource.key}`);
  redirect(
    id ? `/admin/content/${resource.key}?saved=1` : `/admin/content/${resource.key}/${data.id}?created=1`,
  );
}

export async function deleteContent(resourceKey: string, id: string) {
  const resource = getContentResource(resourceKey);
  if (!resource) return;
  await requirePermission(resource.module, "write");
  const supabase = await createClient();
  const { error } = await supabase.from(resource.table).delete().eq("id", id);
  if (error) redirect(`/admin/content/${resource.key}/${id}?error=${encodeURIComponent(friendly(error))}`);
  updateTag(resource.tag);
  redirect(`/admin/content/${resource.key}?deleted=1`);
}

// ---------------------------------------------------------------- gallery photos
export async function addPhotos(albumId: string, urls: string[]): Promise<ActionState> {
  await requirePermission("gallery", "write");
  const clean = urls.filter((u) => typeof u === "string" && u.startsWith("https://")).slice(0, 100);
  if (!clean.length) return { error: "No photos to add." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("gallery_photos")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId);
  const start = count ?? 0;
  const { error } = await supabase
    .from("gallery_photos")
    .insert(clean.map((image_url, i) => ({ album_id: albumId, image_url, sort_order: start + i })));
  if (error) return { error: friendly(error) };
  // First photo becomes the cover if the album has none.
  await supabase
    .from("gallery_albums")
    .update({ cover_image_url: clean[0] })
    .eq("id", albumId)
    .is("cover_image_url", null);
  updateTag(TAGS.gallery);
  revalidatePath(`/admin/content/gallery/${albumId}`);
  return { ok: `${clean.length} photo(s) added.` };
}

export async function updatePhoto(albumId: string, photoId: string, fd: FormData) {
  await requirePermission("gallery", "write");
  const supabase = await createClient();
  await supabase
    .from("gallery_photos")
    .update({
      caption_en: String(fd.get("caption_en") ?? "").trim() || null,
      caption_bn: String(fd.get("caption_bn") ?? "").trim() || null,
      sort_order: Number(fd.get("sort_order") ?? 0) || 0,
    })
    .eq("id", photoId);
  updateTag(TAGS.gallery);
  revalidatePath(`/admin/content/gallery/${albumId}`);
}

export async function deletePhoto(albumId: string, photoId: string) {
  await requirePermission("gallery", "write");
  const supabase = await createClient();
  await supabase.from("gallery_photos").delete().eq("id", photoId);
  updateTag(TAGS.gallery);
  revalidatePath(`/admin/content/gallery/${albumId}`);
}

export async function setAlbumCover(albumId: string, url: string) {
  await requirePermission("gallery", "write");
  const supabase = await createClient();
  await supabase.from("gallery_albums").update({ cover_image_url: url }).eq("id", albumId);
  updateTag(TAGS.gallery);
  revalidatePath(`/admin/content/gallery/${albumId}`);
}

// ---------------------------------------------------------------- inbox
export async function updateSubmission(
  kindKey: string,
  id: string,
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const kind = getInboxKind(kindKey);
  if (!kind) return { error: "Unknown inbox." };
  await requirePermission(kind.module, "write");
  const status = String(fd.get("status") ?? "");
  if (!kind.statuses.includes(status)) return { error: "Choose a valid status." };
  const supabase = await createClient();
  const { error } = await supabase
    .from(kind.table)
    .update({ status, staff_notes: String(fd.get("staff_notes") ?? "").trim() || null })
    .eq("id", id);
  if (error) return { error: friendly(error) };
  revalidatePath(`/admin/inbox/${kind.key}`);
  return { ok: "Saved." };
}

export async function deleteSubmission(kindKey: string, id: string) {
  const kind = getInboxKind(kindKey);
  if (!kind) return;
  await requirePermission(kind.module, "write");
  const supabase = await createClient();
  await supabase.from(kind.table).delete().eq("id", id);
  redirect(`/admin/inbox/${kind.key}?deleted=1`);
}

// ---------------------------------------------------------------- settings
const settingsColumns = [
  "email",
  "phone",
  "whatsapp",
  "address_en",
  "address_bn",
  "map_embed_url",
  "facebook_url",
  "youtube_url",
  "registration_authority",
  "registration_number",
  "mission_en",
  "mission_bn",
  "vision_en",
  "vision_bn",
  "story_en",
  "story_bn",
  "bkash_number",
  "bkash_type",
  "nagad_number",
  "bank_name",
  "bank_branch",
  "bank_account_name",
  "bank_account_number",
  "bank_routing_number",
  "contribute_note_en",
  "contribute_note_bn",
];

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requirePermission("settings", "write");
  const payload: Record<string, string | null> = {};
  for (const col of settingsColumns) {
    if (!fd.has(col)) continue;
    const v = String(fd.get(col) ?? "").trim();
    payload[col] = v || null;
  }
  for (const col of ["facebook_url", "youtube_url", "map_embed_url"]) {
    if (payload[col] && !/^https:\/\//.test(payload[col]!))
      return { error: "Links must start with https://" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
  if (error) return { error: friendly(error) };
  updateTag(TAGS.settings);
  return { ok: "Settings saved. The website shows the changes now." };
}

// ---------------------------------------------------------------- users
export async function updateUser(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requirePermission("users", "write");
  const role = String(fd.get("role") ?? "");
  if (!(role in roleLabels)) return { error: "Choose a valid role." };
  const isActive = fd.get("is_active") === "on";
  if (id === me.id && (role !== "super_admin" || !isActive)) {
    return { error: "You can't remove your own super admin access. Ask another super admin." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, is_active: isActive, full_name: String(fd.get("full_name") ?? "").trim() || null })
    .eq("id", id);
  if (error) return { error: friendly(error) };
  revalidatePath("/admin/users");
  return { ok: "Saved." };
}

export async function inviteUser(_: ActionState, fd: FormData): Promise<ActionState> {
  await requirePermission("users", "write");
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(fd.get("role") ?? "viewer");
  const fullName = String(fd.get("full_name") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!(role in roleLabels)) return { error: "Choose a valid role." };
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "SUPABASE_SECRET_KEY is not set on the server, so invitations can't be sent." };
  }
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl}/auth/confirm?next=/admin/account`,
  });
  if (error) return { error: error.message };
  // The sign-up trigger created the profile as "viewer"; set the chosen role.
  await admin
    .from("profiles")
    .update({ role, full_name: fullName || null })
    .eq("id", data.user.id);
  revalidatePath("/admin/users");
  return { ok: `Invitation sent to ${email}.` };
}

// ---------------------------------------------------------------- auth
export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect." };
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/admin/account`,
  });
  // Same answer whether or not the account exists.
  return { ok: "If that email belongs to a staff account, a reset link is on its way." };
}

export async function updateAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const supabase = await createClient();
  const fullName = String(fd.get("full_name") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password) {
    if (password.length < 10) return { error: "Use at least 10 characters for the password." };
    if (password !== confirm) return { error: "The two passwords don't match." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
  }
  if (fullName) {
    // Staff may only change their own display name; RLS blocks role changes.
    const admin = (() => {
      try {
        return createAdminClient();
      } catch {
        return null;
      }
    })();
    await (admin ?? supabase).from("profiles").update({ full_name: fullName }).eq("id", staff.id);
  }
  revalidatePath("/admin", "layout");
  return { ok: password ? "Password and details saved." : "Details saved." };
}
