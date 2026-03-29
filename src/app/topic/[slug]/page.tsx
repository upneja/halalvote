import { createClient } from "@/lib/supabase/server";
import { VoteButtons } from "@/components/vote-buttons";
import { VoteResults } from "@/components/vote-results";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { TagBadge } from "@/components/tag-badge";
import { notFound } from "next/navigation";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch topic
  const { data: topic } = await supabase
    .from("topics")
    .select("*, profiles(username, display_name)")
    .eq("slug", slug)
    .single();

  if (!topic) notFound();

  // Fetch tags
  const { data: topicTags } = await supabase
    .from("topic_tags")
    .select("tags(id, name, slug)")
    .eq("topic_id", topic.id);

  const tags = topicTags?.map((tt: any) => tt.tags).filter(Boolean) || [];

  // Check user vote
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVote: "halal" | "haram" | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("vote")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .single();
    if (vote) userVote = vote.vote as "halal" | "haram";
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username, display_name)")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
      {/* Topic header */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold heading-display"
          style={{ fontFamily: "var(--font-playfair, serif)" }}
        >
          {topic.title}
        </h1>
        {topic.description && (
          <p className="text-neutral-400 text-base leading-relaxed">
            {topic.description}
          </p>
        )}
        <p className="text-xs text-neutral-600">
          Submitted by{" "}
          <span className="text-neutral-500">@{(topic as any).profiles?.username}</span>
        </p>
      </div>

      {/* Vote section */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {userVote ? (
          <VoteResults
            halalCount={topic.halal_count}
            haramCount={topic.haram_count}
            userVote={userVote}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-400 text-center">
              Cast your vote to see the community results
            </p>
            <VoteButtons topicId={topic.id} topicSlug={topic.slug} />
          </div>
        )}
      </div>

      {/* Discussion section — only shown after voting */}
      {userVote && (
        <div className="space-y-6">
          {/* Section heading */}
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold heading-section">
              Discussion
            </h2>
            <span className="text-sm text-neutral-500">
              {comments?.length || 0} {(comments?.length || 0) === 1 ? "argument" : "arguments"}
            </span>
          </div>

          {/* Comment form */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wide font-medium">
              Add your argument
            </p>
            <CommentForm topicId={topic.id} />
          </div>

          {/* Comments */}
          <CommentList comments={comments || []} />
        </div>
      )}
    </div>
  );
}
