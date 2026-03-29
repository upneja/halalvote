import { createClient } from "@/lib/supabase/server";
import { TopicCard } from "@/components/topic-card";
import { notFound } from "next/navigation";

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch tag
  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tag) notFound();

  // Fetch topics with this tag
  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("topics(*)")
    .eq("tag_id", tag.id);

  const topics = topicTags?.map((tt: any) => tt.topics).filter(Boolean) || [];

  // Fetch user votes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVotes: Record<string, "halal" | "haram"> = {};
  if (user && topics.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("topic_id, vote")
      .eq("user_id", user.id)
      .in(
        "topic_id",
        topics.map((t: any) => t.id)
      );
    if (votes) {
      userVotes = Object.fromEntries(
        votes.map((v) => [v.topic_id, v.vote as "halal" | "haram"])
      );
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs text-neutral-600 uppercase tracking-wider mb-1 font-medium">Tag</p>
        <h1
          className="text-3xl sm:text-4xl font-bold heading-display"
          style={{ fontFamily: "var(--font-playfair, serif)", color: "#D4A843" }}
        >
          {tag.name}
        </h1>
        <p className="text-neutral-500 text-sm mt-2">
          {topics.length} {topics.length === 1 ? "topic" : "topics"}
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {topics.map((topic: any) => (
          <TopicCard
            key={topic.id}
            id={topic.id}
            title={topic.title}
            slug={topic.slug}
            description={topic.description}
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            tags={[tag]}
            userVote={userVotes[topic.id] || null}
            commentCount={0}
          />
        ))}
        {topics.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-neutral-500 text-sm">No topics with this tag yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
