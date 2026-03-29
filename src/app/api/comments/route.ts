import { createClient } from "@/lib/supabase/server";
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

  const { success } = rateLimit(`comments:${user.id}`, 20);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { topic_id, body, scholar_citation } = await request.json();

  if (!topic_id || !body?.trim()) {
    return NextResponse.json({ error: "Topic and body required" }, { status: 400 });
  }

  // Verify user has voted on this topic
  const { data: vote } = await supabase
    .from("votes")
    .select("vote")
    .eq("topic_id", topic_id)
    .eq("user_id", user.id)
    .single();

  if (!vote) {
    return NextResponse.json(
      { error: "Must vote before commenting" },
      { status: 403 }
    );
  }

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      topic_id,
      user_id: user.id,
      body: body.trim(),
      position: vote.vote,
      scholar_citation: scholar_citation?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment });
}
