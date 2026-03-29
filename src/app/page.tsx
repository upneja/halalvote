import { createClient } from "@/lib/supabase/server";
import { TopicCard } from "@/components/topic-card";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch topics
  let topics;
  if (sort === "new") {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    topics = data;
  } else {
    const { data } = await supabase
      .from("trending_topics")
      .select("*")
      .limit(20);
    topics = data;
  }

  // Fetch user votes if logged in
  let userVotes: Record<string, "halal" | "haram"> = {};
  if (user && topics?.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("topic_id, vote")
      .eq("user_id", user.id)
      .in(
        "topic_id",
        topics.map((t) => t.id)
      );
    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.topic_id, v.vote as "halal" | "haram"])
      );
    }
  }

  // Fetch tags and comment counts for topics
  const topicIds = topics?.map((t) => t.id) || [];

  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("topic_id, tags(id, name, slug)")
    .in("topic_id", topicIds);

  const { data: commentCounts } = await supabase
    .rpc("get_comment_counts", { topic_ids: topicIds });

  // Build tag map
  const tagMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  topicTags?.forEach((tt: any) => {
    if (!tagMap[tt.topic_id]) tagMap[tt.topic_id] = [];
    if (tt.tags) tagMap[tt.topic_id].push(tt.tags);
  });

  // Build comment count map
  const commentMap: Record<string, number> = {};
  commentCounts?.forEach((cc: any) => {
    commentMap[cc.topic_id] = cc.count;
  });

  const isNew = sort === "new";

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white heading-display"
              style={{ fontFamily: "var(--font-playfair, serif)" }}
            >
              Community Debates
            </h1>
            <p className="text-neutral-500 text-sm mt-2">
              Vote Halal or Haram, then join the discussion.
            </p>
          </div>

          {/* Sort tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl self-start sm:self-auto"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <Link
              href="/?sort=trending"
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                !isNew
                  ? {
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }
                  : { color: "#737373" }
              }
            >
              Trending
            </Link>
            <Link
              href="/?sort=new"
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={
                isNew
                  ? {
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }
                  : { color: "#737373" }
              }
            >
              New
            </Link>
          </div>
        </div>
      </div>

      {/* Topic list */}
      <div className="space-y-3 sm:space-y-4">
        {topics?.map((topic) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            slug={topic.slug}
            description={topic.description}
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            tags={tagMap[topic.id] || []}
            userVote={userVotes[topic.id] || null}
            commentCount={commentMap[topic.id] || 0}
          />
        ))}
        {(!topics || topics.length === 0) && (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-neutral-400 text-sm">No topics yet.</p>
            <p className="text-neutral-600 text-xs mt-1">
              Be the first to{" "}
              <Link href="/submit" className="text-gold hover:underline">
                submit a topic
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
