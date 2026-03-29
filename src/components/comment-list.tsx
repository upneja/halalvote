import type { Comment } from "@/types/database";

interface CommentWithAuthor extends Comment {
  profiles: { username: string; display_name: string };
}

function CommentItem({ comment }: { comment: CommentWithAuthor }) {
  const isHalal = comment.position === "halal";
  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{
        background: isHalal
          ? "rgba(5, 150, 105, 0.05)"
          : "rgba(153, 27, 27, 0.05)",
        border: `1px solid ${isHalal ? "rgba(5, 150, 105, 0.15)" : "rgba(239, 68, 68, 0.15)"}`,
      }}
    >
      {/* Author + badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-neutral-200">
          @{comment.profiles.username}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: isHalal ? "rgba(5, 150, 105, 0.15)" : "rgba(153, 27, 27, 0.2)",
            color: isHalal ? "#34d399" : "#f87171",
          }}
        >
          {isHalal ? "Halal" : "Haram"}
        </span>
      </div>

      {/* Comment body */}
      <p className="text-sm text-neutral-300 leading-relaxed">{comment.body}</p>

      {/* Scholar citation */}
      {comment.scholar_citation && (
        <div className="scholar-citation mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-neutral-400 italic leading-relaxed">
            <span className="text-gold not-italic font-semibold mr-1">Scholar:</span>
            {comment.scholar_citation}
          </p>
        </div>
      )}
    </div>
  );
}

export function CommentList({ comments }: { comments: CommentWithAuthor[] }) {
  if (comments.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p className="text-neutral-500 text-sm">No comments yet.</p>
        <p className="text-neutral-600 text-xs mt-1">Be the first to share your reasoning.</p>
      </div>
    );
  }

  const halalComments = comments.filter((c) => c.position === "halal");
  const haramComments = comments.filter((c) => c.position === "haram");

  return (
    <div>
      {/* Desktop: two-column versus layout */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-4">
        {/* Halal column */}
        <div className="space-y-3">
          <div
            className="debate-col-halal rounded-xl px-4 pt-4 pb-2 mb-1"
          >
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Halal &mdash; {halalComments.length}
            </h4>
            {halalComments.length === 0 ? (
              <p className="text-neutral-600 text-xs py-2">No Halal arguments yet.</p>
            ) : (
              <div className="space-y-3">
                {halalComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Haram column */}
        <div className="space-y-3">
          <div
            className="debate-col-haram rounded-xl px-4 pt-4 pb-2 mb-1"
          >
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">
              Haram &mdash; {haramComments.length}
            </h4>
            {haramComments.length === 0 ? (
              <p className="text-neutral-600 text-xs py-2">No Haram arguments yet.</p>
            ) : (
              <div className="space-y-3">
                {haramComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: stacked chronological */}
      <div className="sm:hidden space-y-3">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
