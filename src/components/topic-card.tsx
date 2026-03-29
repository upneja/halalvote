import Link from "next/link";
import { TagBadge } from "./tag-badge";
import { VoteButtons } from "./vote-buttons";
import { VoteResults } from "./vote-results";
import type { Tag } from "@/types/database";

interface TopicCardProps {
  id: string;
  title: string;
  slug: string;
  description: string;
  halalCount: number;
  haramCount: number;
  tags: Tag[];
  userVote?: "halal" | "haram" | null;
  commentCount: number;
}

export function TopicCard({
  id,
  title,
  slug,
  description,
  halalCount,
  haramCount,
  tags,
  userVote,
  commentCount,
}: TopicCardProps) {
  return (
    <article className="glass-card topic-card rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Header: title + tags */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Link href={`/topic/${slug}`} className="group">
            <h3
              className="text-lg sm:text-xl font-semibold leading-snug transition-colors group-hover:[color:#D4A843]"
              style={{ letterSpacing: "-0.01em" }}
            >
              {title}
            </h3>
          </Link>
          {description && (
            <p className="text-neutral-400 text-sm mt-1.5 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap flex-shrink-0 max-w-[140px] justify-end">
            {tags.slice(0, 2).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* Vote section */}
      {userVote ? (
        <VoteResults
          halalCount={halalCount}
          haramCount={haramCount}
          userVote={userVote}
        />
      ) : (
        <VoteButtons topicId={id} topicSlug={slug} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/topic/${slug}`}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Link>
        {!userVote && (
          <span className="text-xs text-neutral-600">
            {halalCount + haramCount} votes
          </span>
        )}
      </div>
    </article>
  );
}
