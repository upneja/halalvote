import { createClient } from "@/lib/supabase/server";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function uniqueSlug(title: string): Promise<string> {
  const supabase = await createClient();
  const base = slugify(title);
  let slug = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix++;
  }
}
