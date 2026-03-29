import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic_id, vote } = await request.json();

  if (!topic_id || !["halal", "haram"].includes(vote)) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("votes")
    .insert({
      topic_id,
      user_id: user.id,
      vote,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vote: data });
}
