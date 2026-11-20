import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentResource } from "@/lib/admin/resources";

/** Options for "relation" fields (e.g. which program a project belongs to). */
export async function loadRelations(resource: ContentResource) {
  const supabase = await createClient();
  const out: Record<string, { value: string; label: string }[]> = {};
  for (const f of resource.fields) {
    if (f.type !== "relation" || !f.relation) continue;
    const { data } = await supabase
      .from(f.relation.table)
      .select(`id, ${f.relation.labelColumn}`)
      .order(f.relation.labelColumn);
    out[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({
      value: r.id,
      label: r[f.relation!.labelColumn],
    }));
  }
  return out;
}
