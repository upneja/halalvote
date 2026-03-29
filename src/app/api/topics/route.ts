import { createClient } from "@/lib/supabase/server";
import { generateTags } from "@/lib/claude";
import { uniqueSlug, slugify } from "@/lib/slugify";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = rateLimit(`topics:${user.id}`, 5);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { title, description } = await request.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const slug = await uniqueSlug(title);

  // Create topic
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .insert({
      author_id: user.id,
      title: title.trim(),
      slug,
      description: description.trim(),
    })
    .select()
    .single();

  if (topicError) {
    return NextResponse.json({ error: topicError.message }, { status: 500 });
  }

  // Generate and save tags (non-blocking for user — errors are swallowed)
  const { data: existingTags } = await supabase.from("tags").select("name");
  const tagNames = await generateTags(
    title,
    description,
    existingTags?.map((t) => t.name) || []
  );

  // Use service role client for tag insertion (RLS restricts to service_role)
  const serviceSupabase = (await import("@supabase/supabase-js")).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const tagName of tagNames) {
    const tagSlug = slugify(tagName);

    // Upsert tag
    let { data: tag } = await serviceSupabase
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .single();

    if (!tag) {
      const { data: newTag } = await serviceSupabase
        .from("tags")
        .insert({ name: tagName, slug: tagSlug })
        .select("id")
        .single();
      tag = newTag;
    }

    if (tag) {
      await serviceSupabase
        .from("topic_tags")
        .insert({ topic_id: topic.id, tag_id: tag.id })
        .select();
    }
  }

  return NextResponse.json({ topic });
}
